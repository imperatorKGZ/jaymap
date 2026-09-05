import type maplibregl from "maplibre-gl";
import {
  ClusterEngine,
  type ClusterEngineOptions,
} from "./clusterEngine";

import {
  buildAllClusterIcons,
  clusterIconImageExpression,
  clusterTextSizeExpression,
} from "./clusterStyle";

import {
  addPriceMarkerLayer,
  PRICE_MARKER_HOVER_LAYER_ID,
} from "./PriceMarkerLayer";

import {
  flyIntoCluster,
} from "./ClusterAnimation";

import {
  formatSomPrice,
} from "./priceFormat";

import type {
  ListingFeature,
} from "./types";

export const CLUSTER_SOURCE_ID =
  "jaymap-listings-source";

export const CLUSTER_BADGE_LAYER_ID =
  "jaymap-cluster-badge";

export const CLUSTER_BADGE_HOVER_LAYER_ID =
  "jaymap-cluster-badge-hover";

/**
 * Невидимый слой, который занимает место
 * кластера в collision index.
 *
 * Сам пользователь его не видит.
 */
export const CLUSTER_COLLISION_LAYER_ID =
  "jaymap-cluster-collision";

/** @deprecated */
export const CLUSTER_COUNT_LAYER_ID =
  CLUSTER_BADGE_LAYER_ID;

const ALL_LAYER_IDS = [
  CLUSTER_BADGE_LAYER_ID,
  CLUSTER_BADGE_HOVER_LAYER_ID,
  CLUSTER_COLLISION_LAYER_ID,
];

export interface SetupClusterLayerOptions {
  data: ListingFeature[];

  minZoom?: number;

  clustering?: ClusterEngineOptions;
}

export interface ClusterLayerHandle {
  engine: ClusterEngine;

  refresh: () => void;

  setData: (
    data: ListingFeature[]
  ) => void;

  destroy: () => void;
}

function prepareListings(
  data: ListingFeature[]
): ListingFeature[] {
  return data.map(
    (feature) => ({
      ...feature,

      properties: {
        ...feature.properties,

        /*
         * Считаем подпись цены один раз.
         */
        priceLabel:
          formatSomPrice(
            feature.properties.price
          ),
      },
    })
  );
}

function registerClusterIcons(
  map: maplibregl.Map
): void {
  buildAllClusterIcons().forEach(
    (icon) => {
      if (
        !map.hasImage(
          icon.id
        )
      ) {
        map.addImage(
          icon.id,
          icon.data,
          {
            pixelRatio:
              icon.pixelRatio,
          }
        );
      }
    }
  );
}

/* ============================================================
   VISIBLE CLUSTER
   ============================================================ */

function addClusterBadgeLayer(
  map: maplibregl.Map,
  minZoom: number
): void {
  if (
    map.getLayer(
      CLUSTER_BADGE_LAYER_ID
    )
  ) {
    return;
  }

  map.addLayer({
    id:
      CLUSTER_BADGE_LAYER_ID,

    type:
      "symbol",

    source:
      CLUSTER_SOURCE_ID,

    minzoom:
      minZoom,

    filter: [
      "has",
      "point_count",
    ],

    layout: {
      "icon-image":
        clusterIconImageExpression(),

      /*
       * Кластер всегда остаётся видимым.
       *
       * Collision для его визуального слоя
       * специально отключён.
       */
      "icon-allow-overlap":
        true,

      "icon-ignore-placement":
        true,

      /*
       * Число находится в том же symbol layer.
       */
      "text-field": [
        "to-string",
        [
          "get",
          "point_count",
        ],
      ],

      "text-font": [
        "Noto Sans Bold",
      ],

      "text-size":
        clusterTextSizeExpression(),

      "text-allow-overlap":
        true,

      "text-ignore-placement":
        true,
    },

    paint: {
      "text-color":
        "#ffffff",

      "icon-opacity-transition": {
        duration:
          300,
      },

      "text-opacity-transition": {
        duration:
          300,
      },
    },
  });
}

/**
 * Отдельный hover-слой поверх обычного cluster.
 *
 * Сам cluster не меняет свой исходный дизайн:
 * дополнительный слой даёт только мягкое
 * увеличение + turquoise glow по внешнему краю.
 */
