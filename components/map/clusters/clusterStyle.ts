import type maplibregl from "maplibre-gl";

/**
 * ClusterStyle
 * ------------
 * Всё визуальное решение кластера JayMap живёт здесь, отдельно от
 * логики слоёв (ClusterLayer) и логики кластеризации (ClusterEngine).
 *
 * Дизайн-решение (см. ТЗ):
 *  - Glassmorphism: тёмный полупрозрачный диск.
 *  - Бирюзовая обводка JayMap, насыщенность которой растёт вместе
 *    с количеством объектов.
 *  - Вместо однородного кольца — асимметричная утолщённая дуга,
 *    современная минималистичная отсылка к кыргызскому орнаменту
 *    (плавный "рог"/волна вместо буквального орнамента), без юрты,
 *    түндүка, флага, гор и солнца.
 *  - Число — единственная надпись, белое, жирное, отрисовывается
 *    отдельным text-слоем поверх иконки (чтобы оставаться чётким
 *    на любом zoom, а не быть запечённым в растровую иконку).
 *
 * Если у JayMap уже есть токены дизайн-системы (конкретный HEX
 * бирюзового, конкретная кривая glass-фона) — замените константы
 * ниже на них, остальной код от значений не зависит.
 */

export const JAYMAP_TURQUOISE = "#2FD4C0";
export const CLUSTER_GLASS_FILL = "rgba(13, 20, 28, 0.58)";
export const CLUSTER_GLASS_FILL_DENSE = "rgba(10, 16, 22, 0.68)";

/**
 * Пороги количества объектов, определяющие "уровень" кластера.
 * Уровни 0-2  -> маленький   (< 10)
 * Уровни 3-5  -> средний     (10-99)
 * Уровни 6-8  -> большой     (100-999)
 * Уровни 9-11 -> максимальный (1000+)
 *
 * Внутри каждой группы кластер плавно растёт в размере и насыщенности
 * обводки — так количество "чувствуется" даже без чтения цифры.
 */
export const CLUSTER_THRESHOLDS = [2, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000] as const;
export const CLUSTER_LEVELS = CLUSTER_THRESHOLDS.length; // 12

export function clusterIconId(level: number): string {
  return `jm-cluster-${level}`;
}

export function clusterLevelForCount(count: number): number {
  let level = 0;
  for (let i = 0; i < CLUSTER_THRESHOLDS.length; i++) {
    if (count >= CLUSTER_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  return Math.min(level, CLUSTER_LEVELS - 1);
}

function radiusForLevel(level: number): number {
  const t = level / (CLUSTER_LEVELS - 1);
  // 16px -> 34px логического радиуса
  return Math.round(16 + t * 18);
}

function ringAlphaForLevel(level: number): number {
  const t = level / (CLUSTER_LEVELS - 1);
  // насыщенность бирюзовой окантовки растёт вместе с уровнем,
  // но не доходит до кричащей — максимум 0.92
  return 0.35 + t * 0.57;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

const [TURQ_R, TURQ_G, TURQ_B] = hexToRgb(JAYMAP_TURQUOISE);
function turquoiseRgba(alpha: number): string {
  return `rgba(${TURQ_R}, ${TURQ_G}, ${TURQ_B}, ${alpha})`;
}

export interface ClusterIconSpec {
  id: string;
  data: ImageData;
  pixelRatio: number;
}

/**
 * Рисует одну иконку кластера уровня `level` на офскрин-canvas.
 *
 * Вместо равномерного кольца используется утолщённая, тающая к краям
 * дуга, смещённая в верхне-правую четверть — мягкий, современный
 * жест в сторону кыргызского орнаментального изгиба (без буквальных
 * этнических символов), в духе Apple Maps / Arc / Linear.
 */
export function buildClusterIcon(level: number, pixelRatio = 2): ClusterIconSpec {
  const radius = radiusForLevel(level);
  const size = (radius + 12) * 2; // запас под тень и утолщение дуги
  const canvas = document.createElement("canvas");
  canvas.width = size * pixelRatio;
  canvas.height = size * pixelRatio;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context is unavailable — cluster icons require a browser environment");
  }
  ctx.scale(pixelRatio, pixelRatio);

  const cx = size / 2;
  const cy = size / 2;
  const isDense = level >= 6;

  // 1. Мягкая тень (ambient) — без агрессивных эффектов.
  ctx.save();
  ctx.shadowColor = "rgba(6, 10, 14, 0.32)";
  ctx.shadowBlur = 10 + level * 0.8;
  ctx.shadowOffsetY = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = isDense ? CLUSTER_GLASS_FILL_DENSE : CLUSTER_GLASS_FILL;
  ctx.fill();
  ctx.restore();

  // 2. Едва заметное базовое кольцо по всей окружности (glass edge).
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 0.75, 0, Math.PI * 2);
  ctx.lineWidth = 1;
  ctx.strokeStyle = turquoiseRgba(0.22);
  ctx.stroke();

  // 3. Орнаментальная дуга: тает по толщине к обоим концам,
  // насыщенность растёт с уровнем кластера.
  const ringAlpha = ringAlphaForLevel(level);
  const arcStart = -Math.PI * 0.7;
  const arcEnd = Math.PI * 0.15;
  const segments = 32;
  const maxWidth = 1.75 + level * 0.28;

  ctx.lineCap = "round";
  for (let i = 0; i < segments; i++) {
    const t0 = i / segments;
    const t1 = (i + 1) / segments;
    const a0 = arcStart + (arcEnd - arcStart) * t0;
    const a1 = arcStart + (arcEnd - arcStart) * t1;
    // колоколообразное утолщение к середине дуги
    const bell = Math.sin(Math.PI * t0);
    const width = 1 + bell * maxWidth;

    ctx.beginPath();
    ctx.arc(cx, cy, radius - 0.75, a0, a1);
    ctx.lineWidth = width;
    ctx.strokeStyle = turquoiseRgba(ringAlpha * (0.55 + 0.45 * bell));
    ctx.stroke();
  }

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return { id: clusterIconId(level), data: imageData, pixelRatio };
}

export function buildAllClusterIcons(): ClusterIconSpec[] {
  const icons: ClusterIconSpec[] = [];
  for (let level = 0; level < CLUSTER_LEVELS; level++) {
    icons.push(buildClusterIcon(level));
  }
  return icons;
}

/**
 * MapLibre step-выражение, выбирающее нужную иконку по point_count.
 * Построено из того же массива порогов, что и clusterLevelForCount,
 * чтобы визуальный уровень и код никогда не разъезжались.
 */
export function clusterIconImageExpression(): maplibregl.ExpressionSpecification {
  const expr: unknown[] = ["step", ["get", "point_count"], clusterIconId(0)];
  CLUSTER_THRESHOLDS.forEach((threshold, i) => {
    expr.push(threshold, clusterIconId(i + 1));
  });
  return expr as unknown as maplibregl.ExpressionSpecification;
}

/** Размер шрифта числа растёт вместе с кластером, но остаётся читаемым. */
export function clusterTextSizeExpression(): maplibregl.ExpressionSpecification {
  return [
    "step",
    ["get", "point_count"],
    12,
    10, 13,
    100, 15,
    1000, 17,
  ] as unknown as maplibregl.ExpressionSpecification;
}
