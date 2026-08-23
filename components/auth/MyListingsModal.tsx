"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getMyListings,
} from "@/lib/supabase/api";

import {
  loadCities,
  getCityDisplayName,
  type City,
} from "@/lib/cities";

import type { Language } from "@/lib/i18n";

type ListingStatus =
  | "draft"
  | "published"
  | "paused"
  | "archived";

type MyListing =
  Awaited<
    ReturnType<
      typeof getMyListings
    >
  >[number];

type StatusFilter =
  | "all"
  | ListingStatus;

interface MyListingsModalProps {
  open: boolean;
  onClose: () => void;
}

const STATUS_META: Record<
  ListingStatus,
  {
    label: string;
    shortLabel: string;
    className: string;
  }
> = {
  draft: {
    label: "Черновик",
    shortLabel: "Черновики",
    className:
      "border-white/10 bg-white/5 text-white/65",
  },

  published: {
    label: "Опубликовано",
    shortLabel:
      "Опубликованные",
    className:
      "border-[#2FD4C0]/20 bg-[#2FD4C0]/10 text-[#5FE0D0]",
  },

  paused: {
    label: "На паузе",
    shortLabel: "На паузе",
    className:
      "border-amber-400/20 bg-amber-400/10 text-amber-300",
  },

  archived: {
    label: "Архив",
    shortLabel: "Архив",
    className:
      "border-white/10 bg-white/[0.03] text-white/40",
  },
};

const FILTERS: Array<{
  id: StatusFilter;
  label: string;
}> = [
  {
    id: "all",
    label: "Все",
  },
  {
    id: "published",
    label:
      STATUS_META.published.shortLabel,
  },
  {
    id: "draft",
    label:
      STATUS_META.draft.shortLabel,
  },
  {
    id: "paused",
    label:
      STATUS_META.paused.shortLabel,
  },
  {
    id: "archived",
    label:
      STATUS_META.archived.shortLabel,
  },
];

function formatPrice(
  price: number,
  currency: string
): string {
  return `${price.toLocaleString(
    "ru-RU"
  )} ${currency}`;
}

function formatDate(
  value: string
): string {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "ru-RU",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

function formatPropertyType(
  type: MyListing["type"]
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
      return type;
  }
}

function formatListingSummary(
  listing: MyListing
): string {
  const parts: string[] = [];

  if (
    listing.rooms !=
    null
  ) {
    parts.push(
      `${listing.rooms} комн.`
    );
  }

  if (
    listing.area !=
    null
  ) {
    parts.push(
      `${listing.area} м²`
    );
  }

  if (
    listing.floor !=
    null
  ) {
    parts.push(
      listing.total_floors
        ? `${listing.floor}/${listing.total_floors} эт.`
        : `${listing.floor} эт.`
    );
  }

  return parts.join(
    " · "
  );
}

function getCityNameFallback(
  cityId: string | null,
  cities: City[],
  language: Language
): string {
  if (!cityId) {
    return "";
  }

  const city =
    cities.find(
      (item) =>
        item.id ===
        cityId
    );

  if (city) {
    return getCityDisplayName(
      city,
      language
    );
  }

  return cityId
    .replace(
      /-/g,
      " "
    )
    .replace(
      /\b\w/g,
      (char) =>
        char.toUpperCase()
    );
}

