import type maplibregl from "maplibre-gl";
import type { ClusterEngine } from "./clusterEngine";

/**
 * ClusterAnimation
 * ----------------
 * Supercluster не хранит связь "родитель -> дети" между соседними
 * zoom-уровнями как реальные объекты на карте, поэтому буквально
 * "разлетающихся" геометрий не существует — вместо этого мы
 * добиваемся ощущения "кластер раскрывается" двумя приёмами:
 *
 *  1. Клик по кластеру плавно приближает камеру ровно к тому zoom,
 *     на котором он распадается на детей (getClusterExpansionZoom),
 *     с ease-out кривой — глаз воспринимает это как "раскрытие",
 *     а не телепорт.
 *  2. Новые/старые фичи не появляются резко: у icon/text-слоёв
 *     задан "*-opacity-transition", а сама карта (MainMap) уже
 *     инициализирована с fadeDuration: 300 — MapLibre сам плавно
 *     кросс-фейдит символы при пересчёте источника на zoomend/moveend.
 *
 * Если в будущем понадобится честная покадровая анимация "осколков"
 * (когда видно, как дети разлетаются из точки родителя), это будет
 * отдельный слой поверх кластеров с requestAnimationFrame и временными
 * point-фичами — сознательно не делаем это здесь, чтобы не плодить
 * тяжёлую логику ради эффекта, который редко замечают на реальной карте.
 */

export interface FlyIntoClusterOptions {
  duration?: number;
}

export function flyIntoCluster(
  map: maplibregl.Map,
  engine: ClusterEngine,
  clusterId: number,
  coordinates: [number, number],
  options: FlyIntoClusterOptions = {}
): void {
  // getExpansionMapZoom уже учитывает zoomOffset движка и возвращает
  // значение в тех же единицах, что и map.getZoom() — в отличие от
  // "сырого" getClusterExpansionZoom, которое живёт в системе координат
  // индекса Supercluster и требовало бы отдельной компенсации здесь.
  const targetZoom = Math.min(engine.getExpansionMapZoom(clusterId) + 0.15, map.getMaxZoom());

  map.easeTo({
    center: coordinates,
    zoom: targetZoom,
    duration: options.duration ?? 550,
    easing: easeOutCubic,
  });
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
