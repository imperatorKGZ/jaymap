import maplibregl from "maplibre-gl";
import { addBorderEnhancements } from "./overlays/shadowEffects";
import { createGeoJsonShadow } from "./overlays/createCanvasShadow";
import type { Language } from "@/lib/i18n";

// ----------------------------------------------------
// ПОДДЕРЖКА ЯЗЫКА ДЛЯ ПОДПИСЕЙ (единственное дополнение к этому файлу
// в рамках локализации — вся остальная логика слоёв не изменена).
//
// GeoJSON городов хранит "name" (en), "name:ru", "name:ky".
// По текущему языку строим MapLibre-выражение с graceful fallback,
// чтобы отсутствие перевода в данных не ломало подпись.
// ----------------------------------------------------
function nameFieldFor(language: Language): string {
  if (language === "en") return "name";
  if (language === "ky") return "name:ky";
  return "name:ru";
}

function cityNameExpression(language: Language): maplibregl.ExpressionSpecification {
  return [
    "coalesce",
    ["get", nameFieldFor(language)],
    ["get", "name:ru"],
    ["get", "name"],
    "",
  ] as unknown as maplibregl.ExpressionSpecification;
}

/**
 * Обновляет подписи городов на уже созданной карте под новый язык —
 * без пересоздания источников/слоёв/карты. Вызывается из MainMap
 * при смене языка.
 */
export function updateMapLanguage(map: maplibregl.Map, language: Language): void {
  const expression = cityNameExpression(language);

  if (map.getLayer("kg-cities-labels")) {
    map.setLayoutProperty("kg-cities-labels", "text-field", expression);
  }
  if (map.getLayer("kg-bishkek-label")) {
    map.setLayoutProperty("kg-bishkek-label", "text-field", expression);
  }
}

