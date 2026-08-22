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

  initialPosition:
    | [number, number]
    | null;

  onClose: () => void;

  onConfirm: (
    result: LocationResult
  ) => void;
}

/**
 * Координаты основных городов Кыргызстана.
 *
 * Это fallback.
 * Reverse geocoding после выбора точки
 * определяет уже фактический адрес.
 */
const CITY_CENTERS: Record<
  string,
  [number, number]
> = {
  Бишкек: [
    74.6122,
    42.8746,
  ],

  Ош: [
    72.7985,
    40.5283,
  ],

  Каракол: [
    78.3956,
    42.4907,
  ],

  Нарын: [
    75.9911,
    41.4287,
  ],

  Талас: [
    72.2429,
    42.5228,
  ],

  Баткен: [
    70.8194,
    40.0626,
  ],

  Джалал-Абад: [
    73.0179,
    40.9333,
  ],
};

const DEFAULT_CENTER: [
  number,
  number
] = [
  74.6122,
  42.8746,
];

const DEFAULT_ZOOM = 13;

/**
 * Reverse geocoding через Nominatim.
 *
 * Для MVP этого достаточно.
 * Позже, при росте проекта, вынесем
 * geocoding в backend/proxy.
 */
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

  if (
    !response.ok
  ) {
    throw new Error(
      "Не удалось определить адрес."
    );
  }

  const data =
    await response.json();

  const address =
    data?.address ?? {};

  /*
   * Приоритет:
   *
   * road
   * pedestrian
   * residential
   * footway
   *
   * + house_number
   */
  const street =
    address.road ??
    address.pedestrian ??
    address.residential ??
    address.footway ??
    "";

  const houseNumber =
    address.house_number ??
    "";

  const district =
    address.suburb ??
    address.neighbourhood ??
    address.city_district ??
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
  } else {
    normalizedAddress =
      street ||
      data.display_name ||
      "";
  }

  return {
    address:
      normalizedAddress,

    district:
      district,
  };
}

export default function LocationPicker({
  open,
  cityName,
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
  ] = useState<
    [number, number] | null
  >(initialPosition);

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
  ] = useState<
    string | null
  >(null);

  /*
   * Если город изменился —
   * начинаем с его центра.
   */
  const cityCenter =
    CITY_CENTERS[
      cityName
    ] ??
    DEFAULT_CENTER;

  useEffect(() => {
    if (!open) {
      return;
    }

    setError(null);
    setAddress("");
    setDistrict("");

    if (
      initialPosition
    ) {
      setPosition(
        initialPosition
      );
    } else {
      setPosition(
        cityCenter
      );
    }
  }, [
    open,
    cityName,
    initialPosition,
    cityCenter,
  ]);

  /*
   * Map initialization.
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

    const center =
      initialPosition ??
      cityCenter;

    /*
     * Используем OSM tiles,
     * чтобы в picker были:
     *
     * города
     * улицы
     * дороги
     * номера/подписи
     *
     * Это utility-map, поэтому здесь
     * важнее читаемость, чем
     * декоративная карта JayMap.
     */
    const map =
      new maplibregl.Map({
        container:
          containerRef.current,

        style: {
          version: 8,

          sources: {
            osm: {
              type:
                "raster",

              tiles: [
                "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
              ],

              tileSize:
                256,

              attribution:
                "© OpenStreetMap contributors",
            },
          },

          layers: [
            {
              id:
                "osm",

              type:
                "raster",

              source:
                "osm",

              minzoom:
                0,

              maxzoom:
                19,
            },
          ],
        },

        center,

        zoom:
          initialPosition
            ? 16
            : DEFAULT_ZOOM,

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

    map.on(
      "load",
      () => {
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
        const nextPosition:
          [number, number] =
          [
            event.lngLat.lng,
            event.lngLat.lat,
          ];

        setPosition(
          nextPosition
        );

        setError(null);
        setGeocoding(true);

        markerRef.current?.remove();

        markerRef.current =
          new maplibregl.Marker({
            color:
              "#6FC9C2",
          })
            .setLngLat(
              nextPosition
            )
            .addTo(map);

        try {
          const result =
            await reverseGeocode(
              nextPosition[0],
              nextPosition[1]
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
  }, [
    open,
    cityName,
  ]);

  /*
   * When city changes while
   * picker is already open —
   * move map there.
   */
  useEffect(() => {
    if (
      !open ||
      !mapRef.current
    ) {
      return;
    }

    /*
     * Если уже есть
     * начальная точка —
     * не перетираем её.
     */
    if (
      initialPosition
    ) {
      return;
    }

    const map =
      mapRef.current;

    map.flyTo({
      center:
        cityCenter,

      zoom:
        DEFAULT_ZOOM,

      duration:
        700,
    });

    markerRef.current?.remove();

    markerRef.current =
      null;

    setPosition(
      cityCenter
    );

    setAddress("");
    setDistrict("");
    setError(null);
  }, [
    cityName,
  ]);

  if (!open) {
    return null;
  }

  const handleConfirm =
    () => {
      if (!position) {
        return;
      }

      if (!address) {
        setError(
          "Установите точку на улице, чтобы определить адрес."
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

  return (
    <div className="fixed inset-0 z-[1400] flex items-center justify-center p-5">
      <button
        type="button"
        aria-label="Закрыть карту"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-[14px]"
      />

      <div className="relative flex h-[min(720px,calc(100vh-40px))] w-full max-w-[900px] flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[#11171f] shadow-[0_30px_100px_rgba(0,0,0,0.5)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-[#11171f] px-5 py-4">
          <div>
            <div className="text-[14px] font-semibold text-white/90">
              Укажите точку объекта
            </div>

            <div className="mt-1 text-[11px] text-white/35">
              {cityName
                ? `Город: ${cityName}. Нажмите на карте на нужный адрес.`
                : "Нажмите на карте на нужный адрес."}
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

          {/* City badge */}
          <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-white/10 bg-[#11171f]/90 px-3 py-2 text-[11px] font-medium text-white/75 shadow-lg backdrop-blur-md">
            {cityName}
          </div>

          {/* Geocoding indicator */}
          {geocoding && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-[#11171f]/95 px-4 py-2 text-[11px] text-white/70 shadow-lg">
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

            <div className="mt-1 text-[13px] font-medium text-white/85">
              {geocoding
                ? "Определяем…"
                : address ||
                  "Нажмите на карту"}
            </div>

            {district && (
              <div className="mt-1 text-[10px] text-white/35">
                Район:{" "}
                {
                  district
                }
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
                onClick={
                  handleConfirm
                }
                disabled={
                  !position ||
                  !address ||
                  geocoding
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