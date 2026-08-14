import type { Language } from "@/lib/i18n";

// ----------------------------------------------------
// Единый источник городов Кыргызстана.
//
// Данные читаются ИСКЛЮЧИТЕЛЬНО из /geojson/kg-cities.geojson —
// тот же файл, который использует mapLayers.ts для отрисовки точек
// на карте. Никаких координат или списков городов здесь не хранится
// вручную — только парсинг и сортировка.
// ----------------------------------------------------

export interface City {
  /** Стабильный идентификатор (используем английское имя) */
  id: string;
  name: string;
  nameRu: string;
  nameKy: string;
  population?: number;
  rank?: number;
  coordinates: [number, number];
}

interface CityFeatureProperties {
  name: string;
  "name:ru"?: string;
  "name:ky"?: string;
  population?: number;
  rank?: number;
  capital?: boolean;
  region?: string;
  minzoom?: number;
}

interface CityFeature {
  type: "Feature";
  properties: CityFeatureProperties;
  geometry: {
    type: string;
    coordinates: [number, number];
  };
}

interface CityFeatureCollection {
  type: "FeatureCollection";
  features: CityFeature[];
}

const CITIES_GEOJSON_URL = "/geojson/kg-cities.geojson";

function compareCities(a: City, b: City): number {
  // 1) Приоритет — поле rank, если оно задано у обоих городов.
  if (a.rank !== undefined && b.rank !== undefined) {
    return a.rank - b.rank;
  }
  if (a.rank !== undefined) return -1;
  if (b.rank !== undefined) return 1;

  // 2) Иначе — по населению (по убыванию).
  if (a.population !== undefined && b.population !== undefined) {
    return b.population - a.population;
  }
  if (a.population !== undefined) return -1;
  if (b.population !== undefined) return 1;

  // 3) Иначе — по алфавиту.
  return a.nameRu.localeCompare(b.nameRu, "ru");
}

/**
 * Загружает список городов из kg-cities.geojson и сортирует его так,
 * чтобы крупные города шли первыми (rank -> population -> алфавит).
 */
export async function loadCities(): Promise<City[]> {
  const response = await fetch(CITIES_GEOJSON_URL);
  const data = (await response.json()) as CityFeatureCollection;

  const cities: City[] = data.features
    .filter((feature) => feature.geometry?.type === "Point")
    .map((feature) => {
      const props = feature.properties;
      return {
        id: props.name,
        name: props.name,
        nameRu: props["name:ru"] ?? props.name,
        nameKy: props["name:ky"] ?? props["name:ru"] ?? props.name,
        population: props.population,
        rank: props.rank,
        coordinates: feature.geometry.coordinates,
      };
    });

  return cities.sort(compareCities);
}

/** Название города на выбранном языке интерфейса с graceful fallback. */
export function getCityDisplayName(city: City, language: Language): string {
  if (language === "en") return city.name;
  if (language === "ky") return city.nameKy;
  return city.nameRu;
}