export async function setupMapLayers(map: maplibregl.Map, language: Language = "ru") {

  // ----------------------------------------------------
  // 1. СКРЫТИЕ ИНОСТРАННЫХ МЕТОК
  // ----------------------------------------------------
  const hiddenLayers = [
    "water-name",
    "place-city-capital",
    "place-city-major",
    "place-city-minor",
    "place-district",
  ];

  hiddenLayers.forEach((id) => {
    if (map.getLayer(id)) {
      map.setLayoutProperty(id, "visibility", "none");
    }
  });
  
  if (map.getLayer("road-label-major")) {
    map.setLayoutProperty("road-label-major", "visibility", "visible");
  }

  // ----------------------------------------------------
  // 2. ПЛОТНАЯ МАСКА ЗАТЕМНЕНИЯ (Зарубежье)
  // ----------------------------------------------------
  if (!map.getSource("kg-mask-source")) {
    map.addSource("kg-mask-source", {
      type: "geojson",
      data: "/geojson/kyrgyzstan-mask.geojson",
    });

    map.addLayer({
      id: "kg-mask-layer",
      type: "fill",
      source: "kg-mask-source",
      paint: {
        "fill-color": "rgb(2, 2, 2)",
        "fill-opacity": 0.5,
      },
    });
  }

  // ----------------------------------------------------
  // 3. ЧЁТКАЯ ГРАНИЦА КЫРГЫЗСТАНА
  // ----------------------------------------------------
  if (!map.getSource("kg-boundary-source")) {
    map.addSource("kg-boundary-source", {
      type: "geojson",
      data: "/geojson/kyrgyzstan.geojson",
    });
    
    // NEW: ambient + contact shadow (вставляются ДО kg-land-fill,
    // тем же anchor'ом "landcover-wood" — поэтому окажутся ПОД белой заливкой)
    //addAmbientAndContactShadow(map);
    // --- Генерация и добавление гладкой Canvas-тени ---
    try {
      const shadowData = await createGeoJsonShadow("/geojson/kyrgyzstan.geojson", {
        // Вы можете легко регулировать смещение тени здесь:
        ambientOffsetY: 50, // Сдвиг мягкой тени вниз
        ambientOffsetX: 27, // Сдвиг мягкой тени вправо
        contactOffsetY: 24, // Сдвиг плотной тени вниз
      });

      if (shadowData && !map.getSource("kg-canvas-shadow-source")) {
        map.addSource("kg-canvas-shadow-source", {
          type: "image",
          url: shadowData.url,
          coordinates: shadowData.coordinates,
        });

        map.addLayer(
          {
            id: "kg-canvas-shadow-layer",
            type: "raster",
            source: "kg-canvas-shadow-source",
            paint: {
              "raster-opacity": 1.0, // Прозрачность теперь полностью задается внутри Canvas
              "raster-fade-duration": 0,
            },
          },
          "landcover-wood"
        );
      }
    } catch (err) {
      console.error("Ошибка генерации Canvas-тени:", err);
    }
    map.addLayer(
      {
        id: "kg-land-fill",
        type: "fill",
        source: "kg-boundary-source",
        paint: {
          "fill-color": "#F2F2EF",
          "fill-opacity": 1
        }
      },
      "landcover-wood"
    );
    // ----------------------------------------------------
    // ELEVATION BORDER
    // ----------------------------------------------------


    

    // Светлый кант
    map.addLayer({
      id: "kg-border",

      type: "line",

      source: "kg-boundary-source",

      layout: {
        "line-cap": "round",
        "line-join": "round",
      },

      paint: {

        "line-color": "#ffffff",

        "line-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          5, 0.7,
          8, 0.9,
          12, 1.2
        ],

        "line-opacity": 0.65

      }

    });

    // NEW: двойной кант (иллюзия толщины) + имитация верхнего света вдоль контура
    addBorderEnhancements(map);
  }
  // ----------------------------------------------------
  // 4. МЕТКИ ГОРОДОВ КЫРГЫЗСТАНА
  // ----------------------------------------------------
  if (!map.getSource("kg-cities-source")) {
    map.addSource("kg-cities-source", {
      type: "geojson",
      data: "/geojson/kg-cities.geojson",
    });
    map.addLayer({
      id: "kg-cities-dots",
      type: "circle",
      source: "kg-cities-source",
      filter: [
        "all",
        ["==", ["geometry-type"], "Point"],
        ["<=", ["get", "minzoom"], ["zoom"]]
      ],

      paint: {
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          5, 3,
          8, 4,
          12, 5
        ],

        "circle-color": "#ffffff",
        "circle-stroke-color": "#64748b",
        "circle-stroke-width": 1.5
      }
    });
    map.addLayer({
      id: "kg-bishkek-dot",
      type: "circle",
      source: "kg-cities-source",

      filter: [
        "==",
        ["get", "name:ru"],
        "Бишкек"
      ],

      paint: {
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          5, 3.5,
          8, 4.5,
          12, 5.5
        ],

        "circle-color": "#111827",
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 1
      }
    });
    map.addLayer({
      id: "kg-cities-labels",
      type: "symbol",
      source: "kg-cities-source",
      filter: [
        "all",
        ["==", ["geometry-type"], "Point"],
        ["<=", ["get", "minzoom"], ["zoom"]],
        ["!=", ["get", "name:ru"], "Бишкек"]
      ],
       layout: {
        "text-field":
          cityNameExpression(
            language
          ),

        "text-font": [
          "Noto Sans Regular"
        ],

        /*
        * Подпись может искать свободное
        * положение вокруг своей точки.
        */
        "text-variable-anchor": [
          "left",
          "right",
          "top",
          "bottom",
        ],

        /*
        * Небольшой зазор от точки города.
        */
        "text-radial-offset":
          0.45,

        "text-justify":
          "auto",

        "text-size": [
          "interpolate",
          ["linear"],
          ["zoom"],
          5, 17,
          8, 19,
          12, 23
        ],

        "text-letter-spacing":
          0.02,

        /*
        * Теперь подпись реально участвует
        * в collision detection.
        */
        "text-allow-overlap":
          false,

        "text-ignore-placement":
          false,

        "text-padding":
          6,
      },
    
      paint: {
        "text-color": "#0f1d31",
        "text-halo-color": "rgba(255,255,255,0.95)",
        "text-halo-width": 2.5,
        "text-halo-blur": 1.5
      }
    });
    map.addLayer({
      id: "kg-bishkek-label",
      type: "symbol",
      source: "kg-cities-source",
      filter: [
        "==",
        ["get", "name:ru"],
        "Бишкек"
      ],

      layout: {
        "text-anchor": "left",
        "text-offset": [0.4, 0],
        "text-field": cityNameExpression(language),
        "text-font": ["Noto Sans Regular"],

        "text-size": [
          "interpolate",
          ["linear"],
          ["zoom"],
          5, 22,
          8, 24,
          12, 28
        ],

        "text-allow-overlap": true,
        "text-ignore-placement": true
      },

      paint: {
        "text-color": "#000000",
        "text-halo-color": "#ffffff",
        "text-halo-width": 5,
        "text-halo-blur": 4
      }
    });
  // 5. ОЗЁРА КЫРГЫЗСТАНА
  if (!map.getSource("kg-lakes-source")) {
    map.addSource("kg-lakes-source", {
      type: "geojson",
      data: "/geojson/kg-lakes.geojson",
    });

    map.addLayer({
      id: "kg-lake-label",
      type: "symbol",
      source: "kg-lakes-source",

      layout: {
        "text-field": ["get", "name"],
        "text-font": ["Noto Sans Italic"],

        "text-size": [
          "interpolate",
          ["linear"],
          ["zoom"],
          6, 14,
          8, 18,
          12, 24
        ],

        "text-letter-spacing": 0.12,

        "text-rotate": -8,

        "text-allow-overlap": true,
        "text-ignore-placement": true
      },

      paint: {
        "text-color": "#6E9FC8",

        "text-halo-color": "#ffffff",

        "text-halo-width": 2,

        "text-halo-blur": 1
      }
    });
  }
  }
  
}
