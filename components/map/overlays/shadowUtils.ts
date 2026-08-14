// overlays/shadowUtils.ts
//
// Небольшая утилита без внешних зависимостей (turf и т.п. не используются),
// которая превращает контур полигона Кыргызстана в набор коротких линий
// с рассчитанным коэффициентом "освещённости" каждого сегмента.
//
// Идея: сегмент границы, "смотрящий" в сторону условного источника света
// (сверху-слева, как на референсе), помечается как светлый (light -> 1),
// противоположный — как затемнённый (light -> 0). Дальше это используется
// в line-color как data-driven expression, что и даёт эффект мягкого
// верхнего света без реального 3D/pitch.

type Ring = [number, number][];

// Азимут условного источника света (градусы, 0 = север, по часовой стрелке)
const LIGHT_AZIMUTH = 315; // сверху-слева, как в референсе

function bearingDeg(a: [number, number], b: [number, number]): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const [lon1, lat1] = [toRad(a[0]), toRad(a[1])];
  const [lon2, lat2] = [toRad(b[0]), toRad(b[1])];
  const dLon = lon2 - lon1;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

// 0 = сегмент направлен ровно на источник света (максимально освещён)
// 1 = сегмент направлен ровно от источника света (максимально в тени)
function shadeFactor(brng: number): number {
  const diff = Math.abs(((brng - LIGHT_AZIMUTH + 540) % 360) - 180);
  return diff / 180;
}

export interface ShadeFeatureCollection {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: { light: number };
    geometry: { type: "LineString"; coordinates: [number, number][] };
  }>;
}

/**
 * geojson — исходный FeatureCollection / Feature / Geometry Кыргызстана
 * (Polygon или MultiPolygon). Возвращает набор коротких LineString-сегментов
 * со свойством `light` (0..1).
 */
export function buildShadeLines(geojson: any): ShadeFeatureCollection {
  const features: ShadeFeatureCollection["features"] = [];

  const processRing = (ring: Ring) => {
    for (let i = 0; i < ring.length - 1; i++) {
      const a = ring[i];
      const b = ring[i + 1];
      const brng = bearingDeg(a, b);
      // Инвертируем shadeFactor: сегмент к свету -> light = 1 (ярче)
      const light = 1 - shadeFactor(brng);
      features.push({
        type: "Feature",
        properties: { light },
        geometry: { type: "LineString", coordinates: [a, b] },
      });
    }
  };

  const geometries: any[] =
    geojson.type === "FeatureCollection"
      ? geojson.features.map((f: any) => f.geometry)
      : geojson.type === "Feature"
      ? [geojson.geometry]
      : [geojson];

  geometries.forEach((geom) => {
    if (!geom) return;
    if (geom.type === "Polygon") {
      geom.coordinates.forEach((ring: Ring) => processRing(ring));
    } else if (geom.type === "MultiPolygon") {
      geom.coordinates.forEach((poly: Ring[]) => poly.forEach((ring) => processRing(ring)));
    }
  });

  return { type: "FeatureCollection", features };
}
