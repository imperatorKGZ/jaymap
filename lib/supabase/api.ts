/**
 * lib/supabase/api.ts
 * ------------------------------------------------------------
 * Типобезопасный API-слой.
 *
 * Все запросы к Supabase — здесь.
 * Компоненты не импортируют supabase напрямую,
 * кроме специализированных auth/profile компонентов.
 * ------------------------------------------------------------
 */

import {
  supabase,
} from "./client";

import type {
  Database,
} from "./database.types";

import type {
  ListingsFilter,
  MapBounds,
} from "@/lib/filters/types";

type ListingRow =
  Database["public"]["Tables"]["listings"]["Row"];

type ListingInsert =
  Database["public"]["Tables"]["listings"]["Insert"];

export type ListingStatus =
  | "draft"
  | "published"
  | "paused"
  | "archived";

/**
 * Фильтр уровня API.
 *
 * Sidebar/page работают с ListingsFilter,
 * но для запроса карты bounds обязательны.
 */
export type ListingQueryFilter =
  ListingsFilter & {
    bounds: MapBounds;
  };

/**
 * Backward-compatible export.
 */
export type {
  MapBounds,
};

/* ============================================================
   GeoJSON для карты
   ============================================================ */

/**
 * Получает публичный GeoJSON объявлений.
 *
 * ВАЖНО:
 * RPC не возвращает phone / telegram / whatsapp.
 *
 * Контакты загружаются отдельно через
 * getListingContacts() только для authenticated.
 */
export async function fetchListingsGeoJSON(
  filters: ListingQueryFilter
): Promise<GeoJSON.FeatureCollection> {
  const {
    bounds,
    type,
    cityId,
    priceMin,
    priceMax,
    rooms,
    areaMin,
    areaMax,
    furnished,
    parking,
    pets,
    params,
  } = filters;

  const {
    data,
    error,
  } =
    await supabase.rpc(
      "get_listings_geojson",
      {
        p_west:
          bounds.west,

        p_south:
          bounds.south,

        p_east:
          bounds.east,

        p_north:
          bounds.north,

        p_type:
          type ?? null,

        p_city_id:
          cityId ?? null,

        p_price_min:
          priceMin ?? null,

        p_price_max:
          priceMax ?? null,

        p_rooms:
          rooms ?? null,

        p_area_min:
          areaMin ?? null,

        p_area_max:
          areaMax ?? null,

        p_furnished:
          furnished ?? null,

        p_parking:
          parking ?? null,

        p_pets:
          pets ?? null,

        p_params:
          params ?? null,
      }
    );

  if (error) {
    console.error(
      "[API] fetchListingsGeoJSON error:",
      error
    );

    throw error;
  }

  return (
    data ?? {
      type:
        "FeatureCollection",

      features: [],
    }
  ) as GeoJSON.FeatureCollection;
}

/* ============================================================
   CRUD объявлений
   ============================================================ */

/**
 * Создаёт объявление.
 *
 * RLS дополнительно проверяет:
 * auth.uid() = user_id
 */
export async function createListing(
  data: Omit<
    ListingInsert,
    "coordinates"
  > & {
    lng: number;
    lat: number;
  }
) {
  const {
    lng,
    lat,
    ...rest
  } = data;

  const {
    data: listing,
    error,
  } =
    await supabase
      .from("listings")
      .insert({
        ...rest,

        coordinates:
          `POINT(${lng} ${lat})`,
      })
      .select()
      .single();

  if (error) {
    console.error(
      "[API] createListing error:",
      error
    );

    throw error;
  }

  return listing as ListingRow;
}

/**
 * Получает публичные данные объявления.
 *
 * Контакты намеренно НЕ возвращаются.
 */
export async function getPublicListing(
  id: string
) {
  const {
    data,
    error,
  } =
    await supabase.rpc(
      "get_public_listing",
      {
        p_listing_id:
          id,
      }
    );

  if (error) {
    console.error(
      "[API] getPublicListing error:",
      error
    );

    throw error;
  }

  return data;
}

