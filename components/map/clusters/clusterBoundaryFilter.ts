import type { ListingFeature } from "./types";

/**
 * Точка внутри одного кольца (ray-casting, чётно-нечётное правило).
 * ring — массив [lng, lat].
 */
function pointInRing(x: number, y: number, ring: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-15) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function pointInPolygonRings(x: number, y: number, rings: [number, number][][]): boolean {
  if (!pointInRing(x, y, rings[0])) return false;
  for (let i = 1; i < rings.length; i++) {
    if (pointInRing(x, y, rings[i])) return false; // внутри "дырки" — не считается
  }
  return true;
}

function pointInFeatureCollection(
  lng: number,
  lat: number,
  boundary: GeoJSON.FeatureCollection
): boolean {
  for (const feature of boundary.features) {
    const geom = feature.geometry;
    if (!geom) continue;
    if (geom.type === "Polygon") {
      if (pointInPolygonRings(lng, lat, geom.coordinates as [number, number][][])) return true;
    } else if (geom.type === "MultiPolygon") {
      for (const polygon of geom.coordinates as [number, number][][][]) {
        if (pointInPolygonRings(lng, lat, polygon)) return true;
      }
    }
  }
  return false;
}

/**
 * Отфильтровывает объявления, чьи координаты физически лежат за
 * пределами границы (например, `kg-boundary-source` из mapLayers.ts —
 * тот же `/geojson/kyrgyzstan.geojson`, что рисует линию границы КР).
 *
 * Полезно как защита от плохих данных (ошибка геокодирования адреса,
 * опечатка в координатах при размещении и т.п.) — лучше молча не
 * показать один "бракованный" объект, чем получить кластер/ценник,
 * зависший за рубежом поверх затемнённой маски (см. `kg-mask-layer`).
 *
 * Точка на границе или очень близко к ней (в пределах погрешности
 * ray-casting) может быть отфильтрована — для объектов "впритык"
 * к границе лучше полагаться на реальные адреса, а не на этот фильтр.
 */
export function filterToBoundary(
  features: ListingFeature[],
  boundary: GeoJSON.FeatureCollection
): { kept: ListingFeature[]; rejected: ListingFeature[] } {
  const kept: ListingFeature[] = [];
  const rejected: ListingFeature[] = [];

  for (const feature of features) {
    const [lng, lat] = feature.geometry.coordinates;
    if (pointInFeatureCollection(lng, lat, boundary)) {
      kept.push(feature);
    } else {
      rejected.push(feature);
    }
  }

  return { kept, rejected };
}
