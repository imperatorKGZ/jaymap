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

  cityName: string;

  cityNameRu: string;

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
 * В UI города приходят из GeoJSON.
 *
 * Их id = props.name.
 *
 * Но listings.city_id должен ссылаться
 * на реальный public.cities.id.
 *
 * Поэтому сначала разрешаем UI-city
 * в DB-city.
 */
async function resolveDatabaseCityId(
  input: PersistListingInput
): Promise<string> {
  /*
   * 1. Сначала пробуем английское имя.
   */
  if (input.cityName) {
    const {
      data,
      error,
    } =
      await supabase
        .from("cities")
        .select("id")
        .eq(
          "name",
          input.cityName
        )
        .maybeSingle();

    if (error) {
      throw new Error(
        `Не удалось найти город в базе: ${error.message}`
      );
    }

    if (data?.id) {
      return data.id;
    }
  }

  /*
   * 2. Потом русское название.
   */
  if (input.cityNameRu) {
    const {
      data,
      error,
    } =
      await supabase
        .from("cities")
        .select("id")
        .eq(
          "name_ru",
          input.cityNameRu
        )
        .maybeSingle();

    if (error) {
      throw new Error(
        `Не удалось найти город в базе: ${error.message}`
      );
    }

    if (data?.id) {
      return data.id;
    }
  }

  /*
   * 3. Если по названию не нашли,
   * пробуем старый cityId.
   *
   * Это позволит работать и в случае,
   * если GeoJSON id уже совпадает с DB id.
   */
  if (input.cityId) {
    const {
      data,
      error,
    } =
      await supabase
        .from("cities")
        .select("id")
        .eq(
          "id",
          input.cityId
        )
        .maybeSingle();

    if (error) {
      throw new Error(
        `Не удалось проверить город: ${error.message}`
      );
    }

    if (data?.id) {
      return data.id;
    }
  }

  throw new Error(
    `Город «${
      input.cityNameRu ||
      input.cityName ||
      input.cityId
    }» не найден в таблице cities.`
  );
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
  } = await supabase.storage
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
   * Получаем настоящий DB id города.
   */

  const [
    lng,
    lat,
  ] = input.coordinates;

  /*
   * Создаём объявление как draft/inactive.
   */
  const created =
    await createListing({
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
    } as any);

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
     * в том же порядке.
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
     * удаляем уже загруженные файлы
     * и сам listing.
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