/**
 * Получает контакты объявления.
 *
 * RPC разрешён только authenticated.
 *
 * Возвращает:
 * - phone
 * - telegram
 * - whatsapp
 */
export async function getListingContacts(
  listingId: string
): Promise<{
  phone: string | null;
  telegram: string | null;
  whatsapp: string | null;
} | null> {
  const {
    data,
    error,
  } =
    await supabase.rpc(
      "get_listing_contacts",
      {
        p_listing_id:
          listingId,
      }
    );

  if (error) {
    console.error(
      "[API] getListingContacts error:",
      error
    );

    throw error;
  }

  return data as {
    phone: string | null;
    telegram: string | null;
    whatsapp: string | null;
  } | null;
}

/**
 * Получает одно объявление напрямую.
 *
 * Этот метод оставляем для существующего
 * внутреннего кода/совместимости.
 *
 * Публичный frontend для контактов должен
 * использовать getPublicListing + getListingContacts.
 */
export async function getListingById(
  id: string
) {
  const {
    data,
    error,
  } =
    await supabase
      .from("listings")
      .select("*")
      .eq(
        "id",
        id
      )
      .single();

  if (error) {
    console.error(
      "[API] getListingById error:",
      error
    );

    throw error;
  }

  return data as ListingRow;
}

/**
 * Обновляет объявление.
 *
 * RLS проверяет владельца.
 */
export async function updateListing(
  id: string,
  patch: Partial<ListingInsert>
) {
  const {
    data,
    error,
  } =
    await supabase
      .from("listings")
      .update(patch)
      .eq(
        "id",
        id
      )
      .select()
      .single();

  if (error) {
    console.error(
      "[API] updateListing error:",
      error
    );

    throw error;
  }

  return data as ListingRow;
}

/* ============================================================
   Мои объявления
   ============================================================ */

/**
 * Получает объявления только текущего пользователя.
 *
 * Фильтрация выполняется одновременно:
 *
 * 1. auth.uid() на клиенте;
 * 2. user_id = текущий user;
 * 3. RLS в БД.
 */
export async function getMyListings() {
  const {
    data: {
      user,
    },
  } =
    await supabase.auth.getUser();

  if (!user) {
    throw new Error(
      "Unauthorized"
    );
  }

  const {
    data,
    error,
  } =
    await supabase
      .from("listings")
      .select(
        `
          id,
          created_at,
          updated_at,
          type,
          status,
          price,
          currency,
          rooms,
          area,
          floor,
          total_floors,
          furnished,
          parking,
          pets,
          purpose,
          city_id,
          district,
          address,
          title,
          description,
          photos,
          is_active,
          is_premium,
          params
        `
      )
      .eq(
        "user_id",
        user.id
      )
      .order(
        "created_at",
        {
          ascending:
            false,
        }
      );

  if (error) {
    console.error(
      "[API] getMyListings error:",
      error
    );

    throw error;
  }

  return data ?? [];
}

/* ============================================================
   Управление моими объявлениями
   ============================================================ */

/**
 * Проверяет владельца и возвращает
 * данные, необходимые для lifecycle/delete.
 */
async function getOwnedListingForManagement(
  listingId: string
) {
  const {
    data: {
      user,
    },
  } =
    await supabase.auth.getUser();

  if (!user) {
    throw new Error(
      "Unauthorized"
    );
  }

  const {
    data,
    error,
  } =
    await supabase
      .from("listings")
      .select(
        `
          id,
          user_id,
          status,
          is_active,
          photos
        `
      )
      .eq(
        "id",
        listingId
      )
      .eq(
        "user_id",
        user.id
      )
      .single();

  if (error) {
    console.error(
      "[API] getOwnedListingForManagement error:",
      error
    );

    throw error;
  }

  return {
    listing:
      data,
    userId:
      user.id,
  };
}

/**
 * Меняет lifecycle status.
 *
 * DB trigger синхронизирует:
 *
 * published -> is_active=true
 * всё остальное -> is_active=false
 */
