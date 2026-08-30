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

import {
  setupClusterLayer,
} from "./clusters";

import {
  createUserLocationControl,
} from "./mapTools/UserLocationControl";

import {
  fetchListingsGeoJSON,
  fetchListingsGeoJSONByRadius,
} from "@/lib/supabase/api";

import type {
  ListingsFilter,
} from "@/lib/filters/types";

import {
  useTranslation,
} from "@/lib/i18n";

import type {
  City,
} from "@/lib/cities";

import type {
  PopupListing,
} from "./ListingPopup";

import type {
  ListingFeature,
} from "./clusters/types";

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

  /**
   * Объявление, выбранное из "Избранного".
   *
   * MainMap перемещает камеру
   * к его координатам.
   */
  focusedListing?: {
    id: string;

    coordinates: [
      number,
      number
    ];
  } | null;

  /**
   * Вызывается из инструментов карты
   * для запуска определения местоположения.
   */
  onLocateMeReady?: (
    locateMe: () => void
  ) => void;

  /**
   * Координаты пользователя после
   * успешного определения местоположения.
   */
  onLocationChange?: (
    coordinates: {
      latitude: number;
      longitude: number;
      accuracy: number;
    }
  ) => void;

  /**
   * Радиус поиска вокруг пользователя.
   *
   * null = обычный viewport-поиск.
   *
   * 3000  = 3 км
   * 5000  = 5 км
   * 10000 = 10 км
   */
  searchRadius?:
    | null
    | 3000
    | 5000
    | 10000;

  /**
   * Последние известные координаты пользователя.
   *
   * Нужны для radius-поиска.
   */
  userLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null;
}

const CITY_FLY_TO_ZOOM =
  11.5;

const CITY_FLY_TO_DURATION =
  1800;

const FAVORITE_FLY_TO_ZOOM =
  15;

const FAVORITE_FLY_TO_DURATION =
  900;

const DEBOUNCE_MS =
  300;

/* ============================================================
   RESPONSIVE COUNTRY VIEW
   ============================================================ */

/**
 * Твой эталон.
 *
 * ВАЖНО:
 *
 * Это НЕ ограничение размера экрана.
 * Это только точка, относительно которой
 * рассчитывается desktop responsive camera.
 */
const BASELINE_WIDTH =
  1920;

const BASELINE_HEIGHT =
  912;

/**
 * Исходный country view.
 *
 * Эти значения сохраняем.
 */
const COUNTRY_CENTER:
  [number, number] = [
  74.95,
  41.45,
];

const COUNTRY_BASE_ZOOM =
  6.7;

/**
 * Максимально допустимый zoom-out
 * только для очень маленьких viewport.
 *
 * В нормальных desktop размерах
 * карта останется значительно ближе
 * к твоему 6.7.
 */
const MAX_RESPONSIVE_ZOOM_OUT =
  0.7;

const RESPONSIVE_MIN_ZOOM =
  COUNTRY_BASE_ZOOM -
  MAX_RESPONSIVE_ZOOM_OUT;

/**
 * После остановки resize
 * ждём совсем немного и только один раз
 * корректируем camera.
 *
 * Это убирает дёрганье во время drag-resize.
 */
const RESPONSIVE_RESIZE_DEBOUNCE =
  180;

/**
 * Если изменение zoom меньше этого значения,
 * camera не трогаем.
 */
const RESPONSIVE_ZOOM_EPSILON =
  0.01;

/**
 * Рассчитывает scale относительно
 * твоего baseline 1920×912.
 *
 * Ниже baseline:
 *
 * - сохраняем существующую логику;
 * - берём меньший коэффициент ширины/высоты.
 *
 * Выше baseline:
 *
 * - ширина становится главным фактором;
 * - высота больше не блокирует увеличение;
 * - это позволяет ultrawide и большим desktop
 *   сохранять сопоставимый визуальный размер страны.
 */
