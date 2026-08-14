"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP_CONFIG } from "./mapConfig";
import { setupMapLayers, updateMapLanguage } from "./mapLayers";
import { setupClusterLayer } from "./clusters";
import { fetchListingsGeoJSON, type UserFilters } from "@/lib/supabase/api";
import { useTranslation } from "@/lib/i18n";
import type { City } from "@/lib/cities";
import type { PopupListing } from "./ListingPopup";
import type { ListingFeature } from "./clusters/types";

interface MainMapProps {
  /** Город, выбранный в Navbar. MainMap сам решает, как к нему лететь —
   * Navbar никогда не работает с mapRef напрямую. */
  selectedCity?: City | null;
  /** Фильтры из Sidebar (без bounds — их берём из viewport карты) */
  userFilters?: UserFilters;
  /** Вызывается при клике на отдельный объект — родитель рендерит карточку */
  onListingSelect?: (listing: PopupListing) => void;
}

const CITY_FLY_TO_ZOOM = 11.5;
const CITY_FLY_TO_DURATION = 1800;
const DEBOUNCE_MS = 300;

export default function MainMap({ selectedCity = null, userFilters, onListingSelect }: MainMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const clusterHandleRef = useRef<ReturnType<typeof setupClusterLayer> | null>(null);

  // Ref для debounce-таймера загрузки данных
  const loadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ref чтобы не гонять запросы до готовности карты
  const isReadyRef = useRef(false);

  const { t, language } = useTranslation();
  // Держим текущий язык в ref, чтобы initial-эффект (который выполняется
  // один раз, при монтировании) всегда мог создать слои с актуальным
  // языком, не попадая в зависимости useEffect и не пересоздавая карту.
  const languageRef = useRef(language);
  languageRef.current = language;

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "/map/styles/light.json",

      pitch: 0,
      bearing: 0,

      minZoom: MAP_CONFIG.minZoom,
      maxZoom: MAP_CONFIG.maxZoom,
      //maxBounds: MAP_CONFIG.maxBounds,

      attributionControl: false,
      renderWorldCopies: false,
      antialias: true,
      fadeDuration: 300,
    });

    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();

    console.log("===== MAP CREATED =====");
    console.log("Initial zoom:", map.getZoom());
    console.log("Initial center:", map.getCenter());

    setInterval(() => {
      console.log("Current zoom:", map.getZoom());
    }, 1000);
    
    (window as any).map = map;
    mapRef.current = map;
    setMap(map);

    map.on("load", () => {

      setupMapLayers(map, languageRef.current);

      // Система кластеров недвижимости — инициализируем пустым набором,
      // данные подгрузим отдельно через API с учётом фильтров и bounds.
      clusterHandleRef.current = setupClusterLayer(map, {
        data: [],
        minZoom: CITY_FLY_TO_ZOOM,
      });

      // Клик по отдельному объекту (price marker) → эмитим наружу
      map.on("click", "jaymap-price-marker", (e) => {
        if (!e.features?.length) return;
        const props = e.features[0].properties as Record<string, unknown>;
        onListingSelect?.({
          id: String(props.id),
          title: String(props.title ?? "Без названия"),
          price: Number(props.price ?? 0),
          currency: String(props.currency ?? "KGS"),
          address: props.address ? String(props.address) : undefined,
          photos: safeParsePhotos(props.photos),
          phone: props.phone ? String(props.phone) : undefined,
          telegram: props.telegram ? String(props.telegram) : undefined,
          whatsapp: props.whatsapp ? String(props.whatsapp) : undefined,
          description: props.description ? String(props.description) : undefined,
          rooms: props.rooms != null ? Number(props.rooms) : undefined,
          area: props.area != null ? Number(props.area) : undefined,
          floor: props.floor != null ? Number(props.floor) : undefined,
          totalFloors: props.total_floors != null ? Number(props.total_floors) : undefined,
          furnished: props.furnished === true,
          parking: props.parking === true,
          pets: props.pets === true,
        });
      });

      map.on("mouseenter", "jaymap-price-marker", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "jaymap-price-marker", () => {
        map.getCanvas().style.cursor = "";
      });

      map.jumpTo({
      center: [74.95, 41.45],
      zoom: 6.7,
    });
    map.dragPan.disable();

    map.on("zoomend", () => {
      if (map.getZoom() > 6.8) {
        map.dragPan.enable();
      } else {
        map.dragPan.disable();

        map.easeTo({
          center: [74.95, 41.45],
          duration: 200,
        });
      }
    });
    });
   map.once("idle", () => {
      setIsLoaded(true);
      isReadyRef.current = true;

      requestAnimationFrame(() => {
        setTimeout(() => {
          
        }, 180);
      });
    });
    
     map.once("idle", () => {
      setIsLoaded(true);
    });
    return () => {
      if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
      clusterHandleRef.current?.destroy();
      clusterHandleRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ----------------------------------------------------
  // Загрузка объявлений (debounced, с bounds)
  // ----------------------------------------------------
  const loadListings = useCallback(async () => {
    if (!mapRef.current || !isReadyRef.current || !clusterHandleRef.current) return;

    const map = mapRef.current;
    const bounds = map.getBounds();

    try {
      const geojson = await fetchListingsGeoJSON({
        ...userFilters,
        bounds: {
          west: bounds.getWest(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          north: bounds.getNorth(),
        },
      });

      const listings = geojson.features.filter((feature): feature is ListingFeature => {
        if (feature.geometry?.type !== "Point") return false;
        const props = feature.properties as Record<string, unknown> | null;
        return props !== null && typeof props.price === "number";
      });

      clusterHandleRef.current.setData(listings);
    } catch (err) {
      console.error("[MainMap] Failed to load listings:", err);
    }
  }, [userFilters]);

  // Debounced wrapper
  const scheduleLoad = useCallback(() => {
    if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
    loadTimerRef.current = setTimeout(() => loadListings(), DEBOUNCE_MS);
  }, [loadListings]);

  // При изменении фильтров — перезагружаем
  useEffect(() => {
    scheduleLoad();
  }, [userFilters, scheduleLoad]);

  // При движении/зуме карты — перезагружаем с новыми bounds
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;

    const onMoveEnd = () => scheduleLoad();
    map.on("moveend", onMoveEnd);
    return () => {
      map.off("moveend", onMoveEnd);
    };
  }, [isLoaded, scheduleLoad]);

  // Первая загрузка после готовности карты
  useEffect(() => {
    if (isLoaded) scheduleLoad();
  }, [isLoaded, scheduleLoad]);

  // Смена языка: только обновляем text-field подписей городов,
  // карта, источники и слои не пересоздаются.
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;
    updateMapLanguage(mapRef.current, language);
  }, [language, isLoaded]);

  // Плавный перелёт к городу, выбранному в Navbar. Координаты и весь
  // выбор города приходят готовыми через проп — MainMap лишь вызывает
  // flyTo(), больше ничего о Navbar не знает.
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !selectedCity) return;

    mapRef.current.flyTo({
      center: selectedCity.coordinates,
      zoom: CITY_FLY_TO_ZOOM,
      duration: CITY_FLY_TO_DURATION,
      essential: true,
    });
  }, [selectedCity, isLoaded]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-transparent">
      {/* Карта */}
      <div
        ref={mapContainer}
        className={`absolute inset-0 transition-opacity duration-700 ease-out ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Splash */}
      <div
        className={`absolute inset-0 z-50 flex items-center justify-center bg-white transition-all duration-700 ease-out ${
          isLoaded
            ? "opacity-0 pointer-events-none"
            : "opacity-100"
        }`}
      >
        <div className="flex flex-col items-center select-none">
          <div
            className={`transition-all duration-700 ${
              isLoaded
                ? "opacity-0 translate-y-2"
                : "opacity-100 translate-y-0"
            }`}
          >
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
              MapKG
            </h1>

            <p className="mt-3 text-xs uppercase tracking-[0.3em] text-neutral-400">
              {t("map.preparing")}
            </p>

            <div className="mt-6 h-px w-24 overflow-hidden bg-neutral-200 rounded-full">
              <div
                className="h-full bg-neutral-900 animate-pulse"
                style={{ width: "65%" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- helpers ----------
function safeParsePhotos(raw: unknown): string[] | undefined {
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
}
