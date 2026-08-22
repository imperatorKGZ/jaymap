import type { Language } from "@/lib/i18n";

// ----------------------------------------------------
// Единый источник городов Кыргызстана.
//
// GeoJSON используется для геометрии/координат,
// Supabase public.cities использует тот же slug/id.
//
// ВАЖНО:
// id должен совпадать с public.cities.id.
// ----------------------------------------------------

export interface City {
  id: string;

  name: string;

  nameRu: string;

  nameKy: string;

  population?: number;

  rank?: number;

  coordinates: [
    number,
    number
  ];
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

    coordinates: [
      number,
      number
    ];
  };
}

interface CityFeatureCollection {
  type: "FeatureCollection";

  features: CityFeature[];
}

const CITIES_GEOJSON_URL =
  "/geojson/kg-cities.geojson";

function normalizeCityId(
  name: string
): string {
  return name
    .trim()
    .toLowerCase()
    .replace(
      /ё/g,
      "е"
    )
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );
}

function compareCities(
  a: City,
  b: City
): number {
  // 1. rank
  if (
    a.rank !== undefined &&
    b.rank !== undefined
  ) {
    return (
      a.rank -
      b.rank
    );
  }

  if (
    a.rank !== undefined
  ) {
    return -1;
  }

  if (
    b.rank !== undefined
  ) {
    return 1;
  }

  // 2. population
  if (
    a.population !== undefined &&
    b.population !== undefined
  ) {
    return (
      b.population -
      a.population
    );
  }

  if (
    a.population !== undefined
  ) {
    return -1;
  }

  if (
    b.population !== undefined
  ) {
    return 1;
  }

  // 3. alphabet
  return a.nameRu.localeCompare(
    b.nameRu,
    "ru"
  );
}

export async function loadCities(): Promise<
  City[]
> {
  const response =
    await fetch(
      CITIES_GEOJSON_URL
    );

  if (!response.ok) {
    throw new Error(
      `Failed to load cities: ${response.status}`
    );
  }

  const data =
    (await response.json()) as CityFeatureCollection;

  const cities: City[] =
    data.features
      .filter(
        (feature) =>
          feature.geometry?.type ===
          "Point"
      )
      .map(
        (
          feature
        ) => {
          const props =
            feature.properties;

          const normalizedId =
            normalizeCityId(
              props.name
            );

          return {
            /*
             * ВАЖНО:
             * теперь id = slug,
             * совпадающий с public.cities.id.
             *
             * Bishkek → bishkek
             * Osh → osh
             * Kara-Balta → kara-balta
             */
            id:
              normalizedId,

            name:
              props.name,

            nameRu:
              props[
                "name:ru"
              ] ??
              props.name,

            nameKy:
              props[
                "name:ky"
              ] ??
              props[
                "name:ru"
              ] ??
              props.name,

            population:
              props.population,

            rank:
              props.rank,

            coordinates:
              feature
                .geometry
                .coordinates,
          };
        }
      );

  return cities.sort(
    compareCities
  );
}

export function getCityDisplayName(
  city: City,
  language: Language
): string {
  if (
    language ===
    "en"
  ) {
    return city.name;
  }

  if (
    language ===
    "ky"
  ) {
    return city.nameKy;
  }

  return city.nameRu;
}