"use client";

import {
  memo,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  loadCities,
  getCityDisplayName,
  type City,
} from "@/lib/cities";

import {
  getMyListings,
  type ListingStatus,
} from "@/lib/supabase/api";

import {
  useTranslation,
} from "@/lib/i18n";

import type {
  WorkspaceProps,
} from "./types";

interface MyListing {
  id: string;
  created_at: string;
  updated_at: string;

  type:
    | "rental"
    | "commercial"
    | "land"
    | "daily";

  status:
    | "draft"
    | "published"
    | "paused"
    | "archived";

  price: number;
  currency: string;

  rooms: number | null;
  area: number | null;
  floor: number | null;
  total_floors: number | null;

  furnished: boolean;
  parking: boolean;
  pets: boolean;

  purpose: string | null;

  city_id: string | null;
  district: string | null;
  address: string | null;

  title: string;
  description: string | null;

  photos: string[];

  is_active: boolean;
  is_premium: boolean;

  params: unknown;
}

type ListingMenuState =
  | string
  | null;

interface MyListingsWorkspaceProps
  extends WorkspaceProps {
  onEditListing?: (
    listing: MyListing
  ) => void;

  onChangeStatus?: (
    listing: MyListing,
    status: ListingStatus
  ) => Promise<boolean>;

  onDeleteListing?: (
    listing: MyListing
  ) => Promise<boolean>;
}

function formatPrice(
  price: number,
  currency: string
) {
  return `${new Intl.NumberFormat(
    "ru-RU"
  ).format(price)} ${currency}`;
}

function getTypeLabel(
  type: MyListing["type"]
) {
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
      return "Объект";
  }
}

function getStatusLabel(
  status: MyListing["status"]
) {
  switch (status) {
    case "published":
      return "Активно";

    case "paused":
      return "Приостановлено";

    case "draft":
      return "Черновик";

    case "archived":
      return "Архивировано";

    default:
      return status;
  }
}

function formatUpdatedAt(
  value: string
) {
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
      month: "2-digit",
      year: "numeric",
    }
  ).format(date);
}

function getCityName(
  listing: MyListing,
  cities: City[],
  language:
    | "ru"
    | "ky"
    | "en"
) {
  if (
    !listing.city_id
  ) {
    return null;
  }

  const city =
    cities.find(
      (
        item
      ) =>
        item.id ===
        listing.city_id
    );

  if (!city) {
    return null;
  }

  return getCityDisplayName(
    city,
    language
  );
}

