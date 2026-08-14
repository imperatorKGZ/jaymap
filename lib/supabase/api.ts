/**
 * lib/supabase/api.ts
 * ------------------------------------------------------------
 * Типобезопасный API-слой. Все запросы к Supabase — здесь.
 * Компоненты не импортируют supabase напрямую, только функции отсюда.
 *
 * Принципы:
 *   - Все фильтры через ListingsFilter
 *   - GeoJSON для карты — через RPC (один запрос)
 *   - Bounds (viewport) обязательны для производительности
 * ------------------------------------------------------------
 */
import { supabase } from "./client";
import type { Database } from "./database.types";

type ListingRow = Database["public"]["Tables"]["listings"]["Row"];
type ListingInsert = Database["public"]["Tables"]["listings"]["Insert"];

// ============================================================
// Bounds — видимая область карты [west, south, east, north]
// ============================================================
export interface MapBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

// ============================================================
// Фильтры объявлений (соответствуют параметрам SQL-функции)
// ============================================================
export interface ListingsFilter {
  /** Обязательный фильтр по видимой области карты */
  bounds: MapBounds;

  /** Тип объекта (совпадает с sectionId sidebar) */
  type?: "rental" | "commercial" | "land" | "daily";

  /** Фильтр по городу (опционально, если хотим ограничить городом) */
  cityId?: string;

  /** Цена */
  priceMin?: number;
  priceMax?: number;

  /** Комнаты (для аренды) */
  rooms?: number;

  /** Площадь, м² */
  areaMin?: number;
  areaMax?: number;

  /** Булевы фильтры */
  furnished?: boolean;
  parking?: boolean;
  pets?: boolean;

  /** JSONB-фильтры для специфичных полей (purpose, building_class и т.д.) */
  params?: Record<string, unknown>;
}

// ============================================================
// GeoJSON для карты
// ============================================================

/**
 * Получает GeoJSON объявлений для MapLibre.
 * Использует RPC-функцию get_listings_geojson — быстро, одним запросом.
 *
 * ВАЖНО: bounds обязателен. Без него запрос может вернуть
 * тысячи объектов и заблокировать интерфейс.
 */
export async function fetchListingsGeoJSON(
  filters: ListingsFilter
): Promise<GeoJSON.FeatureCollection> {
  const { bounds, type, cityId, priceMin, priceMax, rooms, areaMin, areaMax, furnished, parking, pets, params } =
    filters;

  const { data, error } = await supabase.rpc("get_listings_geojson", {
    p_west: bounds.west,
    p_south: bounds.south,
    p_east: bounds.east,
    p_north: bounds.north,
    p_type: type ?? null,
    p_city_id: cityId ?? null,
    p_price_min: priceMin ?? null,
    p_price_max: priceMax ?? null,
    p_rooms: rooms ?? null,
    p_area_min: areaMin ?? null,
    p_area_max: areaMax ?? null,
    p_furnished: furnished ?? null,
    p_parking: parking ?? null,
    p_pets: pets ?? null,
    p_params: params ?? null,
  });

  if (error) {
    console.error("[API] fetchListingsGeoJSON error:", error);
    throw error;
  }

  return (data ?? { type: "FeatureCollection", features: [] }) as GeoJSON.FeatureCollection;
}

// ============================================================
// CRUD объявлений
// ============================================================

/**
 * Создаёт объявление. Координаты конвертируются в WKT для PostGIS.
 */
export async function createListing(
  data: Omit<ListingInsert, "coordinates"> & { lng: number; lat: number }
) {
  const { lng, lat, ...rest } = data;

  const { data: listing, error } = await supabase
    .from("listings")
    .insert({
      ...rest,
      coordinates: `POINT(${lng} ${lat})`,
    })
    .select()
    .single();

  if (error) {
    console.error("[API] createListing error:", error);
    throw error;
  }

  return listing as ListingRow;
}

/**
 * Получает одно объявление по ID.
 */
export async function getListingById(id: string) {
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("[API] getListingById error:", error);
    throw error;
  }

  return data as ListingRow;
}

