"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import maplibregl, {
  type Map,
  type Marker,
} from "maplibre-gl";

import "maplibre-gl/dist/maplibre-gl.css";

export interface LocationResult {
  coordinates: [
    number,
    number
  ];

  address: string;

  district: string;
}

interface LocationPickerProps {
  open: boolean;

  cityName: string;

  cityCoordinates:
    | [number, number]
    | null;

  initialPosition:
    | [number, number]
    | null;

  onClose: () => void;

  onConfirm: (
    result: LocationResult
  ) => void;
}

const DEFAULT_CENTER: [
  number,
  number
] = [
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
  const url =
    new URL(
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
    address.house_number ??
    "";

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
      data.display_name ??
      "";
  }

  return {
    address:
      normalizedAddress,

    district,
  };
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

  const [
    position,
    setPosition,
  ] =
    useState<
      [number, number] | null
    >(null);

  const [
    address,
    setAddress,
  ] = useState("");

  const [
    district,
    setDistrict,
  ] = useState("");

  const [
    geocoding,
    setGeocoding,
  ] = useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  const targetCenter =
    cityCoordinates ??
    DEFAULT_CENTER;

  /*
   * При открытии:
   *
   * есть сохранённый pin
   * → показываем его
   *
   * нет pin
   * → центр города
   */
  useEffect(() => {
    if (!open) {
      return;
    }

    setError(null);
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
   * Инициализируем MapLibre
   * на том же style, который
   * используется основной картой JayMap.
   */
  useEffect(() => {
    if (
      !open ||
      !containerRef.current
    ) {
      return;
    }

    if (mapRef.current) {
      return;
    }

    const initialCenter =
      initialPosition ??
      targetCenter;

    const map =
      new maplibregl.Map({
        container:
          containerRef.current,

        /*
         * Ключевой момент:
         * используем существующий
         * рабочий style JayMap.
         *
         * В нём уже есть:
         * - дороги
         * - города
         * - подписи
         * - здания
         * - вода
         */
        style:
          "/map/styles/light.json",

        center:
          initialCenter,

        zoom:
          initialPosition
            ? 16
            : DEFAULT_ZOOM,

        minZoom: 10,

        maxZoom: 19,

        attributionControl:
          true,

        renderWorldCopies:
          false,

        antialias:
          true,
      });

    map.addControl(
      new maplibregl.NavigationControl(
        {
          showCompass:
            false,
        }
      ),
      "top-right"
    );

    map.once(
      "load",
      () => {
        /*
         * Модалка открыта поверх
         * уже существующей страницы,
         * поэтому ResizeObserver / resize
         * здесь обязателен.
         */
        requestAnimationFrame(
          () => {
            map.resize();

            map.jumpTo({
              center:
                initialCenter,

              zoom:
                initialPosition
                  ? 16
                  : DEFAULT_ZOOM,
            });
          }
        );

        if (
          initialPosition
        ) {
          markerRef.current =
            new maplibregl.Marker({
              color:
                "#6FC9C2",
            })
              .setLngLat(
                initialPosition
              )
              .addTo(map);
        }
      }
    );

    map.on(
      "click",
      async (event) => {
        const coordinates:
          [number, number] =
          [
            event.lngLat.lng,
            event.lngLat.lat,
          ];

        setPosition(
          coordinates
        );

        setError(null);

        setAddress("");

        setDistrict("");

        setGeocoding(true);

        markerRef.current?.remove();

        markerRef.current =
          new maplibregl.Marker({
            color:
              "#6FC9C2",
          })
            .setLngLat(
              coordinates
            )
            .addTo(map);

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
        } catch (error) {
          console.error(
            "[LocationPicker] Reverse geocoding failed:",
            error
          );

          setError(
            "Точку установили, но адрес автоматически определить не удалось."
          );
        } finally {
          setGeocoding(
            false
          );
        }
      }
    );

    mapRef.current =
      map;

    return () => {
      markerRef.current?.remove();

      markerRef.current =
        null;

      map.remove();

      mapRef.current =
        null;
    };
  }, [open]);

  /*
   * Город изменился уже после
   * открытия picker.
   *
   * Сбрасываем старый pin
   * и переносим карту в новый город.
   */
  useEffect(() => {
    if (
      !open ||
      !mapRef.current
    ) {
      return;
    }

    /*
     * Если изменение произошло
     * из-за существующей сохранённой
     * точки, не уничтожаем её.
     */
    if (
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
  ]);

  const handleConfirm =
    () => {
      if (!position) {
        return;
      }

      if (
        geocoding
      ) {
        return;
      }

      if (!address) {
        setError(
          "Нажмите на карту на нужный адрес и дождитесь определения адреса."
        );

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
        {/* Header */}
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

        {/* Map */}
        <div className="relative min-h-0 flex-1">
          <div
            ref={
              containerRef
            }
            className="absolute inset-0"
          />

          <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-white/10 bg-white/90 px-3 py-2 text-[11px] font-semibold text-slate-700 shadow-lg">
            {cityName ||
              "Кыргызстан"}
          </div>

          {geocoding && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-[#11171f]/95 px-4 py-2 text-[11px] text-white/75 shadow-lg backdrop-blur-md">
              Определяем адрес…
            </div>
          )}
        </div>

        {/* Footer */}
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
                  !address ||
                  geocoding
                }
                onClick={
                  handleConfirm
                }
                className={[
                  "h-11 rounded-full px-5 text-[12px] font-semibold transition",
                  position &&
                  address &&
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