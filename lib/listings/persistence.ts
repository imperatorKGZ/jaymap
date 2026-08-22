"use client";

import { supabase } from "@/lib/supabase/client";

import {
  createListing,
} from "@/lib/supabase/api";

import type {
  Database,
  Json,
} from "@/lib/supabase/database.types";

import type {
  ListingDraftPhoto,
} from "@/components/listings/ListingPhotoPicker";

const PHOTO_BUCKET =
  "listing-photos";

type ListingInsert =
  Database["public"]["Tables"]["listings"]["Insert"];

type PersistListingInput = {
  selectedType:
    ListingInsert["type"];

  title: string;

  description: string;

  price: number;

  currency: string;

  propertyType: string;

  rooms: number | null;

  area: number | null;

  floor: number | null;

  totalFloors: number | null;

  furnished: boolean;

  parking: boolean;

  pets: boolean;

  purpose: string | null;

  landUse: string | null;

  ratePerSqm: number | null;

  cityId: string;

  cityName?: string;

  cityNameRu?: string;

  district: string;

  address: string;

  coordinates: [
    number,
    number
  ];

  phone: string;

  telegram: string;

  whatsapp: string;

  photos: ListingDraftPhoto[];
};

function buildParams(
  input: PersistListingInput
): Json {
  return {
    property_type:
      input.propertyType ||
      null,

    land_use:
      input.landUse ||
      null,

    rate_per_sqm:
      input.ratePerSqm,
  };
}

/**
 * Пытаемся определить реальный id города,
 * но НЕ делаем это обязательным условием
 * для создания объявления.
 *
 * Если cities пустая / город отсутствует,
 * возвращаем null и объявление всё равно
 * будет создано.
 */
async function resolveDatabaseCityId(
  input: PersistListingInput
): Promise<string | null> {
  const cityId =
    input.cityId?.trim();

  const cityName =
    input.cityName?.trim();

  const cityNameRu =
    input.cityNameRu?.trim();

  if (!cityId) {
    return null;
  }

  /*
   * 1. cityId как прямой id.
   */
  {
    const {
      data,
      error,
    } =
      await supabase
        .from("cities")
        .select("id")
        .eq(
          "id",
          cityId
        )
        .maybeSingle();

    if (!error && data?.id) {
      return data.id;
    }
  }

  /*
   * 2. cityId как английское имя.
   */
  {
    const {
      data,
      error,
    } =
      await supabase
        .from("cities")
        .select("id")
        .eq(
          "name",
          cityId
        )
        .maybeSingle();

    if (!error && data?.id) {
      return data.id;
    }
  }

  /*
   * 3. cityId как русское имя.
   */
  {
    const {
      data,
      error,
    } =
      await supabase
        .from("cities")
        .select("id")
        .eq(
          "name_ru",
          cityId
        )
        .maybeSingle();

    if (!error && data?.id) {
      return data.id;
    }
  }

  /*
   * 4. Дополнительный fallback:
   *    явное английское имя.
   */
  if (cityName) {
    const {
      data,
      error,
    } =
      await supabase
        .from("cities")
        .select("id")
        .eq(
          "name",
          cityName
        )
        .maybeSingle();

    if (!error && data?.id) {
      return data.id;
    }
  }

  /*
   * 5. Дополнительный fallback:
   *    русское имя.
   */
  if (cityNameRu) {
    const {
      data,
      error,
    } =
      await supabase
        .from("cities")
        .select("id")
        .eq(
          "name_ru",
          cityNameRu
        )
        .maybeSingle();

    if (!error && data?.id) {
      return data.id;
    }
  }

  /*
   * Город не найден.
   *
   * ВАЖНО:
   * не бросаем exception.
   *
   * Публикация объявления не должна
   * зависеть от справочника cities.
   */
  console.warn(
    "[ListingPersistence] City not found, creating listing without city_id:",
    {
      cityId,
      cityName,
      cityNameRu,
    }
  );

  return null;
}

async function uploadPhoto(
  file: File,
  userId: string,
  listingId: string,
  index: number
): Promise<{
  url: string;
  path: string;
}> {
  const extension =
    file.type === "image/webp"
      ? "webp"
      : file.name
          .split(".")
          .pop()
          ?.toLowerCase() ||
        "webp";

  const path =
    `${userId}/${listingId}/${String(
      index + 1
    ).padStart(
      2,
      "0"
    )}-${crypto.randomUUID()}.${extension}`;

  const {
    error,
  } =
    await supabase.storage
      .from(
        PHOTO_BUCKET
      )
      .upload(
        path,
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
    throw new Error(
      `Не удалось загрузить фотографию №${
        index + 1
      }: ${error.message}`
    );
  }

  const {
    data,
  } =
    supabase.storage
      .from(
        PHOTO_BUCKET
      )
      .getPublicUrl(
        path
      );

  return {
    url:
      data.publicUrl,

    path,
  };
}

