import maplibregl from "maplibre-gl";

const USER_LOCATION_SOURCE =
  "jaymap-user-location-source";

const USER_LOCATION_DOT_LAYER =
  "jaymap-user-location-dot";

const USER_LOCATION_PULSE_LAYER =
  "jaymap-user-location-pulse";

const USER_LOCATION_ACCURACY_LAYER =
  "jaymap-user-location-accuracy";

const USER_LOCATION_COLOR =
  "#3a62db";

export interface UserLocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface UserLocationControlOptions {
  onLocationChange?: (
    coordinates: UserLocationCoordinates
  ) => void;
}

/**
 * Отдельный контроллер геолокации JayMap.
 *
 * Основная геолокация выполняется через
 * стандартный MapLibre GeolocateControl.
 *
 * Отображение пользователя реализовано
 * собственными MapLibre source/layers:
 *
 * - точка пользователя;
 * - пульсирующий индикатор;
 * - круг точности.
 *
 * Цвет намеренно зафиксирован:
 * #6FC9C2
 */
class JayMapUserLocationControl
  implements maplibregl.IControl {
  private map:
    | maplibregl.Map
    | null = null;

  private geolocateControl:
    | maplibregl.GeolocateControl
    | null = null;

  private visible =
    true;

  private currentCoordinates:
    | UserLocationCoordinates
    | null = null;

  private pulseAnimationFrame:
    | number
    | null = null;

  private readonly onLocationChange:
    | ((
        coordinates: UserLocationCoordinates
      ) => void)
    | undefined;

  private readonly controlElement =
    document.createElement("div");

  constructor(
    options: UserLocationControlOptions = {}
  ) {
    this.onLocationChange =
      options.onLocationChange;

    this.controlElement.style.display =
      "none";
  }

  onAdd(
    map: maplibregl.Map
  ): HTMLElement {
    this.map =
      map;

    this.geolocateControl =
      new maplibregl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy:
            true,

          timeout:
            10000,

          maximumAge:
            30000,
        },

        trackUserLocation:
          false,

        showUserLocation:
          false,

        showAccuracyCircle:
          false,

        fitBoundsOptions: {
          maxZoom:
            15,
        },
      });

    this.geolocateControl.on(
      "geolocate",
      (event) => {
        const coordinates: UserLocationCoordinates = {
          latitude:
            event.coords.latitude,

          longitude:
            event.coords.longitude,

          accuracy:
            event.coords.accuracy,
        };

        this.currentCoordinates =
          coordinates;

        this.onLocationChange?.(
          coordinates
        );

        this.ensureSourceAndLayers();

        this.updateUserLocationLayers();

        this.startPulseAnimation();
      }
    );

    /*
     * Подключаем внутренний
     * GeolocateControl к той же карте.
     *
     * Его собственный DOM пользователю
     * не показываем.
     */
    this.geolocateControl.onAdd(
      map
    );

    this.ensureSourceAndLayers();

    return this.controlElement;
  }

  onRemove(
    map: maplibregl.Map
  ): void {
    this.stopPulseAnimation();

    this.removeUserLocationLayers();

    this.geolocateControl?.onRemove(
      map
    );

    this.geolocateControl =
      null;

    this.map =
      null;

    this.currentCoordinates =
      null;
  }

  /**
   * Первый вызов:
   * определяет местоположение.
   *
   * После получения координат:
   * trigger() становится переключателем:
   *
   * visible -> hide
   * hidden  -> show
   */
  trigger(): void {
    if (
      this.currentCoordinates
    ) {
      if (
        this.visible
      ) {
        this.hide();
      } else {
        this.show();
      }

      return;
    }

    this.visible =
      true;

    this.geolocateControl?.trigger();
  }

  /**
   * Показывает пользователя.
   */
  show(): void {
    this.visible =
      true;

    this.setLayersVisibility(
      "visible"
    );

    if (
      this.currentCoordinates
    ) {
      this.startPulseAnimation();
    }
  }

  /**
   * Скрывает пользователя.
   *
   * Координаты сохраняются.
   */
  hide(): void {
    this.visible =
      false;

    this.stopPulseAnimation();

    this.setLayersVisibility(
      "none"
    );
  }

  /**
   * Текущее состояние видимости.
   */
  isVisible(): boolean {
    return this.visible;
  }

  /**
   * Возвращает последние известные
   * координаты пользователя.
   */
  getCoordinates():
    | UserLocationCoordinates
    | null {
    return this.currentCoordinates;
  }

  /**
   * Создаёт source и слои один раз.
   */
  private ensureSourceAndLayers():
    void {
    const map =
      this.map;

    if (!map) {
      return;
    }

    if (
      !map.getSource(
        USER_LOCATION_SOURCE
      )
    ) {
      map.addSource(
        USER_LOCATION_SOURCE,
        {
          type:
            "geojson",

          data: {
            type:
              "FeatureCollection",

            features: [],
          },
        }
      );
    }

    /*
     * Реальный круг точности.
     *
     * Его радиус никогда не анимируется.
     */
    if (
      !map.getLayer(
        USER_LOCATION_ACCURACY_LAYER
      )
    ) {
      map.addLayer({
        id:
          USER_LOCATION_ACCURACY_LAYER,

        type:
          "fill",

        source:
          USER_LOCATION_SOURCE,

        filter: [
          "==",
          ["get", "kind"],
          "accuracy",
        ],

        paint: {
          "fill-color":
            USER_LOCATION_COLOR,

          "fill-opacity":
            0.12,

          "fill-outline-color":
            USER_LOCATION_COLOR,
        },
      });
    }

    /*
     * Живой pulse.
     */
    if (
      !map.getLayer(
        USER_LOCATION_PULSE_LAYER
      )
    ) {
      map.addLayer({
        id:
          USER_LOCATION_PULSE_LAYER,

        type:
          "circle",

        source:
          USER_LOCATION_SOURCE,

        filter: [
          "==",
          ["get", "kind"],
          "pulse",
        ],

        paint: {
          "circle-radius":
            10,

          "circle-color":
            USER_LOCATION_COLOR,

          "circle-opacity":
            0.28,

          "circle-stroke-width":
            0,

          "circle-blur":
            0.35,
        },
      });
    }

    /*
     * Центральная точка пользователя.
     */
    if (
      !map.getLayer(
        USER_LOCATION_DOT_LAYER
      )
    ) {
      map.addLayer({
        id:
          USER_LOCATION_DOT_LAYER,

        type:
          "circle",

        source:
          USER_LOCATION_SOURCE,

        filter: [
          "==",
          ["get", "kind"],
          "user",
        ],

        paint: {
          "circle-radius":
            7,

          "circle-color":
            USER_LOCATION_COLOR,

          "circle-stroke-color":
            "#FFFFFF",

          "circle-stroke-width":
            2,

          "circle-opacity":
            1,
        },
      });
    }

    this.setLayersVisibility(
      this.visible
        ? "visible"
        : "none"
    );
  }

  /**
   * Обновляет GeoJSON source
   * координатами пользователя.
   */
  private updateUserLocationLayers():
    void {
    const map =
      this.map;

    if (
      !map ||
      !this.currentCoordinates
    ) {
      return;
    }

    this.ensureSourceAndLayers();

    const source =
      map.getSource(
        USER_LOCATION_SOURCE
      );

    if (
      !source ||
      !("setData" in source)
    ) {
      return;
    }

    const {
      latitude,
      longitude,
      accuracy,
    } =
      this.currentCoordinates;

    const accuracyPolygon =
      createAccuracyPolygon(
        longitude,
        latitude,
        Math.max(
          accuracy,
          1
        )
      );

    source.setData({
      type:
        "FeatureCollection",

      features: [
        {
          type:
            "Feature",

          properties: {
            kind:
              "user",
          },

          geometry: {
            type:
              "Point",

            coordinates: [
              longitude,
              latitude,
            ],
          },
        },

        {
          type:
            "Feature",

          properties: {
            kind:
              "pulse",
          },

          geometry: {
            type:
              "Point",

            coordinates: [
              longitude,
              latitude,
            ],
          },
        },

        {
          type:
            "Feature",

          properties: {
            kind:
              "accuracy",
          },

          geometry:
            accuracyPolygon,
        },
      ],
    });

    this.setLayersVisibility(
      this.visible
        ? "visible"
        : "none"
    );
  }

  /**
   * Запускает лёгкую пульсацию.
   *
   * Один цикл:
   * 0 → 2 секунды
   *
   * Радиус:
   * 10px → 32px
   *
   * Прозрачность:
   * 0.28 → 0
   *
   * Центральная точка
   * не меняется.
   */
  private startPulseAnimation():
    void {
    if (
      this.pulseAnimationFrame !==
        null ||
      !this.map ||
      !this.currentCoordinates ||
      !this.visible
    ) {
      return;
    }

    const map =
      this.map;

    const startTime =
      performance.now();

    const animate =
      (
        timestamp: number
      ) => {
        if (
          !this.visible ||
          !this.map ||
          !this.currentCoordinates
        ) {
          this.pulseAnimationFrame =
            null;

          return;
        }

        const elapsed =
          (timestamp -
            startTime) %
          2000;

        const progress =
          elapsed /
          2000;

        /*
         * Ease-out:
         * импульс быстро расходится
         * и мягко затухает.
         */
        const eased =
          1 -
          Math.pow(
            1 - progress,
            2
          );

        const radius =
          10 +
          eased *
            22;

        const opacity =
          0.28 *
          (1 - eased);

        if (
          map.getLayer(
            USER_LOCATION_PULSE_LAYER
          )
        ) {
          map.setPaintProperty(
            USER_LOCATION_PULSE_LAYER,
            "circle-radius",
            radius
          );

          map.setPaintProperty(
            USER_LOCATION_PULSE_LAYER,
            "circle-opacity",
            opacity
          );
        }

        this.pulseAnimationFrame =
          requestAnimationFrame(
            animate
          );
      };

    this.pulseAnimationFrame =
      requestAnimationFrame(
        animate
      );
  }

  /**
   * Останавливает animation loop.
   */
  private stopPulseAnimation():
    void {
    if (
      this.pulseAnimationFrame !==
      null
    ) {
      cancelAnimationFrame(
        this.pulseAnimationFrame
      );

      this.pulseAnimationFrame =
        null;
    }
  }

  /**
   * Управляет visibility
   * пользовательских слоёв.
   */
  private setLayersVisibility(
    visibility:
      | "visible"
      | "none"
  ): void {
    const map =
      this.map;

    if (!map) {
      return;
    }

    if (
      map.getLayer(
        USER_LOCATION_DOT_LAYER
      )
    ) {
      map.setLayoutProperty(
        USER_LOCATION_DOT_LAYER,
        "visibility",
        visibility
      );
    }

    if (
      map.getLayer(
        USER_LOCATION_PULSE_LAYER
      )
    ) {
      map.setLayoutProperty(
        USER_LOCATION_PULSE_LAYER,
        "visibility",
        visibility
      );
    }

    if (
      map.getLayer(
        USER_LOCATION_ACCURACY_LAYER
      )
    ) {
      map.setLayoutProperty(
        USER_LOCATION_ACCURACY_LAYER,
        "visibility",
        visibility
      );
    }
  }

  /**
   * Удаляет только наши source/layers.
   */
  private removeUserLocationLayers():
    void {
    const map =
      this.map;

    if (!map) {
      return;
    }

    if (
      map.getLayer(
        USER_LOCATION_PULSE_LAYER
      )
    ) {
      map.removeLayer(
        USER_LOCATION_PULSE_LAYER
      );
    }

    if (
      map.getLayer(
        USER_LOCATION_ACCURACY_LAYER
      )
    ) {
      map.removeLayer(
        USER_LOCATION_ACCURACY_LAYER
      );
    }

    if (
      map.getLayer(
        USER_LOCATION_DOT_LAYER
      )
    ) {
      map.removeLayer(
        USER_LOCATION_DOT_LAYER
      );
    }

    if (
      map.getSource(
        USER_LOCATION_SOURCE
      )
    ) {
      map.removeSource(
        USER_LOCATION_SOURCE
      );
    }
  }
}

