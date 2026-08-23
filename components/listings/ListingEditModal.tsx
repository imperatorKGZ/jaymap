"use client";
import {
  createPortal,
} from "react-dom";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  getListingById,
} from "@/lib/supabase/api";

import {
  loadCities,
  getCityDisplayName,
  type City,
} from "@/lib/cities";

import {
  processListingImage,
} from "@/lib/listings/image-processing";

import {
  saveListingEdit,
  type ListingEditInput,
} from "@/lib/listings/editing";

import LocationPicker from "./LocationPicker";

export type ListingEditType =
  | "rental"
  | "commercial"
  | "land"
  | "daily";

interface ListingEditModalProps {
  open: boolean;
  listingId: string | null;
  onClose: () => void;
  onSaved: () => void;
}

interface ExistingPhoto {
  type: "existing";
  id: string;
  url: string;
}

interface NewPhoto {
  type: "new";
  id: string;
  file: File;
  previewUrl: string;
}

type EditPhoto =
  | ExistingPhoto
  | NewPhoto;

interface EditForm {
  title: string;
  description: string;

  price: string;
  currency: string;

  rooms: string;
  area: string;
  floor: string;
  totalFloors: string;

  furnished: boolean;
  parking: boolean;
  pets: boolean;

  purpose: string;
  landUse: string;
  ratePerSqm: string;

  cityId: string;
  district: string;
  address: string;

  coordinates:
    | [number, number]
    | null;

  phone: string;
  telegram: string;
  whatsapp: string;

  propertyType: string;
}

const RENTAL_PROPERTY_TYPES =
  [
    {
      value: "apartment",
      label: "Квартира",
    },
    {
      value: "house",
      label: "Дом",
    },
    {
      value: "room",
      label: "Комната",
    },
  ];

const COMMERCIAL_PURPOSES =
  [
    {
      value: "office",
      label: "Офис",
    },
    {
      value: "retail",
      label: "Магазин",
    },
    {
      value: "warehouse",
      label: "Склад",
    },
    {
      value: "production",
      label: "Производство",
    },
    {
      value: "catering",
      label: "Общепит",
    },
  ];

const LAND_USES =
  [
    {
      value: "residential",
      label: "Жилое",
    },
    {
      value: "agricultural",
      label: "Сельхоз",
    },
    {
      value: "commercial",
      label: "Коммерческое",
    },
    {
      value: "industrial",
      label: "Промышленное",
    },
  ];

const inputClass =
  "h-11 w-full rounded-[12px] border border-white/10 bg-transparent px-3.5 text-[13px] text-white outline-none placeholder:text-white/25 focus:border-[#6FC9C2]";

const labelClass =
  "mb-2 block text-[10px] font-medium uppercase tracking-[0.08em] text-white/40";

function createEmptyForm():
  EditForm {
  return {
    title: "",
    description: "",

    price: "",
    currency: "KGS",

    rooms: "",
    area: "",
    floor: "",
    totalFloors: "",

    furnished:
      false,

    parking:
      false,

    pets:
      false,

    purpose:
      "office",

    landUse:
      "residential",

    ratePerSqm:
      "",

    cityId: "",
    district: "",
    address: "",

    coordinates:
      null,

    phone: "",
    telegram: "",
    whatsapp: "",

    propertyType:
      "apartment",
  };
}

function parseNumber(
  value: string
) {
  const normalized =
    value
      .trim()
      .replace(
        /\s/g,
        ""
      )
      .replace(
        ",",
        "."
      );

  if (!normalized) {
    return null;
  }

  const number =
    Number(
      normalized
    );

  return Number.isFinite(
    number
  )
    ? number
    : null;
}