function getResponsiveScale():
  number {
  if (
    typeof window ===
    "undefined"
  ) {
    return 1;
  }

  const width =
    window.innerWidth;

  const height =
    window.innerHeight;

  if (
    width <= 0 ||
    height <= 0
  ) {
    return 1;
  }

  const widthScale =
    width /
    BASELINE_WIDTH;

  const heightScale =
    height /
    BASELINE_HEIGHT;

  /**
   * Ниже baseline ничего не меняем:
   * карта отдаляется относительно меньшей оси.
   */
  if (
    widthScale < 1 ||
    heightScale < 1
  ) {
    return Math.min(
      widthScale,
      heightScale,
      1
    );
  }

  /**
   * На больших экранах используем именно ширину.
   *
   * Это ключевое отличие:
   *
   * 1920×1080 → 1.00
   * 2560×1080 → 1.33
   * 3440×1440 → 1.79
   * 3840×2160 → 2.00
   *
   * Дальше масштаб ограничивается
   * в getResponsiveCountryZoom().
   */
  return widthScale;
}

/**
 * Переводит responsive scale
 * в MapLibre zoom.
 *
 * MapLibre использует logarithmic zoom,
 * поэтому log2 даёт естественное изменение
 * масштаба.
 *
 * baseline:
 *
 * scale 1
 * ↓
 * zoom 6.7
 *
 * меньше viewport:
 *
 * scale < 1
 * ↓
 * zoom уменьшается
 *
 * больше viewport:
 *
 * scale > 1
 * ↓
 * zoom увеличивается
 */
function getResponsiveCountryZoom():
  number {
  const scale =
    getResponsiveScale();

  const deltaZoom =
    Math.log2(
      scale
    );

  const limitedDelta =
    Math.max(
      -MAX_RESPONSIVE_ZOOM_OUT,
      Math.min(
        1,
        deltaZoom
      )
    );

  return Math.min(
    COUNTRY_BASE_ZOOM + 1,
    Math.max(
      RESPONSIVE_MIN_ZOOM,
      COUNTRY_BASE_ZOOM +
        limitedDelta
    )
  );
}

/* ============================================================
   COMPONENT
   ============================================================ */

