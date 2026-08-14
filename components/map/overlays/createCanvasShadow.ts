// overlays/createCanvasShadow.ts
import maplibregl from "maplibre-gl";

interface ShadowOptions {
  paddingRatio?: number;   // Отступ вокруг страны для размытия
  canvasSize?: number;     // Разрешение Canvas

  // Дальняя мягкая тень (Ambient)
  ambientBlur?: number;
  ambientOffsetX?: number;
  ambientOffsetY?: number;
  ambientColor?: string;

  // Ближняя плотная тень (Contact)
  contactBlur?: number;
  contactOffsetX?: number;
  contactOffsetY?: number;
  contactColor?: string;
}

export async function createGeoJsonShadow(
  geojsonUrl: string,
  options: ShadowOptions = {}
) {
  const {
    paddingRatio = 0.25,
    canvasSize = 1536,

    // Настройки для глубокого 3D-эффекта (как на макете)
    ambientBlur = 32,
    ambientOffsetX = 16,
    ambientOffsetY = 36,
    ambientColor = "rgba(10, 16, 28, 0.55)",

    contactBlur = 10,
    contactOffsetX = 6,
    contactOffsetY = 16,
    contactColor = "rgba(5, 8, 15, 0.75)",
  } = options;

  const res = await fetch(geojsonUrl);
  const geojson = await res.json();

  // 1. Поиск крайних точек (Bounding Box)
  let minLng = Infinity, maxLng = -Infinity;
  let minLat = Infinity, maxLat = -Infinity;

  const processCoords = (coords: [number, number][]) => {
    for (const [lng, lat] of coords) {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
  };

  const extractRings = (geometry: any) => {
    if (geometry.type === "Polygon") {
      geometry.coordinates.forEach(processCoords);
    } else if (geometry.type === "MultiPolygon") {
      geometry.coordinates.forEach((poly: any) => poly.forEach(processCoords));
    }
  };

  if (geojson.type === "FeatureCollection") {
    geojson.features.forEach((f: any) => extractRings(f.geometry));
  } else if (geojson.type === "Feature") {
    extractRings(geojson.geometry);
  } else {
    extractRings(geojson);
  }

  // 2. Расширяем границы
  const lngSpan = maxLng - minLng;
  const latSpan = maxLat - minLat;

  const bounds = {
    west: minLng - lngSpan * paddingRatio,
    east: maxLng + lngSpan * paddingRatio,
    north: maxLat + latSpan * paddingRatio,
    south: minLat - latSpan * paddingRatio,
  };

  // 3. Mercator-проекция для 100% совпадения с координатной сеткой MapLibre
  const minMerc = maplibregl.MercatorCoordinate.fromLngLat({ lng: bounds.west, lat: bounds.north });
  const maxMerc = maplibregl.MercatorCoordinate.fromLngLat({ lng: bounds.east, lat: bounds.south });

  const mercWidth = maxMerc.x - minMerc.x;
  const mercHeight = maxMerc.y - minMerc.y;
  const aspectRatio = mercWidth / mercHeight;

  const canvas = document.createElement("canvas");
  canvas.width = canvasSize;
  canvas.height = Math.round(canvasSize / aspectRatio);

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Функция перевода [lng, lat] -> пиксели Canvas
  const project = (lng: number, lat: number): [number, number] => {
    const merc = maplibregl.MercatorCoordinate.fromLngLat({ lng, lat });
    const x = ((merc.x - minMerc.x) / mercWidth) * canvas.width;
    const y = ((merc.y - minMerc.y) / mercHeight) * canvas.height;
    return [x, y];
  };

  // Вспомогательная функция трассировки геометрии
  const traceGeometry = () => {
    ctx.beginPath();

    const drawRing = (ring: [number, number][]) => {
      if (ring.length === 0) return;
      const [startX, startY] = project(ring[0][0], ring[0][1]);
      ctx.moveTo(startX, startY);

      for (let i = 1; i < ring.length; i++) {
        const [x, y] = project(ring[i][0], ring[i][1]);
        ctx.lineTo(x, y);
      }
    };

    const drawGeometry = (geometry: any) => {
      if (geometry.type === "Polygon") {
        geometry.coordinates.forEach(drawRing);
      } else if (geometry.type === "MultiPolygon") {
        geometry.coordinates.forEach((poly: any) => poly.forEach(drawRing));
      }
    };

    if (geojson.type === "FeatureCollection") {
      geojson.features.forEach((f: any) => drawGeometry(f.geometry));
    } else {
      drawGeometry(geojson.geometry || geojson);
    }

    ctx.closePath();
  };

  // 4. Отрисовка двух слоев тени

  // Проход 1: Дальняя мягкая тень (Ambient)
  ctx.save();
  ctx.translate(ambientOffsetX, ambientOffsetY);
  ctx.filter = `blur(${ambientBlur}px)`;
  ctx.fillStyle = ambientColor;
  traceGeometry();
  ctx.fill("evenodd");
  ctx.restore();

  // Проход 2: Ближняя плотная тень (Contact)
  ctx.save();
  ctx.translate(contactOffsetX, contactOffsetY);
  ctx.filter = `blur(${contactBlur}px)`;
  ctx.fillStyle = contactColor;
  traceGeometry();
  ctx.fill("evenodd");
  ctx.restore();

  // 5. Возврат результата
  return {
    url: canvas.toDataURL("image/png"),
    coordinates: [
      [bounds.west, bounds.north], // top-left
      [bounds.east, bounds.north], // top-right
      [bounds.east, bounds.south], // bottom-right
      [bounds.west, bounds.south], // bottom-left
    ] as [[number, number], [number, number], [number, number], [number, number]],
  };
}