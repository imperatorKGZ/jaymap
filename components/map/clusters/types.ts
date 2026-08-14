import type { Feature, Point, FeatureCollection } from "geojson";

/**
 * Свойства одного объявления недвижимости.
 * price — цена в сомах (не в тысячах/миллионах — форматирование
 * происходит в formatSomPrice при подготовке данных).
 */
export interface ListingProperties {
  id: string | number;
  price: number;
  [key: string]: unknown;
}

/** Точка объявления в исходном (некластеризованном) GeoJSON. */
export type ListingFeature = Feature<Point, ListingProperties>;

/**
 * Свойства, которые Supercluster добавляет кластерам, плюс то, что мы
 * прокидываем через reduce (сумма цен — может пригодиться для будущих
 * фич вроде "средняя цена в кластере", сейчас не используется в UI).
 */
export interface ClusterProperties {
  cluster: true;
  cluster_id: number;
  point_count: number;
  point_count_abbreviated: number | string;
  sumPrice: number;
}

export type ClusterFeature = Feature<Point, ClusterProperties>;

export type ClusterOrListingFeature = ClusterFeature | ListingFeature;

export type ClusterOrListingCollection = FeatureCollection<
  Point,
  ClusterProperties | ListingProperties
>;