export async function updateListingStatus(
  listingId: string,
  status: ListingStatus
) {
  const {
    data: {
      user,
    },
  } =
    await supabase.auth.getUser();

  if (!user) {
    throw new Error(
      "Unauthorized"
    );
  }

  const {
    data,
    error,
  } =
    await supabase
      .from("listings")
      .update({
        status,
      })
      .eq(
        "id",
        listingId
      )
      .eq(
        "user_id",
        user.id
      )
      .select(
        `
          id,
          status,
          is_active,
          updated_at
        `
      )
      .single();

  if (error) {
    console.error(
      "[API] updateListingStatus error:",
      error
    );

    throw error;
  }

  return data;
}

/**
 * Опубликовать объявление.
 */
export async function publishListing(
  listingId: string
) {
  return updateListingStatus(
    listingId,
    "published"
  );
}

/**
 * Приостановить объявление.
 */
export async function pauseListing(
  listingId: string
) {
  return updateListingStatus(
    listingId,
    "paused"
  );
}

/**
 * Опубликовать заново.
 */
export async function resumeListing(
  listingId: string
) {
  return updateListingStatus(
    listingId,
    "published"
  );
}

/**
 * Получить путь Storage-объекта
 * из публичного URL.
 *
 * Ожидаемый URL:
 *
 * /storage/v1/object/public/listing-photos/...
 */
function getListingPhotoPath(
  url: string
): string | null {
  const marker =
    "/storage/v1/object/public/listing-photos/";

  const index =
    url.indexOf(
      marker
    );

  if (
    index === -1
  ) {
    return null;
  }

  const path =
    url.slice(
      index +
        marker.length
    );

  if (!path) {
    return null;
  }

  return decodeURIComponent(
    path
  );
}

/**
 * Полное удаление объявления.
 *
 * 1. Проверяем владельца.
 * 2. Пытаемся определить все photo paths.
 * 3. Удаляем их из Storage.
 * 4. Удаляем listing.
 *
 * favorites удаляются каскадно
 * на уровне БД.
 */
export async function deleteListingPermanently(
  listingId: string
) {
  const {
    listing,
    userId,
  } =
    await getOwnedListingForManagement(
      listingId
    );

  const photoPaths =
    (
      listing.photos ??
      []
    )
      .map(
        (
          url
        ) =>
          getListingPhotoPath(
            url
          )
      )
      .filter(
        (
          path
        ): path is string =>
          Boolean(
            path
          )
      );

  /**
   * Удаляем файлы из Storage.
   */
  if (
    photoPaths.length >
    0
  ) {
    const {
      error:
        storageError,
    } =
      await supabase.storage
        .from(
          "listing-photos"
        )
        .remove(
          photoPaths
        );

    if (
      storageError
    ) {
      console.error(
        "[API] deleteListingPermanently storage error:",
        storageError
      );

      throw storageError;
    }
  }

  /**
   * Удаляем строку объявления.
   *
   * RLS + user_id защищают
   * операцию владельцем.
   */
  const {
    error,
  } =
    await supabase
      .from("listings")
      .delete()
      .eq(
        "id",
        listingId
      )
      .eq(
        "user_id",
        userId
      );

  if (error) {
    console.error(
      "[API] deleteListingPermanently database error:",
      error
    );

    throw error;
  }

  return true;
}

/* ============================================================
   Избранное
   ============================================================ */

/**
 * Добавляет/удаляет объявление
 * из избранного.
 *
 * true  = добавлено
 * false = удалено
 */