function MyListingsWorkspace({
  onEditListing,
  onChangeStatus,
  onDeleteListing,
}: MyListingsWorkspaceProps) {
  const {
    language,
  } = useTranslation();

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
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState(false);

  const [
    openMenu,
    setOpenMenu,
  ] = useState<
    ListingMenuState
  >(null);

  const [
    deleteTarget,
    setDeleteTarget,
  ] =
    useState<string | null>(
      null
    );

  const [
    actionId,
    setActionId,
  ] =
    useState<string | null>(
      null
    );

  const loadListings =
    async () => {
      setLoading(true);
      setError(false);

      try {
        const [
          listingsData,
          citiesData,
        ] = await Promise.all([
          getMyListings(),
          loadCities(),
        ]);

        setListings(
          (listingsData ??
            []) as MyListing[]
        );

        setCities(
          citiesData
        );
      } catch (loadError) {
        console.error(
          "[MyListingsWorkspace] Load failed:",
          loadError
        );

        setListings(
          []
        );

        setCities(
          []
        );

        setError(
          true
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  useEffect(() => {
    let cancelled =
      false;

    async function load() {
      setLoading(
        true
      );

      setError(
        false
      );

      try {
        const [
          listingsData,
          citiesData,
        ] = await Promise.all([
          getMyListings(),
          loadCities(),
        ]);

        if (
          cancelled
        ) {
          return;
        }

        setListings(
          (listingsData ??
            []) as MyListing[]
        );

        setCities(
          citiesData
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
          "[MyListingsWorkspace] Load failed:",
          loadError
        );

        setListings(
          []
        );

        setCities(
          []
        );

        setError(
          true
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
  }, []);

  useEffect(() => {
    const handlePointerDown =
      (
        event: PointerEvent
      ) => {
        if (
          !openMenu
        ) {
          return;
        }

        const target =
          event.target;

        if (
          target instanceof
          HTMLElement
        ) {
          const actionArea =
            target.closest(
              "[data-listing-actions]"
            );

          if (
            actionArea
          ) {
            return;
          }
        }

        setOpenMenu(
          null
        );

        setDeleteTarget(
          null
        );
      };

    document.addEventListener(
      "pointerdown",
      handlePointerDown
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown
      );
    };
  }, [
    openMenu,
  ]);

  const totalCount =
    listings.length;

  const languageForCities =
    language === "ky"
      ? "ky"
      : language === "en"
        ? "en"
        : "ru";

  const headingCount =
    useMemo(
      () =>
        `Все · ${totalCount}`,
      [
        totalCount,
      ]
    );

  const handleStatusChange =
    async (
      listing: MyListing,
      nextStatus: ListingStatus
    ) => {
      if (
        !onChangeStatus ||
        actionId ===
          listing.id
      ) {
        return;
      }

      setActionId(
        listing.id
      );

      try {
        const success =
          await onChangeStatus(
            listing,
            nextStatus
          );

        if (
          !success
        ) {
          return;
        }

        setListings(
          (
            previous
          ) =>
            previous.map(
              (
                item
              ) =>
                item.id ===
                listing.id
                  ? {
                      ...item,

                      status:
                        nextStatus,

                      is_active:
                        nextStatus ===
                        "published",

                      updated_at:
                        new Date().toISOString(),
                    }
                  : item
            )
        );

        setOpenMenu(
          null
        );
      } catch (
        statusError
      ) {
        console.error(
          "[MyListingsWorkspace] Status change failed:",
          statusError
        );
      } finally {
        setActionId(
          null
        );
      }
    };

  const handleDelete =
    async (
      listing: MyListing
    ) => {
      if (
        !onDeleteListing ||
        actionId ===
          listing.id
      ) {
        return;
      }

      setActionId(
        listing.id
      );

      try {
        const success =
          await onDeleteListing(
            listing
          );

        if (
          !success
        ) {
          return;
        }

        setListings(
          (
            previous
          ) =>
            previous.filter(
              (
                item
              ) =>
                item.id !==
                listing.id
            )
        );

        setDeleteTarget(
          null
        );

        setOpenMenu(
          null
        );
      } catch (
        deleteError
      ) {
        console.error(
          "[MyListingsWorkspace] Permanent delete failed:",
          deleteError
        );
      } finally {
        setActionId(
          null
        );
      }
    };

  if (
    loading
  ) {
    return (
      <div className="px-4 py-4">
        <div className="mb-4">
          <div className="h-4 w-32 animate-pulse rounded bg-[var(--sb-hover-bg)]" />

          <div className="mt-2 h-3 w-16 animate-pulse rounded bg-[var(--sb-hover-bg)]" />
        </div>

        <div className="flex flex-col gap-2.5">
          {[1, 2, 3].map(
            (
              item
            ) => (
              <div
                key={
                  item
                }
                className="h-[92px] w-full animate-pulse rounded-[var(--sb-radius-control)] border border-[var(--sb-border)] bg-[var(--sb-hover-bg)]"
              />
            )
          )}
        </div>
      </div>
    );
  }

  if (
    error
  ) {
    return (
      <div className="px-4 py-4">
        <div className="rounded-[var(--sb-radius-control)] border border-[var(--sb-border)] bg-[var(--sb-hover-bg)] px-4 py-5 text-center">
          <p className="text-[12px] font-medium text-[var(--sb-text-strong)]">
            Не удалось
            загрузить
            объявления.
          </p>

          <button
            type="button"
            onClick={() =>
              void loadListings()
            }
            className="mt-3 rounded-lg border border-[var(--sb-border)] px-3 py-2 text-[10px] font-medium text-[var(--sb-text-muted)] transition hover:bg-white/5 hover:text-[var(--sb-text-strong)]"
          >
            Повторить
          </button>
        </div>
      </div>
    );
  }

  if (
    listings.length ===
    0
  ) {
    return (
      <div className="px-4 py-4">
        <div className="mb-5">
          <h2 className="text-[16px] font-semibold text-[var(--sb-text-strong)]">
            Мои
            объявления
          </h2>

          <p className="mt-1 text-[11px] text-[var(--sb-text-muted)]">
            {
              headingCount
            }
          </p>
        </div>

        <div className="flex flex-col items-center rounded-[var(--sb-radius-control)] border border-[var(--sb-border)] bg-[var(--sb-hover-bg)] px-5 py-10 text-center">
          <p className="text-[13px] font-medium text-[var(--sb-text-strong)]">
            Объявлений
            пока нет
          </p>

          <p className="mt-1 text-[11px] leading-5 text-[var(--sb-text-muted)]">
            Здесь будут
            отображаться
            ваши
            объявления.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      <div className="mb-4">
        <h2 className="text-[16px] font-semibold text-[var(--sb-text-strong)]">
          Мои
          объявления
        </h2>

        <p className="mt-1 text-[11px] text-[var(--sb-text-muted)]">
          {
            headingCount
          }
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {listings.map(
          (
            listing
          ) => {
            const photo =
              listing.photos?.[0] ??
              null;

            const cityName =
              getCityName(
                listing,
                cities,
                languageForCities
              );

            const locationParts =
              [
                getTypeLabel(
                  listing.type
                ),
                cityName,
                listing.district,
              ].filter(
                (
                  value
                ): value is string =>
                  Boolean(
                    value
                  )
              );

            const locationText =
              locationParts.join(
                " · "
              );

            const isMenuOpen =
              openMenu ===
              listing.id;

            const isDeleting =
              actionId ===
                listing.id &&
              deleteTarget ===
                listing.id;

            const isActing =
              actionId ===
              listing.id;

            const statusLabel =
              getStatusLabel(
                listing.status
              );

            return (
              <div
                key={
                  listing.id
                }
                className={[
                  "w-full overflow-hidden rounded-[var(--sb-radius-control)] border border-[var(--sb-border)] bg-[var(--sb-hover-bg)] transition-colors",
                  listing.status ===
                    "published"
                    ? "hover:bg-white/[0.055]"
                    : "opacity-80",
                ].join(
                  " "
                )}
              >
                <div className="flex w-full items-start">
                  <div
                    className="shrink-0 p-[8px_0_8px_8px]"
                    style={{
                      flex:
                        "0 0 88px",
                      width:
                        "88px",
                    }}
                  >
                    <div
                      className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-[9px] border border-[var(--sb-border)] bg-black/10"
                      style={{
                        width:
                          "80px",
                        height:
                          "68px",
                      }}
                    >
                      {photo ? (
                        <img
                          src={
                            photo
                          }
                          alt=""
                          loading="lazy"
                          draggable={
                            false
                          }
                          className="block h-full w-full"
                          style={{
                            maxWidth:
                              "none",
                            objectFit:
                              "cover",
                            objectPosition:
                              "center",
                          }}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center px-2 text-center text-[9px] leading-3 text-[var(--sb-text-muted)]">
                          Нет фото
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 px-3 py-2.5">
                    <div className="flex min-w-0 items-start gap-1.5">
                      <p className="line-clamp-2 min-w-0 flex-1 text-[12px] font-semibold leading-[15px] text-[var(--sb-text-strong)]">
                        {
                          listing.title
                        }
                      </p>

                      <button
                        type="button"
                        disabled={
                          isActing
                        }
                        aria-label="Действия объявления"
                        aria-expanded={
                          isMenuOpen
                        }
                        onClick={(
                          event
                        ) => {
                          event.stopPropagation();

                          if (
                            isActing
                          ) {
                            return;
                          }

                          setOpenMenu(
                            isMenuOpen
                              ? null
                              : listing.id
                          );

                          setDeleteTarget(
                            null
                          );
                        }}
                        className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[var(--sb-text-muted)] transition-colors hover:bg-white/[0.06] hover:text-[var(--sb-text-strong)] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <span className="block translate-y-[-1px] text-[14px] leading-none tracking-[0.08em]">
                          •••
                        </span>
                      </button>
                    </div>

                    {locationText && (
                      <p className="mt-1 truncate text-[10px] leading-4 text-[var(--sb-text-muted)]">
                        {
                          locationText
                        }
                      </p>
                    )}

                    <div className="mt-1.5 flex min-w-0 items-center justify-between gap-2">
                      <p className="min-w-0 truncate text-[12px] font-semibold leading-4 text-[var(--sb-text-strong)]">
                        {formatPrice(
                          listing.price,
                          listing.currency
                        )}
                      </p>

                      <span
                        className={[
                          "shrink-0 rounded-full px-2 py-1 text-[9px] font-medium leading-none",
                          listing.status ===
                            "published"
                            ? "bg-[var(--sb-accent-soft)] text-[var(--sb-accent)]"
                            : "bg-white/[0.05] text-[var(--sb-text-muted)]",
                        ].join(
                          " "
                        )}
                      >
                        {
                          statusLabel
                        }
                      </span>
                    </div>

                    <p className="mt-1 text-[9px] leading-3 text-[var(--sb-text-muted)]">
                      Обновлено{" "}
                      {formatUpdatedAt(
                        listing.updated_at
                      )}
                    </p>
                  </div>
                </div>

                {isMenuOpen && (
                  <div
                    data-listing-actions
                    className="border-t border-[var(--sb-border)] bg-[var(--sb-bg-solid)]"
                    onClick={(
                      event
                    ) =>
                      event.stopPropagation()
                    }
                  >
                    {deleteTarget !==
                    listing.id ? (
                      <>
                        <div className="grid grid-cols-2 divide-x divide-[var(--sb-border)]">
                          <button
                            type="button"
                            disabled={
                              isActing
                            }
                            onClick={() => {
                              setOpenMenu(
                                null
                              );

                              onEditListing?.(
                                listing
                              );
                            }}
                            className="min-h-[38px] cursor-pointer px-3 text-[11px] font-medium text-[var(--sb-text-strong)] transition hover:bg-[var(--sb-hover-bg)] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Редактировать
                          </button>

                          {listing.status ===
                            "published" && (
                            <button
                              type="button"
                              disabled={
                                isActing
                              }
                              onClick={() =>
                                void handleStatusChange(
                                  listing,
                                  "paused"
                                )
                              }
                              className="min-h-[38px] cursor-pointer px-3 text-[11px] font-medium text-[var(--sb-text-strong)] transition hover:bg-[var(--sb-hover-bg)] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Приостановить
                            </button>
                          )}

                          {listing.status ===
                            "paused" && (
                            <button
                              type="button"
                              disabled={
                                isActing
                              }
                              onClick={() =>
                                void handleStatusChange(
                                  listing,
                                  "published"
                                )
                              }
                              className="min-h-[38px] cursor-pointer px-3 text-[11px] font-medium text-[var(--sb-text-strong)] transition hover:bg-[var(--sb-hover-bg)] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Запустить
                            </button>
                          )}

                          {listing.status ===
                            "draft" && (
                            <button
                              type="button"
                              disabled={
                                isActing
                              }
                              onClick={() =>
                                void handleStatusChange(
                                  listing,
                                  "published"
                                )
                              }
                              className="min-h-[38px] cursor-pointer px-3 text-[11px] font-medium text-[var(--sb-text-strong)] transition hover:bg-[var(--sb-hover-bg)] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Опубликовать
                            </button>
                          )}

                          {listing.status ===
                            "archived" && (
                            <button
                              type="button"
                              disabled={
                                isActing
                              }
                              onClick={() =>
                                void handleStatusChange(
                                  listing,
                                  "published"
                                )
                              }
                              className="min-h-[38px] cursor-pointer px-3 text-[11px] font-medium text-[var(--sb-text-strong)] transition hover:bg-[var(--sb-hover-bg)] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Запустить
                            </button>
                          )}
                        </div>

                        <div className="border-t border-[var(--sb-border)]">
                          <button
                            type="button"
                            disabled={
                              isActing
                            }
                            onClick={() =>
                              setDeleteTarget(
                                listing.id
                              )
                            }
                            className="min-h-[38px] w-full cursor-pointer px-3 text-left text-[11px] font-medium text-[var(--sb-text-strong)] transition hover:bg-[var(--sb-hover-bg)] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Удалить
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="px-3 py-3">
                        <p className="text-[11px] font-medium text-[var(--sb-text-strong)]">
                          Удалить объявление?
                        </p>

                        <p className="mt-1 text-[10px] leading-4 text-[var(--sb-text-muted)]">
                          Объявление и
                          все его
                          фотографии
                          будут удалены
                          навсегда.
                        </p>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            disabled={
                              isDeleting
                            }
                            onClick={() =>
                              setDeleteTarget(
                                null
                              )
                            }
                            className="min-h-[34px] rounded-lg border border-[var(--sb-border)] px-3 text-[10px] font-medium text-[var(--sb-text-muted)] transition hover:bg-[var(--sb-hover-bg)] hover:text-[var(--sb-text-strong)] disabled:opacity-40"
                          >
                            Отмена
                          </button>

                          <button
                            type="button"
                            disabled={
                              isDeleting
                            }
                            onClick={() =>
                              void handleDelete(
                                listing
                              )
                            }
                            className="min-h-[34px] rounded-lg bg-[var(--sb-cta)] px-3 text-[10px] font-semibold text-[var(--sb-cta-text)] transition hover:bg-[var(--sb-cta-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isDeleting
                              ? "Удаление…"
                              : "Удалить"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}

export default memo(
  MyListingsWorkspace
);