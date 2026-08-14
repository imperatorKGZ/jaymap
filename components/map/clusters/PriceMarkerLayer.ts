import type maplibregl from "maplibre-gl";
import { JAYMAP_TURQUOISE } from "./clusterStyle";

export const PRICE_PILL_IMAGE_ID = "jm-price-pill";
export const PRICE_MARKER_LAYER_ID = "jaymap-price-marker";

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export interface PricePillIconSpec {
  id: string;
  data: ImageData;
  pixelRatio: number;
  /** Растягиваемая область — так одна иконка подстраивается под любую длину цены (icon-text-fit: "both"). */
  content: [number, number, number, number];
  stretchX: [number, number][];
  stretchY: [number, number][];
}

/**
 * Растровая "капсула" — glassmorphism-фон под ценой отдельного
 * объекта. Одна иконка на всё приложение: MapLibre растягивает её
 * под текст через icon-text-fit: "both", поэтому не нужно рисовать
 * фон под каждую цену отдельно (GPU-friendly, без React на объект).
 */
export function buildPricePillImage(pixelRatio = 2): PricePillIconSpec {
  const width = 68;
  const height = 34;
  const radius = 17;
  const [r, g, b] = hexToRgb(JAYMAP_TURQUOISE);

  const canvas = document.createElement("canvas");
  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context is unavailable — price pill icon requires a browser environment");
  }
  ctx.scale(pixelRatio, pixelRatio);

  ctx.save();
  ctx.shadowColor = "rgba(6, 10, 14, 0.28)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;
  roundRectPath(ctx, 1, 1, width - 2, height - 2, radius);
  ctx.fillStyle = "rgba(13, 20, 28, 0.62)";
  ctx.fill();
  ctx.restore();

  roundRectPath(ctx, 1, 1, width - 2, height - 2, radius);
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.85)`;
  ctx.stroke();

  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);

  return {
    id: PRICE_PILL_IMAGE_ID,
    data,
    pixelRatio,
    content: [radius, 8, width - radius, height - 8],
    stretchX: [[radius, width - radius]],
    stretchY: [[8, height - 8]],
  };
}

export function registerPricePillImage(map: maplibregl.Map): void {
  if (map.hasImage(PRICE_PILL_IMAGE_ID)) return;
  const pill = buildPricePillImage();
  map.addImage(pill.id, pill.data, {
    pixelRatio: pill.pixelRatio,
    content: pill.content,
    stretchX: pill.stretchX,
    stretchY: pill.stretchY,
  } as maplibregl.StyleImageMetadata);
}

/**
 * Слой отдельных объектов (когда кластеров больше нет). Показывает
 * только цену — ни адреса, ни домика. icon-text-fit: "both" растягивает
 * стеклянную капсулу под конкретную цену без создания геометрии на
 * каждый объект вручную — всё через один symbol-слой и GeoJSON-источник.
 */
export function addPriceMarkerLayer(
  map: maplibregl.Map,
  sourceId: string,
  minZoom: number,
  layerId: string = PRICE_MARKER_LAYER_ID
): string {
  if (map.getLayer(layerId)) return layerId;

  registerPricePillImage(map);

  map.addLayer({
    id: layerId,
    type: "symbol",
    source: sourceId,
    minzoom: minZoom,
    filter: ["!", ["has", "point_count"]],
    layout: {
      "icon-image": PRICE_PILL_IMAGE_ID,
      "icon-text-fit": "both",
      "icon-text-fit-padding": [4, 10, 4, 10],
      // ВАЖНО: collision detection включена (allow-overlap: false).
      // При высокой плотности объектов не все ценники физически
      // помещаются на экране — лучше аккуратно скрыть часть (пользователь
      // раскроет их дальнейшим зумом), чем завалить карту наложенными
      // друг на друга плашками, как было при allow-overlap: true.
      "icon-allow-overlap": false,
      "icon-ignore-placement": false,
      "icon-padding": 4,
      "text-field": ["get", "priceLabel"],
      "text-font": ["Noto Sans Bold"],
      "text-size": 12,
      "text-allow-overlap": false,
      "text-ignore-placement": false,
      // Если текст не помещается — прячем всю плашку целиком
      // (иконка без цены бессмысленна), а не оставляем "голый" пин.
      "text-optional": false,
    },
    paint: {
      "text-color": "#ffffff",
      "icon-opacity-transition": { duration: 250 },
      "text-opacity-transition": { duration: 250 },
    },
  });

  return layerId;
}
