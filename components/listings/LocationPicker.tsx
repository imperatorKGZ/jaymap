"use client";

import { useEffect, useRef, useState } from "react";

import maplibregl, {
  type Map,
  type Marker,
} from "maplibre-gl";

import "maplibre-gl/dist/maplibre-gl.css";

import { setupMapLayers } from "../map/mapLayers";

export interface LocationResult {
  coordinates: [number, number];
  address: string;
  district: string;
}

interface LocationPickerProps {
  open: boolean;
  cityName: string;
  cityCoordinates: [number, number] | null;
  initialPosition: [number, number] | null;
  onClose: () => void;
  onConfirm: (result: LocationResult) => void;
}

const DEFAULT_CENTER: [number, number] = [
  74.6122,
  42.8746,
];

const DEFAULT_ZOOM = 13;

async function reverseGeocode(
  lng: number,
  lat: number
): Promise<{
  address: string;
  district: string;
}> {
  const url = new URL(
    "https://nominatim.openstreetmap.org/reverse"
  );

  url.searchParams.set(
    "lat",
    String(lat)
  );

  url.searchParams.set(
    "lon",
    String(lng)
  );

  url.searchParams.set(
    "format",
    "json"
  );

  url.searchParams.set(
    "addressdetails",
    "1"
  );

  url.searchParams.set(
    "accept-language",
    "ru"
  );

  const response =
    await fetch(
      url.toString(),
      {
        headers: {
          Accept:
            "application/json",
        },
      }
    );

  if (!response.ok) {
    throw new Error(
      "Не удалось определить адрес."
    );
  }

  const data =
    await response.json();

  const address =
    data?.address ?? {};

  const street =
    address.road ??
    address.pedestrian ??
    address.residential ??
    address.footway ??
    address.path ??
    "";

  const houseNumber =
    address.house_number ?? "";

  const district =
    address.suburb ??
    address.neighbourhood ??
    address.city_district ??
    address.quarter ??
    address.county ??
    "";

  let normalizedAddress =
    "";

  if (
    street &&
    houseNumber
  ) {
    normalizedAddress =
      `${street}, ${houseNumber}`;
  } else if (
    street
  ) {
    normalizedAddress =
      street;
  } else {
    normalizedAddress =
      data.display_name ?? "";
  }

  return {
    address:
      normalizedAddress,

    district,
  };
}

function createMarker(
  map: Map,
  coordinates: [number, number]
): Marker {
  const marker =
    new maplibregl.Marker({
      color: "#6FC9C2",
      anchor: "bottom",
    })
      .setLngLat(
        coordinates
      )
      .addTo(map);

  const element =
    marker.getElement();

  element.style.zIndex =
    "20";

  element.style.pointerEvents =
    "auto";

  return marker;
}

