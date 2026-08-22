"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useAuth,
} from "@/lib/auth/AuthProvider";

import {
  loadCities,
  getCityDisplayName,
  type City,
} from "@/lib/cities";

import LocationPicker from "./LocationPicker";

import ListingPhotoPicker, {
  type ListingDraftPhoto,
} from "./ListingPhotoPicker";

export type ListingCreateType =
  | "rental"
  | "commercial"
  | "land"
  | "daily";

interface ListingCreateModalProps {
  open: boolean;
  onClose: () => void;
}

interface ListingTypeOption {
  value: ListingCreateType;
  title: string;
  description: string;
  icon: string;
}

interface ListingForm {
  title: string;
  description: string;
  price: string;
  currency: string;

  propertyType: string;
  rooms: number | null;

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

  coordinates: [
    number,
    number
  ] | null;

  phone: string;
  telegram: string;
  whatsapp: string;
}

const LISTING_TYPES: ListingTypeOption[] =
  [
    {
      value: "rental",
      title: "Аренда",
      description:
        "Квартиры, дома и комнаты",
      icon: "⌂",
    },
    {
      value: "commercial",
      title: "Коммерция",
      description:
        "Офисы, магазины и помещения",
      icon: "▦",
    },
    {
      value: "land",
      title: "Земля",
      description:
        "Участки и земельные объекты",
      icon: "⌁",
    },
    {
      value: "daily",
      title: "Посуточно",
      description:
        "Жильё для краткосрочной аренды",
      icon: "◫",
    },
  ];

