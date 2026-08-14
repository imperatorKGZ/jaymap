import type { ListingFeature } from "./types";

/**
 * Загружает GeoJSON с объявлениями по тому же принципу, что и
 * kg-cities.geojson / kyrgyzstan.geojson в mapLayers.ts — просто
 * fetch статического файла (или API-эндпоинта, отдающего FeatureCollection).
 *
 * Ожидаемый формат каждой фичи:
 * {
 *   "type": "Feature",
 *   "geometry": { "type": "Point", "coordinates": [lng, lat] },
 *   "properties": { "id": "...", "price": 4200000 }
 * }
 */
export async function loadListings(url: string): Promise<ListingFeature[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Не удалось загрузить объявления (${response.status}): ${url}`);
  }
  const geojson = (await response.json()) as GeoJSON.FeatureCollection;

  return geojson.features.filter(
    (feature): feature is ListingFeature =>
      feature.geometry?.type === "Point" &&
      typeof (feature.properties as { price?: unknown } | null)?.price === "number"
  );
}
