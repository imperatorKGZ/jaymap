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

const sectionClass =
  "rounded-[16px] border border-white/[0.08] bg-white/[0.025] p-[18px]";

function createEmptyForm(): EditForm {
  return {
    title: "",
    description: "",

    price: "",
    currency: "KGS",

    rooms: "",
    area: "",
    floor: "",
    totalFloors: "",

    furnished: false,
    parking: false,
    pets: false,

    purpose: "office",
    landUse: "residential",
    ratePerSqm: "",

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
): number | null {
  const normalized =
    value
      .trim()
      .replace(/\s/g, "")
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
      Number.isFinite(lng) &&
      Number.isFinite(lat)
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
    const pointMatch =
      value.match(
        /POINT\s*\(\s*([-0-9.]+)\s+([-0-9.]+)\s*\)/i
      );

    if (pointMatch) {
      const lng =
        Number(
          pointMatch[1]
        );

      const lat =
        Number(
          pointMatch[2]
        );

      if (
        Number.isFinite(lng) &&
        Number.isFinite(lat)
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
        Number.isFinite(lng) &&
        Number.isFinite(lat)
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

    if (
      Array.isArray(
        object.coordinates
      ) &&
      object.coordinates.length >=
        2
    ) {
      const lng =
        Number(
          object.coordinates[0]
        );

      const lat =
        Number(
          object.coordinates[1]
        );

      if (
        Number.isFinite(lng) &&
        Number.isFinite(lat)
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
      Number.isFinite(lng) &&
      Number.isFinite(lat)
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
): Record<string, unknown> {
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

function getTypeLabel(
  type:
    | ListingEditType
    | null
): string {
  switch (type) {
    case "rental":
      return "Аренда";

    case "commercial":
      return "Коммерция";

    case "land":
      return "Земля";

    case "daily":
      return "Посуточно";

    default:
      return "Объявление";
  }
}

function getPropertyTypeLabel(
  value: string
): string {
  return (
    RENTAL_PROPERTY_TYPES.find(
      (item) =>
        item.value ===
        value
    )?.label ?? ""
  );
}

function getPurposeLabel(
  value: string
): string {
  return (
    COMMERCIAL_PURPOSES.find(
      (item) =>
        item.value ===
        value
    )?.label ?? ""
  );
}

function getLandUseLabel(
  value: string
): string {
  return (
    LAND_USES.find(
      (item) =>
        item.value ===
        value
    )?.label ?? ""
  );
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
  ] = useState<EditPhoto[]>(
    []
  );

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
  ] = useState<string | null>(
    null
  );

  const [
    locationOpen,
    setLocationOpen,
  ] = useState(false);

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  useEffect(() => {
    if (
      !open ||
      !listingId
    ) {
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
        ] =
          await Promise.all([
            getListingById(
              listingId
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
      cancelled = true;
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
        return (
          "Заголовок должен содержать минимум 8 символов."
        );
      }

      if (
        price === null ||
        price <= 0
      ) {
        return (
          "Укажите корректную цену."
        );
      }

      if (
        !form.cityId
      ) {
        return (
          "Выберите город."
        );
      }

      if (
        !form.address.trim()
      ) {
        return (
          "Укажите адрес объекта."
        );
      }

      if (
        !form.coordinates
      ) {
        return (
          "Укажите точку объекта на карте."
        );
      }

      if (
        photos.length ===
        0
      ) {
        return (
          "Добавьте хотя бы одну фотографию."
        );
      }

      if (
        !form.phone.trim()
      ) {
        return (
          "Укажите телефон для связи."
        );
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
          return (
            "Выберите тип жилья."
          );
        }

        const rooms =
          parseNumber(
            form.rooms
          );

        if (
          rooms === null ||
          rooms < 1
        ) {
          return (
            "Укажите количество комнат."
          );
        }

        const area =
          parseNumber(
            form.area
          );

        if (
          area === null ||
          area <= 0
        ) {
          return (
            "Укажите площадь."
          );
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
          return (
            "Укажите площадь помещения."
          );
        }

        if (
          !form.purpose
        ) {
          return (
            "Выберите назначение помещения."
          );
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
          return (
            "Укажите площадь участка."
          );
        }

        if (
          !form.landUse
        ) {
          return (
            "Выберите назначение земли."
          );
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

      setError(
        null
      );

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

          const newPhoto: NewPhoto =
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
              newPhoto,
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

  const handleLocationConfirm =
    (
      result: {
        coordinates:
          [
            number,
            number
          ];

        address: string;

        district: string;
      }
    ) => {
      setForm(
        (
          previous
        ) => ({
          ...previous,

          coordinates:
            result.coordinates,

          address:
            result.address ||
            previous.address,

          district:
            result.district ||
            previous.district,
        })
      );

      setLocationOpen(
        false
      );

      setError(
        null
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

      if (
        !listingId
      ) {
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

  if (
    !open ||
    !listingId
  ) {
    return null;
  }

  const typeLabel =
    getTypeLabel(
      listingType
    );

  const cityLabel =
    selectedCity
      ? getCityDisplayName(
          selectedCity,
          "ru"
        )
      : "Город не выбран";

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/65 p-5 backdrop-blur-[14px]"
        onMouseDown={(
          event
        ) => {
          if (
            event.target ===
            event.currentTarget
          ) {
            onClose();
          }
        }}
      >
        <div
          className="relative flex h-[min(780px,calc(100vh-40px))] w-full max-w-[680px] flex-col overflow-hidden rounded-[24px] border border-white/[0.10] bg-[linear-gradient(180deg,rgba(29,36,46,0.99)_0%,rgba(17,23,31,0.99)_100%)] shadow-[0_30px_100px_rgba(0,0,0,0.55)]"
          onMouseDown={(
            event
          ) =>
            event.stopPropagation()
          }
        >
          {/* HEADER */}
          <div className="shrink-0 border-b border-white/[0.08] px-7 pb-5 pt-6">
            <div className="flex items-start justify-between gap-5">
              <div>
                <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em]">
                  <span className="text-[#6FC9C2]">
                    JayMap
                  </span>

                  <span className="h-[3px] w-[3px] rounded-full bg-white/20" />

                  <span className="text-white/35">
                    Редактирование
                  </span>
                </div>

                <h2 className="text-[24px] font-bold tracking-[-0.025em] text-white">
                  Редактировать объявление
                </h2>

                <p className="mt-2 max-w-[470px] text-[12px] leading-5 text-white/40">
                  Измените данные объекта.
                  Все изменения будут
                  сохранены в вашем
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
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/[0.09] bg-white/[0.04] text-[21px] leading-none text-white/55 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-40"
              >
                ×
              </button>
            </div>

            {/* TYPE / STATUS LINE */}
            <div className="mt-5 flex items-center gap-2">
              <span className="rounded-full border border-[#6FC9C2]/20 bg-[#6FC9C2]/[0.08] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#6FC9C2]">
                {typeLabel}
              </span>

              <span className="text-[10px] text-white/25">
                {cityLabel}
              </span>
            </div>
          </div>

          {/* BODY */}
          <div className="sb-scroll min-h-0 flex-1 overflow-y-auto px-7 py-5">
            {loading ? (
              <div className="space-y-2.5">
                <div className="h-[170px] animate-pulse rounded-[16px] bg-white/[0.04]" />
                <div className="h-[220px] animate-pulse rounded-[16px] bg-white/[0.04]" />
                <div className="h-[220px] animate-pulse rounded-[16px] bg-white/[0.04]" />
              </div>
            ) : (
              <div className="space-y-2.5">
                {/* PHOTOS */}
                <section
                  className={
                    sectionClass
                  }
                >
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <div className="text-[13px] font-semibold text-white/88">
                        Фотографии
                      </div>

                      <div className="mt-1 text-[10px] text-white/30">
                        Первая фотография —
                        обложка.
                      </div>
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
                      className="h-9 rounded-[10px] border border-white/[0.08] bg-white/[0.025] px-3.5 text-[11px] font-medium text-white/60 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
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
                    <div className="mt-4 grid grid-cols-4 gap-2">
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
                              className="group relative aspect-square overflow-hidden rounded-[12px] border border-white/[0.08] bg-white/[0.03]"
                            >
                              <img
                                src={src}
                                alt=""
                                className="h-full w-full object-cover"
                              />

                              {index ===
                                0 && (
                                <span className="absolute left-2 top-2 rounded-full bg-[#6FC9C2] px-2 py-1 text-[8px] font-bold uppercase tracking-[0.05em] text-[#0a0f14]">
                                  Обложка
                                </span>
                              )}

                              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent p-2 pt-7 opacity-0 transition group-hover:opacity-100">
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
                                    className="flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-[11px] text-white/80 disabled:opacity-20"
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
                                    className="flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-[11px] text-white/80 disabled:opacity-20"
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

                              <span className="absolute bottom-2 left-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-[9px] font-semibold text-white/85">
                                {index +
                                  1}
                              </span>
                            </div>
                          );
                        }
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                      className="mt-4 flex min-h-[140px] w-full items-center justify-center rounded-[12px] border border-dashed border-white/[0.10] bg-white/[0.01] text-center transition hover:bg-white/[0.025]"
                    >
                      <div>
                        <div className="text-[12px] font-medium text-white/45">
                          Нет фотографий
                        </div>

                        <div className="mt-1 text-[10px] text-[#6FC9C2]">
                          Добавить фотографии
                        </div>
                      </div>
                    </button>
                  )}

                  <div className="mt-2 text-right text-[9px] text-white/20">
                    {photos.length} / 12
                  </div>
                </section>

                {/* BASIC */}
                <section
                  className={
                    sectionClass
                  }
                >
                  <div>
                    <div className="text-[13px] font-semibold text-white/88">
                      Основная информация
                    </div>

                    <div className="mt-1 text-[10px] text-white/30">
                      Данные, которые будут
                      видны в карточке
                      объявления.
                    </div>
                  </div>

                  <div className="mt-5">
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
                      maxLength={120}
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

                    <div className="mb-2 flex justify-end text-[9px] text-white/20">
                      {
                        form.description
                          .length
                      }
                      /2000
                    </div>

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
                      maxLength={2000}
                      className="w-full resize-none rounded-[12px] border border-white/10 bg-transparent px-3.5 py-3 text-[13px] leading-5 text-white outline-none placeholder:text-white/25 focus:border-[#6FC9C2]"
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-[1fr_120px] gap-2.5">
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

                      <div className="flex h-11 gap-1 rounded-[12px] bg-white/[0.035] p-1">
                        {[
                          "KGS",
                          "USD",
                        ].map(
                          (
                            currency
                          ) => {
                            const active =
                              form.currency ===
                              currency;

                            return (
                              <button
                                key={
                                  currency
                                }
                                type="button"
                                onClick={() =>
                                  updateForm(
                                    "currency",
                                    currency
                                  )
                                }
                                className={[
                                  "flex-1 rounded-[9px] text-[10px] font-semibold transition",
                                  active
                                    ? "bg-[#6FC9C2] text-[#0a0f14]"
                                    : "text-white/40 hover:text-white/70",
                                ].join(
                                  " "
                                )}
                              >
                                {
                                  currency
                                }
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* RESIDENTIAL */}
                {(
                  listingType ===
                    "rental" ||
                  listingType ===
                    "daily"
                ) && (
                  <section
                    className={
                      sectionClass
                    }
                  >
                    <div className="text-[13px] font-semibold text-white/88">
                      Характеристики жилья
                    </div>

                    <div className="mt-1 text-[10px] text-white/30">
                      Основные параметры
                      квартиры, дома или
                      комнаты.
                    </div>

                    <div className="mt-5">
                      <label
                        className={
                          labelClass
                        }
                      >
                        Тип жилья
                      </label>

                      <div className="flex gap-1 rounded-[12px] bg-white/[0.035] p-1">
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
                                  "min-h-[38px] flex-1 rounded-[9px] text-[11px] font-medium transition",
                                  active
                                    ? "bg-[#6FC9C2] text-[#0a0f14]"
                                    : "text-white/45 hover:text-white/70",
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

                      <div className="flex gap-1 rounded-[12px] bg-white/[0.035] p-1">
                        {[
                          "1",
                          "2",
                          "3",
                          "4",
                          "5",
                        ].map(
                          (
                            room
                          ) => {
                            const active =
                              form.rooms ===
                              room;

                            return (
                              <button
                                key={
                                  room
                                }
                                type="button"
                                onClick={() =>
                                  updateForm(
                                    "rooms",
                                    room
                                  )
                                }
                                className={[
                                  "min-h-[38px] flex-1 rounded-[9px] text-[11px] font-medium transition",
                                  active
                                    ? "bg-[#6FC9C2] text-[#0a0f14]"
                                    : "text-white/45 hover:text-white/70",
                                ].join(
                                  " "
                                )}
                              >
                                {room ===
                                "5"
                                  ? "5+"
                                  : room}
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2.5">
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
                        Этажность дома
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

                    <div className="mt-4 overflow-hidden rounded-[12px] border border-white/[0.07]">
                      {[
                        {
                          key:
                            "furnished" as const,
                          label:
                            "С мебелью",
                        },
                        {
                          key:
                            "parking" as const,
                          label:
                            "Парковка",
                        },
                        {
                          key:
                            "pets" as const,
                          label:
                            "Можно с животными",
                        },
                      ].map(
                        (
                          item,
                          index
                        ) => {
                          const active =
                            form[
                              item.key
                            ];

                          return (
                            <button
                              key={
                                item.key
                              }
                              type="button"
                              onClick={() =>
                                updateForm(
                                  item.key,
                                  !active
                                )
                              }
                              className={[
                                "flex min-h-[44px] w-full items-center justify-between px-3 text-left transition",
                                index >
                                0
                                  ? "border-t border-white/[0.06]"
                                  : "",
                                active
                                  ? "bg-[#6FC9C2]/[0.05]"
                                  : "bg-transparent",
                              ].join(
                                " "
                              )}
                            >
                              <span className="text-[12px] font-medium text-white/65">
                                {
                                  item.label
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
                                    "absolute top-1 h-4 w-4 rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.25)] transition-all",
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
                )}

                {/* COMMERCIAL */}
                {listingType ===
                  "commercial" && (
                  <section
                    className={
                      sectionClass
                    }
                  >
                    <div className="text-[13px] font-semibold text-white/88">
                      Характеристики коммерции
                    </div>

                    <div className="mt-5">
                      <label
                        className={
                          labelClass
                        }
                      >
                        Назначение
                      </label>

                      <div className="flex flex-wrap gap-1 rounded-[12px] bg-white/[0.035] p-1">
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
                                  "min-h-[38px] flex-[1_1_30%] rounded-[9px] text-[11px] font-medium transition",
                                  active
                                    ? "bg-[#6FC9C2] text-[#0a0f14]"
                                    : "text-white/45 hover:text-white/70",
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

                    <div className="mt-4 grid grid-cols-2 gap-2.5">
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

                    <div className="mt-4 overflow-hidden rounded-[12px] border border-white/[0.07]">
                      <button
                        type="button"
                        onClick={() =>
                          updateForm(
                            "parking",
                            !form.parking
                          )
                        }
                        className={[
                          "flex min-h-[44px] w-full items-center justify-between px-3 text-left transition",
                          form.parking
                            ? "bg-[#6FC9C2]/[0.05]"
                            : "",
                        ].join(
                          " "
                        )}
                      >
                        <span className="text-[12px] font-medium text-white/65">
                          Парковка
                        </span>

                        <span
                          className={[
                            "relative h-6 w-10 rounded-full transition",
                            form.parking
                              ? "bg-[#6FC9C2]"
                              : "bg-white/10",
                          ].join(
                            " "
                          )}
                        >
                          <span
                            className={[
                              "absolute top-1 h-4 w-4 rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.25)]",
                              form.parking
                                ? "left-5"
                                : "left-1",
                            ].join(
                              " "
                            )}
                          />
                        </span>
                      </button>
                    </div>
                  </section>
                )}

                {/* LAND */}
                {listingType ===
                  "land" && (
                  <section
                    className={
                      sectionClass
                    }
                  >
                    <div className="text-[13px] font-semibold text-white/88">
                      Характеристики участка
                    </div>

                    <div className="mt-1 text-[10px] text-white/30">
                      Основные параметры
                      земельного объекта.
                    </div>

                    <div className="mt-5">
                      <label
                        className={
                          labelClass
                        }
                      >
                        Назначение земли
                      </label>

                      <div className="flex flex-wrap gap-1 rounded-[12px] bg-white/[0.035] p-1">
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
                                  "min-h-[38px] flex-[1_1_45%] rounded-[9px] text-[11px] font-medium transition",
                                  active
                                    ? "bg-[#6FC9C2] text-[#0a0f14]"
                                    : "text-white/45 hover:text-white/70",
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
                        Площадь участка,
                        м²
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
                )}

                {/* LOCATION */}
                <section
                  className={
                    sectionClass
                  }
                >
                  <div>
                    <div className="text-[13px] font-semibold text-white/88">
                      Локация
                    </div>

                    <div className="mt-1 text-[10px] text-white/30">
                      Точное расположение
                      объекта на карте.
                    </div>
                  </div>

                  <div className="mt-5">
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
                      ) => {
                        const cityId =
                          event.target
                            .value;

                        setForm(
                          (
                            previous
                          ) => ({
                            ...previous,
                            cityId,
                            coordinates:
                              null,
                            address:
                              "",
                            district:
                              "",
                          })
                        );

                        setError(
                          null
                        );
                      }}
                      className="h-11 w-full rounded-[12px] border border-white/10 bg-[#1b232d] px-3.5 text-[13px] text-white outline-none focus:border-[#6FC9C2]"
                    >
                      <option
                        value=""
                        className="bg-[#1b232d]"
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
                            className="bg-[#1b232d]"
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
                      placeholder="Например: Центр"
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
                      placeholder="Улица, дом"
                      className={
                        inputClass
                      }
                    />
                  </div>

                  <button
                    type="button"
                    disabled={
                      saving ||
                      !form.cityId
                    }
                    onClick={() =>
                      setLocationOpen(
                        true
                      )
                    }
                    className="mt-4 flex min-h-[70px] w-full items-center justify-between rounded-[14px] border border-white/[0.08] bg-white/[0.018] px-4 text-left transition hover:border-[#6FC9C2]/30 hover:bg-white/[0.03] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <div>
                      <div className="text-[12px] font-semibold text-white/85">
                        📍 Точка на
                        карте
                      </div>

                      <div className="mt-1 text-[10px] text-white/30">
                        {form.coordinates
                          ? `${form.coordinates[1].toFixed(
                              6
                            )}, ${form.coordinates[0].toFixed(
                              6
                            )}`
                          : "Нажмите, чтобы изменить расположение"}
                      </div>
                    </div>

                    <span className="text-[15px] text-[#6FC9C2]">
                      →
                    </span>
                  </button>
                </section>

                {/* CONTACTS */}
                <section
                  className={
                    sectionClass
                  }
                >
                  <div>
                    <div className="text-[13px] font-semibold text-white/88">
                      Контакты
                    </div>

                    <div className="mt-1 text-[10px] text-white/30">
                      Контактные данные
                      объявления.
                    </div>
                  </div>

                  <div className="mt-5">
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
                      placeholder="+996 ..."
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
                      placeholder="@username"
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
                      placeholder="+996 ..."
                      inputMode="tel"
                      className={
                        inputClass
                      }
                    />
                  </div>
                </section>

                {/* ERROR */}
                {error && (
                  <div className="rounded-[12px] border border-red-400/20 bg-red-400/[0.07] px-3.5 py-3 text-[11px] leading-5 text-red-300">
                    {error}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-white/[0.08] px-7 py-4">
            <button
              type="button"
              disabled={
                saving
              }
              onClick={
                onClose
              }
              className="h-11 rounded-full border border-white/[0.08] bg-white/[0.025] px-5 text-[12px] font-medium text-white/55 transition hover:bg-white/[0.05] hover:text-white/80 disabled:opacity-40"
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
              className="h-11 min-w-[150px] rounded-full bg-[#6FC9C2] px-6 text-[12px] font-semibold text-[#0a0f14] transition hover:bg-[#7ad6ce] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/25"
            >
              {saving
                ? "Сохраняем…"
                : "Сохранить изменения →"}
            </button>
          </div>
        </div>
      </div>

      <LocationPicker
        open={
          locationOpen
        }
        cityName={
          selectedCity
            ? getCityDisplayName(
                selectedCity,
                "ru"
              )
            : ""
        }
        cityCoordinates={
          selectedCity?.coordinates ??
          null
        }
        initialPosition={
          form.coordinates
        }
        onClose={() =>
          setLocationOpen(
            false
          )
        }
        onConfirm={
          handleLocationConfirm
        }
      />
    </>,
    document.body
  );
}