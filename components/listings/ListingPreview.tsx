"use client";

import type {
  ListingDraftPhoto,
} from "./ListingPhotoPicker";

export interface ListingPreviewData {
  type:
    | "rental"
    | "commercial"
    | "land"
    | "daily";

  typeLabel: string;

  title: string;

  description: string;

  price: number;

  currency: string;

  propertyType: string;

  propertyTypeLabel: string;

  rooms: number | null;

  area: string;

  floor: string;

  totalFloors: string;

  furnished: boolean;

  parking: boolean;

  pets: boolean;

  purpose: string;

  purposeLabel: string;

  landUse: string;

  landUseLabel: string;

  ratePerSqm: string;

  cityName: string;

  district: string;

  address: string;

  coordinates:
    | [number, number]
    | null;

  phone: string;

  telegram: string;

  whatsapp: string;

  photos: ListingDraftPhoto[];
}

interface ListingPreviewProps {
  data: ListingPreviewData;

  onBack: () => void;

  onSaveDraft: () => void;

  onPublish: () => void;
}

function formatPrice(
  value: number
): string {
  return new Intl.NumberFormat(
    "ru-RU"
  ).format(value);
}

function getTypeTitle(
  type: ListingPreviewData["type"]
): string {
  switch (type) {
    case "rental":
      return "Аренда";

    case "daily":
      return "Посуточно";

    case "commercial":
      return "Коммерция";

    case "land":
      return "Земля";

    default:
      return "Объект";
  }
}

function getCurrencySymbol(
  currency: string
): string {
  switch (currency) {
    case "USD":
      return "$";

    case "KGS":
      return "сом";

    default:
      return currency;
  }
}

function InfoBadge({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span
      style={{
        display:
          "inline-flex",
        alignItems:
          "center",
        minHeight:
          "30px",
        padding:
          "0 10px",
        border:
          "1px solid rgba(255,255,255,0.08)",
        borderRadius:
          "999px",
        background:
          "rgba(255,255,255,0.035)",
        color:
          "rgba(255,255,255,0.62)",
        fontSize:
          "11px",
        fontWeight:
          500,
      }}
    >
      {children}
    </span>
  );
}

function FeatureRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        display:
          "flex",
        alignItems:
          "center",
        justifyContent:
          "space-between",
        gap:
          "16px",
        minHeight:
          "42px",
        borderBottom:
          "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <span
        style={{
          fontSize:
            "11px",
          color:
            "rgba(255,255,255,0.34)",
        }}
      >
        {label}
      </span>

      <span
        style={{
          fontSize:
            "12px",
          color:
            "rgba(255,255,255,0.76)",
          fontWeight:
            500,
          textAlign:
            "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}

export default function ListingPreview({
  data,
  onBack,
  onSaveDraft,
  onPublish,
}: ListingPreviewProps) {
  const cover =
    data.photos[0] ??
    null;

  const gallery =
    data.photos.slice(
      1
    );

  const priceLabel =
    `${formatPrice(
      data.price
    )} ${getCurrencySymbol(
      data.currency
    )}`;

  const locationLabel =
    [
      data.cityName,
      data.district,
    ]
      .filter(
        Boolean
      )
      .join(
        " · "
      );

  return (
    <div
      style={{
        position:
          "fixed",
        inset:
          0,
        zIndex:
          1300,
        display:
          "flex",
        alignItems:
          "center",
        justifyContent:
          "center",
        padding:
          "24px",
      }}
    >
      <button
        type="button"
        aria-label="Закрыть предпросмотр"
        onClick={
          onBack
        }
        style={{
          position:
            "absolute",
          inset:
            0,
          width:
            "100%",
          height:
            "100%",
          padding:
            0,
          border:
            0,
          background:
            "rgba(8,12,16,0.68)",
          backdropFilter:
            "blur(18px)",
          WebkitBackdropFilter:
            "blur(18px)",
        }}
      />

      <div
        onClick={(event) =>
          event.stopPropagation()
        }
        style={{
          position:
            "relative",
          width:
            "100%",
          maxWidth:
            "760px",
          maxHeight:
            "calc(100vh - 48px)",
          overflowY:
            "auto",
          border:
            "1px solid rgba(255,255,255,0.12)",
          borderRadius:
            "24px",
          background:
            "linear-gradient(180deg, rgba(29,36,46,0.99) 0%, rgba(17,23,31,0.99) 100%)",
          boxShadow:
            "0 30px 100px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)",
          color:
            "#fff",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding:
              "24px 26px 20px",
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
              gap:
                "16px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize:
                    "10px",
                  fontWeight:
                    650,
                  color:
                    "#6FC9C2",
                  textTransform:
                    "uppercase",
                  letterSpacing:
                    "0.12em",
                  marginBottom:
                    "8px",
                }}
              >
                Предпросмотр объявления
              </div>

              <h2
                style={{
                  margin:
                    0,
                  fontSize:
                    "22px",
                  lineHeight:
                    "1.25",
                  fontWeight:
                    700,
                  letterSpacing:
                    "-0.02em",
                }}
              >
                Проверьте объявление
              </h2>

              <p
                style={{
                  margin:
                    "8px 0 0",
                  fontSize:
                    "12px",
                  lineHeight:
                    "1.5",
                  color:
                    "rgba(255,255,255,0.38)",
                }}
              >
                Здесь пока нет публикации.
                Следующий этап —
                сохранение черновика или
                публикация.
              </p>
            </div>

            <button
              type="button"
              onClick={
                onBack
              }
              aria-label="Закрыть"
              style={{
                flexShrink:
                  0,
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
                  "21px",
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          style={{
            padding:
              "22px 26px 26px",
          }}
        >
          {/* Gallery */}
          <div
            style={{
              display:
                "grid",
              gridTemplateColumns:
                gallery.length > 0
                  ? "minmax(0, 1.8fr) minmax(0, 1fr)"
                  : "1fr",
              gap:
                "8px",
            }}
          >
            <div
              style={{
                position:
                  "relative",
                minHeight:
                  "320px",
                overflow:
                  "hidden",
                border:
                  "1px solid rgba(255,255,255,0.08)",
                borderRadius:
                  "18px",
                background:
                  "rgba(255,255,255,0.03)",
              }}
            >
              {cover ? (
                <>
                  <img
                    src={
                      cover.previewUrl
                    }
                    alt={
                      data.title
                    }
                    style={{
                      width:
                        "100%",
                      height:
                        "100%",
                      minHeight:
                        "320px",
                      objectFit:
                        "cover",
                      display:
                        "block",
                    }}
                  />

                  <div
                    style={{
                      position:
                        "absolute",
                      left:
                        "12px",
                      top:
                        "12px",
                      padding:
                        "6px 9px",
                      borderRadius:
                        "999px",
                      background:
                        "rgba(10,15,20,0.78)",
                      backdropFilter:
                        "blur(8px)",
                      color:
                        "#6FC9C2",
                      fontSize:
                        "9px",
                      fontWeight:
                        700,
                      textTransform:
                        "uppercase",
                      letterSpacing:
                        "0.08em",
                    }}
                  >
                    Обложка
                  </div>
                </>
              ) : (
                <div
                  style={{
                    minHeight:
                      "320px",
                    display:
                      "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    color:
                      "rgba(255,255,255,0.25)",
                    fontSize:
                      "12px",
                  }}
                >
                  Нет фотографии
                </div>
              )}
            </div>

            {gallery.length > 0 && (
              <div
                style={{
                  display:
                    "grid",
                  gridTemplateRows:
                    "repeat(2, minmax(0, 1fr))",
                  gap:
                    "8px",
                }}
              >
                {gallery
                  .slice(
                    0,
                    4
                  )
                  .map(
                    (
                      photo
                    ) => (
                      <div
                        key={
                          photo.id
                        }
                        style={{
                          overflow:
                            "hidden",
                          border:
                            "1px solid rgba(255,255,255,0.08)",
                          borderRadius:
                            "14px",
                          background:
                            "rgba(255,255,255,0.03)",
                        }}
                      >
                        <img
                          src={
                            photo.previewUrl
                          }
                          alt=""
                          style={{
                            display:
                              "block",
                            width:
                              "100%",
                            height:
                              "100%",
                            minHeight:
                              "150px",
                            objectFit:
                              "cover",
                          }}
                        />
                      </div>
                    )
                  )}
              </div>
            )}
          </div>

          {/* Main info */}
          <section
            style={{
              marginTop:
                "12px",
              padding:
                "20px",
              border:
                "1px solid rgba(255,255,255,0.08)",
              borderRadius:
                "16px",
              background:
                "rgba(255,255,255,0.025)",
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
                gap:
                  "20px",
              }}
            >
              <div
                style={{
                  minWidth:
                    0,
                }}
              >
                <div
                  style={{
                    fontSize:
                      "10px",
                    fontWeight:
                      650,
                    color:
                      "#6FC9C2",
                    textTransform:
                      "uppercase",
                    letterSpacing:
                      "0.1em",
                  }}
                >
                  {data.typeLabel ||
                    getTypeTitle(
                      data.type
                    )}
                </div>

                <h3
                  style={{
                    margin:
                      "8px 0 0",
                    fontSize:
                      "21px",
                    lineHeight:
                      "1.3",
                    fontWeight:
                      700,
                    letterSpacing:
                      "-0.02em",
                  }}
                >
                  {
                    data.title
                  }
                </h3>

                <div
                  style={{
                    marginTop:
                      "8px",
                    fontSize:
                      "12px",
                    color:
                      "rgba(255,255,255,0.42)",
                  }}
                >
                  {locationLabel ||
                    "Локация не указана"}
                </div>
              </div>

              <div
                style={{
                  flexShrink:
                    0,
                  textAlign:
                    "right",
                }}
              >
                <div
                  style={{
                    fontSize:
                      "18px",
                    lineHeight:
                      "1.2",
                    fontWeight:
                      700,
                    color:
                      "#fff",
                  }}
                >
                  {priceLabel}
                </div>

                {(data.type ===
                    "rental" ||
                  data.type ===
                    "daily") && (
                  <div
                    style={{
                      marginTop:
                        "4px",
                      fontSize:
                        "10px",
                      color:
                        "rgba(255,255,255,0.3)",
                    }}
                  >
                    {data.type ===
                    "daily"
                      ? "за сутки"
                      : "за месяц"}
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                display:
                  "flex",
                flexWrap:
                  "wrap",
                gap:
                  "6px",
                marginTop:
                  "16px",
              }}
            >
              {data.rooms && (
                <InfoBadge>
                  {data.rooms}{" "}
                  {data.rooms === 1
                    ? "комната"
                    : "комнаты"}
                </InfoBadge>
              )}

              {data.area && (
                <InfoBadge>
                  {
                    data.area
                  }{" "}
                  м²
                </InfoBadge>
              )}

              {data.floor && (
                <InfoBadge>
                  этаж{" "}
                  {
                    data.floor
                  }
                  {data.totalFloors
                    ? `/${data.totalFloors}`
                    : ""}
                </InfoBadge>
              )}

              {data.propertyTypeLabel && (
                <InfoBadge>
                  {
                    data.propertyTypeLabel
                  }
                </InfoBadge>
              )}

              {data.purposeLabel && (
                <InfoBadge>
                  {
                    data.purposeLabel
                  }
                </InfoBadge>
              )}

              {data.landUseLabel && (
                <InfoBadge>
                  {
                    data.landUseLabel
                  }
                </InfoBadge>
              )}

              {data.furnished && (
                <InfoBadge>
                  С мебелью
                </InfoBadge>
              )}

              {data.parking && (
                <InfoBadge>
                  Парковка
                </InfoBadge>
              )}

              {data.pets && (
                <InfoBadge>
                  С животными
                </InfoBadge>
              )}
            </div>
          </section>

          {/* Description */}
          <section
            style={{
              marginTop:
                "10px",
              padding:
                "18px 20px",
              border:
                "1px solid rgba(255,255,255,0.08)",
              borderRadius:
                "16px",
              background:
                "rgba(255,255,255,0.025)",
            }}
          >
            <div
              style={{
                marginBottom:
                  "10px",
                fontSize:
                  "13px",
                fontWeight:
                  650,
              }}
            >
              Описание
            </div>

            <div
              style={{
                fontSize:
                  "12px",
                lineHeight:
                  "1.7",
                color:
                  "rgba(255,255,255,0.52)",
                whiteSpace:
                  "pre-wrap",
              }}
            >
              {data.description ||
                "Описание не указано."}
            </div>
          </section>

          {/* Details */}
          <section
            style={{
              marginTop:
                "10px",
              padding:
                "18px 20px",
              border:
                "1px solid rgba(255,255,255,0.08)",
              borderRadius:
                "16px",
              background:
                "rgba(255,255,255,0.025)",
            }}
          >
            <div
              style={{
                marginBottom:
                  "8px",
                fontSize:
                  "13px",
                fontWeight:
                  650,
              }}
            >
              Детали
            </div>

            {(data.ratePerSqm ||
              data.type ===
                "commercial") && (
              <FeatureRow
                label="Цена за м²"
                value={
                  data.ratePerSqm
                    ? `${data.ratePerSqm} ${getCurrencySymbol(
                        data.currency
                      )}`
                    : "—"
                }
              />
            )}

            <FeatureRow
              label="Город"
              value={
                data.cityName ||
                "—"
              }
            />

            <FeatureRow
              label="Район"
              value={
                data.district ||
                "—"
              }
            />

            <FeatureRow
              label="Адрес"
              value={
                data.address ||
                "—"
              }
            />

            <FeatureRow
              label="Координаты"
              value={
                data.coordinates
                  ? `${data.coordinates[1].toFixed(
                      5
                    )}, ${data.coordinates[0].toFixed(
                      5
                    )}`
                  : "—"
              }
            />
          </section>

          {/* Contacts */}
          <section
            style={{
              marginTop:
                "10px",
              padding:
                "18px 20px",
              border:
                "1px solid rgba(255,255,255,0.08)",
              borderRadius:
                "16px",
              background:
                "rgba(255,255,255,0.025)",
            }}
          >
            <div
              style={{
                marginBottom:
                  "12px",
                fontSize:
                  "13px",
                fontWeight:
                  650,
              }}
            >
              Контакты
            </div>

            <div
              style={{
                display:
                  "grid",
                gridTemplateColumns:
                  "repeat(3, minmax(0, 1fr))",
                gap:
                  "8px",
              }}
            >
              <InfoBadge>
                Телефон:{" "}
                {data.phone ||
                  "—"}
              </InfoBadge>

              <InfoBadge>
                Telegram:{" "}
                {data.telegram ||
                  "—"}
              </InfoBadge>

              <InfoBadge>
                WhatsApp:{" "}
                {data.whatsapp ||
                  "—"}
              </InfoBadge>
            </div>
          </section>

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
                "12px",
              marginTop:
                "18px",
            }}
          >
            <button
              type="button"
              onClick={
                onBack
              }
              style={{
                minWidth:
                  "110px",
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
                  "rgba(255,255,255,0.58)",
                fontSize:
                  "12px",
                fontWeight:
                  500,
                cursor:
                  "pointer",
              }}
            >
              ← Изменить
            </button>

            <div
              style={{
                display:
                  "flex",
                gap:
                  "8px",
              }}
            >
              <button
                type="button"
                onClick={
                  onSaveDraft
                }
                style={{
                  height:
                    "46px",
                  padding:
                    "0 18px",
                  border:
                    "1px solid rgba(111,201,194,0.25)",
                  borderRadius:
                    "999px",
                  background:
                    "rgba(111,201,194,0.06)",
                  color:
                    "#6FC9C2",
                  fontSize:
                    "12px",
                  fontWeight:
                    600,
                  cursor:
                    "pointer",
                }}
              >
                Сохранить черновик
              </button>

              <button
                type="button"
                onClick={
                  onPublish
                }
                style={{
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
                    "12px",
                  fontWeight:
                    700,
                  cursor:
                    "pointer",
                }}
              >
                Опубликовать
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}