function parseCoordinates(
  value: unknown
):
  | [number, number]
  | null {
  if (
    Array.isArray(value) &&
    value.length >= 2
  ) {
    const lng =
      Number(
        value[0]
      );

    const lat =
      Number(
        value[1]
      );

    if (
      Number.isFinite(
        lng
      ) &&
      Number.isFinite(
        lat
      )
    ) {
      return [
        lng,
        lat,
      ];
    }
  }

  if (
    typeof value ===
    "string"
  ) {
    const match =
      value.match(
        /POINT\s*\(\s*([-0-9.]+)\s+([-0-9.]+)\s*\)/i
      );

    if (match) {
      const lng =
        Number(
          match[1]
        );

      const lat =
        Number(
          match[2]
        );

      if (
        Number.isFinite(
          lng
        ) &&
        Number.isFinite(
          lat
        )
      ) {
        return [
          lng,
          lat,
        ];
      }
    }

    const numbers =
      value.match(
        /-?\d+(?:\.\d+)?/g
      );

    if (
      numbers &&
      numbers.length >= 2
    ) {
      const lng =
        Number(
          numbers[0]
        );

      const lat =
        Number(
          numbers[1]
        );

      if (
        Number.isFinite(
          lng
        ) &&
        Number.isFinite(
          lat
        )
      ) {
        return [
          lng,
          lat,
        ];
      }
    }
  }

  if (
    value &&
    typeof value ===
      "object"
  ) {
    const object =
      value as Record<
        string,
        unknown
      >;

    const coordinates =
      object.coordinates;

    if (
      Array.isArray(
        coordinates
      ) &&
      coordinates.length >=
        2
    ) {
      const lng =
        Number(
          coordinates[0]
        );

      const lat =
        Number(
          coordinates[1]
        );

      if (
        Number.isFinite(
          lng
        ) &&
        Number.isFinite(
          lat
        )
      ) {
        return [
          lng,
          lat,
        ];
      }
    }

    const lng =
      Number(
        object.lng ??
          object.longitude
      );

    const lat =
      Number(
        object.lat ??
          object.latitude
      );

    if (
      Number.isFinite(
        lng
      ) &&
      Number.isFinite(
        lat
      )
    ) {
      return [
        lng,
        lat,
      ];
    }
  }

  return null;
}

function getParams(
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
    return listing.params as Record<
      string,
      unknown
    >;
  }

  return {};
}