async function cleanupUploadedPhotos(
  paths: string[]
) {
  if (
    paths.length ===
    0
  ) {
    return;
  }

  const {
    error,
  } =
    await supabase.storage
      .from(
        PHOTO_BUCKET
      )
      .remove(
        paths
      );

  if (error) {
    console.error(
      "[ListingPersistence] Storage cleanup failed:",
      error
    );
  }
}

async function deleteCreatedListing(
  listingId: string,
  userId: string
) {
  const {
    error,
  } =
    await supabase
      .from(
        "listings"
      )
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
      "[ListingPersistence] Listing cleanup failed:",
      error
    );
  }
}

async function updateListingLifecycle(
  listingId: string,
  status:
    | "draft"
    | "published",
  photos: string[]
) {
  const table =
    supabase.from(
      "listings"
    ) as any;

  const {
    error,
  } =
    await table
      .update({
        photos,

        status,

        is_active:
          status ===
          "published",
      })
      .eq(
        "id",
        listingId
      );

  if (error) {
    throw new Error(
      `Не удалось обновить статус объявления: ${error.message}`
    );
  }
}

export async function persistListing(
  input: PersistListingInput,
  mode:
    | "draft"
    | "published"
): Promise<{
  id: string;

  status:
    | "draft"
    | "published";
}> {
  const {
    data: {
      user,
    },

    error:
      authError,
  } =
    await supabase.auth.getUser();

  if (
    authError ||
    !user
  ) {
    throw new Error(
      "Необходимо войти в аккаунт для размещения объявления."
    );
  }

  /*
   * Пытаемся получить city_id,
   * но НЕ блокируем публикацию,
   * если город отсутствует.
   */
  const databaseCityId =
    await resolveDatabaseCityId(
      input
    );

  const [
    lng,
    lat,
  ] =
    input.coordinates;

  /*
   * Формируем payload.
   *
   * city_id добавляем только если
   * реально нашли город.
   */
  const listingPayload: ListingInsert =
    {
      type:
        input.selectedType,

      title:
        input.title,

      description:
        input.description ||
        null,

      price:
        input.price,

      currency:
        input.currency,

      rooms:
        input.rooms,

      area:
        input.area,

      floor:
        input.floor,

      total_floors:
        input.totalFloors,

      furnished:
        input.furnished,

      parking:
        input.parking,

      pets:
        input.pets,

      purpose:
        input.purpose,

      district:
        input.district ||
        null,

      address:
        input.address ||
        null,

      phone:
        input.phone ||
        null,

      telegram:
        input.telegram ||
        null,

      whatsapp:
        input.whatsapp ||
        null,

      photos:
        [],

      user_id:
        user.id,

      is_active:
        false,

      is_premium:
        false,

      params:
        buildParams(
          input
        ),

      lng,

      lat,
    };

  /*
   * Добавляем city_id только когда
   * он действительно существует.
   */
  if (
    databaseCityId
  ) {
    (
      listingPayload as ListingInsert & {
        city_id?: string | null;
      }
    ).city_id =
      databaseCityId;
  }

  /*
   * Создаём объявление.
   */
  const created =
    await createListing(
      listingPayload as any
    );

  const uploaded: Array<{
    url: string;
    path: string;
  }> = [];

  try {
    /*
     * Загружаем изображения
     * в исходном порядке.
     *
     * photos[0] = cover.
     */
    for (
      let index = 0;
      index <
      input.photos.length;
      index += 1
    ) {
      const photo =
        input.photos[
          index
        ];

      uploaded.push(
        await uploadPhoto(
          photo.file,
          user.id,
          created.id,
          index
        )
      );
    }

    /*
     * Сохраняем URL фотографий
     * и lifecycle.
     */
    await updateListingLifecycle(
      created.id,

      mode,

      uploaded.map(
        (
          item
        ) =>
          item.url
      )
    );

    return {
      id:
        created.id,

      status:
        mode,
    };
  } catch (
    error
  ) {
    /*
     * Если upload/update упал —
     * чистим storage и listing.
     */
    await cleanupUploadedPhotos(
      uploaded.map(
        (
          item
        ) =>
          item.path
      )
    );

    await deleteCreatedListing(
      created.id,
      user.id
    );

    throw error;
  }
}