function addClusterBadgeHoverLayer(
  map: maplibregl.Map,
  minZoom: number
): void {
  if (
    map.getLayer(
      CLUSTER_BADGE_HOVER_LAYER_ID
    )
  ) {
    return;
  }

  map.addLayer({
    id:
      CLUSTER_BADGE_HOVER_LAYER_ID,

    type:
      "symbol",

    source:
      CLUSTER_SOURCE_ID,

    minzoom:
      minZoom,

    filter: [
      "all",
      [
        "has",
        "point_count",
      ],
      [
        "==",
        [
          "get",
          "cluster_id",
        ],
        "__jaymap_no_hover__",
      ],
    ],

    layout: {
      "icon-image":
        clusterIconImageExpression(),

      "icon-size":
        1.08,

      "icon-allow-overlap":
        true,

      "icon-ignore-placement":
        true,

      "text-field": [
        "to-string",
        [
          "get",
          "point_count",
        ],
      ],

      "text-font": [
        "Noto Sans Bold",
      ],

      "text-size":
        clusterTextSizeExpression(),

      "text-allow-overlap":
        true,

      "text-ignore-placement":
        true,
    },

    paint: {
      "icon-opacity":
        0.38,

      "text-opacity":
        0,
    },
  });
}

/* ============================================================
   INVISIBLE CLUSTER COLLISION
   ============================================================ */

/**
 * Невидимая копия cluster symbol.
 *
 * Она:
 *
 * - использует ТОТ ЖЕ icon-image;
 * - находится в ТОЙ ЖЕ координате;
 * - имеет ТОТ ЖЕ приблизительный размер;
 * - ничего не рисует;
 * - но участвует в collision detection.
 *
 * Благодаря этому city labels понимают:
 *
 * "здесь уже занят cluster".
 */
function addClusterCollisionLayer(
  map: maplibregl.Map,
  minZoom: number
): void {
  if (
    map.getLayer(
      CLUSTER_COLLISION_LAYER_ID
    )
  ) {
    return;
  }

  map.addLayer({
    id:
      CLUSTER_COLLISION_LAYER_ID,

    type:
      "symbol",

    source:
      CLUSTER_SOURCE_ID,

    minzoom:
      minZoom,

    filter: [
      "has",
      "point_count",
    ],

    layout: {
      /*
       * Та же иконка, что у настоящего cluster.
       *
       * Поэтому collision box примерно
       * соответствует реальному визуальному объекту.
       */
      "icon-image":
        clusterIconImageExpression(),

      "icon-allow-overlap":
        false,

      "icon-ignore-placement":
        false,

      "icon-padding":
        8,

      /*
       * Отдельно резервируем пространство
       * под число.
       */
      "text-field": [
        "to-string",
        [
          "get",
          "point_count",
        ],
      ],

      "text-font": [
        "Noto Sans Bold",
      ],

      "text-size":
        clusterTextSizeExpression(),

      "text-allow-overlap":
        false,

      "text-ignore-placement":
        false,

      "text-padding":
        8,
    },

    paint: {
      /*
       * Полностью невидимый объект.
       *
       * ВАЖНО:
       * collision всё равно существует.
       */
      "icon-opacity":
        0,

      "text-opacity":
        0,
    },
  });
}

/**
 * Перемещаем collision layer ПЕРЕД
 * картографическими label layers.
 *
 * Тогда:
 *
 * collision cluster
 *      ↓
 * city / road label
 *
 * label видит занятое место и ищет
 * другой anchor.
 */
function positionClusterCollisionLayer(
  map: maplibregl.Map
): void {
  if (
    !map.getLayer(
      CLUSTER_COLLISION_LAYER_ID
    )
  ) {
    return;
  }

  const labelCandidates = [
    /*
     * Самый важный для твоего случая.
     */
    "road-label-major",

    /*
     * Наши собственные city labels.
     */
    "kg-cities-labels",
    "kg-bishkek-label",

    /*
     * Озёра — на случай близкого столкновения.
     */
    "kg-lake-label",
  ];

  const target =
    labelCandidates.find(
      (
        layerId
      ) =>
        Boolean(
          map.getLayer(
            layerId
          )
        )
    );

  if (!target) {
    return;
  }

  map.moveLayer(
    CLUSTER_COLLISION_LAYER_ID,
    target
  );
}