export default function LocationPicker({
  open,
  cityName,
  cityCoordinates,
  initialPosition,
  onClose,
  onConfirm,
}: LocationPickerProps) {
  const containerRef =
    useRef<HTMLDivElement>(
      null
    );

  const mapRef =
    useRef<Map | null>(
      null
    );

  const markerRef =
    useRef<Marker | null>(
      null
    );

  const resizeObserverRef =
    useRef<ResizeObserver | null>(
      null
    );

  const [position, setPosition] =
    useState<
      [number, number] | null
    >(null);

  const [address, setAddress] =
    useState("");

  const [district, setDistrict] =
    useState("");

  const [geocoding, setGeocoding] =
    useState(false);

  const [error, setError] =
    useState<string | null>(
      null
    );

  const [mapError, setMapError] =
    useState<string | null>(
      null
    );

  const [mapReady, setMapReady] =
    useState(false);

  const targetCenter =
    cityCoordinates ??
    DEFAULT_CENTER;

  /*
   * Сбрасываем состояние
   * при открытии picker.
   */
  useEffect(() => {
    if (!open) {
      return;
    }

    setError(null);

    setMapError(null);

    setMapReady(false);

    setAddress("");

    setDistrict("");

    setPosition(
      initialPosition ??
        targetCenter
    );
  }, [
    open,
    initialPosition,
    cityCoordinates,
  ]);

  /*
   * Инициализация MapLibre.
   */
  useEffect(() => {
    if (
      !open ||
      !containerRef.current ||
      mapRef.current
    ) {
      return;
    }

    const container =
      containerRef.current;

    const initialCenter =
      initialPosition ??
      targetCenter;

    const initialZoom =
      initialPosition
        ? 16
        : DEFAULT_ZOOM;

    let map: Map;

    try {
      map =
        new maplibregl.Map({
          container,

          /*
           * Используем тот же style,
           * что и основная карта JayMap.
           */
          style:
            "/map/styles/light.json",

          center:
            initialCenter,

          zoom:
            initialZoom,

          minZoom:
            10,

          maxZoom:
            19,

          /*
           * Убираем attribution control.
           */
          attributionControl:
            false,

          renderWorldCopies:
            false,

          antialias:
            true,
        });
    } catch (cause) {
      console.error(
        "[LocationPicker] Map initialization failed:",
        cause
      );

      setMapError(
        "Не удалось инициализировать карту."
      );

      return;
    }

    mapRef.current =
      map;

    /*
     * Navigation controls
     * оставляем.
     */
    map.addControl(
      new maplibregl.NavigationControl(
        {
          showCompass:
            false,
        }
      ),
      "top-right"
    );

    /*
     * Resize должен только
     * обновлять геометрию.
     *
     * Никакого jumpTo здесь нет,
     * иначе камера отпрыгивает.
     */
    const resize = () => {
      if (
        !mapRef.current
      ) {
        return;
      }

      map.resize();
    };

    const scheduleResize = () => {
      requestAnimationFrame(
        resize
      );

      window.setTimeout(
        resize,
        50
      );

      window.setTimeout(
        resize,
        200
      );
    };

    resizeObserverRef.current =
      new ResizeObserver(
        scheduleResize
      );

    resizeObserverRef.current.observe(
      container
    );

    /*
     * Основная инициализация.
     */
    map.once(
      "load",
      async () => {
        try {
          /*
           * Подключаем те же слои,
           * которые используются MainMap.
           */
          await setupMapLayers(
            map,
            "ru"
          );
        } catch (cause) {
          console.error(
            "[LocationPicker] Failed to setup main map layers:",
            cause
          );

          setMapError(
            "Не удалось настроить слои карты."
          );

          return;
        }

        scheduleResize();

        /*
         * Если точка уже была сохранена —
         * создаём marker.
         */
        if (
          initialPosition
        ) {
          markerRef.current?.remove();

          markerRef.current =
            createMarker(
              map,
              initialPosition
            );
        }

        /*
         * ВАЖНО:
         *
         * Не показываем карту сразу после
         * setupMapLayers().
         *
         * Ждём idle — MapLibre закончил
         * текущую отрисовку и загрузку
         * необходимых ресурсов.
         */
        map.once(
          "idle",
          () => {
            if (
              !mapRef.current
            ) {
              return;
            }

            map.resize();

            requestAnimationFrame(
              () => {
                if (
                  mapRef.current === map
                ) {
                  setMapReady(
                    true
                  );
                }
              }
            );
          }
        );
      }
    );

    /*
     * Ошибки MapLibre.
     *
     * НЕ переводим mapReady=true:
     * иначе пользователь увидит
     * промежуточную/сломавшуюся карту.
     */
    map.on(
      "error",
      (event) => {
        console.error(
          "[LocationPicker] MapLibre error:",
          event?.error
        );

        setMapError(
          "Карта не смогла загрузить картографические данные."
        );
      }
    );

    /*
     * Клик по карте.
     */
    map.on(
      "click",
      async (event) => {
        const coordinates:
          [number, number] = [
          event.lngLat.lng,
          event.lngLat.lat,
        ];

        setPosition(
          coordinates
        );

        setError(null);

        setMapError(null);

        setAddress("");

        setDistrict("");

        setGeocoding(
          true
        );

        /*
         * Старый marker удаляем.
         */
        markerRef.current?.remove();

        /*
         * Новый marker создаём
         * сразу, независимо от geocoding.
         */
        markerRef.current =
          createMarker(
            map,
            coordinates
          );

        try {
          const result =
            await reverseGeocode(
              coordinates[0],
              coordinates[1]
            );

          setAddress(
            result.address
          );

          setDistrict(
            result.district
          );
        } catch (cause) {
          console.error(
            "[LocationPicker] Reverse geocoding failed:",
            cause
          );

          setError(
            "Точку установили, но адрес автоматически определить не удалось. Адрес можно указать вручную."
          );
        } finally {
          setGeocoding(
            false
          );
        }
      }
    );

    scheduleResize();

    return () => {
      resizeObserverRef.current?.disconnect();

      resizeObserverRef.current =
        null;

      markerRef.current?.remove();

      markerRef.current =
        null;

      map.remove();

      mapRef.current =
        null;
    };
  }, [open]);

  /*
   * Если город изменился
   * после открытия picker —
   * перемещаем камеру.
   *
   * initialPosition защищает
   * существующую выбранную точку.
   */
  useEffect(() => {
    if (
      !open ||
      !mapRef.current ||
      initialPosition
    ) {
      return;
    }

    const map =
      mapRef.current;

    const nextCenter =
      cityCoordinates ??
      DEFAULT_CENTER;

    markerRef.current?.remove();

    markerRef.current =
      null;

    setPosition(
      nextCenter
    );

    setAddress("");

    setDistrict("");

    setError(null);

    map.flyTo({
      center:
        nextCenter,

      zoom:
        DEFAULT_ZOOM,

      duration:
        600,

      essential:
        true,
    });

    window.setTimeout(
      () => {
        map.resize();
      },
      50
    );
  }, [
    cityCoordinates,
    open,
    initialPosition,
  ]);

  const handleConfirm =
    () => {
      if (!position) {
        return;
      }

      if (geocoding) {
        return;
      }

      onConfirm({
        coordinates:
          position,

        address,

        district,
      });
    };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[1400] flex items-center justify-center p-5">
      <button
        type="button"
        aria-label="Закрыть карту"
        onClick={
          onClose
        }
        className="absolute inset-0 bg-black/60 backdrop-blur-[14px]"
      />

      <div className="relative flex h-[min(720px,calc(100vh-40px))] w-full max-w-[920px] flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[#11171f] shadow-[0_30px_100px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between border-b border-white/10 bg-[#11171f] px-5 py-4">
          <div>
            <div className="text-[14px] font-semibold text-white/90">
              Укажите точку объекта
            </div>

            <div className="mt-1 text-[11px] text-white/35">
              Город:{" "}
              {cityName ||
                "не выбран"}
              . Нажмите на карте на нужный адрес.
            </div>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[20px] text-white/60 hover:bg-white/10 hover:text-white"
          >
            ×
          </button>
        </div>

        <div className="relative min-h-0 flex-1">
          <div
            ref={
              containerRef
            }
            className={[
              "relative h-full w-full",
              mapReady
                ? "opacity-100"
                : "opacity-0",
            ].join(" ")}
          />

          <div className="pointer-events-none absolute left-4 top-4 z-30 rounded-full border border-white/10 bg-white/90 px-3 py-2 text-[11px] font-semibold text-slate-700 shadow-lg">
            {cityName ||
              "Кыргызстан"}
          </div>

          {mapError && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#11171f]/80 px-6 text-center">
              <div className="max-w-[420px] rounded-2xl border border-red-400/20 bg-[#11171f]/95 px-5 py-4 text-[12px] text-red-200 shadow-xl">
                {mapError}
              </div>
            </div>
          )}

          {geocoding && (
            <div className="pointer-events-none absolute bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-full border border-white/10 bg-[#11171f]/95 px-4 py-2 text-[11px] text-white/75 shadow-lg backdrop-blur-md">
              Определяем адрес…
            </div>
          )}
        </div>

        <div className="border-t border-white/10 bg-[#11171f] px-5 py-4">
          <div className="mb-3 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-3">
            <div className="text-[9px] font-semibold uppercase tracking-[0.08em] text-white/30">
              Определённый адрес
            </div>

            <div className="mt-1 text-[13px] font-medium text-white/90">
              {geocoding
                ? "Определяем…"
                : address ||
                  "Нажмите на карту"}
            </div>

            {district && (
              <div className="mt-1 text-[10px] text-white/35">
                Район:{" "}
                {district}
              </div>
            )}
          </div>

          {error && (
            <div className="mb-3 rounded-[10px] border border-red-400/20 bg-red-400/[0.08] px-3 py-2.5 text-[11px] text-red-300">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <div className="text-[10px] text-white/25">
              {position
                ? `${position[1].toFixed(
                    6
                  )}, ${position[0].toFixed(
                    6
                  )}`
                : "Точка не выбрана"}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={
                  onClose
                }
                className="h-11 rounded-full border border-white/10 bg-white/5 px-5 text-[12px] font-medium text-white/55 hover:bg-white/10 hover:text-white/80"
              >
                Отмена
              </button>

              <button
                type="button"
                disabled={
                  !position ||
                  geocoding
                }
                onClick={
                  handleConfirm
                }
                className={[
                  "h-11 rounded-full px-5 text-[12px] font-semibold transition",

                  position &&
                  !geocoding
                    ? "bg-[#6FC9C2] text-[#0a0f14] hover:bg-[#7ad6ce]"
                    : "cursor-not-allowed bg-white/10 text-white/25",
                ].join(
                  " "
                )}
              >
                Использовать адрес
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}