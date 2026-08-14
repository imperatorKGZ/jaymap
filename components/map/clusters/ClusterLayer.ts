import type maplibregl from "maplibre-gl";
import { ClusterEngine, type ClusterEngineOptions } from "./clusterEngine";
import {
  buildAllClusterIcons,
  clusterIconImageExpression,
  clusterTextSizeExpression,
} from "./clusterStyle";
import { addPriceMarkerLayer } from "./PriceMarkerLayer";
import { flyIntoCluster } from "./ClusterAnimation";
import { formatSomPrice } from "./priceFormat";
import type { ListingFeature } from "./types";

export const CLUSTER_SOURCE_ID = "jaymap-listings-source";
export const CLUSTER_BADGE_LAYER_ID = "jaymap-cluster-badge";
/** @deprecated Число теперь рисуется в том же слое, что и бейдж (см. CLUSTER_BADGE_LAYER_ID). */
export const CLUSTER_COUNT_LAYER_ID = CLUSTER_BADGE_LAYER_ID;

const ALL_LAYER_IDS = [CLUSTER_BADGE_LAYER_ID];

export interface SetupClusterLayerOptions {
  /** Сырые точки объявлений (GeoJSON Point + { id, price, ... }). */
  data: ListingFeature[];
  /**
   * Zoom, после которого вместо города появляется первый уровень
   * кластеров. Должен совпадать с CITY_FLY_TO_ZOOM в MainMap (11.5 по ТЗ).
   */
  minZoom?: number;
  clustering?: ClusterEngineOptions;
}

export interface ClusterLayerHandle {
  engine: ClusterEngine;
  /** Принудительно пересчитать кластеры для текущего вьюпорта. */
  refresh: () => void;
  /** Заменить набор объявлений (например, после применения фильтров в будущем). */
  setData: (data: ListingFeature[]) => void;
  destroy: () => void;
}

function prepareListings(data: ListingFeature[]): ListingFeature[] {
  return data.map((feature) => ({
    ...feature,
    properties: {
      ...feature.properties,
      // Считаем подпись цены один раз здесь, а не через MapLibre
      // expression — форматирование ("4.2 млн") сложнее, чем умеет
      // style spec, и один раз на объект дешевле, чем на каждый рендер.
      priceLabel: formatSomPrice(feature.properties.price),
    },
  }));
}

function registerClusterIcons(map: maplibregl.Map): void {
  buildAllClusterIcons().forEach((icon) => {
    if (!map.hasImage(icon.id)) {
      map.addImage(icon.id, icon.data, { pixelRatio: icon.pixelRatio });
    }
  });
}

function addClusterBadgeLayer(map: maplibregl.Map, minZoom: number): void {
  if (map.getLayer(CLUSTER_BADGE_LAYER_ID)) return;

  map.addLayer({
    id: CLUSTER_BADGE_LAYER_ID,
    type: "symbol",
    source: CLUSTER_SOURCE_ID,
    minzoom: minZoom,
    filter: ["has", "point_count"],
    layout: {
      "icon-image": clusterIconImageExpression(),
      // Иконка и число объединены в ОДИН слой (а не в два), чтобы
      // MapLibre считал их одним объектом при разрешении коллизий —
      // раньше бейдж и цифра были в разных слоях и иногда "расходились"
      // (бейдж есть, число исчезло, потому что коллизии считались
      // независимо друг от друга).
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
      // Только число — без "Бишкек", "объявлений" и т.д. (по ТЗ).
      "text-field": ["to-string", ["get", "point_count"]],
      "text-font": ["Noto Sans Bold"],
      "text-size": clusterTextSizeExpression(),
      "text-allow-overlap": true,
      "text-ignore-placement": true,
    },
    paint: {
      "text-color": "#ffffff",
      "icon-opacity-transition": { duration: 300 },
      "text-opacity-transition": { duration: 300 },
    },
  });
}

