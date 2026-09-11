import maplibregl from "maplibre-gl";

const SEARCH_RADIUS_SOURCE =
  "jaymap-search-radius-source";

const SEARCH_RADIUS_FILL_LAYER =
  "jaymap-search-radius-fill";

const SEARCH_RADIUS_LINE_LAYER =
  "jaymap-search-radius-line";

const SEARCH_RADIUS_COLOR =
  "#6FC9C2";

const SEARCH_RADIUS_FILL_OPACITY =
  0.13;

const SEARCH_RADIUS_LINE_OPACITY =
  0.50;

const SEARCH_RADIUS_LINE_WIDTH =
  1.5;

const CIRCLE_SEGMENTS =
  96;

const EARTH_RADIUS_METERS =
  6371008.8;

export type SearchRadius =
  | null
  | 3000
  | 5000
  | 10000;

export interface SearchRadiusCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Создаёт GeoJSON Polygon вокруг точки
 * на заданном расстоянии в метрах.
 *
 * Круг строится по геодезической формуле,
 * поэтому корректно работает независимо
 * от текущего zoom карты.
 */
function createRadiusPolygon(
  latitude: number,
  longitude: number,
  radiusMeters: number
): GeoJSON.Polygon {
  const latitudeRadians =
    (latitude * Math.PI) /
    180;

  const angularDistance =
    radiusMeters /
    EARTH_RADIUS_METERS;

  const coordinates: [
    number,
    number
  ][] = [];

  for (
    let index = 0;
    index <= CIRCLE_SEGMENTS;
    index += 1
  ) {
    const bearing =
      (index /
        CIRCLE_SEGMENTS) *
      Math.PI *
      2;

    const bearingSin =
      Math.sin(bearing);

    const bearingCos =
      Math.cos(bearing);

    const latitudePoint =
      Math.asin(
        Math.sin(
          latitudeRadians
        ) *
          Math.cos(
            angularDistance
          ) +
          Math.cos(
            latitudeRadians
          ) *
            Math.sin(
              angularDistance
            ) *
            bearingCos
      );

    const longitudePoint =
      longitude +
      (Math.atan2(
        bearingSin *
          Math.sin(
            angularDistance
          ) *
          Math.cos(
            latitudeRadians
          ),
        Math.cos(
          angularDistance
        ) -
          Math.sin(
            latitudeRadians
          ) *
            Math.sin(
              latitudePoint
            )
      ) *
        180) /
        Math.PI;

    coordinates.push([
      longitudePoint,
      (latitudePoint *
        180) /
        Math.PI,
    ]);
  }

  return {
    type: "Polygon",
    coordinates: [
      coordinates,
    ],
  };
}

/**
 * Создаёт source + layers один раз.
 *
 * Никакой логики геолокации здесь нет.
 * Функция отвечает исключительно за
 * визуальный слой радиуса поиска.
 */
export function ensureSearchRadiusLayer(
  map: maplibregl.Map
): void {
  if (
    !map.getSource(
      SEARCH_RADIUS_SOURCE
    )
  ) {
    map.addSource(
      SEARCH_RADIUS_SOURCE,
      {
        type: "geojson",

        data: {
          type: "FeatureCollection",

          features: [],
        },
      }
    );
  }

  /**
   * Мягкая полупрозрачная зона.
   */
  if (
    !map.getLayer(
      SEARCH_RADIUS_FILL_LAYER
    )
  ) {
    map.addLayer({
      id:
        SEARCH_RADIUS_FILL_LAYER,

      type: "fill",

      source:
        SEARCH_RADIUS_SOURCE,

      paint: {
        "fill-color":
          SEARCH_RADIUS_COLOR,

        "fill-opacity":
          SEARCH_RADIUS_FILL_OPACITY,
      },

      layout: {
        visibility: "none",
      },
    });
  }

  /**
   * Тонкий контур.
   */
  if (
    !map.getLayer(
      SEARCH_RADIUS_LINE_LAYER
    )
  ) {
    map.addLayer({
      id:
        SEARCH_RADIUS_LINE_LAYER,

      type: "line",

      source:
        SEARCH_RADIUS_SOURCE,

      paint: {
        "line-color":
          SEARCH_RADIUS_COLOR,

        "line-opacity":
          SEARCH_RADIUS_LINE_OPACITY,

        "line-width":
          SEARCH_RADIUS_LINE_WIDTH,
      },

      layout: {
        visibility: "none",
      },
    });
  }
}

/**
 * Показывает радиус поиска.
 *
 * radius = null:
 *   слой скрывается.
 *
 * coordinates отсутствуют:
 *   слой скрывается.
 */
export function updateSearchRadiusLayer(
  map: maplibregl.Map,
  coordinates:
    | SearchRadiusCoordinates
    | null,
  radius: SearchRadius
): void {
  ensureSearchRadiusLayer(
    map
  );

  const source =
    map.getSource(
      SEARCH_RADIUS_SOURCE
    );

  if (
    !source ||
    !(
      "setData" in source
    )
  ) {
    return;
  }

  if (
    !coordinates ||
    radius === null
  ) {
    source.setData({
      type:
        "FeatureCollection",

      features: [],
    });

    setSearchRadiusVisibility(
      map,
      false
    );

    return;
  }

  const polygon =
    createRadiusPolygon(
      coordinates.latitude,
      coordinates.longitude,
      radius
    );

  source.setData({
    type:
      "FeatureCollection",

    features: [
      {
        type: "Feature",

        properties: {
          radiusMeters:
            radius,
        },

        geometry:
          polygon,
      },
    ],
  });

  setSearchRadiusVisibility(
    map,
    true
  );
}

/**
 * Только visibility.
 *
 * Данные source при этом сохраняются.
 */
export function setSearchRadiusVisibility(
  map: maplibregl.Map,
  visible: boolean
): void {
  const visibility =
    visible
      ? "visible"
      : "none";

  if (
    map.getLayer(
      SEARCH_RADIUS_FILL_LAYER
    )
  ) {
    map.setLayoutProperty(
      SEARCH_RADIUS_FILL_LAYER,
      "visibility",
      visibility
    );
  }

  if (
    map.getLayer(
      SEARCH_RADIUS_LINE_LAYER
    )
  ) {
    map.setLayoutProperty(
      SEARCH_RADIUS_LINE_LAYER,
      "visibility",
      visibility
    );
  }
}

/**
 * Удаляет только наши source/layers.
 *
 * Нужен для cleanup MainMap.
 */
export function removeSearchRadiusLayer(
  map: maplibregl.Map
): void {
  if (
    map.getLayer(
      SEARCH_RADIUS_LINE_LAYER
    )
  ) {
    map.removeLayer(
      SEARCH_RADIUS_LINE_LAYER
    );
  }

  if (
    map.getLayer(
      SEARCH_RADIUS_FILL_LAYER
    )
  ) {
    map.removeLayer(
      SEARCH_RADIUS_FILL_LAYER
    );
  }

  if (
    map.getSource(
      SEARCH_RADIUS_SOURCE
    )
  ) {
    map.removeSource(
      SEARCH_RADIUS_SOURCE
    );
  }
}