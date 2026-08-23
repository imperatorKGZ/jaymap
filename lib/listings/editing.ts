"use client";

import {
  supabase,
} from "@/lib/supabase/client";

import {
  getListingById,
  updateListing,
} from "@/lib/supabase/api";

import {
  processListingImage,
} from "@/lib/listings/image-processing";

const PHOTO_BUCKET =
  "listing-photos";

export interface ListingEditInput {
  title: string;

  description: string;

  price: number;

  currency: string;

  rooms: number | null;

  area: number | null;

  floor: number | null;

  totalFloors: number | null;

  furnished: boolean;

  parking: boolean;

  pets: boolean;

  purpose: string | null;

  cityId: string | null;

  district: string | null;

  address: string | null;

  coordinates:
    | [number, number]
    | null;

  phone: string | null;

  telegram: string | null;

  whatsapp: string | null;

  propertyType: string | null;

  landUse: string | null;

  ratePerSqm: number | null;

  photos: Array<{
    type:
      | "existing"
      | "new";

    url?: string;

    file?: File;
  }>;
}

function getPhotoPathFromUrl(
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

  try {
    return decodeURIComponent(
      path
    );
  } catch {
    return path;
  }
}

function buildCoordinatesValue(
  coordinates:
    | [number, number]
    | null
) {
  if (
    !coordinates ||
    coordinates.length !== 2
  ) {
    return null;
  }

  const [
    lng,
    lat,
  ] = coordinates;

  if (
    !Number.isFinite(
      lng
    ) ||
    !Number.isFinite(
      lat
    )
  ) {
    return null;
  }

  return `POINT(${lng} ${lat})`;
}

async function uploadNewPhoto(
  file: File,
  userId: string,
  listingId: string,
  index: number
) {
  const processed =
    await processListingImage(
      file
    );

  const extension =
    processed.type ===
    "image/webp"
      ? "webp"
      : processed.name
          .split(".")
          .pop()
          ?.toLowerCase() ||
        "webp";

  const path =
    `${userId}/${listingId}/edit-${String(
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
        processed,
        {
          cacheControl:
            "31536000",

          upsert:
            false,

          contentType:
            processed.type ||
            "image/webp",
        }
      );

  if (error) {
    throw new Error(
      `Не удалось загрузить фотографию: ${error.message}`
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

async function removeStoragePaths(
  paths: string[]
) {
  if (
    paths.length === 0
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
    throw new Error(
      `Не удалось удалить фотографии: ${error.message}`
    );
  }
}

function getCurrentParams(
  listing: any
) {
  if (
    listing?.params &&
    typeof listing.params ===
      "object" &&
    !Array.isArray(
      listing.params
    )
  ) {
    return listing.params;
  }

  return {};
}

export async function saveListingEdit(
  listingId: string,
  input: ListingEditInput
) {
  const {
    data: {
      user,
    },
  } =
    await supabase.auth.getUser();

  if (!user) {
    throw new Error(
      "Необходимо войти в аккаунт."
    );
  }

  /**
   * Повторно читаем актуальное объявление.
   * Нельзя доверять старому состоянию модалки:
   * пользователь мог открыть/изменить его
   * в другой вкладке.
   */
  const current =
    await getListingById(
      listingId
    );

  if (
    current.user_id &&
    current.user_id !==
      user.id
  ) {
    throw new Error(
      "У вас нет доступа к этому объявлению."
    );
  }

  const oldPhotoUrls =
    Array.isArray(
      current.photos
    )
      ? current.photos
      : [];

  const oldPhotoPaths =
    oldPhotoUrls
      .map(
        (
          url
        ) =>
          getPhotoPathFromUrl(
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

  const keepExistingUrls =
    input.photos
      .filter(
        (
          photo
        ) =>
          photo.type ===
            "existing" &&
          typeof photo.url ===
            "string" &&
          photo.url.length >
            0
      )
      .map(
        (
          photo
        ) =>
          photo.url as string
      );

  const newPhotos =
    input.photos.filter(
      (
        photo
      ) =>
        photo.type ===
          "new" &&
        photo.file instanceof
          File
    );

  const uploadedPaths: string[] =
    [];

  const uploadedUrls: string[] =
    [];

  try {
    /*
     * Загружаем новые фотографии
     * только после того, как прошли owner-check.
     */
    for (
      let index = 0;
      index <
      newPhotos.length;
      index += 1
    ) {
      const photo =
        newPhotos[
          index
        ];

      if (
        !photo.file
      ) {
        continue;
      }

      const uploaded =
        await uploadNewPhoto(
          photo.file,
          user.id,
          listingId,
          index
        );

      uploadedPaths.push(
        uploaded.path
      );

      uploadedUrls.push(
        uploaded.url
      );
    }

    const finalPhotos = [
      ...keepExistingUrls,
      ...uploadedUrls,
    ];

    const existingParam =
      getCurrentParams(
        current
      );

    const nextParams = {
      ...existingParam,

      property_type:
        input.propertyType ||
        null,

      land_use:
        input.landUse ||
        null,

      rate_per_sqm:
        input.ratePerSqm,
    };

    const patch: Record<
      string,
      unknown
    > = {
      title:
        input.title.trim(),

      description:
        input.description.trim() ||
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
        input.purpose?.trim() ||
        null,

      city_id:
        input.cityId ||
        null,

      district:
        input.district?.trim() ||
        null,

      address:
        input.address?.trim() ||
        null,

      phone:
        input.phone?.trim() ||
        null,

      telegram:
        input.telegram?.trim() ||
        null,

      whatsapp:
        input.whatsapp?.trim() ||
        null,

      photos:
        finalPhotos,

      params:
        nextParams,
    };

    const coordinatesValue =
      buildCoordinatesValue(
        input.coordinates
      );

    if (
      coordinatesValue
    ) {
      patch.coordinates =
        coordinatesValue;
    }

    /*
     * Сохраняем БД.
     */
    await updateListing(
      listingId,
      patch as any
    );

    /*
     * Теперь можно удалить старые
     * фотографии, которые пользователь
     * убрал из объявления.
     */
    const finalUrlSet =
      new Set(
        finalPhotos
      );

    const removedPaths =
      oldPhotoUrls
        .filter(
          (
            url
          ) =>
            !finalUrlSet.has(
              url
            )
        )
        .map(
          (
            url
          ) =>
            getPhotoPathFromUrl(
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

    if (
      removedPaths.length >
      0
    ) {
      try {
        await removeStoragePaths(
          removedPaths
        );
      } catch (
        cleanupError
      ) {
        /*
         * БД уже сохранена.
         * Не откатываем объявление.
         *
         * Просто логируем cleanup,
         * чтобы не потерять успешное
         * пользовательское сохранение.
         */
        console.error(
          "[ListingEditing] Old photo cleanup failed:",
          cleanupError
        );
      }
    }

    return {
      id:
        listingId,

      photos:
        finalPhotos,
    };
  } catch (
    error
  ) {
    /*
     * Если БД update не состоялся,
     * новые уже загруженные фото
     * обязательно удаляем.
     */
    try {
      await removeStoragePaths(
        uploadedPaths
      );
    } catch (
      cleanupError
    ) {
      console.error(
        "[ListingEditing] Rollback photo cleanup failed:",
        cleanupError
      );
    }

    throw error;
  }
}