/**
 * Создаёт control пользователя.
 *
 * Совместим с текущим MainMap:
 *
 * map.addControl(control)
 * control.trigger()
 */
export function createUserLocationControl(
  options: UserLocationControlOptions = {}
):
  JayMapUserLocationControl {
  return new JayMapUserLocationControl(
    options
  );
}

/**
 * Создаёт приблизительный круг
 * точности вокруг координаты пользователя.
 *
 * accuracy — радиус в метрах.
 */
function createAccuracyPolygon(
  longitude: number,
  latitude: number,
  radiusMeters: number
): GeoJSON.Polygon {
  const points =
    64;

  const coordinates:
    [number, number][] =
    [];

  const earthRadius =
    6371008.8;

  const angularDistance =
    radiusMeters /
    earthRadius;

  const latitudeRadians =
    (latitude *
      Math.PI) /
    180;

  const longitudeRadians =
    (longitude *
      Math.PI) /
    180;

  for (
    let index = 0;
    index <= points;
    index += 1
  ) {
    const bearing =
      (index /
        points) *
      Math.PI *
      2;

    const sinLatitude =
      Math.sin(
        latitudeRadians
      );

    const cosLatitude =
      Math.cos(
        latitudeRadians
      );

    const sinAngularDistance =
      Math.sin(
        angularDistance
      );

    const cosAngularDistance =
      Math.cos(
        angularDistance
      );

    const pointLatitude =
      Math.asin(
        sinLatitude *
          cosAngularDistance +
          cosLatitude *
            sinAngularDistance *
            Math.cos(
              bearing
            )
      );

    const pointLongitude =
      longitudeRadians +
      Math.atan2(
        Math.sin(
          bearing
        ) *
          sinAngularDistance *
          cosLatitude,
        cosAngularDistance -
          sinLatitude *
            Math.sin(
              pointLatitude
            )
      );

    coordinates.push([
      (pointLongitude *
        180) /
        Math.PI,

      (pointLatitude *
        180) /
        Math.PI,
    ]);
  }

  return {
    type:
      "Polygon",

    coordinates: [
      coordinates,
    ],
  };
}