export async function toggleFavorite(
  listingId: string
): Promise<boolean> {
  const {
    data: {
      user,
    },
  } =
    await supabase.auth.getUser();

  if (!user) {
    throw new Error(
      "Unauthorized"
    );
  }

  const {
    data: existing,
  } =
    await supabase
      .from("favorites")
      .select("*")
      .eq(
        "listing_id",
        listingId
      )
      .eq(
        "user_id",
        user.id
      )
      .maybeSingle();

  if (existing) {
    const {
      error,
    } =
      await supabase
        .from("favorites")
        .delete()
        .eq(
          "listing_id",
          listingId
        )
        .eq(
          "user_id",
          user.id
        );

    if (error) {
      console.error(
        "[API] remove favorite error:",
        error
      );

      throw error;
    }

    return false;
  }

  const {
    error,
  } =
    await supabase
      .from("favorites")
      .insert({
        listing_id:
          listingId,

        user_id:
          user.id,
      });

  if (error) {
    console.error(
      "[API] add favorite error:",
      error
    );

    throw error;
  }

  return true;
}

/**
 * Получает ID избранных объявлений
 * текущего пользователя.
 */
export async function getFavoriteIds(): Promise<
  string[]
> {
  const {
    data: {
      user,
    },
  } =
    await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const {
    data,
    error,
  } =
    await supabase
      .from("favorites")
      .select(
        "listing_id"
      )
      .eq(
        "user_id",
        user.id
      );

  if (error) {
    console.error(
      "[API] getFavoriteIds error:",
      error
    );

    return [];
  }

  return (
    data?.map(
      (
        favorite
      ) =>
        favorite.listing_id
    ) ?? []
  );
}

/**
 * Получает GeoJSON избранных объявлений.
 *
 * Временно используется существующий RPC.
 */
export async function getFavoritesGeoJSON(): Promise<
  GeoJSON.FeatureCollection
> {
  const {
    data: {
      user,
    },
  } =
    await supabase.auth.getUser();

  if (!user) {
    return {
      type:
        "FeatureCollection",

      features: [],
    };
  }

  const {
    data,
    error,
  } =
    await supabase.rpc(
      "get_listings_geojson",
      {
        p_west:
          -180,

        p_south:
          -90,

        p_east:
          180,

        p_north:
          90,

        p_type:
          null,

        p_city_id:
          null,

        p_price_min:
          null,

        p_price_max:
          null,

        p_rooms:
          null,

        p_area_min:
          null,

        p_area_max:
          null,

        p_furnished:
          null,

        p_parking:
          null,

        p_pets:
          null,

        p_params:
          null,
      }
    );

  if (error) {
    console.error(
      "[API] getFavoritesGeoJSON error:",
      error
    );

    return {
      type:
        "FeatureCollection",

      features: [],
    };
  }

  const collection =
    (
      data ?? {
        type:
          "FeatureCollection",

        features: [],
      }
    ) as GeoJSON.FeatureCollection;

  const favoriteIds =
    await getFavoriteIds();

  return {
    ...collection,

    features:
      collection.features.filter(
        (
          feature
        ) => {
          const props =
            feature.properties as
              | Record<
                  string,
                  unknown
                >
              | null;

          return (
            props?.id !=
              null &&
            favoriteIds.includes(
              String(
                props.id
              )
            )
          );
        }
      ),
  };
}

/* ============================================================
   Фото объявлений
   ============================================================ */

const PHOTO_BUCKET =
  "listing-photos";

/**
 * Загружает фото объявления
 * в Storage.
 */
export async function uploadListingPhoto(
  file: File,
  listingId: string
): Promise<string> {
  const fileExt =
    file.name
      .split(".")
      .pop()
      ?.toLowerCase() ??
    "jpg";

  const fileName =
    `${listingId}/${crypto.randomUUID()}.${fileExt}`;

  const {
    error,
  } =
    await supabase.storage
      .from(
        PHOTO_BUCKET
      )
      .upload(
        fileName,
        file,
        {
          cacheControl:
            "31536000",

          upsert:
            false,

          contentType:
            file.type,
        }
      );

  if (error) {
    console.error(
      "[API] uploadListingPhoto error:",
      error
    );

    throw error;
  }

  const {
    data,
  } =
    supabase.storage
      .from(
        PHOTO_BUCKET
      )
      .getPublicUrl(
        fileName
      );

  return data.publicUrl;
}