export default function ListingEditModal({
  open,
  listingId,
  onClose,
  onSaved,
}: ListingEditModalProps) {
  const [
    form,
    setForm,
  ] = useState<EditForm>(
    createEmptyForm()
  );

  const [
    listingType,
    setListingType,
  ] =
    useState<ListingEditType | null>(
      null
    );

  const [
    cities,
    setCities,
  ] = useState<City[]>(
    []
  );

  const [
    photos,
    setPhotos,
  ] = useState<
    EditPhoto[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);

  const [
    locationOpen,
    setLocationOpen,
  ] = useState(false);

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  useEffect(() => {
    if (!open || !listingId) {
      return;
    }

    let cancelled =
      false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [
          listing,
          loadedCities,
        ] = await Promise.all([
          getListingById(
            listingId!
          ),
          loadCities(),
        ]);

        if (
          cancelled
        ) {
          return;
        }

        const params =
          getParams(
            listing
          );

        setListingType(
          listing.type as ListingEditType
        );

        setForm({
          title:
            listing.title ??
            "",

          description:
            listing.description ??
            "",

          price:
            listing.price !=
            null
              ? String(
                  listing.price
                )
              : "",

          currency:
            listing.currency ??
            "KGS",

          rooms:
            listing.rooms !=
            null
              ? String(
                  listing.rooms
                )
              : "",

          area:
            listing.area !=
            null
              ? String(
                  listing.area
                )
              : "",

          floor:
            listing.floor !=
            null
              ? String(
                  listing.floor
                )
              : "",

          totalFloors:
            listing.total_floors !=
            null
              ? String(
                  listing.total_floors
                )
              : "",

          furnished:
            Boolean(
              listing.furnished
            ),

          parking:
            Boolean(
              listing.parking
            ),

          pets:
            Boolean(
              listing.pets
            ),

          purpose:
            listing.purpose ??
            "office",

          landUse:
            typeof params.land_use ===
            "string"
              ? params.land_use
              : "residential",

          ratePerSqm:
            params.rate_per_sqm !=
            null
              ? String(
                  params.rate_per_sqm
                )
              : "",

          cityId:
            listing.city_id ??
            "",

          district:
            listing.district ??
            "",

          address:
            listing.address ??
            "",

          coordinates:
            parseCoordinates(
              listing.coordinates
            ),

          phone:
            listing.phone ??
            "",

          telegram:
            listing.telegram ??
            "",

          whatsapp:
            listing.whatsapp ??
            "",

          propertyType:
            typeof params.property_type ===
            "string"
              ? params.property_type
              : "apartment",
        });

        const existingPhotos: ExistingPhoto[] =
          Array.isArray(
            listing.photos
          )
            ? listing.photos.map(
                (
                  url: string
                ) => ({
                  type:
                    "existing",

                  id:
                    crypto.randomUUID(),

                  url,
                })
              )
            : [];

        setPhotos(
          existingPhotos
        );

        setCities(
          loadedCities
        );
      } catch (
        loadError
      ) {
        if (
          cancelled
        ) {
          return;
        }

        console.error(
          "[ListingEditModal] Load failed:",
          loadError
        );

        setError(
          "Не удалось загрузить объявление."
        );
      } finally {
        if (
          !cancelled
        ) {
          setLoading(
            false
          );
        }
      }
    }

    void load();

    return () => {
      cancelled =
        true;
    };
  }, [
    open,
    listingId,
  ]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow =
      document.body.style
        .overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    return () => {
      photos.forEach(
        (
          photo
        ) => {
          if (
            photo.type ===
            "new"
          ) {
            URL.revokeObjectURL(
              photo.previewUrl
            );
          }
        }
      );
    };
  }, [photos]);

  const selectedCity =
    useMemo(
      () =>
        cities.find(
          (
            city
          ) =>
            city.id ===
            form.cityId
        ) ??
        null,
      [
        cities,
        form.cityId,
      ]
    );

  if (
    !open ||
    !listingId
  ) {
    return null;
  }

  const updateForm = <
    K extends keyof EditForm
  >(
    key: K,
    value: EditForm[K]
  ) => {
    setForm(
      (
        previous
      ) => ({
        ...previous,
        [key]:
          value,
      })
    );

    setError(
      null
    );
  };

  const validate =
    () => {
      const title =
        form.title.trim();

      const price =
        parseNumber(
          form.price
        );

      if (
        title.length <
        8
      ) {
        return "Заголовок должен содержать минимум 8 символов.";
      }

      if (
        price === null ||
        price <= 0
      ) {
        return "Укажите корректную цену.";
      }

      if (
        !form.cityId
      ) {
        return "Выберите город.";
      }

      if (
        !form.address.trim()
      ) {
        return "Укажите адрес объекта.";
      }

      if (
        !form.coordinates
      ) {
        return "Укажите точку объекта на карте.";
      }

      if (
        photos.length ===
        0
      ) {
        return "Добавьте хотя бы одну фотографию.";
      }

      if (
        !form.phone.trim()
      ) {
        return "Укажите телефон для связи.";
      }

      if (
        listingType ===
          "rental" ||
        listingType ===
          "daily"
      ) {
        if (
          !form.propertyType
        ) {
          return "Выберите тип жилья.";
        }

        const rooms =
          parseNumber(
            form.rooms
          );

        if (
          rooms === null ||
          rooms < 1
        ) {
          return "Укажите количество комнат.";
        }

        const area =
          parseNumber(
            form.area
          );

        if (
          area === null ||
          area <= 0
        ) {
          return "Укажите площадь.";
        }
      }

      if (
        listingType ===
        "commercial"
      ) {
        const area =
          parseNumber(
            form.area
          );

        if (
          area === null ||
          area <= 0
        ) {
          return "Укажите площадь помещения.";
        }

        if (
          !form.purpose
        ) {
          return "Выберите назначение помещения.";
        }
      }

      if (
        listingType ===
        "land"
      ) {
        const area =
          parseNumber(
            form.area
          );

        if (
          area === null ||
          area <= 0
        ) {
          return "Укажите площадь участка.";
        }

        if (
          !form.landUse
        ) {
          return "Выберите назначение земли.";
        }
      }

      return null;
    };

  const handleAddPhotos =
    async (
      files: File[]
    ) => {
      const remaining =
        12 -
        photos.length;

      if (
        remaining <= 0
      ) {
        setError(
          "Можно добавить максимум 12 фотографий."
        );

        return;
      }

      setError(null);

      for (
        const file of files.slice(
          0,
          remaining
        )
      ) {
        try {
          const processed =
            await processListingImage(
              file
            );

          const nextPhoto: NewPhoto =
            {
              type:
                "new",

              id:
                crypto.randomUUID(),

              file:
                processed,

              previewUrl:
                URL.createObjectURL(
                  processed
                ),
            };

          setPhotos(
            (
              previous
            ) => [
              ...previous,
              nextPhoto,
            ]
          );
        } catch (
          photoError
        ) {
          console.error(
            "[ListingEditModal] Photo processing failed:",
            photoError
          );

          setError(
            `Не удалось обработать фото «${file.name}».`
          );
        }
      }
    };

  const handleRemovePhoto =
    (
      photo: EditPhoto
    ) => {
      if (
        photo.type ===
        "new"
      ) {
        URL.revokeObjectURL(
          photo.previewUrl
        );
      }

      setPhotos(
        (
          previous
        ) =>
          previous.filter(
            (
              item
            ) =>
              item.id !==
              photo.id
          )
      );
    };

  const handleMovePhoto =
    (
      index: number,
      direction:
        | "left"
        | "right"
    ) => {
      const nextIndex =
        direction ===
        "left"
          ? index - 1
          : index + 1;

      if (
        nextIndex <
          0 ||
        nextIndex >=
          photos.length
      ) {
        return;
      }

      setPhotos(
        (
          previous
        ) => {
          const next =
            [
              ...previous,
            ];

          [
            next[index],
            next[nextIndex],
          ] = [
            next[nextIndex],
            next[index],
          ];

          return next;
        }
      );
    };

  const handleSave =
    async () => {
      const validation =
        validate();

      if (
        validation
      ) {
        setError(
          validation
        );

        return;
      }

      if (!listingId) {
        return;
      }

      setSaving(
        true
      );

      setError(
        null
      );

      try {
        const input: ListingEditInput =
          {
            title:
              form.title.trim(),

            description:
              form.description.trim(),

            price:
              parseNumber(
                form.price
              )!,

            currency:
              form.currency,

            rooms:
              parseNumber(
                form.rooms
              ),

            area:
              parseNumber(
                form.area
              ),

            floor:
              parseNumber(
                form.floor
              ),

            totalFloors:
              parseNumber(
                form.totalFloors
              ),

            furnished:
              form.furnished,

            parking:
              form.parking,

            pets:
              form.pets,

            purpose:
              form.purpose.trim() ||
              null,

            cityId:
              form.cityId ||
              null,

            district:
              form.district.trim() ||
              null,

            address:
              form.address.trim() ||
              null,

            coordinates:
              form.coordinates,

            phone:
              form.phone.trim() ||
              null,

            telegram:
              form.telegram.trim() ||
              null,

            whatsapp:
              form.whatsapp.trim() ||
              null,

            propertyType:
              form.propertyType ||
              null,

            landUse:
              form.landUse ||
              null,

            ratePerSqm:
              parseNumber(
                form.ratePerSqm
              ),

            photos:
              photos.map(
                (
                  photo
                ) =>
                  photo.type ===
                  "existing"
                    ? {
                        type:
                          "existing",

                        url:
                          photo.url,
                      }
                    : {
                        type:
                          "new",

                        file:
                          photo.file,
                      }
              ),
          };

        await saveListingEdit(
          listingId,
          input
        );

        onSaved();
        onClose();
      } catch (
        saveError
      ) {
        console.error(
          "[ListingEditModal] Save failed:",
          saveError
        );

        setError(
          saveError instanceof
            Error
            ? saveError.message
            : "Не удалось сохранить изменения."
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-black/65 p-6 backdrop-blur-md"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative flex max-h-[calc(100vh-32px)] w-full max-w-[680px] flex-col overflow-hidden rounded-[24px] border border-white/[0.10] bg-[#111820] shadow-[0_30px_100px_rgba(0,0,0,0.55)]">
        {/* HEADER */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.08] px-6 py-5">
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6FC9C2]">
              JayMap
            </p>

            <h2 className="text-[21px] font-semibold tracking-[-0.02em] text-white">
              Редактировать
              объявление
            </h2>

            <p className="mt-1 text-[11px] text-white/30">
              Изменения
              сохранятся в
              вашем
              объявлении.
            </p>
          </div>

          <button
            type="button"
            disabled={
              saving
            }
            onClick={
              onClose
            }
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.035] text-[20px] text-white/50 transition hover:bg-white/[0.07] hover:text-white disabled:opacity-40"
          >
            ×
          </button>
        </div>

        {/* BODY */}
        <div className="sb-scroll min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="space-y-3">
              {[
                1,
                2,
                3,
                4,
                5,
              ].map(
                (
                  item
                ) => (
                  <div
                    key={
                      item
                    }
                    className="h-12 animate-pulse rounded-xl bg-white/[0.04]"
                  />
                )
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* PHOTOS */}
              <section className="rounded-2xl border border-white/[0.08] bg-white/[0.018] p-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[13px] font-semibold text-white/85">
                      Фотографии
                    </p>

                    <p className="mt-1 text-[10px] text-white/25">
                      Первая
                      фотография —
                      обложка.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={
                      saving ||
                      photos.length >=
                        12
                    }
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    className="rounded-lg border border-white/[0.08] px-3 py-2 text-[10px] font-medium text-white/55 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    + Добавить
                  </button>

                  <input
                    ref={
                      fileInputRef
                    }
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    hidden
                    onChange={(
                      event
                    ) => {
                      const files =
                        Array.from(
                          event.target.files ??
                            []
                        );

                      event.target.value =
                        "";

                      void handleAddPhotos(
                        files
                      );
                    }}
                  />
                </div>

                {photos.length >
                0 ? (
                  <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {photos.map(
                      (
                        photo,
                        index
                      ) => {
                        const src =
                          photo.type ===
                          "existing"
                            ? photo.url
                            : photo.previewUrl;

                        return (
                          <div
                            key={
                              photo.id
                            }
                            className="group relative aspect-square overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03]"
                          >
                            <img
                              src={
                                src
                              }
                              alt=""
                              className="h-full w-full object-cover"
                            />

                            {index ===
                              0 && (
                              <span className="absolute left-2 top-2 rounded-full bg-[#6FC9C2] px-2 py-1 text-[8px] font-bold uppercase tracking-[0.05em] text-[#0a0f14]">
                                Обложка
                              </span>
                            )}

                            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent p-2 pt-8 opacity-0 transition group-hover:opacity-100">
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  disabled={
                                    index ===
                                      0 ||
                                    saving
                                  }
                                  onClick={() =>
                                    handleMovePhoto(
                                      index,
                                      "left"
                                    )
                                  }
                                  className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-[11px] text-white/80 disabled:opacity-20"
                                >
                                  ←
                                </button>

                                <button
                                  type="button"
                                  disabled={
                                    index ===
                                      photos.length -
                                        1 ||
                                    saving
                                  }
                                  onClick={() =>
                                    handleMovePhoto(
                                      index,
                                      "right"
                                    )
                                  }
                                  className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-[11px] text-white/80 disabled:opacity-20"
                                >
                                  →
                                </button>
                              </div>

                              <button
                                type="button"
                                disabled={
                                  saving
                                }
                                onClick={() =>
                                  handleRemovePhoto(
                                    photo
                                  )
                                }
                                className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500/70 text-[12px] text-white disabled:opacity-30"
                              >
                                ×
                              </button>
                            </div>

                            <span className="absolute bottom-2 left-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-[9px] font-semibold text-white/80">
                              {index +
                                1}
                            </span>
                          </div>
                        );
                      }
                    )}
                  </div>
                ) : (
                  <div className="mt-4 flex min-h-[150px] items-center justify-center rounded-xl border border-dashed border-white/[0.10] text-center">
                    <div>
                      <p className="text-[12px] font-medium text-white/45">
                        Нет фотографий
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          fileInputRef.current?.click()
                        }
                        className="mt-2 text-[11px] font-medium text-[#6FC9C2]"
                      >
                        Добавить
                      </button>
                    </div>
                  </div>
                )}
              </section>

              {/* BASIC */}
              <section className="rounded-2xl border border-white/[0.08] bg-white/[0.018] p-4">
                <p className="text-[13px] font-semibold text-white/85">
                  Основная
                  информация
                </p>

                <div className="mt-4">
                  <label
                    className={
                      labelClass
                    }
                  >
                    Заголовок
                  </label>

                  <input
                    value={
                      form.title
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        "title",
                        event.target.value
                      )
                    }
                    maxLength={
                      120
                    }
                    className={
                      inputClass
                    }
                  />
                </div>

                <div className="mt-4">
                  <label
                    className={
                      labelClass
                    }
                  >
                    Описание
                  </label>

                  <textarea
                    value={
                      form.description
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        "description",
                        event.target.value
                      )
                    }
                    rows={5}
                    maxLength={
                      2000
                    }
                    className="w-full resize-none rounded-[12px] border border-white/10 bg-transparent px-3.5 py-3 text-[13px] leading-5 text-white outline-none placeholder:text-white/25 focus:border-[#6FC9C2]"
                  />
                </div>

                <div className="mt-4 grid grid-cols-[1fr_120px] gap-3">
                  <div>
                    <label
                      className={
                        labelClass
                      }
                    >
                      Цена
                    </label>

                    <input
                      value={
                        form.price
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          "price",
                          event.target.value.replace(
                            /[^\d\s.,]/g,
                            ""
                          )
                        )
                      }
                      inputMode="decimal"
                      className={
                        inputClass
                      }
                    />
                  </div>

                  <div>
                    <label
                      className={
                        labelClass
                      }
                    >
                      Валюта
                    </label>

                    <select
                      value={
                        form.currency
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          "currency",
                          event.target.value
                        )
                      }
                      className="h-11 w-full rounded-[12px] border border-white/10 bg-[#18212a] px-3 text-[12px] text-white outline-none focus:border-[#6FC9C2]"
                    >
                      <option
                        value="KGS"
                        className="bg-[#18212a]"
                      >
                        KGS
                      </option>

                      <option
                        value="USD"
                        className="bg-[#18212a]"
                      >
                        USD
                      </option>

                      <option
                        value="EUR"
                        className="bg-[#18212a]"
                      >
                        EUR
                      </option>
                    </select>
                  </div>
                </div>
              </section>

              {/* TYPE-SPECIFIC */}
              {listingType ===
                "rental" ||
              listingType ===
                "daily" ? (
                <section className="rounded-2xl border border-white/[0.08] bg-white/[0.018] p-4">
                  <p className="text-[13px] font-semibold text-white/85">
                    Характеристики
                  </p>

                  <div className="mt-4">
                    <label
                      className={
                        labelClass
                      }
                    >
                      Тип жилья
                    </label>

                    <div className="grid grid-cols-3 gap-1 rounded-xl bg-white/[0.035] p-1">
                      {RENTAL_PROPERTY_TYPES.map(
                        (
                          option
                        ) => {
                          const active =
                            form.propertyType ===
                            option.value;

                          return (
                            <button
                              key={
                                option.value
                              }
                              type="button"
                              onClick={() =>
                                updateForm(
                                  "propertyType",
                                  option.value
                                )
                              }
                              className={[
                                "min-h-[36px] rounded-lg text-[11px] font-semibold transition",
                                active
                                  ? "bg-[#6FC9C2] text-[#0a0f14]"
                                  : "text-white/45 hover:bg-white/[0.04] hover:text-white",
                              ].join(
                                " "
                              )}
                            >
                              {
                                option.label
                              }
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <label
                      className={
                        labelClass
                      }
                    >
                      Комнаты
                    </label>

                    <div className="grid grid-cols-5 gap-1 rounded-xl bg-white/[0.035] p-1">
                      {[1, 2, 3, 4, 5].map(
                        (
                          room
                        ) => {
                          const active =
                            form.rooms ===
                            String(
                              room
                            );

                          return (
                            <button
                              key={
                                room
                              }
                              type="button"
                              onClick={() =>
                                updateForm(
                                  "rooms",
                                  String(
                                    room
                                  )
                                )
                              }
                              className={[
                                "min-h-[36px] rounded-lg text-[11px] font-semibold transition",
                                active
                                  ? "bg-[#6FC9C2] text-[#0a0f14]"
                                  : "text-white/45 hover:bg-white/[0.04] hover:text-white",
                              ].join(
                                " "
                              )}
                            >
                              {room ===
                              5
                                ? "5+"
                                : room}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <label
                        className={
                          labelClass
                        }
                      >
                        Площадь, м²
                      </label>

                      <input
                        value={
                          form.area
                        }
                        onChange={(
                          event
                        ) =>
                          updateForm(
                            "area",
                            event.target.value.replace(
                              /[^\d\s.,]/g,
                              ""
                            )
                          )
                        }
                        inputMode="decimal"
                        className={
                          inputClass
                        }
                      />
                    </div>

                    <div>
                      <label
                        className={
                          labelClass
                        }
                      >
                        Этаж
                      </label>

                      <input
                        value={
                          form.floor
                        }
                        onChange={(
                          event
                        ) =>
                          updateForm(
                            "floor",
                            event.target.value.replace(
                              /\D/g,
                              ""
                            )
                          )
                        }
                        inputMode="numeric"
                        className={
                          inputClass
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label
                      className={
                        labelClass
                      }
                    >
                      Всего этажей
                    </label>

                    <input
                      value={
                        form.totalFloors
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          "totalFloors",
                          event.target.value.replace(
                            /\D/g,
                            ""
                          )
                        )
                      }
                      inputMode="numeric"
                      className={
                        inputClass
                      }
                    />
                  </div>

                  <div className="mt-4 space-y-1 rounded-xl border border-white/[0.07] p-1">
                    {[
                      [
                        "furnished",
                        "С мебелью",
                      ],
                      [
                        "parking",
                        "Парковка",
                      ],
                      [
                        "pets",
                        "Можно с животными",
                      ],
                    ].map(
                      ([
                        key,
                        label,
                      ]) => {
                        const active =
                          Boolean(
                            form[
                              key as keyof EditForm
                            ]
                          );

                        return (
                          <button
                            key={
                              key
                            }
                            type="button"
                            onClick={() =>
                              updateForm(
                                key as keyof EditForm,
                                !active as never
                              )
                            }
                            className="flex min-h-[40px] w-full items-center justify-between rounded-lg px-2 text-left text-[11px] text-white/60 transition hover:bg-white/[0.035] hover:text-white"
                          >
                            <span>
                              {
                                label
                              }
                            </span>

                            <span
                              className={[
                                "relative h-6 w-10 rounded-full transition",
                                active
                                  ? "bg-[#6FC9C2]"
                                  : "bg-white/10",
                              ].join(
                                " "
                              )}
                            >
                              <span
                                className={[
                                  "absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition",
                                  active
                                    ? "left-5"
                                    : "left-1",
                                ].join(
                                  " "
                                )}
                              />
                            </span>
                          </button>
                        );
                      }
                    )}
                  </div>
                </section>
              ) : null}

              {listingType ===
                "commercial" ? (
                <section className="rounded-2xl border border-white/[0.08] bg-white/[0.018] p-4">
                  <p className="text-[13px] font-semibold text-white/85">
                    Коммерция
                  </p>

                  <div className="mt-4">
                    <label
                      className={
                        labelClass
                      }
                    >
                      Назначение
                    </label>

                    <div className="grid grid-cols-2 gap-1 rounded-xl bg-white/[0.035] p-1">
                      {COMMERCIAL_PURPOSES.map(
                        (
                          option
                        ) => {
                          const active =
                            form.purpose ===
                            option.value;

                          return (
                            <button
                              key={
                                option.value
                              }
                              type="button"
                              onClick={() =>
                                updateForm(
                                  "purpose",
                                  option.value
                                )
                              }
                              className={[
                                "min-h-[36px] rounded-lg text-[10px] font-semibold transition",
                                active
                                  ? "bg-[#6FC9C2] text-[#0a0f14]"
                                  : "text-white/45 hover:bg-white/[0.04] hover:text-white",
                              ].join(
                                " "
                              )}
                            >
                              {
                                option.label
                              }
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <label
                        className={
                          labelClass
                        }
                      >
                        Площадь, м²
                      </label>

                      <input
                        value={
                          form.area
                        }
                        onChange={(
                          event
                        ) =>
                          updateForm(
                            "area",
                            event.target.value.replace(
                              /[^\d\s.,]/g,
                              ""
                            )
                          )
                        }
                        inputMode="decimal"
                        className={
                          inputClass
                        }
                      />
                    </div>

                    <div>
                      <label
                        className={
                          labelClass
                        }
                      >
                        Этаж
                      </label>

                      <input
                        value={
                          form.floor
                        }
                        onChange={(
                          event
                        ) =>
                          updateForm(
                            "floor",
                            event.target.value.replace(
                              /\D/g,
                              ""
                            )
                          )
                        }
                        inputMode="numeric"
                        className={
                          inputClass
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label
                      className={
                        labelClass
                      }
                    >
                      Цена за м²
                    </label>

                    <input
                      value={
                        form.ratePerSqm
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          "ratePerSqm",
                          event.target.value.replace(
                            /[^\d\s.,]/g,
                            ""
                          )
                        )
                      }
                      inputMode="decimal"
                      className={
                        inputClass
                      }
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      updateForm(
                        "parking",
                        !form.parking
                      )
                    }
                    className="mt-4 flex min-h-[40px] w-full items-center justify-between rounded-xl border border-white/[0.07] px-3 text-[11px] text-white/60 transition hover:bg-white/[0.035] hover:text-white"
                  >
                    <span>
                      Парковка
                    </span>

                    <span
                      className={[
                        "relative h-6 w-10 rounded-full",
                        form.parking
                          ? "bg-[#6FC9C2]"
                          : "bg-white/10",
                      ].join(
                        " "
                      )}
                    >
                      <span
                        className={[
                          "absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition",
                          form.parking
                            ? "left-5"
                            : "left-1",
                        ].join(
                          " "
                        )}
                      />
                    </span>
                  </button>
                </section>
              ) : null}

              {listingType ===
                "land" ? (
                <section className="rounded-2xl border border-white/[0.08] bg-white/[0.018] p-4">
                  <p className="text-[13px] font-semibold text-white/85">
                    Земля
                  </p>

                  <div className="mt-4">
                    <label
                      className={
                        labelClass
                      }
                    >
                      Назначение
                    </label>

                    <div className="grid grid-cols-2 gap-1 rounded-xl bg-white/[0.035] p-1">
                      {LAND_USES.map(
                        (
                          option
                        ) => {
                          const active =
                            form.landUse ===
                            option.value;

                          return (
                            <button
                              key={
                                option.value
                              }
                              type="button"
                              onClick={() =>
                                updateForm(
                                  "landUse",
                                  option.value
                                )
                              }
                              className={[
                                "min-h-[36px] rounded-lg text-[10px] font-semibold transition",
                                active
                                  ? "bg-[#6FC9C2] text-[#0a0f14]"
                                  : "text-white/45 hover:bg-white/[0.04] hover:text-white",
                              ].join(
                                " "
                              )}
                            >
                              {
                                option.label
                              }
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <label
                      className={
                        labelClass
                      }
                    >
                      Площадь, м²
                    </label>

                    <input
                      value={
                        form.area
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          "area",
                          event.target.value.replace(
                            /[^\d\s.,]/g,
                            ""
                          )
                        )
                      }
                      inputMode="decimal"
                      className={
                        inputClass
                      }
                    />
                  </div>
                </section>
              ) : null}

              {/* LOCATION */}
              <section className="rounded-2xl border border-white/[0.08] bg-white/[0.018] p-4">
                <p className="text-[13px] font-semibold text-white/85">
                  Локация
                </p>

                <div className="mt-4">
                  <label
                    className={
                      labelClass
                    }
                  >
                    Город
                  </label>

                  <select
                    value={
                      form.cityId
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        "cityId",
                        event.target.value
                      )
                    }
                    className="h-11 w-full rounded-[12px] border border-white/10 bg-[#18212a] px-3.5 text-[12px] text-white outline-none focus:border-[#6FC9C2]"
                  >
                    <option
                      value=""
                      className="bg-[#18212a]"
                    >
                      Выберите город
                    </option>

                    {cities.map(
                      (
                        city
                      ) => (
                        <option
                          key={
                            city.id
                          }
                          value={
                            city.id
                          }
                          className="bg-[#18212a]"
                        >
                          {getCityDisplayName(
                            city,
                            "ru"
                          )}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="mt-4">
                  <label
                    className={
                      labelClass
                    }
                  >
                    Район
                  </label>

                  <input
                    value={
                      form.district
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        "district",
                        event.target.value
                      )
                    }
                    className={
                      inputClass
                    }
                  />
                </div>

                <div className="mt-4">
                  <label
                    className={
                      labelClass
                    }
                  >
                    Адрес
                  </label>

                  <input
                    value={
                      form.address
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        "address",
                        event.target.value
                      )
                    }
                    className={
                      inputClass
                    }
                  />
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setLocationOpen(
                      true
                    )
                  }
                  className="mt-4 flex min-h-[64px] w-full items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.018] px-3.5 text-left transition hover:bg-white/[0.04]"
                >
                  <div>
                    <p className="text-[11px] font-medium text-white/65">
                      Точка на карте
                    </p>

                    <p className="mt-1 text-[10px] text-white/25">
                      {form.coordinates
                        ? `${form.coordinates[1].toFixed(
                            5
                          )}, ${form.coordinates[0].toFixed(
                            5
                          )}`
                        : "Не выбрана"}
                    </p>
                  </div>

                  <span className="text-[15px] text-[#6FC9C2]">
                    →
                  </span>
                </button>
              </section>

              {/* CONTACTS */}
              <section className="rounded-2xl border border-white/[0.08] bg-white/[0.018] p-4">
                <p className="text-[13px] font-semibold text-white/85">
                  Контакты
                </p>

                <div className="mt-4 space-y-4">
                  <div>
                    <label
                      className={
                        labelClass
                      }
                    >
                      Телефон
                    </label>

                    <input
                      value={
                        form.phone
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          "phone",
                          event.target.value
                        )
                      }
                      inputMode="tel"
                      className={
                        inputClass
                      }
                    />
                  </div>

                  <div>
                    <label
                      className={
                        labelClass
                      }
                    >
                      Telegram
                    </label>

                    <input
                      value={
                        form.telegram
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          "telegram",
                          event.target.value
                        )
                      }
                      className={
                        inputClass
                      }
                    />
                  </div>

                  <div>
                    <label
                      className={
                        labelClass
                      }
                    >
                      WhatsApp
                    </label>

                    <input
                      value={
                        form.whatsapp
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          "whatsapp",
                          event.target.value
                        )
                      }
                      inputMode="tel"
                      className={
                        inputClass
                      }
                    />
                  </div>
                </div>
              </section>

              {error && (
                <div className="rounded-xl border border-red-400/20 bg-red-400/[0.07] px-3 py-2.5 text-[11px] leading-5 text-red-300">
                  {
                    error
                  }
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex shrink-0 gap-2 border-t border-white/[0.08] px-6 py-4">
          <button
            type="button"
            disabled={
              saving
            }
            onClick={
              onClose
            }
            className="min-h-[42px] flex-1 rounded-xl border border-white/[0.08] px-4 text-[11px] font-medium text-white/45 transition hover:bg-white/[0.04] hover:text-white disabled:opacity-40"
          >
            Отмена
          </button>

          <button
            type="button"
            disabled={
              loading ||
              saving
            }
            onClick={
              handleSave
            }
            className="min-h-[42px] flex-1 rounded-xl bg-[#6FC9C2] px-4 text-[11px] font-semibold text-[#0a0f14] transition hover:bg-[#7bd4cc] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Сохранение…"
              : "Сохранить изменения"}
          </button>
        </div>
      </div>

      {locationOpen &&
        selectedCity && (
          <LocationPicker
            open={
              locationOpen
            }
            cityName={getCityDisplayName(
              selectedCity,
              "ru"
            )}
            cityCoordinates={
              selectedCity.coordinates
            }
            initialPosition={
              form.coordinates
            }
            onClose={() =>
              setLocationOpen(
                false
              )
            }
            onConfirm={(
              result
            ) => {
              updateForm(
                "coordinates",
                result.coordinates
              );

              updateForm(
                "address",
                result.address
              );

              updateForm(
                "district",
                result.district
              );

              setLocationOpen(
                false
              );
            }}
          />
        )}
    </div>,
    document.body
  );
}