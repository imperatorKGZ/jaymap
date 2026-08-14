import Supercluster from "supercluster";
import type { ListingFeature, ClusterProperties } from "./types";

export interface ClusterEngineOptions {
  /** Радиус кластеризации в пикселях (на zoom-уровне). По умолчанию 80. */
  radius?: number;
  /**
   * Zoom, после которого объекты больше не кластеризуются (показываются
   * как есть) — задавайте в единицах РЕАЛЬНОГО zoom карты (например,
   * map.getMaxZoom()), а не внутренних единиц Supercluster: движок сам
   * учтёт zoomOffset при вычислении внутреннего порога.
   */
  maxZoom?: number;
  minZoom?: number;
  /** Минимум точек, чтобы образовать кластер (иначе — отдельные объекты). */
  minPoints?: number;
  /**
   * Насколько "занижать" zoom при запросе кластеров у Supercluster
   * относительно реального zoom карты.
   *
   * Почему это нужно: у Supercluster радиус в пикселях константный,
   * но при увеличении zoom тот же пиксельный радиус покрывает всё
   * меньшую площадь на местности — поэтому на плотных данных (тысячи
   * объектов на город) даже при входе в город "сверху" кластеры уже
   * начинают дробиться на десятки мелких вместо одной крупной плашки.
   * zoomOffset заставляет индекс агрегировать так, будто zoom ниже
   * реального — картинка становится заметно спокойнее, а точки при
   * этом всё равно рисуются на настоящих координатах и настоящем zoom.
   *
   * 0 — поведение "как есть" (честный zoom). 1-1.5 — заметно более
   * крупная агрегация, хорошо подходит для плотных городов.
   */
  zoomOffset?: number;
}

const DEFAULT_OPTIONS: Required<ClusterEngineOptions> = {
  // 90px, minPoints:3 и zoomOffset:1.25 подобраны так, чтобы при
  // высокой плотности данных получалось несколько крупных, спокойных
  // кластеров, а не "ковёр" из десятков кластеров по 2-3 объекта
  // (см. ClusterLayer.ts).
  radius: 90,
  maxZoom: 16,
  minZoom: 0,
  minPoints: 3,
  zoomOffset: 1.25,
};

/**
 * Тонкая обёртка над Supercluster.
 *
 * Держит всю логику кластеризации отдельно от MapLibre и React — так
 * её проще тестировать и переиспользовать (например, в воркере, если
 * 50k+ объектов в какой-то момент потребуют вынести индексацию из
 * основного потока).
 */
export class ClusterEngine {
  private index: Supercluster<ListingFeature["properties"], ClusterProperties>;
  private loaded = false;
  private readonly zoomOffset: number;
  private readonly indexMaxZoom: number;

  constructor(options: ClusterEngineOptions = {}) {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    this.zoomOffset = opts.zoomOffset;

    // ВАЖНО: opts.maxZoom — это реальный zoom карты (например,
    // map.getMaxZoom()), а Supercluster внутри должен получить порог в
    // "смещённых" единицах (см. zoomOffset). Раньше это смещение не
    // учитывалось здесь, из-за чего запрос кластеров (см.
    // getClustersForMapZoom) физически не мог добраться до уровня, на
    // котором Supercluster отдаёт точки уже совсем без кластеризации —
    // объекты с (почти) одинаковыми координатами (например, несколько
    // квартир одного дома, geocoded в одну точку) навсегда оставались
    // "неразбиваемым" кластером, сколько бы вы ни зумировали, хотя по
    // ТЗ иерархия должна доходить до отдельных объектов на любом наборе
    // данных.
    //
    // "-1" — запас в один уровень, чтобы реальный zoom карты гарантированно
    // "дотягивался" до порога даже с учётом округления.
    this.indexMaxZoom = Math.max(0, Math.floor(opts.maxZoom - this.zoomOffset) - 1);

    this.index = new Supercluster<ListingFeature["properties"], ClusterProperties>({
      radius: opts.radius,
      maxZoom: this.indexMaxZoom,
      minZoom: Math.floor(opts.minZoom),
      minPoints: opts.minPoints,
      // Сохраняем сумму цен на случай будущих фич (средняя цена в
      // кластере и т.п.) — сейчас в UI не используется.
      map: (props) => ({ sumPrice: props.price ?? 0 }),
      reduce: (accumulated, props) => {
        accumulated.sumPrice += props.sumPrice;
      },
    });
  }

  load(features: ListingFeature[]): void {
    this.index.load(features as any);
    this.loaded = true;
  }

  isReady(): boolean {
    return this.loaded;
  }

  /**
   * Кластеры/точки для текущего вьюпорта и РЕАЛЬНОГО zoom карты.
   * Внутри запрашивает у Supercluster более низкий "эффективный" zoom
   * (см. zoomOffset) — снаружи об этом знать не нужно.
   */
  getClustersForMapZoom(bbox: [number, number, number, number], mapZoom: number) {
    if (!this.loaded) return [];
    // indexMaxZoom + 1 — это специальный "листовой" уровень у самого
    // Supercluster: на нём кластеризация не применяется вообще, объекты
    // возвращаются как есть, независимо от расстояния между ними. Это
    // единственный способ гарантированно "разобрать" даже точки с
    // (почти) одинаковыми координатами — поэтому клэмп именно по +1,
    // а не по indexMaxZoom (см. комментарий в конструкторе).
    const effectiveZoom = Math.min(
      this.indexMaxZoom + 1,
      Math.max(0, Math.round(mapZoom - this.zoomOffset))
    );
    return this.index.getClusters(bbox, effectiveZoom);
  }

  /** @deprecated используйте getClustersForMapZoom — оставлено для обратной совместимости. */
  getClusters(bbox: [number, number, number, number], zoom: number) {
    if (!this.loaded) return [];
    return this.index.getClusters(bbox, Math.round(zoom));
  }

  /** Zoom (в единицах Supercluster), на котором кластер начинает распадаться. */
  getClusterExpansionZoom(clusterId: number): number {
    return this.index.getClusterExpansionZoom(clusterId);
  }

  /**
   * То же самое, но уже переведённое обратно в реальный zoom карты —
   * именно это нужно передавать в map.easeTo()/flyTo() при клике по кластеру.
   */
  getExpansionMapZoom(clusterId: number): number {
    return this.index.getClusterExpansionZoom(clusterId) + this.zoomOffset;
  }

  getLeaves(clusterId: number, limit = Infinity, offset = 0) {
    return this.index.getLeaves(clusterId, limit, offset);
  }
}