export default function MyListingsModal({
  open,
  onClose,
}: MyListingsModalProps) {
  const [
    listings,
    setListings,
  ] = useState<
    MyListing[]
  >([]);

  const [
    cities,
    setCities,
  ] = useState<
    City[]
  >([]);

  const [
    activeFilter,
    setActiveFilter,
  ] =
    useState<StatusFilter>(
      "all"
    );

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    citiesLoading,
    setCitiesLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);

  const [
    isVisible,
    setIsVisible,
  ] = useState(false);

  /*
   * Пока основной проект работает
   * с текущим language-контрактом,
   * для этого MVP используем русский.
   *
   * Позже подключим реальный language state
   * профиля/приложения без изменения
   * структуры компонента.
   */
  const language: Language =
    "ru";

  useEffect(() => {
    if (!open) {
      setIsVisible(
        false
      );
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          setIsVisible(
            true
          );
        },
        10
      );

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [open]);

  const loadListings =
    useCallback(
      async () => {
        setLoading(true);
        setError(null);

        try {
          const [
            listingsData,
            citiesData,
          ] =
            await Promise.all([
              getMyListings(),
              loadCities(),
            ]);

          setListings(
            listingsData
          );

          setCities(
            citiesData
          );
        } catch (
          loadError
        ) {
          console.error(
            "[MyListingsModal] Load failed:",
            loadError
          );

          setError(
            "Не удалось загрузить объявления."
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled =
      false;

    const run =
      async () => {
        setCitiesLoading(
          true
        );

        try {
          const citiesData =
            await loadCities();

          if (
            !cancelled
          ) {
            setCities(
              citiesData
            );
          }
        } catch (
          citiesError
        ) {
          console.error(
            "[MyListingsModal] Cities load failed:",
            citiesError
          );
        } finally {
          if (
            !cancelled
          ) {
            setCitiesLoading(
              false
            );
          }
        }
      };

    if (
      cities.length ===
      0
    ) {
      void run();
    }

    return () => {
      cancelled = true;
    };
  }, [
    open,
    cities.length,
  ]);

  useEffect(() => {
    if (!open) {
      return;
    }

    void loadListings();
  }, [
    open,
    loadListings,
  ]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (
        event.key ===
        "Escape"
      ) {
        onClose();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    open,
    onClose,
  ]);

  const filteredListings =
    useMemo(() => {
      if (
        activeFilter ===
        "all"
      ) {
        return listings;
      }

      return listings.filter(
        (listing) =>
          listing.status ===
          activeFilter
      );
    }, [
      activeFilter,
      listings,
    ]);

  const counts =
    useMemo(() => {
      return {
        all:
          listings.length,

        published:
          listings.filter(
            (listing) =>
              listing.status ===
              "published"
          ).length,

        draft:
          listings.filter(
            (listing) =>
              listing.status ===
              "draft"
          ).length,

        paused:
          listings.filter(
            (listing) =>
              listing.status ===
              "paused"
          ).length,

        archived:
          listings.filter(
            (listing) =>
              listing.status ===
              "archived"
          ).length,
      };
    }, [listings]);

  const handleClose =
    useCallback(() => {
      setIsVisible(
        false
      );

      window.setTimeout(
        () => {
          onClose();
        },
        180
      );
    }, [onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Закрыть"
        onClick={
          handleClose
        }
        className={`absolute inset-0 bg-black/55 backdrop-blur-[8px] transition-opacity duration-200 ${
          isVisible
            ? "opacity-100"
            : "opacity-0"
        }`}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="my-listings-title"
        className={`relative z-[1001] flex h-[min(820px,calc(100vh-32px))] w-full max-w-[860px] flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[#141b24]/95 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-[24px] transition-all duration-200 ${
          isVisible
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-2 scale-[0.98] opacity-0"
        }`}
      >
        {/* Header */}
        <div className="shrink-0 border-b border-white/[0.07] px-6 pb-4 pt-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2
                id="my-listings-title"
                className="text-[22px] font-semibold tracking-tight text-white"
              >
                Мои объявления
              </h2>

              <p className="mt-1 text-[12px] text-white/40">
                {listings.length ===
                0
                  ? "Управление вашими объявлениями"
                  : `${listings.length} ${
                      listings.length ===
                      1
                        ? "объявление"
                        : listings.length <
                            5
                          ? "объявления"
                          : "объявлений"
                    }`}
              </p>
            </div>

            <button
              type="button"
              onClick={
                handleClose
              }
              aria-label="Закрыть"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/55 transition hover:bg-white/10 hover:text-white"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M18 6L6 18" />
                <path d="M6 6L18 18" />
              </svg>
            </button>
          </div>

          {/* Filters */}
          <div className="mt-4 overflow-x-auto">
            <div className="flex min-w-max gap-1.5">
              {FILTERS.map(
                (filter) => {
                  const active =
                    activeFilter ===
                    filter.id;

                  const count =
                    counts[
                      filter.id
                    ];

                  return (
                    <button
                      key={
                        filter.id
                      }
                      type="button"
                      onClick={() =>
                        setActiveFilter(
                          filter.id
                        )
                      }
                      className={`inline-flex h-9 items-center gap-2 rounded-full border px-3 text-[12px] font-medium transition ${
                        active
                          ? "border-[#2FD4C0]/30 bg-[#2FD4C0]/10 text-[#5FE0D0]"
                          : "border-white/8 bg-white/[0.03] text-white/50 hover:bg-white/[0.06] hover:text-white/75"
                      }`}
                    >
                      <span>
                        {
                          filter.label
                        }
                      </span>

                      <span
                        className={`min-w-[20px] rounded-full px-1.5 py-0.5 text-center text-[10px] ${
                          active
                            ? "bg-[#2FD4C0]/15 text-[#5FE0D0]"
                            : "bg-white/5 text-white/35"
                        }`}
                      >
                        {
                          count
                        }
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex h-full min-h-[320px] items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#2FD4C0]" />

                <span className="text-[12px] text-white/40">
                  Загружаем объявления…
                </span>
              </div>
            </div>
          ) : error ? (
            <div className="flex h-full min-h-[320px] items-center justify-center">
              <div className="max-w-[360px] rounded-2xl border border-red-400/10 bg-red-400/[0.04] px-6 py-6 text-center">
                <div className="text-[14px] font-medium text-white/85">
                  Не удалось загрузить
                  объявления
                </div>

                <div className="mt-2 text-[12px] leading-relaxed text-white/40">
                  {error}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void loadListings()
                  }
                  className="mt-4 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[12px] font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  Повторить
                </button>
              </div>
            </div>
          ) : filteredListings.length ===
            0 ? (
            <div className="flex h-full min-h-[320px] items-center justify-center">
              <div className="max-w-[380px] text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03] text-white/25">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 10.5L12 3l9 7.5" />
                    <path d="M5.5 9.5V21h13V9.5" />
                    <path d="M9.5 21v-7h5v7" />
                  </svg>
                </div>

                <div className="mt-4 text-[15px] font-medium text-white/80">
                  {activeFilter ===
                  "all"
                    ? "У вас пока нет объявлений"
                    : `Нет объявлений со статусом «${
                        STATUS_META[
                          activeFilter
                        ].label
                      }»`}
                </div>

                <div className="mt-2 text-[12px] leading-relaxed text-white/35">
                  Здесь будут отображаться
                  ваши объявления.
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredListings.map(
                (listing) => {
                  const status =
                    listing.status as ListingStatus;

                  const statusMeta =
                    STATUS_META[
                      status
                    ];

                  const cityName =
                    getCityNameFallback(
                      listing.city_id,
                      cities,
                      language
                    );

                  const summary =
                    formatListingSummary(
                      listing
                    );

                  const cover =
                    listing.photos?.[0] ??
                    null;

                  return (
                    <div
                      key={
                        listing.id
                      }
                      className="group overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] transition hover:border-white/[0.12] hover:bg-white/[0.04]"
                    >
                      <div className="flex min-h-[148px]">
                        {/* Image */}
                        <div className="relative w-[190px] shrink-0 bg-white/[0.03]">
                          {cover ? (
                            <img
                              src={
                                cover
                              }
                              alt=""
                              className="h-full min-h-[148px] w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full min-h-[148px] items-center justify-center text-white/20">
                              <svg
                                width="30"
                                height="30"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                              >
                                <rect
                                  x="3"
                                  y="4"
                                  width="18"
                                  height="16"
                                  rx="2"
                                />
                                <circle
                                  cx="8"
                                  cy="9"
                                  r="1.5"
                                />
                                <path d="M21 15l-5-5L6 20" />
                              </svg>
                            </div>
                          )}

                          {listing.is_premium && (
                            <div className="absolute left-3 top-3 rounded-full border border-amber-300/20 bg-amber-300/10 px-2 py-1 text-[10px] font-medium text-amber-200">
                              Premium
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="min-w-0 flex-1 px-4 py-3.5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="text-[11px] uppercase tracking-[0.08em] text-white/30">
                                {formatPropertyType(
                                  listing.type
                                )}
                              </div>

                              <h3 className="mt-1 line-clamp-2 text-[14px] font-semibold leading-snug text-white/90">
                                {
                                  listing.title
                                }
                              </h3>
                            </div>

                            <span
                              className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-medium ${statusMeta.className}`}
                            >
                              {
                                statusMeta.label
                              }
                            </span>
                          </div>

                          <div className="mt-3 text-[18px] font-semibold tracking-tight text-[#2FD4C0]">
                            {formatPrice(
                              listing.price,
                              listing.currency
                            )}
                          </div>

                          {cityName ||
                            listing.district ||
                            listing.address ? (
                            <div className="mt-1.5 flex min-w-0 items-center gap-1.5 text-[11px] text-white/45">
                              <svg
                                width="13"
                                height="13"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="shrink-0"
                              >
                                <path d="M12 21s7-6.2 7-12a7 7 0 10-14 0c0 5.8 7 12 7 12z" />
                                <circle
                                  cx="12"
                                  cy="9"
                                  r="2.2"
                                />
                              </svg>

                              <span className="truncate">
                                {[
                                  cityName,
                                  listing.district,
                                  listing.address,
                                ]
                                  .filter(
                                    Boolean
                                  )
                                  .join(
                                    " · "
                                  )}
                              </span>
                            </div>
                          ) : null}

                          {summary && (
                            <div className="mt-1 text-[11px] text-white/35">
                              {
                                summary
                              }
                            </div>
                          )}

                          <div className="mt-3 flex items-center justify-between gap-3">
                            <div className="text-[10px] text-white/25">
                              {
                                formatDate(
                                  listing.created_at
                                )
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading &&
          !error &&
          listings.length >
            0 && (
            <div className="shrink-0 border-t border-white/[0.07] px-6 py-3">
              <div className="flex items-center justify-between text-[10px] text-white/25">
                <span>
                  {citiesLoading
                    ? "Загружаем города…"
                    : "Мои объявления"}
                </span>

                <span>
                  {
                    filteredListings.length
                  } из{" "}
                  {
                    listings.length
                  }
                </span>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}