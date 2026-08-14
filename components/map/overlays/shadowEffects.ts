// overlays/shadowEffects.ts
//
// Добавляет визуальные эффекты "объёма" для полигона Кыргызстана,
// не трогая существующие источники/слои/архитектуру:
//
//   1) Ambient shadow  — большая, очень мягкая тень под всей территорией
//   2) Contact shadow  — тонкая чёткая тень вдоль самого контура
//   3) Directional shading — имитация верхнего света вдоль границы
//      (верх/лево светлее, низ/право темнее)
//   4) Border thickness — двойной кант (line-gap-width), имитирующий
//      толщину материала 2-3мм
//
// Все новые слои используют уже существующий источник "kg-boundary-source"
// (или отдельный производный источник "kg-shade-source" для п.3).
// Ничего не удаляется, порядок существующих слоёв не меняется —
// новые слои только вставляются рядом с уже существующими kg-* слоями.

import maplibregl from "maplibre-gl";
import { buildShadeLines } from "./shadowUtils";

/**
 * Шаги 1 и 2: Ambient + Contact shadow.
 *
 * ВАЖНО: вызывать ДО добавления слоя "kg-land-fill", используя тот же
 * anchor "landcover-wood" — тогда новые слои-тени лягут ПОД белой заливкой
 * территории, а не поверх неё.
 */
export function addAmbientAndContactShadow(map: maplibregl.Map) {
  if (map.getLayer("kg-shadow-ambient-1")) return; // уже добавлено

  // "Псевдо-блюр" ambient-тени — несколько концентрических линий
  // разной ширины/blur/прозрачности имитируют мягкий gaussian-blur,
  // которого нативно нет у fill-слоёв в MapLibre.
  const ambientSteps = [
    { id: "kg-shadow-ambient-1", width: 55, blur: 55, opacity: 0.035, dx: 14, dy: 18 },
    { id: "kg-shadow-ambient-2", width: 36, blur: 36, opacity: 0.045, dx: 10, dy: 13 },
    { id: "kg-shadow-ambient-3", width: 20, blur: 20, opacity: 0.060, dx: 6, dy: 8 },
  ];

  ambientSteps.forEach((step) => {
    map.addLayer(
      {
        id: step.id,
        type: "line",
        source: "kg-boundary-source",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#070606",
          "line-width": step.width,
          "line-blur": step.blur,
          "line-opacity": step.opacity,
          "line-translate": [step.dx, step.dy],
          "line-translate-anchor": "viewport",
        },
      },
      "landcover-wood"
    );
  });

  // Мягкая заливка-подложка под всей формой — усиливает цельность тени
  map.addLayer(
    {
      id: "kg-shadow-ambient-fill",
      type: "fill",
      source: "kg-boundary-source",
      paint: {
        "fill-color": "#0b0b0b",
        "fill-opacity": 0.045,
        "fill-translate": [10, 14],
        "fill-translate-anchor": "viewport",
      },
    },
    "landcover-wood"
  );

  // Contact shadow — тонкая, чёткая, у самого контура (эффект "касания" поверхности)
  map.addLayer(
    {
      id: "kg-shadow-contact",
      type: "line",
      source: "kg-boundary-source",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#0a0a0a",
        "line-width": ["interpolate", ["linear"], ["zoom"], 5, 2, 8, 3, 12, 4],
        "line-blur": 1.2,
        "line-opacity": 0.28,
        "line-translate": [2, 3],
        "line-translate-anchor": "viewport",
      },
    },
    "landcover-wood"
  );
}

/**
 * Шаги 3 и 4: border thickness + directional shading.
 *
 * Вызывать ПОСЛЕ добавления существующего слоя "kg-border" —
 * новые слои добавляются поверх него (без beforeId), как и сам kg-border.
 */
export function addBorderEnhancements(map: maplibregl.Map) {
  // 4) Двойной кант — имитация толщины материала 2-3мм.
  // line-gap-width рисует два параллельных штриха с зазором вместо одного —
  // это и даёт ощущение "среза" материала по контуру.
  if (!map.getLayer("kg-border-thickness")) {
    map.addLayer({
      id: "kg-border-thickness",
      type: "line",
      source: "kg-boundary-source",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#ffffff",
        "line-width": ["interpolate", ["linear"], ["zoom"], 5, 0.5, 8, 0.6, 12, 0.8],
        "line-gap-width": ["interpolate", ["linear"], ["zoom"], 5, 0.6, 8, 0.8, 12, 1.1],
        "line-opacity": 0.5,
      },
    });
  }

  // 3) Directional shading — верх/лево светлее, низ/право темнее вдоль контура.
  // Требует геометрию полигона на клиенте, поэтому грузим тот же файл отдельно
  // (существующий источник kg-boundary-source не трогаем и не удаляем).
  if (map.getSource("kg-shade-source")) return;

  fetch("/geojson/kyrgyzstan.geojson")
    .then((res) => res.json())
    .then((geojson) => {
      if (map.getSource("kg-shade-source")) return;

      const shadeData = buildShadeLines(geojson);

      map.addSource("kg-shade-source", {
        type: "geojson",
        data: shadeData as any,
      });

      map.addLayer({
        id: "kg-shade-line",
        type: "line",
        source: "kg-shade-source",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-width": ["interpolate", ["linear"], ["zoom"], 5, 1, 8, 1.4, 12, 1.8],
          "line-blur": 1.5,
          "line-color": [
            "interpolate",
            ["linear"],
            ["get", "light"],
            0, "rgba(20,20,20,0.16)",
            0.5, "rgba(120,120,120,0.05)",
            1, "rgba(255,255,255,0.55)",
          ],
          "line-opacity": 0.9,
        },
      });
    })
    .catch((err) => {
      // Декоративный эффект — не должен ломать карту при сетевой ошибке
      console.warn("kg-shade-line: не удалось построить directional shading", err);
    });
}