export default function MainMap({
  selectedCity = null,
  filters,
  onListingSelect,
  focusedListing = null,
  onLocateMeReady,
  onLocationChange,
  searchRadius = null,
  userLocation = null,
}: MainMapProps) {

  const mapContainer =
    useRef<HTMLDivElement>(
      null
    );

  const mapRef =
    useRef<
      maplibregl.Map | null
    >(null);

  const userLocationControlRef =
    useRef<
      maplibregl.GeolocateControl | null
    >(null);

  const clusterHandleRef =
    useRef<
      ReturnType<
        typeof setupClusterLayer
      > | null
    >(null);

  /**
   * Таймер debounce для запросов.
   */
  const loadTimerRef =
    useRef<
      ReturnType<
        typeof setTimeout
      > | null
    >(null);

  /**
   * Таймер responsive resize.
   */
  const responsiveResizeTimerRef =
    useRef<
      ReturnType<
        typeof setTimeout
      > | null
    >(null);

  /**
   * Карта готова к загрузке данных.
   */
  const isReadyRef =
    useRef(false);

  /**
   * Защита от race condition.
   */
  const requestIdRef =
    useRef(0);

  /**
   * Responsive camera работает
   * только для country view.
   *
   * После выбора города/объявления
   * отключается.
   */
  const responsiveCountryViewRef =
    useRef(true);

  /**
   * Флаг:
   *
   * следующий zoom был вызван нами
   * во время responsive resize.
   *
   * Нужен, чтобы существующий zoomend
   * не принял наш resize за действие
   * пользователя.
   */
  const responsiveCameraChangeRef =
    useRef(false);

  const [
    isLoaded,
    setIsLoaded,
  ] =
    useState(false);

  const {
    t,
    language,
  } =
    useTranslation();

  /**
   * Текущий язык хранится в ref.
   *
   * MapLibre и его listeners создаются
   * один раз.
   */
  const languageRef =
    useRef(language);

  const onLocateMeReadyRef =
    useRef<
      ((locateMe: () => void) => void) | undefined
    >(undefined);

  /**
   * Динамические значения храним
   * в ref, чтобы изменение фильтра,
   * радиуса или координат пользователя
   * НЕ пересоздавало MapLibre instance.
   */
  const filtersRef =
    useRef<
      ListingsFilter | undefined
    >(filters);

  const searchRadiusRef =
    useRef<
      | null
      | 3000
      | 5000
      | 10000
    >(searchRadius);

  const userLocationRef =
    useRef<
      {
        latitude: number;
        longitude: number;
        accuracy: number;
      } | null
    >(userLocation);

  const onLocationChangeRef =
    useRef<
      | ((
          coordinates: {
            latitude: number;
            longitude: number;
            accuracy: number;
          }
        ) => void)
      | undefined
    >(undefined);

  onLocateMeReadyRef.current =
    onLocateMeReady;

  onLocationChangeRef.current =
    onLocationChange;

  filtersRef.current =
    filters;

  searchRadiusRef.current =
    searchRadius;

  userLocationRef.current =
    userLocation;

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

        pitch:
          0,

        bearing:
          0,

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

        antialias:
          true,

        fadeDuration:
          300,
      });

    map.dragRotate.disable();

    map.touchZoomRotate.disableRotation();

    mapRef.current =
      map;

    /**
     * MapLibre load.
     */
    map.on(
      "load",
      () => {
        setupMapLayers(
          map,
          languageRef.current
        );

        const userLocationControl =
          createUserLocationControl({
            onLocationChange:
              (
                coordinates
              ) => {
                userLocationRef.current =
                  coordinates;

                onLocationChangeRef.current?.(
                  coordinates
                );
              },
          });

        userLocationControlRef.current =
          userLocationControl;

        map.addControl(
          userLocationControl,
          "bottom-right"
        );

        onLocateMeReadyRef.current?.(
          () => {
            userLocationControl.trigger();
          }
        );

        clusterHandleRef.current =
          setupClusterLayer(
            map,
            {
              data: [],

              minZoom:
                CITY_FLY_TO_ZOOM,
            }
          );

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
              event
                .features[0]
                .properties as Record<
                string,
                unknown
              >;

            onListingSelect?.({
              id:
                String(
                  props.id
                ),

              title:
                String(
                  props.title ??
                    "Без названия"
                ),

              price:
                Number(
                  props.price ??
                    0
                ),

              currency:
                String(
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
                props.rooms !=
                  null
                  ? Number(
                      props.rooms
                    )
                  : undefined,

              area:
                props.area !=
                  null
                  ? Number(
                      props.area
                    )
                  : undefined,

              floor:
                props.floor !=
                  null
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
                props.pets ===
                true,
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
              .style.cursor =
              "";
          }
        );

        /**
         * -----------------------------------------------------
         * INITIAL CAMERA
         * -----------------------------------------------------
         *
         * На 1920×912:
         *
         * center = [74.95, 41.45]
         * zoom = 6.7
         *
         * На меньшем viewport
         * допускается только responsive zoom-out.
         */
        const initialZoom =
          getResponsiveCountryZoom();

        /**
         * Временно разрешаем карте
         * отдалиться ниже исходного minZoom,
         * если viewport этого требует.
         */
        map.setMinZoom(
          Math.min(
            MAP_CONFIG.minZoom,
            initialZoom
          )
        );

        map.jumpTo({
          center:
            COUNTRY_CENTER,

          zoom:
            initialZoom,
        });

        /**
         * At low zoom we don't allow arbitrary horizontal
         * dragging away from the initial country view.
         */
        map.dragPan.disable();

        /**
         * Существующая логика управления pan
         * остаётся.
         */
        map.on(
          "zoomend",
          () => {
            /**
             * Если это был именно наш
             * responsive resize — не считаем
             * его пользовательским zoom.
             */
            if (
              responsiveCameraChangeRef.current
            ) {
              responsiveCameraChangeRef.current =
                false;

              return;
            }

            const countryZoom =
              getResponsiveCountryZoom();

            if (
              map.getZoom() >
              countryZoom +
                0.1
            ) {
              /**
               * Пользователь увеличил карту.
               */
              responsiveCountryViewRef.current =
                false;

              map.dragPan.enable();
            } else {
              /**
               * Возврат к responsive country view.
               */
              map.dragPan.disable();

              responsiveCountryViewRef.current =
                true;

              map.easeTo({
                center:
                  COUNTRY_CENTER,

                zoom:
                  countryZoom,

                duration:
                  200,
              });
            }
          }
        );
      }
    );

    /**
     * One idle listener only.
     */
    map.once(
      "idle",
      () => {
        setIsLoaded(
          true
        );

        isReadyRef.current =
          true;
      }
    );

    return () => {
      isReadyRef.current =
        false;

      requestIdRef.current +=
        1;

      if (
        loadTimerRef.current
      ) {
        clearTimeout(
          loadTimerRef.current
        );

        loadTimerRef.current =
          null;
      }

      if (
        responsiveResizeTimerRef.current
      ) {
        clearTimeout(
          responsiveResizeTimerRef.current
        );

        responsiveResizeTimerRef.current =
          null;
      }

      clusterHandleRef.current?.destroy();

      clusterHandleRef.current =
        null;

      userLocationControlRef.current =
        null;

      map.remove();

      mapRef.current =
        null;
    };
  }, [
    onListingSelect,
  ]);

  /* =========================================================
     RESPONSIVE MAP RESIZE
     ========================================================= */

  useEffect(() => {
    const map =
      mapRef.current;

    const container =
      mapContainer.current;

    if (
      !map ||
      !container ||
      !isLoaded
    ) {
      return;
    }

    const handleResize =
      () => {
        /**
         * -----------------------------------------------------
         * Главное отличие:
         *
         * во время drag-resize мы НЕ трогаем camera.
         *
         * Только ждём окончания resize.
         * -----------------------------------------------------
         */

        if (
          responsiveResizeTimerRef.current
        ) {
          clearTimeout(
            responsiveResizeTimerRef.current
          );
        }

        responsiveResizeTimerRef.current =
          setTimeout(
            () => {
              responsiveResizeTimerRef.current =
                null;

              /**
               * MapLibre получает актуальный
               * размер контейнера.
               */
              map.resize();

              /**
               * Если карта уже не находится
               * в исходном country view —
               * пользователя не трогаем.
               */
              if (
                !responsiveCountryViewRef.current
              ) {
                return;
              }

              /**
               * Новый responsive zoom.
               */
              const nextZoom =
                getResponsiveCountryZoom();

              const currentZoom =
                map.getZoom();

              /**
               * Ничего не делаем,
               * если zoom практически тот же.
               */
              if (
                Math.abs(
                  currentZoom -
                    nextZoom
                ) <
                RESPONSIVE_ZOOM_EPSILON
              ) {
                return;
              }

              /**
               * Разрешаем responsive camera
               * временно выйти за стандартный
               * minZoom, если viewport требует
               * другого country zoom.
               */
              map.setMinZoom(
                Math.min(
                  MAP_CONFIG.minZoom,
                  nextZoom
                )
              );

              /**
               * Ставим флаг до zoomend,
               * чтобы существующая логика
               * zoomend не считала это
               * пользовательским zoom.
               */
              responsiveCameraChangeRef.current =
                true;

              /**
               * Только zoom.
               *
               * Center НЕ задаём.
               *
               * Поэтому карта не прыгает
               * в другую географическую точку.
               */
              map.jumpTo({
                zoom:
                  nextZoom,
              });
            },
            RESPONSIVE_RESIZE_DEBOUNCE
          );
      };

    /**
     * MapLibre сам отслеживает изменение
     * размера контейнера.
     *
     * Этот listener нужен только для
     * нашей дополнительной responsive camera.
     */
    window.addEventListener(
      "resize",
      handleResize
    );

    return () => {
      window.removeEventListener(
        "resize",
        handleResize
      );

      if (
        responsiveResizeTimerRef.current
      ) {
        clearTimeout(
          responsiveResizeTimerRef.current
        );

        responsiveResizeTimerRef.current =
          null;
      }
    };
  }, [
    isLoaded,
  ]);

  /* =========================================================
     LOAD LISTINGS
     ========================================================= */

  const loadListings =
    useCallback(
      async () => {
        if (
          !mapRef.current ||
          !isReadyRef.current ||
          !clusterHandleRef.current
        ) {
          return;
        }

        const map =
          mapRef.current;

        const currentRequestId =
          ++requestIdRef.current;

        const currentRadius =
          searchRadiusRef.current;

        const currentUserLocation =
          userLocationRef.current;

        const currentFilters =
          filtersRef.current;

        try {
          let geojson:
            GeoJSON.FeatureCollection;

          /**
           * =====================================================
           * RADIUS SEARCH
           * =====================================================
           *
           * Если радиус включён и координаты
           * пользователя уже известны —
           * используем PostGIS radius RPC.
           */
          if (
            currentRadius !==
              null &&
            currentUserLocation
          ) {
            geojson =
              await fetchListingsGeoJSONByRadius(
                {
                  ...(currentFilters ??
                    {}),

                  latitude:
                    currentUserLocation.latitude,

                  longitude:
                    currentUserLocation.longitude,

                  radiusMeters:
                    currentRadius,
                }
              );
          } else {
            /**
             * =================================================
             * ОБЫЧНЫЙ VIEWPORT SEARCH
             * =================================================
             *
             * Радиус выключен —
             * полностью сохраняем старую механику.
             */
            const bounds =
              map.getBounds();

            geojson =
              await fetchListingsGeoJSON(
                {
                  ...(currentFilters ??
                    {}),

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
          }

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
                  feature
                    .properties as
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
        } catch (
          error
        ) {
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
      },
      []
    );

  /* =========================================================
     DEBOUNCE
     ========================================================= */

  const scheduleLoad =
    useCallback(
      () => {
        if (
          loadTimerRef.current
        ) {
          clearTimeout(
            loadTimerRef.current
          );
        }

        loadTimerRef.current =
          setTimeout(
            () => {
              loadTimerRef.current =
                null;

              void loadListings();
            },
            DEBOUNCE_MS
          );
      },
      [
        loadListings,
      ]
    );

  /* =========================================================
     FILTER CHANGES
     ========================================================= */

  useEffect(() => {
    if (
      !isLoaded
    ) {
      return;
    }

    scheduleLoad();
  }, [
    filters,
    isLoaded,
    scheduleLoad,
  ]);

  /* =========================================================
     RADIUS / LOCATION CHANGES
     ========================================================= */

  useEffect(() => {
    if (
      !isLoaded
    ) {
      return;
    }

    /**
     * Если радиус выключен —
     * возвращаем обычный viewport search.
     *
     * Если радиус включён, но координаты
     * ещё не определены — не делаем запрос.
     *
     * Координаты появятся после
     * UserLocationControl.
     */
    if (
      searchRadius !==
        null &&
      !userLocation
    ) {
      return;
    }

    scheduleLoad();
  }, [
    searchRadius,
    userLocation,
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
        /**
         * В radius mode движение карты
         * не должно менять центр поиска:
         *
         * центр = userLocation
         *
         * Поэтому запрос после moveend
         * здесь нужен только в обычном режиме.
         */
        if (
          searchRadiusRef.current !==
          null
        ) {
          return;
        }

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
    if (
      !isLoaded
    ) {
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

    /**
     * Город — отдельный camera mode.
     *
     * Responsive country resize
     * сюда больше не вмешивается.
     */
    responsiveCountryViewRef.current =
      false;

    mapRef.current.flyTo({
      center:
        selectedCity.coordinates,

      zoom:
        CITY_FLY_TO_ZOOM,

      duration:
        CITY_FLY_TO_DURATION,

      essential:
        true,
    });
  }, [
    selectedCity,
    isLoaded,
  ]);

  /* =========================================================
     FAVORITE FLY-TO
     =========================================================

     Вызывается, когда пользователь нажимает
     на объявление в Sidebar → Избранное.

     Никакой отдельной карты не создаём.
     Используем существующий MapLibre instance.
     ========================================================= */

  useEffect(() => {
    if (
      !isLoaded ||
      !mapRef.current ||
      !focusedListing
    ) {
      return;
    }

    responsiveCountryViewRef.current =
      false;

    mapRef.current.flyTo({
      center:
        focusedListing.coordinates,

      zoom:
        FAVORITE_FLY_TO_ZOOM,

      duration:
        FAVORITE_FLY_TO_DURATION,

      essential:
        true,
    });
  }, [
    focusedListing,
    isLoaded,
  ]);

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <div className="relative h-full w-full overflow-hidden bg-transparent">
      {/* Map */}
      <div
        ref={
          mapContainer
        }
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
              {t(
                "map.preparing"
              )}
            </p>

            <div className="mt-6 h-px w-24 overflow-hidden rounded-full bg-neutral-200">
              <div
                className="h-full bg-neutral-900 animate-pulse"
                style={{
                  width:
                    "65%",
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
  if (
    Array.isArray(
      raw
    )
  ) {
    return raw as string[];
  }

  if (
    typeof raw ===
    "string"
  ) {
    try {
      const parsed =
        JSON.parse(
          raw
        );

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