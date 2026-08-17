"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { MAP_CONFIG } from "./mapConfig";
import {
  setupMapLayers,
  updateMapLanguage,
} from "./mapLayers";
import { setupClusterLayer } from "./clusters";

import {
  fetchListingsGeoJSON,
} from "@/lib/supabase/api";

import type {
  ListingsFilter,
} from "@/lib/filters/types";

import { useTranslation } from "@/lib/i18n";

import type { City } from "@/lib/cities";
import type { PopupListing } from "./ListingPopup";
import type { ListingFeature } from "./clusters/types";

interface MainMapProps {
  /**
   * Город, выбранный в Navbar.
   * MainMap сам управляет flyTo.
   */
  selectedCity?: City | null;

  /**
   * Последние успешно применённые фильтры Sidebar.
   *
   * Bounds сюда не передаются.
   * MainMap получает их непосредственно из текущего viewport.
   */
  filters?: ListingsFilter;

  /**
   * Вызывается при клике на отдельное объявление.
   */
  onListingSelect?: (
    listing: PopupListing
  ) => void;
}

const CITY_FLY_TO_ZOOM = 11.5;
const CITY_FLY_TO_DURATION = 1800;
const DEBOUNCE_MS = 300;

export default function MainMap({
  selectedCity = null,
  filters,
  onListingSelect,
}: MainMapProps) {
  const mapContainer =
    useRef<HTMLDivElement>(null);

  const mapRef =
    useRef<maplibregl.Map | null>(null);

  const clusterHandleRef =
    useRef<
      ReturnType<typeof setupClusterLayer> | null
    >(null);

  /**
   * Таймер debounce для запросов.
   */
  const loadTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  /**
   * Карта готова к загрузке данных.
   */
  const isReadyRef =
    useRef(false);

  /**
   * Защита от race condition.
   *
   * Если:
   *
   * request 1
   * request 2
   *
   * и request 1 завершится позже request 2,
   * его результат игнорируется.
   */
  const requestIdRef =
    useRef(0);

  const [isLoaded, setIsLoaded] =
    useState(false);

  const { t, language } =
    useTranslation();

  /**
   * Текущий язык хранится в ref.
   *
   * MapLibre и его listeners создаются
   * один раз, поэтому не нужно пересоздавать
   * карту при смене языка.
   */
  const languageRef =
    useRef(language);

  languageRef.current =
    language;

  /* =========================================================
     MAP INITIALIZATION
     ========================================================= */

  useEffect(() => {
    if (
      !mapContainer.current ||
      mapRef.current
    ) {
      return;
    }

    const map =
      new maplibregl.Map({
        container:
          mapContainer.current,

        style:
          "/map/styles/light.json",

        pitch: 0,
        bearing: 0,

        minZoom:
          MAP_CONFIG.minZoom,

        maxZoom:
          MAP_CONFIG.maxZoom,

        // maxBounds:
        // MAP_CONFIG.maxBounds,

        attributionControl:
          false,

        renderWorldCopies:
          false,

        antialias: true,

        fadeDuration: 300,
      });

    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();

    mapRef.current = map;

    /**
     * MapLibre load.
     */
    map.on("load", () => {
      setupMapLayers(
        map,
        languageRef.current
      );

      clusterHandleRef.current =
        setupClusterLayer(map, {
          data: [],
          minZoom:
            CITY_FLY_TO_ZOOM,
        });

      /**
       * Click on price marker.
       */
      map.on(
        "click",
        "jaymap-price-marker",
        (event) => {
          if (
            !event.features?.length
          ) {
            return;
          }

          const props =
            event.features[0]
              .properties as Record<
              string,
              unknown
            >;

          onListingSelect?.({
            id: String(
              props.id
            ),

            title: String(
              props.title ??
                "Без названия"
            ),

            price: Number(
              props.price ?? 0
            ),

            currency: String(
              props.currency ??
                "KGS"
            ),

            address:
              props.address
                ? String(
                    props.address
                  )
                : undefined,

            photos:
              safeParsePhotos(
                props.photos
              ),

            phone:
              props.phone
                ? String(
                    props.phone
                  )
                : undefined,

            telegram:
              props.telegram
                ? String(
                    props.telegram
                  )
                : undefined,

            whatsapp:
              props.whatsapp
                ? String(
                    props.whatsapp
                  )
                : undefined,

            description:
              props.description
                ? String(
                    props.description
                  )
                : undefined,

            rooms:
              props.rooms != null
                ? Number(
                    props.rooms
                  )
                : undefined,

            area:
              props.area != null
                ? Number(
                    props.area
                  )
                : undefined,

            floor:
              props.floor != null
                ? Number(
                    props.floor
                  )
                : undefined,

            totalFloors:
              props.total_floors !=
              null
                ? Number(
                    props.total_floors
                  )
                : undefined,

            furnished:
              props.furnished ===
              true,

            parking:
              props.parking ===
              true,

            pets:
              props.pets === true,
          });
        }
      );

      /**
       * Marker cursor.
       */
      map.on(
        "mouseenter",
        "jaymap-price-marker",
        () => {
          map.getCanvas()
            .style.cursor =
            "pointer";
        }
      );

      map.on(
        "mouseleave",
        "jaymap-price-marker",
        () => {
          map.getCanvas()
            .style.cursor = "";
        }
      );

      /**
       * Initial camera position.
       */
      map.jumpTo({
        center: [
          74.95,
          41.45,
        ],
        zoom: 6.7,
      });

      /**
       * At low zoom we don't allow arbitrary horizontal
       * dragging away from the initial country view.
       */
      map.dragPan.disable();

      map.on(
        "zoomend",
        () => {
          if (
            map.getZoom() > 6.8
          ) {
            map.dragPan.enable();
          } else {
            map.dragPan.disable();

            map.easeTo({
              center: [
                74.95,
                41.45,
              ],
              duration: 200,
            });
          }
        }
      );
    });

    /**
     * One idle listener only.
     */
    map.once(
      "idle",
      () => {
        setIsLoaded(true);
        isReadyRef.current =
          true;
      }
    );

    return () => {
      isReadyRef.current =
        false;

      requestIdRef.current += 1;

      if (
        loadTimerRef.current
      ) {
        clearTimeout(
          loadTimerRef.current
        );

        loadTimerRef.current =
          null;
      }

      clusterHandleRef.current?.destroy();

      clusterHandleRef.current =
        null;

      map.remove();

      mapRef.current =
        null;
    };
  }, [onListingSelect]);

  /* =========================================================
     LOAD LISTINGS
     ========================================================= */

  const loadListings =
    useCallback(async () => {
      if (
        !mapRef.current ||
        !isReadyRef.current ||
        !clusterHandleRef.current
      ) {
        return;
      }

      const map =
        mapRef.current;

      const bounds =
        map.getBounds();

      const currentRequestId =
        ++requestIdRef.current;

      try {
        const geojson =
          await fetchListingsGeoJSON(
            {
              ...filters,

              bounds: {
                west:
                  bounds.getWest(),

                south:
                  bounds.getSouth(),

                east:
                  bounds.getEast(),

                north:
                  bounds.getNorth(),
              },
            }
          );

        /**
         * Обновление устаревшим ответом запрещено.
         */
        if (
          currentRequestId !==
          requestIdRef.current
        ) {
          return;
        }

        const listings =
          geojson.features.filter(
            (
              feature
            ): feature is ListingFeature => {
              if (
                feature.geometry
                  ?.type !==
                "Point"
              ) {
                return false;
              }

              const props =
                feature.properties as
                  | Record<
                      string,
                      unknown
                    >
                  | null;

              return (
                props !==
                  null &&
                typeof props.price ===
                  "number"
              );
            }
          );

        clusterHandleRef.current?.setData(
          listings
        );
      } catch (error) {
        /**
         * Если другой запрос уже стал актуальным,
         * старую ошибку тоже игнорируем.
         */
        if (
          currentRequestId !==
          requestIdRef.current
        ) {
          return;
        }

        console.error(
          "[MainMap] Failed to load listings:",
          error
        );
      }
    }, [filters]);

  /* =========================================================
     DEBOUNCE
     ========================================================= */

  const scheduleLoad =
    useCallback(() => {
      if (
        loadTimerRef.current
      ) {
        clearTimeout(
          loadTimerRef.current
        );
      }

      loadTimerRef.current =
        setTimeout(() => {
          loadTimerRef.current =
            null;

          void loadListings();
        }, DEBOUNCE_MS);
    }, [loadListings]);

  /* =========================================================
     FILTER CHANGES
     ========================================================= */

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    scheduleLoad();
  }, [
    filters,
    isLoaded,
    scheduleLoad,
  ]);

  /* =========================================================
     MAP MOVEMENT
     ========================================================= */

  useEffect(() => {
    const map =
      mapRef.current;

    if (
      !map ||
      !isLoaded
    ) {
      return;
    }

    const handleMoveEnd =
      () => {
        scheduleLoad();
      };

    map.on(
      "moveend",
      handleMoveEnd
    );

    return () => {
      map.off(
        "moveend",
        handleMoveEnd
      );
    };
  }, [
    isLoaded,
    scheduleLoad,
  ]);

  /* =========================================================
     INITIAL DATA LOAD
     ========================================================= */

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    scheduleLoad();
  }, [
    isLoaded,
    scheduleLoad,
  ]);

  /* =========================================================
     LANGUAGE
     ========================================================= */

  useEffect(() => {
    if (
      !isLoaded ||
      !mapRef.current
    ) {
      return;
    }

    updateMapLanguage(
      mapRef.current,
      language
    );
  }, [
    language,
    isLoaded,
  ]);

  /* =========================================================
     CITY FLY-TO
     ========================================================= */

  useEffect(() => {
    if (
      !isLoaded ||
      !mapRef.current ||
      !selectedCity
    ) {
      return;
    }

    mapRef.current.flyTo({
      center:
        selectedCity.coordinates,

      zoom:
        CITY_FLY_TO_ZOOM,

      duration:
        CITY_FLY_TO_DURATION,

      essential: true,
    });
  }, [
    selectedCity,
    isLoaded,
  ]);

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <div className="relative h-full w-full overflow-hidden bg-transparent">
      {/* Map */}
      <div
        ref={mapContainer}
        className={[
          "absolute inset-0",
          "transition-opacity",
          "duration-700",
          "ease-out",
          isLoaded
            ? "opacity-100"
            : "opacity-0",
        ].join(" ")}
      />

      {/* Splash */}
      <div
        className={[
          "absolute inset-0",
          "z-50",
          "flex items-center justify-center",
          "bg-white",
          "transition-all",
          "duration-700",
          "ease-out",
          isLoaded
            ? "pointer-events-none opacity-0"
            : "opacity-100",
        ].join(" ")}
      >
        <div className="flex flex-col items-center select-none">
          <div
            className={[
              "transition-all",
              "duration-700",
              isLoaded
                ? "translate-y-2 opacity-0"
                : "translate-y-0 opacity-100",
            ].join(" ")}
          >
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
              MapKG
            </h1>

            <p className="mt-3 text-xs uppercase tracking-[0.3em] text-neutral-400">
              {t("map.preparing")}
            </p>

            <div className="mt-6 h-px w-24 overflow-hidden rounded-full bg-neutral-200">
              <div
                className="h-full bg-neutral-900 animate-pulse"
                style={{
                  width: "65%",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Helpers
   ============================================================ */

function safeParsePhotos(
  raw: unknown
): string[] | undefined {
  if (Array.isArray(raw)) {
    return raw as string[];
  }

  if (typeof raw === "string") {
    try {
      const parsed =
        JSON.parse(raw);

      return Array.isArray(
        parsed
      )
        ? parsed
        : undefined;
    } catch {
      return undefined;
    }
  }

  return undefined;
}