const RENTAL_PROPERTY_TYPES = [
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

const COMMERCIAL_PURPOSES = [
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

const LAND_USES = [
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

function createInitialForm(phone = ""): ListingForm {
  return {
    title: "",
    description: "",
    price: "",
    currency: "KGS",

    propertyType:
      "apartment",

    rooms: null,

    area: "",
    floor: "",
    totalFloors: "",

    furnished: false,
    parking: false,
    pets: false,

    purpose: "office",
    landUse:
      "residential",

    ratePerSqm: "",

    cityId: "",
    district: "",
    address: "",

    coordinates: null,

    phone,
    telegram: "",
    whatsapp: "",
  };
}

export default function ListingCreateModal({
  open,
  onClose,
}: ListingCreateModalProps) {
  const {
    user,
    profile,
  } = useAuth();

  const [
    selectedType,
    setSelectedType,
  ] = useState<
    ListingCreateType | null
  >(null);

  const [
    step,
    setStep,
  ] = useState<1 | 2 | 3>(1);

  const [
    form,
    setForm,
  ] = useState<ListingForm>(
    createInitialForm()
  );

  const [
    photos,
    setPhotos,
  ] = useState<ListingDraftPhoto[]>([]);

  const [
    cities,
    setCities,
  ] = useState<City[]>([]);

  const [
    locationPickerOpen,
    setLocationPickerOpen,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setSelectedType(null);
    setStep(1);
    setForm(
      createInitialForm(
        profile?.contact_phone ?? ""
      )
    );
    setPhotos([]);
    setError(null);

    const previousOverflow =
      document.body.style
        .overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [open, profile?.contact_phone]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    loadCities()
      .then((loaded) => {
        if (!cancelled) {
          setCities(loaded);
        }
      })
      .catch((error) => {
        console.error(
          "[ListingCreateModal] Cities load failed:",
          error
        );
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  const selectedCity =
    useMemo(
      () =>
        cities.find(
          (city) =>
            city.id ===
            form.cityId
        ) ?? null,
      [cities, form.cityId]
    );

  const selectedOption =
    useMemo(
      () =>
        LISTING_TYPES.find(
          (item) =>
            item.value ===
            selectedType
        ) ?? null,
      [selectedType]
    );

  if (!open) {
    return null;
  }

  if (!user) {
    return null;
  }

  const updateForm = <
    K extends keyof ListingForm
  >(
    key: K,
    value: ListingForm[K]
  ) => {
    setForm(
      (previous) => ({
        ...previous,
        [key]: value,
      })
    );

    setError(null);
  };

  const handleContinue =
    () => {
      if (!selectedType) {
        setError(
          "Выберите тип объявления."
        );

        return;
      }

      setError(null);

      setStep(2);
    };

  const handleBack = () => {
    setError(null);

    if (step === 3) {
      setStep(2);
      return;
    }

    if (step === 2) {
      setStep(1);
      return;
    }

    onClose();
  };

  const handleSaveStepTwo =
    () => {
      const title =
        form.title.trim();

      const price =
        Number(
          form.price
            .replace(/\s/g, "")
            .replace(
              ",",
              "."
            )
        );

      if (!title) {
        setError(
          "Введите заголовок объявления."
        );
        return;
      }

      if (title.length < 8) {
        setError(
          "Заголовок должен содержать минимум 8 символов."
        );
        return;
      }

      if (
        !Number.isFinite(price) ||
        price <= 0
      ) {
        setError(
          "Укажите корректную цену."
        );
        return;
      }

      if (
        selectedType ===
          "rental" ||
        selectedType ===
          "daily"
      ) {
        if (
          !form.propertyType
        ) {
          setError(
            "Выберите тип жилья."
          );
          return;
        }

        if (
          !form.rooms ||
          form.rooms < 1
        ) {
          setError(
            "Укажите количество комнат."
          );
          return;
        }

        const area =
          Number(
            form.area
              .replace(
                /\s/g,
                ""
              )
              .replace(
                ",",
                "."
              )
          );

        if (
          !Number.isFinite(area) ||
          area <= 0
        ) {
          setError(
            "Укажите площадь."
          );
          return;
        }
      }

      if (
        selectedType ===
        "commercial"
      ) {
        const area =
          Number(
            form.area
              .replace(
                /\s/g,
                ""
              )
              .replace(
                ",",
                "."
              )
          );

        if (
          !Number.isFinite(area) ||
          area <= 0
        ) {
          setError(
            "Укажите площадь помещения."
          );
          return;
        }

        if (!form.purpose) {
          setError(
            "Выберите назначение помещения."
          );
          return;
        }
      }

      if (
        selectedType ===
        "land"
      ) {
        const area =
          Number(
            form.area
              .replace(
                /\s/g,
                ""
              )
              .replace(
                ",",
                "."
              )
          );

        if (
          !Number.isFinite(area) ||
          area <= 0
        ) {
          setError(
            "Укажите площадь участка."
          );
          return;
        }

        if (!form.landUse) {
          setError(
            "Выберите назначение земли."
          );
          return;
        }
      }

      setError(null);

      console.log(
        "[ListingCreateModal] Step 2:",
        {
          selectedType,
          form,
        }
      );

      setStep(3);
    };

  const handleContinueFromStepTwo =
    () => {
      // Reuse the existing Step 2 validation.
      handleSaveStepTwo();
    };

  const handleConfirmLocation =
    (result: {
      coordinates: [
        number,
        number
      ];
      address: string;
      district: string;
    }) => {
      setForm(
        (previous) => ({
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

      setError(null);

      setLocationPickerOpen(
        false
      );
    };

  const handlePreview =
    () => {
      if (!form.cityId) {
        setError(
          "Выберите город."
        );
        return;
      }

      if (!form.address.trim()) {
        setError(
          "Укажите адрес объекта."
        );
        return;
      }

      if (!form.coordinates) {
        setError(
          "Укажите точку объекта на карте."
        );
        return;
      }

      if (photos.length === 0) {
        setError(
          "Добавьте хотя бы одну фотографию."
        );
        return;
      }

      if (!form.phone.trim()) {
        setError(
          "Укажите телефон для связи."
        );
        return;
      }

      setError(null);

      console.log(
        "[ListingCreateModal] Draft ready:",
        {
          type: selectedType,
          form,
          photos: photos.map((photo) => ({
            id: photo.id,
            name: photo.file.name,
            size: photo.file.size,
          })),
        }
      );
    };

  const locationText =
    form.coordinates
      ? `${form.coordinates[1].toFixed(5)}, ${form.coordinates[0].toFixed(5)}`
      : "Точка не выбрана";

  const stepLabel =
    step === 1
      ? "Шаг 1 из 3"
      : step === 2
        ? "Шаг 2 из 3"
        : "Шаг 3 из 3";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="listing-create-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1200,
        display: "flex",
        alignItems:
          "center",
        justifyContent:
          "center",
        padding: "24px",
      }}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Закрыть"
        onClick={onClose}
        style={{
          position:
            "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          border: 0,
          padding: 0,
          background:
            "rgba(8, 12, 16, 0.62)",
          backdropFilter:
            "blur(16px)",
          WebkitBackdropFilter:
            "blur(16px)",
        }}
      />

      {/* Modal */}
      <div
        onClick={(event) =>
          event.stopPropagation()
        }
        style={{
          position:
            "relative",
          width: "100%",
          maxWidth: "620px",
          maxHeight:
            "calc(100vh - 48px)",
          overflowY: "auto",
          border:
            "1px solid rgba(255,255,255,0.12)",
          borderRadius: "24px",
          background:
            "linear-gradient(180deg, rgba(29,36,46,0.98) 0%, rgba(17,23,31,0.98) 100%)",
          boxShadow:
            "0 30px 100px rgba(0,0,0,0.48), inset 0 1px 0 rgba(255,255,255,0.05)",
          color:
            "#ffffff",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding:
              "28px 30px 22px",
            borderBottom:
              "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              display:
                "flex",
              alignItems:
                "flex-start",
              justifyContent:
                "space-between",
              gap: "16px",
            }}
          >
            <div>
              <div
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  gap: "10px",
                  marginBottom:
                    "9px",
                  fontSize:
                    "11px",
                  fontWeight: 600,
                  color:
                    "#6FC9C2",
                  textTransform:
                    "uppercase",
                  letterSpacing:
                    "0.12em",
                }}
              >
                <span>
                  JayMap
                </span>

                <span
                  style={{
                    width:
                      "3px",
                    height:
                      "3px",
                    borderRadius:
                      "999px",
                    background:
                      "rgba(255,255,255,0.2)",
                  }}
                />

                <span
                  style={{
                    color:
                      "rgba(255,255,255,0.35)",
                  }}
                >
                  Новое объявление
                </span>
              </div>

              <h2
                id="listing-create-title"
                style={{
                  margin: 0,
                  fontSize:
                    "24px",
                  lineHeight:
                    "1.2",
                  fontWeight: 700,
                  letterSpacing:
                    "-0.02em",
                }}
              >
                {step === 1
                  ? "Разместить объявление"
                  : step === 2
                    ? "Данные объекта"
                    : "Локация и контакты"}
              </h2>

              <p
                style={{
                  margin:
                    "10px 0 0",
                  maxWidth:
                    "470px",
                  fontSize:
                    "13px",
                  lineHeight:
                    "1.55",
                  color:
                    "rgba(255,255,255,0.48)",
                }}
              >
                {step === 1
                  ? "Сначала выберите тип объекта. Следующий шаг будет автоматически адаптирован под него."
                  : step === 2
                    ? "Укажите основные характеристики объекта. Следующий шаг — локация и фотографии."
                    : "Укажите расположение, добавьте фотографии и проверьте контакты перед публикацией."}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть"
              style={{
                flexShrink: 0,
                width:
                  "36px",
                height:
                  "36px",
                display:
                  "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                border:
                  "1px solid rgba(255,255,255,0.08)",
                borderRadius:
                  "50%",
                background:
                  "rgba(255,255,255,0.05)",
                color:
                  "rgba(255,255,255,0.65)",
                cursor:
                  "pointer",
                fontSize:
                  "22px",
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>

          {/* Step indicator */}
          <div
            style={{
              display:
                "flex",
              alignItems:
                "center",
              gap: "8px",
              marginTop:
                "22px",
            }}
          >
            <div
              style={{
                width:
                  "34px",
                height:
                  "4px",
                borderRadius:
                  "999px",
                background:
                  "#6FC9C2",
              }}
            />

            <div
              style={{
                width:
                  "34px",
                height:
                  "4px",
                borderRadius:
                  "999px",
                background:
                  step >= 2
                    ? "#6FC9C2"
                    : "rgba(255,255,255,0.08)",
              }}
            />

            <div
              style={{
                width:
                  "34px",
                height:
                  "4px",
                borderRadius:
                  "999px",
                background:
                  "rgba(255,255,255,0.08)",
              }}
            />

            <span
              style={{
                marginLeft:
                  "4px",
                fontSize:
                  "10px",
                color:
                  "rgba(255,255,255,0.3)",
              }}
            >
              {stepLabel}
            </span>
          </div>
        </div>

        {/* =====================================================
            STEP 1
           ===================================================== */}

        {step === 1 && (
          <div
            style={{
              padding:
                "26px 30px 30px",
            }}
          >
            <div
              style={{
                marginBottom:
                  "16px",
                fontSize:
                  "12px",
                fontWeight: 600,
                color:
                  "rgba(255,255,255,0.6)",
              }}
            >
              Тип объявления
            </div>

            <div
              style={{
                display:
                  "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: "10px",
              }}
            >
              {LISTING_TYPES.map(
                (option) => {
                  const active =
                    option.value ===
                    selectedType;

                  return (
                    <button
                      key={
                        option.value
                      }
                      type="button"
                      onClick={() => {
                        setSelectedType(
                          option.value
                        );

                        setError(
                          null
                        );
                      }}
                      style={{
                        position:
                          "relative",
                        minHeight:
                          "118px",
                        padding:
                          "18px",
                        border:
                          active
                            ? "1px solid rgba(111,201,194,0.8)"
                            : "1px solid rgba(255,255,255,0.08)",
                        borderRadius:
                          "16px",
                        background:
                          active
                            ? "rgba(111,201,194,0.10)"
                            : "rgba(255,255,255,0.035)",
                        color:
                          "#ffffff",
                        textAlign:
                          "left",
                        cursor:
                          "pointer",
                        transition:
                          "border-color 120ms ease, background 120ms ease",
                      }}
                    >
                      <span
                        style={{
                          position:
                            "absolute",
                          top:
                            "13px",
                          right:
                            "13px",
                          width:
                            "8px",
                          height:
                            "8px",
                          borderRadius:
                            "50%",
                          background:
                            active
                              ? "#6FC9C2"
                              : "transparent",
                          border:
                            active
                              ? "none"
                              : "1px solid rgba(255,255,255,0.18)",
                        }}
                      />

                      <div
                        style={{
                          width:
                            "34px",
                          height:
                            "34px",
                          display:
                            "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "center",
                          borderRadius:
                            "10px",
                          background:
                            active
                              ? "rgba(111,201,194,0.16)"
                              : "rgba(255,255,255,0.05)",
                          color:
                            active
                              ? "#6FC9C2"
                              : "rgba(255,255,255,0.55)",
                          fontSize:
                            "18px",
                          fontWeight:
                            600,
                        }}
                      >
                        {
                          option.icon
                        }
                      </div>

                      <div
                        style={{
                          marginTop:
                            "13px",
                          fontSize:
                            "14px",
                          fontWeight:
                            650,
                        }}
                      >
                        {
                          option.title
                        }
                      </div>

                      <div
                        style={{
                          marginTop:
                            "5px",
                          fontSize:
                            "11px",
                          lineHeight:
                            "1.45",
                          color:
                            "rgba(255,255,255,0.38)",
                        }}
                      >
                        {
                          option.description
                        }
                      </div>
                    </button>
                  );
                }
              )}
            </div>

            {error && (
              <div
                style={{
                  marginTop:
                    "16px",
                  padding:
                    "11px 12px",
                  border:
                    "1px solid rgba(255,90,90,0.2)",
                  borderRadius:
                    "10px",
                  background:
                    "rgba(255,90,90,0.08)",
                  color:
                    "#ff9d9d",
                  fontSize:
                    "12px",
                }}
              >
                {error}
              </div>
            )}

            <div
              style={{
                display:
                  "flex",
                alignItems:
                  "center",
                justifyContent:
                  "space-between",
                gap:
                  "14px",
                marginTop:
                  "24px",
              }}
            >
              <div
                style={{
                  fontSize:
                    "11px",
                  lineHeight:
                    "1.45",
                  color:
                    "rgba(255,255,255,0.28)",
                }}
              >
                Объявление будет
                опубликовано от
                вашего профиля.
              </div>

              <button
                type="button"
                onClick={
                  handleContinue
                }
                style={{
                  minWidth:
                    "150px",
                  height:
                    "46px",
                  padding:
                    "0 20px",
                  border: 0,
                  borderRadius:
                    "999px",
                  background:
                    selectedType
                      ? "#6FC9C2"
                      : "rgba(255,255,255,0.08)",
                  color:
                    selectedType
                      ? "#0a0f14"
                      : "rgba(255,255,255,0.35)",
                  fontSize:
                    "13px",
                  fontWeight:
                    650,
                  cursor:
                    selectedType
                      ? "pointer"
                      : "not-allowed",
                  transition:
                    "background 120ms ease, color 120ms ease",
                }}
              >
                Продолжить

                <span
                  style={{
                    marginLeft:
                      "7px",
                    fontSize:
                      "15px",
                  }}
                >
                  →
                </span>
              </button>
            </div>
          </div>
        )}

        {/* =====================================================
            STEP 2
           ===================================================== */}

        {step === 2 && (
          <div
            style={{
              padding:
                "24px 30px 30px",
            }}
          >
            {/* Common information */}
            <section
              style={{
                border:
                  "1px solid rgba(255,255,255,0.08)",
                borderRadius:
                  "16px",
                background:
                  "rgba(255,255,255,0.025)",
                padding:
                  "18px",
              }}
            >
              <div
                style={{
                  marginBottom:
                    "16px",
                }}
              >
                <div
                  style={{
                    fontSize:
                      "13px",
                    fontWeight:
                      650,
                    color:
                      "rgba(255,255,255,0.88)",
                  }}
                >
                  Основная информация
                </div>

                <div
                  style={{
                    marginTop:
                      "4px",
                    fontSize:
                      "11px",
                    color:
                      "rgba(255,255,255,0.32)",
                  }}
                >
                  Заполните данные,
                  которые будут
                  видны в карточке
                  объявления.
                </div>
              </div>

              {/* Title */}
              <div
                style={{
                  display:
                    "flex",
                  flexDirection:
                    "column",
                  gap:
                    "8px",
                }}
              >
                <span
                  style={{
                    fontSize:
                      "11px",
                    fontWeight:
                      500,
                    color:
                      "rgba(255,255,255,0.42)",
                    textTransform:
                      "uppercase",
                    letterSpacing:
                      "0.08em",
                  }}
                >
                  Заголовок
                </span>

                <input
                  value={
                    form.title
                  }
                  onChange={(
                    event
                  ) =>
                    updateForm(
                      "title",
                      event.target
                        .value
                    )
                  }
                  placeholder="Например: 2-комнатная квартира в центре"
                  maxLength={
                    120
                  }
                  className="h-11 w-full rounded-[12px] border border-white/10 bg-transparent px-3.5 text-[13px] text-white outline-none placeholder:text-white/25 focus:border-[#6FC9C2]"
                />
              </div>

              {/* Description */}
              <div
                style={{
                  display:
                    "flex",
                  flexDirection:
                    "column",
                  gap:
                    "8px",
                  marginTop:
                    "16px",
                }}
              >
                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                  }}
                >
                  <span
                    style={{
                      fontSize:
                        "11px",
                      fontWeight:
                        500,
                      color:
                        "rgba(255,255,255,0.42)",
                      textTransform:
                        "uppercase",
                      letterSpacing:
                        "0.08em",
                    }}
                  >
                    Описание
                  </span>

                  <span
                    style={{
                      fontSize:
                        "10px",
                      color:
                        "rgba(255,255,255,0.22)",
                    }}
                  >
                    {
                      form.description
                        .length
                    }
                    /1000
                  </span>
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
                      event.target
                        .value
                    )
                  }
                  placeholder="Расскажите об объекте, состоянии, особенностях и инфраструктуре..."
                  maxLength={
                    1000
                  }
                  rows={4}
                  className="w-full resize-none rounded-[12px] border border-white/10 bg-transparent px-3.5 py-3 text-[13px] leading-5 text-white outline-none placeholder:text-white/25 focus:border-[#6FC9C2]"
                />
              </div>

              {/* Price row */}
              <div
                style={{
                  display:
                    "grid",
                  gridTemplateColumns:
                    "1fr 120px",
                  gap:
                    "10px",
                  marginTop:
                    "16px",
                }}
              >
                <div
                  style={{
                    display:
                      "flex",
                    flexDirection:
                      "column",
                    gap:
                      "8px",
                  }}
                >
                  <span
                    style={{
                      fontSize:
                        "11px",
                      fontWeight:
                        500,
                      color:
                        "rgba(255,255,255,0.42)",
                      textTransform:
                        "uppercase",
                      letterSpacing:
                        "0.08em",
                    }}
                  >
                    Цена
                  </span>

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
                    placeholder="40 000"
                    inputMode="numeric"
                    className="h-11 w-full rounded-[12px] border border-white/10 bg-transparent px-3.5 text-[13px] text-white outline-none placeholder:text-white/25 focus:border-[#6FC9C2]"
                  />
                </div>

                <div
                  style={{
                    display:
                      "flex",
                    flexDirection:
                      "column",
                    gap:
                      "8px",
                  }}
                >
                  <span
                    style={{
                      fontSize:
                        "11px",
                      fontWeight:
                        500,
                      color:
                        "rgba(255,255,255,0.42)",
                      textTransform:
                        "uppercase",
                      letterSpacing:
                        "0.08em",
                    }}
                  >
                    Валюта
                  </span>

                  <div
                    style={{
                      display:
                        "grid",
                      gridTemplateColumns:
                        "1fr 1fr",
                      gap:
                        "4px",
                      padding:
                        "4px",
                      minHeight:
                        "44px",
                      borderRadius:
                        "12px",
                      background:
                        "rgba(255,255,255,0.035)",
                    }}
                  >
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
                            style={{
                              border: 0,
                              borderRadius:
                                "9px",
                              background:
                                active
                                  ? "#6FC9C2"
                                  : "transparent",
                              color:
                                active
                                  ? "#0a0f14"
                                  : "rgba(255,255,255,0.48)",
                              fontSize:
                                "11px",
                              fontWeight:
                                650,
                              cursor:
                                "pointer",
                            }}
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

            {/* Rental / daily */}
            {(selectedType ===
              "rental" ||
              selectedType ===
                "daily") && (
              <section
                style={{
                  marginTop:
                    "10px",
                  border:
                    "1px solid rgba(255,255,255,0.08)",
                  borderRadius:
                    "16px",
                  background:
                    "rgba(255,255,255,0.025)",
                  padding:
                    "18px",
                }}
              >
                <div
                  style={{
                    marginBottom:
                      "16px",
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        "13px",
                      fontWeight:
                        650,
                      color:
                        "rgba(255,255,255,0.88)",
                    }}
                  >
                    Характеристики жилья
                  </div>

                  <div
                    style={{
                      marginTop:
                        "4px",
                      fontSize:
                        "11px",
                      color:
                        "rgba(255,255,255,0.32)",
                    }}
                  >
                    Основные параметры
                    квартиры, дома или
                    комнаты.
                  </div>
                </div>

                {/* Property type */}
                <div
                  style={{
                    display:
                      "flex",
                    flexDirection:
                      "column",
                    gap:
                      "8px",
                  }}
                >
                  <span
                    style={{
                      fontSize:
                        "11px",
                      fontWeight:
                        500,
                      color:
                        "rgba(255,255,255,0.42)",
                      textTransform:
                        "uppercase",
                      letterSpacing:
                        "0.08em",
                    }}
                  >
                    Тип жилья
                  </span>

                  <div
                    style={{
                      display:
                        "flex",
                      gap:
                        "4px",
                      padding:
                        "4px",
                      borderRadius:
                        "12px",
                      background:
                        "rgba(255,255,255,0.035)",
                    }}
                  >
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
                            style={{
                              flex:
                                1,
                              minHeight:
                                "36px",
                              border:
                                0,
                              borderRadius:
                                "9px",
                              background:
                                active
                                  ? "#6FC9C2"
                                  : "transparent",
                              color:
                                active
                                  ? "#0a0f14"
                                  : "rgba(255,255,255,0.48)",
                              fontSize:
                                "12px",
                              fontWeight:
                                600,
                              cursor:
                                "pointer",
                            }}
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

                {/* Rooms */}
                <div
                  style={{
                    display:
                      "flex",
                    flexDirection:
                      "column",
                    gap:
                      "8px",
                    marginTop:
                      "16px",
                  }}
                >
                  <span
                    style={{
                      fontSize:
                        "11px",
                      fontWeight:
                        500,
                      color:
                        "rgba(255,255,255,0.42)",
                      textTransform:
                        "uppercase",
                      letterSpacing:
                        "0.08em",
                    }}
                  >
                    Комнаты
                  </span>

                  <div
                    style={{
                      display:
                        "grid",
                      gridTemplateColumns:
                        "repeat(5, 1fr)",
                      gap:
                        "5px",
                      padding:
                        "4px",
                      borderRadius:
                        "12px",
                      background:
                        "rgba(255,255,255,0.035)",
                    }}
                  >
                    {[
                      1,
                      2,
                      3,
                      4,
                      5,
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
                            style={{
                              minHeight:
                                "36px",
                              border:
                                0,
                              borderRadius:
                                "9px",
                              background:
                                active
                                  ? "#6FC9C2"
                                  : "transparent",
                              color:
                                active
                                  ? "#0a0f14"
                                  : "rgba(255,255,255,0.48)",
                              fontSize:
                                "12px",
                              fontWeight:
                                650,
                              cursor:
                                "pointer",
                            }}
                          >
                            {
                              room ===
                              5
                                ? "5+"
                                : room
                            }
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* Area / floor */}
                <div
                  style={{
                    display:
                      "grid",
                    gridTemplateColumns:
                      "1fr 1fr",
                    gap:
                      "10px",
                    marginTop:
                      "16px",
                  }}
                >
                  <div
                    style={{
                      display:
                        "flex",
                      flexDirection:
                        "column",
                      gap:
                        "8px",
                    }}
                  >
                    <span
                      style={{
                        fontSize:
                          "11px",
                        fontWeight:
                          500,
                        color:
                          "rgba(255,255,255,0.42)",
                        textTransform:
                          "uppercase",
                        letterSpacing:
                          "0.08em",
                      }}
                    >
                      Площадь, м²
                    </span>

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
                      placeholder="55"
                      inputMode="decimal"
                      className="h-11 w-full rounded-[12px] border border-white/10 bg-transparent px-3.5 text-[13px] text-white outline-none placeholder:text-white/25 focus:border-[#6FC9C2]"
                    />
                  </div>

                  <div
                    style={{
                      display:
                        "flex",
                      flexDirection:
                        "column",
                      gap:
                        "8px",
                    }}
                  >
                    <span
                      style={{
                        fontSize:
                          "11px",
                        fontWeight:
                          500,
                        color:
                          "rgba(255,255,255,0.42)",
                        textTransform:
                          "uppercase",
                        letterSpacing:
                          "0.08em",
                      }}
                    >
                      Этаж
                    </span>

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
                      placeholder="5"
                      inputMode="numeric"
                      className="h-11 w-full rounded-[12px] border border-white/10 bg-transparent px-3.5 text-[13px] text-white outline-none placeholder:text-white/25 focus:border-[#6FC9C2]"
                    />
                  </div>
                </div>

                {/* Total floors */}
                <div
                  style={{
                    display:
                      "flex",
                    flexDirection:
                      "column",
                    gap:
                      "8px",
                    marginTop:
                      "16px",
                  }}
                >
                  <span
                    style={{
                      fontSize:
                        "11px",
                      fontWeight:
                        500,
                      color:
                        "rgba(255,255,255,0.42)",
                      textTransform:
                        "uppercase",
                      letterSpacing:
                        "0.08em",
                    }}
                  >
                    Этажность дома
                  </span>

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
                    placeholder="9"
                    inputMode="numeric"
                    className="h-11 w-full rounded-[12px] border border-white/10 bg-transparent px-3.5 text-[13px] text-white outline-none placeholder:text-white/25 focus:border-[#6FC9C2]"
                  />
                </div>

                {/* Toggles */}
                <div
                  style={{
                    display:
                      "flex",
                    flexDirection:
                      "column",
                    gap:
                      "2px",
                    marginTop:
                      "16px",
                    padding:
                      "4px",
                    border:
                      "1px solid rgba(255,255,255,0.07)",
                    borderRadius:
                      "12px",
                  }}
                >
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
                      item
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
                          style={{
                            minHeight:
                              "42px",
                            display:
                              "flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "space-between",
                            padding:
                              "0 8px",
                            border:
                              0,
                            borderRadius:
                              "9px",
                            background:
                              active
                                ? "rgba(111,201,194,0.08)"
                                : "transparent",
                            color:
                              active
                                ? "rgba(255,255,255,0.9)"
                                : "rgba(255,255,255,0.58)",
                            cursor:
                              "pointer",
                            textAlign:
                              "left",
                          }}
                        >
                          <span
                            style={{
                              fontSize:
                                "12px",
                              fontWeight:
                                500,
                            }}
                          >
                            {
                              item.label
                            }
                          </span>

                          <span
                            style={{
                              position:
                                "relative",
                              width:
                                "40px",
                              height:
                                "24px",
                              borderRadius:
                                "999px",
                              background:
                                active
                                  ? "#6FC9C2"
                                  : "rgba(255,255,255,0.10)",
                              transition:
                                "background 120ms ease",
                            }}
                          >
                            <span
                              style={{
                                position:
                                  "absolute",
                                top:
                                  "2px",
                                left:
                                  active
                                    ? "18px"
                                    : "2px",
                                width:
                                  "20px",
                                height:
                                  "20px",
                                borderRadius:
                                  "50%",
                                background:
                                  "#ffffff",
                                boxShadow:
                                  "0 2px 6px rgba(0,0,0,0.25)",
                                transition:
                                  "left 120ms ease",
                              }}
                            />
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>
              </section>
            )}

            {/* Commercial */}
            {selectedType ===
              "commercial" && (
              <section
                style={{
                  marginTop:
                    "10px",
                  border:
                    "1px solid rgba(255,255,255,0.08)",
                  borderRadius:
                    "16px",
                  background:
                    "rgba(255,255,255,0.025)",
                  padding:
                    "18px",
                }}
              >
                <div
                  style={{
                    marginBottom:
                      "16px",
                    fontSize:
                      "13px",
                    fontWeight:
                      650,
                    color:
                      "rgba(255,255,255,0.88)",
                  }}
                >
                  Характеристики коммерции
                </div>

                <div
                  style={{
                    fontSize:
                      "11px",
                    fontWeight:
                      500,
                    color:
                      "rgba(255,255,255,0.42)",
                    textTransform:
                      "uppercase",
                    letterSpacing:
                      "0.08em",
                    marginBottom:
                      "8px",
                  }}
                >
                  Назначение
                </div>

                <div
                  style={{
                    display:
                      "flex",
                    flexWrap:
                      "wrap",
                    gap:
                      "5px",
                    padding:
                      "4px",
                    borderRadius:
                      "12px",
                    background:
                      "rgba(255,255,255,0.035)",
                  }}
                >
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
                          style={{
                            flex:
                              "1 1 30%",
                            minHeight:
                              "36px",
                            border:
                              0,
                            borderRadius:
                              "9px",
                            background:
                              active
                                ? "#6FC9C2"
                                : "transparent",
                            color:
                              active
                                ? "#0a0f14"
                                : "rgba(255,255,255,0.48)",
                            fontSize:
                              "11px",
                            fontWeight:
                              600,
                            cursor:
                              "pointer",
                          }}
                        >
                          {
                            option.label
                          }
                        </button>
                      );
                    }
                  )}
                </div>

                <div
                  style={{
                    display:
                      "grid",
                    gridTemplateColumns:
                      "1fr 1fr",
                    gap:
                      "10px",
                    marginTop:
                      "16px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize:
                          "11px",
                        color:
                          "rgba(255,255,255,0.42)",
                        textTransform:
                          "uppercase",
                        letterSpacing:
                          "0.08em",
                        marginBottom:
                          "8px",
                      }}
                    >
                      Площадь, м²
                    </div>

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
                      placeholder="120"
                      inputMode="decimal"
                      className="h-11 w-full rounded-[12px] border border-white/10 bg-transparent px-3.5 text-[13px] text-white outline-none placeholder:text-white/25 focus:border-[#6FC9C2]"
                    />
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize:
                          "11px",
                        color:
                          "rgba(255,255,255,0.42)",
                        textTransform:
                          "uppercase",
                        letterSpacing:
                          "0.08em",
                        marginBottom:
                          "8px",
                      }}
                    >
                      Этаж
                    </div>

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
                      placeholder="1"
                      inputMode="numeric"
                      className="h-11 w-full rounded-[12px] border border-white/10 bg-transparent px-3.5 text-[13px] text-white outline-none placeholder:text-white/25 focus:border-[#6FC9C2]"
                    />
                  </div>
                </div>

                <div
                  style={{
                    marginTop:
                      "16px",
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        "11px",
                      color:
                        "rgba(255,255,255,0.42)",
                      textTransform:
                        "uppercase",
                      letterSpacing:
                        "0.08em",
                      marginBottom:
                        "8px",
                    }}
                  >
                    Цена за м²
                  </div>

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
                    placeholder="500"
                    inputMode="decimal"
                    className="h-11 w-full rounded-[12px] border border-white/10 bg-transparent px-3.5 text-[13px] text-white outline-none placeholder:text-white/25 focus:border-[#6FC9C2]"
                  />
                </div>

                <div
                  style={{
                    marginTop:
                      "12px",
                    padding:
                      "4px",
                    border:
                      "1px solid rgba(255,255,255,0.07)",
                    borderRadius:
                      "12px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      updateForm(
                        "parking",
                        !form.parking
                      )
                    }
                    style={{
                      width:
                        "100%",
                      minHeight:
                        "42px",
                      display:
                        "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "space-between",
                      padding:
                        "0 8px",
                      border:
                        0,
                      borderRadius:
                        "9px",
                      background:
                        form.parking
                          ? "rgba(111,201,194,0.08)"
                          : "transparent",
                      color:
                        "rgba(255,255,255,0.7)",
                      cursor:
                        "pointer",
                    }}
                  >
                    <span
                      style={{
                        fontSize:
                          "12px",
                        fontWeight:
                          500,
                      }}
                    >
                      Парковка
                    </span>

                    <span
                      style={{
                        position:
                          "relative",
                        width:
                          "40px",
                        height:
                          "24px",
                        borderRadius:
                          "999px",
                        background:
                          form.parking
                            ? "#6FC9C2"
                            : "rgba(255,255,255,0.10)",
                      }}
                    >
                      <span
                        style={{
                          position:
                            "absolute",
                          top:
                            "2px",
                          left:
                            form.parking
                              ? "18px"
                              : "2px",
                          width:
                            "20px",
                          height:
                            "20px",
                          borderRadius:
                            "50%",
                          background:
                            "#fff",
                          transition:
                            "left 120ms ease",
                        }}
                      />
                    </span>
                  </button>
                </div>
              </section>
            )}

            {/* Land */}
            {selectedType ===
              "land" && (
              <section
                style={{
                  marginTop:
                    "10px",
                  border:
                    "1px solid rgba(255,255,255,0.08)",
                  borderRadius:
                    "16px",
                  background:
                    "rgba(255,255,255,0.025)",
                  padding:
                    "18px",
                }}
              >
                <div
                  style={{
                    marginBottom:
                      "16px",
                    fontSize:
                      "13px",
                    fontWeight:
                      650,
                    color:
                      "rgba(255,255,255,0.88)",
                  }}
                >
                  Характеристики участка
                </div>

                <div
                  style={{
                    fontSize:
                      "11px",
                    color:
                      "rgba(255,255,255,0.42)",
                    textTransform:
                      "uppercase",
                    letterSpacing:
                      "0.08em",
                    marginBottom:
                      "8px",
                  }}
                >
                  Назначение земли
                </div>

                <div
                  style={{
                    display:
                      "flex",
                    flexWrap:
                      "wrap",
                    gap:
                      "5px",
                    padding:
                      "4px",
                    borderRadius:
                      "12px",
                    background:
                      "rgba(255,255,255,0.035)",
                  }}
                >
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
                          style={{
                            flex:
                              "1 1 40%",
                            minHeight:
                              "36px",
                            border:
                              0,
                            borderRadius:
                              "9px",
                            background:
                              active
                                ? "#6FC9C2"
                                : "transparent",
                            color:
                              active
                                ? "#0a0f14"
                                : "rgba(255,255,255,0.48)",
                            fontSize:
                              "11px",
                            fontWeight:
                              600,
                            cursor:
                              "pointer",
                          }}
                        >
                          {
                            option.label
                          }
                        </button>
                      );
                    }
                  )}
                </div>

                <div
                  style={{
                    marginTop:
                      "16px",
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        "11px",
                      color:
                        "rgba(255,255,255,0.42)",
                      textTransform:
                        "uppercase",
                      letterSpacing:
                        "0.08em",
                      marginBottom:
                        "8px",
                    }}
                  >
                    Площадь, м²
                  </div>

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
                    placeholder="600"
                    inputMode="decimal"
                    className="h-11 w-full rounded-[12px] border border-white/10 bg-transparent px-3.5 text-[13px] text-white outline-none placeholder:text-white/25 focus:border-[#6FC9C2]"
                  />
                </div>
              </section>
            )}

            {error && (
              <div
                style={{
                  marginTop:
                    "14px",
                  padding:
                    "11px 12px",
                  border:
                    "1px solid rgba(255,90,90,0.2)",
                  borderRadius:
                    "10px",
                  background:
                    "rgba(255,90,90,0.08)",
                  color:
                    "#ff9d9d",
                  fontSize:
                    "12px",
                }}
              >
                {error}
              </div>
            )}

            {/* Footer */}
            <div
              style={{
                display:
                  "flex",
                alignItems:
                  "center",
                justifyContent:
                  "space-between",
                gap:
                  "14px",
                marginTop:
                  "24px",
              }}
            >
              <button
                type="button"
                onClick={
                  handleBack
                }
                style={{
                  minWidth:
                    "100px",
                  height:
                    "46px",
                  padding:
                    "0 18px",
                  border:
                    "1px solid rgba(255,255,255,0.08)",
                  borderRadius:
                    "999px",
                  background:
                    "rgba(255,255,255,0.025)",
                  color:
                    "rgba(255,255,255,0.55)",
                  fontSize:
                    "13px",
                  fontWeight:
                    500,
                  cursor:
                    "pointer",
                }}
              >
                ← Назад
              </button>

              <button
                type="button"
                onClick={
                  handleSaveStepTwo
                }
                style={{
                  minWidth:
                    "160px",
                  height:
                    "46px",
                  padding:
                    "0 20px",
                  border: 0,
                  borderRadius:
                    "999px",
                  background:
                    "#6FC9C2",
                  color:
                    "#0a0f14",
                  fontSize:
                    "13px",
                  fontWeight:
                    650,
                  cursor:
                    "pointer",
                }}
              >
                К локации
                <span
                  style={{
                    marginLeft:
                      "7px",
                    fontSize:
                      "15px",
                  }}
                >
                  →
                </span>
              </button>
            </div>

            <div
              style={{
                marginTop:
                  "12px",
                fontSize:
                  "10px",
                lineHeight:
                  "1.4",
                color:
                  "rgba(255,255,255,0.2)",
              }}
            >
              {selectedOption
                ? `Выбрано: ${selectedOption.title}. Локацию и фотографии добавим следующим шагом.`
                : "Заполните данные объекта."}
            </div>
          </div>
        )}

        {/* =====================================================
            STEP 3
           ===================================================== */}

        {step === 3 && (
          <div
            style={{
              padding: "24px 30px 30px",
            }}
          >
            {/* Location */}
            <section
              style={{
                border:
                  "1px solid rgba(255,255,255,0.08)",
                borderRadius: "16px",
                background:
                  "rgba(255,255,255,0.025)",
                padding: "18px",
              }}
            >
              <div
                style={{
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 650,
                    color:
                      "rgba(255,255,255,0.88)",
                  }}
                >
                  Локация
                </div>

                <div
                  style={{
                    marginTop: "4px",
                    fontSize: "11px",
                    color:
                      "rgba(255,255,255,0.32)",
                  }}
                >
                  Точное расположение понадобится для показа объекта на карте.
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                <div>
                  <span
                    style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 500,
                      color:
                        "rgba(255,255,255,0.42)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Город
                  </span>

                  <select
                    value={form.cityId}
                    onChange={(event) => {
                      const cityId =
                        event.target.value;

                      setForm(
                        (previous) => ({
                          ...previous,
                          cityId,

                          // Новый город = старая точка больше не актуальна
                          coordinates: null,

                          // Сбрасываем адрес от предыдущего города
                          address: "",

                          // Сбрасываем район
                          district: "",
                        })
                      );

                      setError(null);
                    }}
                    className="mt-2 h-11 w-full rounded-[12px] border border-white/10 bg-[#1d242e] px-3.5 text-[13px] text-white outline-none focus:border-[#6FC9C2]"
                  >
                    <option
                      value=""
                      className="bg-[#1d242e]"
                    >
                      Выберите город
                    </option>

                    {cities.map((city) => (
                      <option
                        key={city.id}
                        value={city.id}
                        className="bg-[#1d242e]"
                      >
                        {getCityDisplayName(
                          city,
                          "ru"
                        )}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <span
                    style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 500,
                      color:
                        "rgba(255,255,255,0.42)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Район
                  </span>

                  <input
                    value={form.district}
                    onChange={(event) =>
                      updateForm(
                        "district",
                        event.target.value
                      )
                    }
                    placeholder="Например: Центр"
                    className="mt-2 h-11 w-full rounded-[12px] border border-white/10 bg-transparent px-3.5 text-[13px] text-white outline-none placeholder:text-white/25 focus:border-[#6FC9C2]"
                  />
                </div>

                <div>
                  <span
                    style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 500,
                      color:
                        "rgba(255,255,255,0.42)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Адрес
                  </span>

                  <input
                    value={form.address}
                    onChange={(event) =>
                      updateForm(
                        "address",
                        event.target.value
                      )
                    }
                    placeholder="Улица, дом"
                    className="mt-2 h-11 w-full rounded-[12px] border border-white/10 bg-transparent px-3.5 text-[13px] text-white outline-none placeholder:text-white/25 focus:border-[#6FC9C2]"
                  />
                </div>

                <div
                  style={{
                    padding: "4px",
                    border:
                      "1px solid rgba(255,255,255,0.07)",
                    borderRadius: "12px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setLocationPickerOpen(true)
                    }
                    style={{
                      width: "100%",
                      minHeight: "58px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0 12px",
                      border: 0,
                      borderRadius: "9px",
                      background:
                        form.coordinates
                          ? "rgba(111,201,194,0.08)"
                          : "transparent",
                      color: "#fff",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                      >
                        📍 Точка на карте
                      </div>

                      <div
                        style={{
                          marginTop: "4px",
                          fontSize: "10px",
                          color:
                            "rgba(255,255,255,0.3)",
                        }}
                      >
                        {form.coordinates
                          ? `${form.coordinates[1].toFixed(5)}, ${form.coordinates[0].toFixed(5)}`
                          : "Нажмите, чтобы указать объект на карте"}
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: "14px",
                        color: "#6FC9C2",
                      }}
                    >
                      →
                    </span>
                  </button>
                </div>
              </div>
            </section>

            {/* Photos */}
            <section
              style={{
                marginTop: "10px",
                border:
                  "1px solid rgba(255,255,255,0.08)",
                borderRadius: "16px",
                background:
                  "rgba(255,255,255,0.025)",
                padding: "18px",
              }}
            >
              <ListingPhotoPicker
                photos={photos}
                onChange={setPhotos}
              />
            </section>

            {/* Contacts */}
            <section
              style={{
                marginTop: "10px",
                border:
                  "1px solid rgba(255,255,255,0.08)",
                borderRadius: "16px",
                background:
                  "rgba(255,255,255,0.025)",
                padding: "18px",
              }}
            >
              <div
                style={{
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 650,
                    color:
                      "rgba(255,255,255,0.88)",
                  }}
                >
                  Контакты
                </div>

                <div
                  style={{
                    marginTop: "4px",
                    fontSize: "11px",
                    color:
                      "rgba(255,255,255,0.32)",
                  }}
                >
                  Эти контакты будут доступны только авторизованным пользователям.
                </div>
              </div>

              <div
                style={{
                  marginBottom: "14px",
                  padding: "10px 12px",
                  border:
                    "1px solid rgba(111,201,194,0.10)",
                  borderRadius: "10px",
                  background:
                    "rgba(111,201,194,0.04)",
                  color:
                    "rgba(255,255,255,0.38)",
                  fontSize: "10px",
                  lineHeight: "1.5",
                }}
              >
                Телефон автоматически взят из профиля. Его можно изменить для этого объявления.
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                <div>
                  <span
                    style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 500,
                      color:
                        "rgba(255,255,255,0.42)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Телефон
                  </span>

                  <input
                    value={form.phone}
                    onChange={(event) =>
                      updateForm(
                        "phone",
                        event.target.value
                      )
                    }
                    placeholder="+996 ..."
                    inputMode="tel"
                    className="mt-2 h-11 w-full rounded-[12px] border border-white/10 bg-transparent px-3.5 text-[13px] text-white outline-none placeholder:text-white/25 focus:border-[#6FC9C2]"
                  />
                </div>

                <div>
                  <span
                    style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 500,
                      color:
                        "rgba(255,255,255,0.42)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Telegram
                  </span>

                  <input
                    value={form.telegram}
                    onChange={(event) =>
                      updateForm(
                        "telegram",
                        event.target.value
                      )
                    }
                    placeholder="@username"
                    className="mt-2 h-11 w-full rounded-[12px] border border-white/10 bg-transparent px-3.5 text-[13px] text-white outline-none placeholder:text-white/25 focus:border-[#6FC9C2]"
                  />
                </div>

                <div>
                  <span
                    style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 500,
                      color:
                        "rgba(255,255,255,0.42)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    WhatsApp
                  </span>

                  <input
                    value={form.whatsapp}
                    onChange={(event) =>
                      updateForm(
                        "whatsapp",
                        event.target.value
                      )
                    }
                    placeholder="+996 ..."
                    inputMode="tel"
                    className="mt-2 h-11 w-full rounded-[12px] border border-white/10 bg-transparent px-3.5 text-[13px] text-white outline-none placeholder:text-white/25 focus:border-[#6FC9C2]"
                  />
                </div>
              </div>
            </section>

            {error && (
              <div
                style={{
                  marginTop: "14px",
                  padding: "11px 12px",
                  border:
                    "1px solid rgba(255,90,90,0.2)",
                  borderRadius: "10px",
                  background:
                    "rgba(255,90,90,0.08)",
                  color: "#ff9d9d",
                  fontSize: "12px",
                  lineHeight: "1.5",
                }}
              >
                {error}
              </div>
            )}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "14px",
                marginTop: "24px",
              }}
            >
              <button
                type="button"
                onClick={handleBack}
                style={{
                  minWidth: "100px",
                  height: "46px",
                  padding: "0 18px",
                  border:
                    "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "999px",
                  background:
                    "rgba(255,255,255,0.025)",
                  color:
                    "rgba(255,255,255,0.55)",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                ← Назад
              </button>

              <button
                type="button"
                onClick={handlePreview}
                style={{
                  minWidth: "160px",
                  height: "46px",
                  padding: "0 20px",
                  border: 0,
                  borderRadius: "999px",
                  background: "#6FC9C2",
                  color: "#0a0f14",
                  fontSize: "13px",
                  fontWeight: 650,
                  cursor: "pointer",
                }}
              >
                Предпросмотр
                <span
                  style={{
                    marginLeft: "7px",
                    fontSize: "15px",
                  }}
                >
                  →
                </span>
              </button>
            </div>
          </div>
        )}

        <LocationPicker
          open={locationPickerOpen}

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
            setLocationPickerOpen(
              false
            )
          }

          onConfirm={
            handleConfirmLocation
          }
        />

      </div>
    </div>
  );
}