/* ============================================================
   MAIN
   ============================================================ */

export function setupClusterLayer(
  map: maplibregl.Map,
  options: SetupClusterLayerOptions
): ClusterLayerHandle {
  const {
    data,
    minZoom = 11.5,
    clustering,
  } = options;

  const engine =
    new ClusterEngine({
      maxZoom:
        map.getMaxZoom?.() ??
        16,

      ...clustering,
    });

  engine.load(
    prepareListings(
      data
    )
  );

  registerClusterIcons(
    map
  );

  if (
    !map.getSource(
      CLUSTER_SOURCE_ID
    )
  ) {
    map.addSource(
      CLUSTER_SOURCE_ID,
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
   * Видимый cluster.
   */
  addClusterBadgeLayer(
    map,
    minZoom
  );

  /*
   * Hover halo для cluster.
   */
  addClusterBadgeHoverLayer(
    map,
    minZoom
  );

  /*
   * Невидимая collision zone.
   */
  addClusterCollisionLayer(
    map,
    minZoom
  );

  /*
   * Ценовые маркеры обычных объявлений.
   */
  addPriceMarkerLayer(
    map,
    CLUSTER_SOURCE_ID,
    minZoom
  );

  /*
   * Очень важно:
   *
   * collision layer должен оказаться
   * ПОД city/road labels.
   *
   * Сам настоящий cluster остаётся выше.
   */
  positionClusterCollisionLayer(
    map
  );

  const resetClusterHover =
    () => {
      if (
        map.getLayer(
          CLUSTER_BADGE_HOVER_LAYER_ID
        )
      ) {
        map.setFilter(
          CLUSTER_BADGE_HOVER_LAYER_ID,
          [
            "all",
            [
              "has",
              "point_count",
            ],
            [
              "==",
              [
                "get",
                "cluster_id",
              ],
              "__jaymap_no_hover__",
            ],
          ]
        );
      }
    };

  const resetPriceHover =
    () => {
      if (
        map.getLayer(
          PRICE_MARKER_HOVER_LAYER_ID
        )
      ) {
        map.setFilter(
          PRICE_MARKER_HOVER_LAYER_ID,
          [
            "all",
            [
              "!",
              [
                "has",
                "point_count",
              ],
            ],
            [
              "==",
              [
                "get",
                "id",
              ],
              "__jaymap_no_hover__",
            ],
          ]
        );
      }
    };

  const recompute =
    () => {
      if (
        !engine.isReady()
      ) {
        return;
      }

      const bounds =
        map.getBounds();

      const bbox: [
        number,
        number,
        number,
        number
      ] = [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ];

      const clusters =
        engine.getClustersForMapZoom(
          bbox,
          map.getZoom()
        );

      const source =
        map.getSource(
          CLUSTER_SOURCE_ID
        ) as
          | maplibregl.GeoJSONSource
          | undefined;

      source?.setData({
        type:
          "FeatureCollection",

        features:
          clusters as GeoJSON.Feature[],
      });

      /*
       * После viewport/zoom change
       * старый hover больше не должен
       * оставаться визуально активным.
       */
      resetClusterHover();
      resetPriceHover();
    };

  const onClusterClick =
    (
      e: maplibregl.MapLayerMouseEvent & {
        features?: maplibregl.MapGeoJSONFeature[];
      }
    ) => {
      const feature =
        e.features?.[0];

      if (
        !feature ||
        feature.geometry.type !==
          "Point"
      ) {
        return;
      }

      const clusterId =
        feature.properties
          ?.cluster_id;

      if (
        clusterId == null
      ) {
        return;
      }

      const coordinates =
        feature.geometry.coordinates.slice(
          0,
          2
        ) as [
          number,
          number
        ];

      flyIntoCluster(
        map,
        engine,
        clusterId,
        coordinates
      );
    };

  const onClusterEnter =
    (
      e: maplibregl.MapLayerMouseEvent & {
        features?: maplibregl.MapGeoJSONFeature[];
      }
    ) => {
      const feature =
        e.features?.[0];

      if (!feature) {
        return;
      }

      const clusterId =
        feature.properties
          ?.cluster_id;

      if (
        clusterId == null
      ) {
        return;
      }

      map.setFilter(
        CLUSTER_BADGE_HOVER_LAYER_ID,
        [
          "all",
          [
            "has",
            "point_count",
          ],
          [
            "==",
            [
              "get",
              "cluster_id",
            ],
            clusterId,
          ],
        ]
      );

      map.getCanvas()
        .style.cursor =
        "pointer";
    };

  const onClusterLeave =
    () => {
      resetClusterHover();

      map.getCanvas()
        .style.cursor =
        "";
    };

  const onPriceEnter =
    (
      e: maplibregl.MapLayerMouseEvent & {
        features?: maplibregl.MapGeoJSONFeature[];
      }
    ) => {
      const feature =
        e.features?.[0];

      if (!feature) {
        return;
      }

      const listingId =
        feature.properties?.id;

      if (
        listingId == null
      ) {
        return;
      }

      map.setFilter(
        PRICE_MARKER_HOVER_LAYER_ID,
        [
          "all",
          [
            "!",
            [
              "has",
              "point_count",
            ],
          ],
          [
            "==",
            [
              "get",
              "id",
            ],
            listingId,
          ],
        ]
      );

      map.getCanvas()
        .style.cursor =
        "pointer";
    };

  const onPriceLeave =
    () => {
      resetPriceHover();

      map.getCanvas()
        .style.cursor =
        "";
    };

  map.on(
    "moveend",
    recompute
  );

  map.on(
    "zoomend",
    recompute
  );

  map.on(
    "click",
    CLUSTER_BADGE_LAYER_ID,
    onClusterClick
  );

  map.on(
    "mouseenter",
    CLUSTER_BADGE_LAYER_ID,
    onClusterEnter
  );

  map.on(
    "mouseleave",
    CLUSTER_BADGE_LAYER_ID,
    onClusterLeave
  );

  map.on(
    "mouseenter",
    "jaymap-price-marker",
    onPriceEnter
  );

  map.on(
    "mouseleave",
    "jaymap-price-marker",
    onPriceLeave
  );

  /*
   * Первичная отрисовка.
   */
  recompute();

  return {
    engine,

    refresh:
      recompute,

    setData:
      (
        nextData: ListingFeature[]
      ) => {
        engine.load(
          prepareListings(
            nextData
          )
        );

        recompute();
      },

    destroy:
      () => {
        map.off(
          "moveend",
          recompute
        );

        map.off(
          "zoomend",
          recompute
        );

        map.off(
          "click",
          CLUSTER_BADGE_LAYER_ID,
          onClusterClick
        );

        map.off(
          "mouseenter",
          CLUSTER_BADGE_LAYER_ID,
          onClusterEnter
        );

        map.off(
          "mouseleave",
          CLUSTER_BADGE_LAYER_ID,
          onClusterLeave
        );

        map.off(
          "mouseenter",
          "jaymap-price-marker",
          onPriceEnter
        );

        map.off(
          "mouseleave",
          "jaymap-price-marker",
          onPriceLeave
        );

        ALL_LAYER_IDS.forEach(
          (
            id
          ) => {
            if (
              map.getLayer(
                id
              )
            ) {
              map.removeLayer(
                id
              );
            }
          }
        );

        if (
          map.getLayer(
            "jaymap-price-marker"
          )
        ) {
          map.removeLayer(
            "jaymap-price-marker"
          );
        }

        if (
          map.getLayer(
            PRICE_MARKER_HOVER_LAYER_ID
          )
        ) {
          map.removeLayer(
            PRICE_MARKER_HOVER_LAYER_ID
          );
        }

        if (
          map.getSource(
            CLUSTER_SOURCE_ID
          )
        ) {
          map.removeSource(
            CLUSTER_SOURCE_ID
          );
        }
      },
  };
}