/**
 * Обновляет объявление (только если вы автор — RLS проверит).
 */
export async function updateListing(id: string, patch: Partial<ListingInsert>) {
  const { data, error } = await supabase
    .from("listings")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[API] updateListing error:", error);
    throw error;
  }

  return data as ListingRow;
}

// ============================================================
// Избранное
// ============================================================

/**
 * Добавляет/удаляет объявление из избранного.
 * Возвращает true если теперь в избранном, false если удалено.
 */
export async function toggleFavorite(listingId: string): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // Проверяем, есть ли в избранном
  const { data: existing } = await supabase
    .from("favorites")
    .select("*")
    .eq("listing_id", listingId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("favorites")
      .delete()
      .eq("listing_id", listingId)
      .eq("user_id", user.id);
    return false;
  } else {
    await supabase.from("favorites").insert({
      listing_id: listingId,
      user_id: user.id,
    });
    return true;
  }
}

/**
 * Получает ID избранных объявлений текущего пользователя.
 */
export async function getFavoriteIds(): Promise<string[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("favorites")
    .select("listing_id")
    .eq("user_id", user.id);

  if (error) {
    console.error("[API] getFavoriteIds error:", error);
    return [];
  }

  return data?.map((f) => f.listing_id) ?? [];
}

/**
 * Получает GeoJSON избранных объявлений для отображения на карте.
 */
export async function getFavoritesGeoJSON(): Promise<GeoJSON.FeatureCollection> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { type: "FeatureCollection", features: [] };

  const { data, error } = await supabase.rpc("get_listings_geojson", {
    p_west: -180,
    p_south: -90,
    p_east: 180,
    p_north: 90,
    p_type: null,
    p_city_id: null,
    p_price_min: null,
    p_price_max: null,
    p_rooms: null,
    p_area_min: null,
    p_area_max: null,
    p_furnished: null,
    p_parking: null,
    p_pets: null,
    p_params: null,
  });

  // TODO: добавить фильтр по favorites в SQL-функцию или фильтровать на клиенте
  // Пока загружаем все активные — для MVP достаточно если избранных мало

  if (error) {
    console.error("[API] getFavoritesGeoJSON error:", error);
    return { type: "FeatureCollection", features: [] };
  }

  const collection = (data ?? { type: "FeatureCollection", features: [] }) as GeoJSON.FeatureCollection;
  const favoriteIds = await getFavoriteIds();

  return {
    ...collection,
    features: collection.features.filter((f) => {
      const props = f.properties as Record<string, unknown> | undefined;
      return props?.id && favoriteIds.includes(String(props.id));
    }),
  };
}

// ============================================================
// Фото — Supabase Storage
// ============================================================

const PHOTO_BUCKET = "listing-photos";

/**
 * Загружает фото в Storage и возвращает публичный URL.
 */
export async function uploadListingPhoto(file: File, listingId: string): Promise<string> {
  const fileExt = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const fileName = `${listingId}/${crypto.randomUUID()}.${fileExt}`;

  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(fileName, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });

  if (error) {
    console.error("[API] uploadListingPhoto error:", error);
    throw error;
  }

  const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(fileName);
  return data.publicUrl;
}

/**
 * Удаляет фото из Storage.
 */
export async function deleteListingPhoto(url: string) {
  // Извлекаем путь из публичного URL
  const baseUrl = supabase.storage.from(PHOTO_BUCKET).getPublicUrl("").data.publicUrl;
  const path = url.replace(baseUrl, "").replace(/^\//, "");

  const { error } = await supabase.storage.from(PHOTO_BUCKET).remove([path]);
  if (error) {
    console.error("[API] deleteListingPhoto error:", error);
    throw error;
  }
}

// ============================================================
// Auth helpers
// ============================================================

export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) return null;
  return user;
}

export function onAuthStateChange(callback: (user: typeof supabase.auth.getUser extends () => Promise<{ data: { user: infer U } }> ? U : never) => void) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
  return data.subscription;
}