/**
 * Подключает всю систему кластеров JayMap к уже созданной карте.
 * Ничего не знает про Navbar/Sidebar/UI — только источник + слои +
 * события клика/зума, как и требует ТЗ.
 *
 * Вызывать один раз, после setupMapLayers(map, ...), внутри map.on("load").
 */
export function setupClusterLayer(
  map: maplibregl.Map,
  options: SetupClusterLayerOptions
): ClusterLayerHandle {
  const { data, minZoom = 11.5, clustering } = options;

  const engine = new ClusterEngine({
    // radius/minPoints/zoomOffset уже подобраны разумными по умолчанию
    // внутри ClusterEngine (см. clusterEngine.ts) — здесь переопределяем
    // только maxZoom (в единицах РЕАЛЬНОГО zoom карты — движок сам
    // учтёт zoomOffset при вычислении внутреннего порога Supercluster).
    // Если на реальных данных всё ещё слишком "рябит" мелкими
    // кластерами — начните с увеличения zoomOffset через
    // clustering: { zoomOffset: 1.8 }.
    maxZoom: map.getMaxZoom?.() ?? 16,
    ...clustering,
  });

  engine.load(prepareListings(data));

  registerClusterIcons(map);

  if (!map.getSource(CLUSTER_SOURCE_ID)) {
    map.addSource(CLUSTER_SOURCE_ID, {
      type: "geojson",
      // Кластеризацию делает Supercluster на JS-стороне (не встроенная
      // "cluster: true" у MapLibre) — так у нас полный контроль над
      // стилем кластера вместо стандартного круга.
      data: { type: "FeatureCollection", features: [] },
    });
  }

  addClusterBadgeLayer(map, minZoom);
  addPriceMarkerLayer(map, CLUSTER_SOURCE_ID, minZoom);

  const recompute = () => {
    if (!engine.isReady()) return;
    const bounds = map.getBounds();
    const bbox: [number, number, number, number] = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ];
    const clusters = engine.getClustersForMapZoom(bbox, map.getZoom());
    const source = map.getSource(CLUSTER_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    source?.setData({ type: "FeatureCollection", features: clusters as GeoJSON.Feature[] });
  };

  const onClusterClick = (
    e: maplibregl.MapLayerMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }
  ) => {
    const feature = e.features?.[0];
    if (!feature || feature.geometry.type !== "Point") return;
    const clusterId = feature.properties?.cluster_id;
    if (clusterId == null) return;
    const coordinates = feature.geometry.coordinates.slice(0, 2) as [number, number];
    flyIntoCluster(map, engine, clusterId, coordinates);
  };

  const onEnter = () => {
    map.getCanvas().style.cursor = "pointer";
  };
  const onLeave = () => {
    map.getCanvas().style.cursor = "";
  };

  map.on("moveend", recompute);
  map.on("zoomend", recompute);
  map.on("click", CLUSTER_BADGE_LAYER_ID, onClusterClick);
  map.on("mouseenter", CLUSTER_BADGE_LAYER_ID, onEnter);
  map.on("mouseleave", CLUSTER_BADGE_LAYER_ID, onLeave);

  // первичная отрисовка
  recompute();

  return {
    engine,
    refresh: recompute,
    setData: (nextData: ListingFeature[]) => {
      engine.load(prepareListings(nextData));
      recompute();
    },
    destroy: () => {
      map.off("moveend", recompute);
      map.off("zoomend", recompute);
      map.off("click", CLUSTER_BADGE_LAYER_ID, onClusterClick);
      map.off("mouseenter", CLUSTER_BADGE_LAYER_ID, onEnter);
      map.off("mouseleave", CLUSTER_BADGE_LAYER_ID, onLeave);
      ALL_LAYER_IDS.forEach((id) => {
        if (map.getLayer(id)) map.removeLayer(id);
      });
      if (map.getLayer("jaymap-price-marker")) map.removeLayer("jaymap-price-marker");
      if (map.getSource(CLUSTER_SOURCE_ID)) map.removeSource(CLUSTER_SOURCE_ID);
    },
  };
}
