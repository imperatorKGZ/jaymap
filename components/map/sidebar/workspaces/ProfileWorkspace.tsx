"use client";

import {
  memo,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ProfileIcon,
} from "../icons";
import {
  IconRenderer,
} from "../IconRenderer";

import type {
  WorkspaceProps,
} from "./types";

import {
  useTranslation,
} from "@/lib/i18n";

import {
  useAuth,
} from "@/lib/auth/AuthProvider";

import AuthModal from "@/components/auth/AuthModal";
import ProfileEditModal from "@/components/auth/ProfileEditModal";

import {
  getMyListings,
} from "@/lib/supabase/api";

interface MyListing {
  id: string;
  created_at: string;
  updated_at: string;
  type:
    | "rental"
    | "commercial"
    | "land"
    | "daily";
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

type ProfileView =
  | "profile"
  | "my-listings";

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

function ProfileWorkspace(
  _: WorkspaceProps
) {
  const { t } =
    useTranslation();

  const {
    user,
    profile,
    loading,
    profileLoading,
    signOut,
  } = useAuth();

  const [
    authModalOpen,
    setAuthModalOpen,
  ] = useState(false);

  const [
    editProfileOpen,
    setEditProfileOpen,
  ] = useState(false);

  const [
    view,
    setView,
  ] = useState<ProfileView>(
    "profile"
  );

  const [
    listings,
    setListings,
  ] = useState<MyListing[]>(
    []
  );

  const [
    listingsLoading,
    setListingsLoading,
  ] = useState(false);

  const [
    listingsError,
    setListingsError,
  ] = useState(false);

  useEffect(() => {
    if (!user) {
      setView("profile");
      setListings([]);
    }
  }, [user]);

  const displayName =
    useMemo(() => {
      if (
        profile?.display_name?.trim()
      ) {
        return profile.display_name.trim();
      }

      const metadataName =
        user?.user_metadata
          ?.full_name ??
        user?.user_metadata
          ?.name;

      if (
        typeof metadataName ===
          "string" &&
        metadataName.trim()
      ) {
        return metadataName.trim();
      }

      if (user?.email) {
        return user.email
          .split("@")[0];
      }

      return "Пользователь";
    }, [
      profile?.display_name,
      user?.user_metadata,
      user?.email,
    ]);

  const avatarUrl =
    profile?.avatar_url ||
    user?.user_metadata
      ?.avatar_url ||
    user?.user_metadata
      ?.picture ||
    null;

  const handleLogout =
    async () => {
      try {
        await signOut();
      } catch (error) {
        console.error(
          "[ProfileWorkspace] Logout failed:",
          error
        );
      }
    };

  const handleOpenMyListings =
    async () => {
      if (!user) {
        return;
      }

      setView("my-listings");
      setListingsError(false);

      /*
       * Уже загруженные данные повторно
       * не запрашиваем без необходимости.
       */
      if (listings.length > 0) {
        return;
      }

      setListingsLoading(true);

      try {
        const data =
          await getMyListings();

        setListings(
          (data ?? []) as MyListing[]
        );
      } catch (error) {
        console.error(
          "[ProfileWorkspace] Failed to load listings:",
          error
        );

        setListingsError(true);
      } finally {
        setListingsLoading(false);
      }
    };

  const handleBackToProfile =
    () => {
      setView("profile");
    };

  /*
   * Guest
   */
  if (!loading && !user) {
    return (
      <>
        <div className="flex flex-col items-center gap-3 px-5 py-7 text-center">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-[var(--sb-accent-soft)] text-[var(--sb-accent)]">
            <IconRenderer
              icon={ProfileIcon}
              size={28}
            />
          </div>

          <div>
            <p className="text-[14px] font-semibold text-[var(--sb-text-strong)]">
              {t("profile.guest")}
            </p>

            <p className="mt-1 text-[12px] leading-5 text-[var(--sb-text-muted)]">
              {t(
                "profile.loginPrompt"
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setAuthModalOpen(
                true
              )
            }
            className="mt-2 min-h-[44px] w-full rounded-full bg-[var(--sb-cta)] px-4 text-[13px] font-semibold text-[var(--sb-cta-text)] transition hover:bg-[var(--sb-cta-hover)]"
          >
            {t(
              "profile.login"
            )}
          </button>
        </div>

        <AuthModal
          open={authModalOpen}
          onClose={() =>
            setAuthModalOpen(
              false
            )
          }
        />
      </>
    );
  }

  /*
   * Auth / profile loading
   */
  if (
    loading ||
    profileLoading
  ) {
    return (
      <div className="flex flex-col items-center gap-3 px-5 py-7 text-center">
        <div className="h-16 w-16 animate-pulse rounded-full bg-white/10" />

        <div className="w-full">
          <div className="mx-auto h-4 w-28 animate-pulse rounded bg-white/10" />

          <div className="mx-auto mt-2 h-3 w-40 animate-pulse rounded bg-white/5" />
        </div>

        <div className="mt-2 h-11 w-full animate-pulse rounded-full bg-white/10" />
      </div>
    );
  }

  /*
   * My listings view
   */
  if (
    view === "my-listings"
  ) {
    return (
      <div className="px-4 py-4">
        <button
          type="button"
          onClick={
            handleBackToProfile
          }
          className="mb-4 flex items-center gap-2 text-[12px] font-medium text-[var(--sb-text-muted)] transition hover:text-[var(--sb-text-strong)]"
        >
          <span className="text-[16px]">
            ←
          </span>

          Профиль
        </button>

        <div className="mb-4">
          <h2 className="text-[16px] font-semibold text-[var(--sb-text-strong)]">
            Мои объявления
          </h2>

          <p className="mt-1 text-[11px] text-[var(--sb-text-muted)]">
            Объекты, опубликованные с этого аккаунта
          </p>
        </div>

        {listingsLoading && (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map(
              (item) => (
                <div
                  key={item}
                  className="h-[84px] animate-pulse rounded-2xl border border-[var(--sb-border)] bg-[var(--sb-hover-bg)]"
                />
              )
            )}
          </div>
        )}

        {!listingsLoading &&
          listingsError && (
            <div className="rounded-2xl border border-red-400/10 bg-red-400/5 px-4 py-4 text-center">
              <p className="text-[12px] text-red-300/80">
                Не удалось загрузить объявления.
              </p>

              <button
                type="button"
                onClick={() => {
                  setListings(
                    []
                  );
                  void handleOpenMyListings();
                }}
                className="mt-3 rounded-full bg-white/5 px-4 py-2 text-[12px] font-medium text-white/70 hover:bg-white/10"
              >
                Повторить
              </button>
            </div>
          )}

        {!listingsLoading &&
          !listingsError &&
          listings.length ===
            0 && (
            <div className="flex flex-col items-center rounded-2xl border border-[var(--sb-border)] px-5 py-10 text-center">
              <div className="text-[28px]">
                🏠
              </div>

              <p className="mt-3 text-[13px] font-semibold text-[var(--sb-text-strong)]">
                У вас пока нет объявлений
              </p>

              <p className="mt-1 text-[11px] leading-5 text-[var(--sb-text-muted)]">
                После публикации ваши объекты появятся здесь.
              </p>
            </div>
          )}

        {!listingsLoading &&
          !listingsError &&
          listings.length > 0 && (
            <div className="flex flex-col gap-2">
              {listings.map(
                (listing) => {
                  const photo =
                    listing.photos?.[0] ??
                    null;

                  return (
                    <button
                      type="button"
                      key={
                        listing.id
                      }
                      onClick={() => {
                        console.log(
                          "[ProfileWorkspace] Listing clicked:",
                          listing.id
                        );
                      }}
                      className="flex w-full overflow-hidden rounded-2xl border border-[var(--sb-border)] bg-[var(--sb-hover-bg)] text-left transition hover:bg-white/5"
                    >
                      <div className="h-[84px] w-[92px] flex-shrink-0 overflow-hidden bg-black/10">
                        {photo ? (
                          <img
                            src={
                              photo
                            }
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[22px] text-white/20">
                            🏠
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 px-3 py-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-[12px] font-semibold text-[var(--sb-text-strong)]">
                            {listing.title}
                          </p>

                          {listing.is_premium && (
                            <span className="flex-shrink-0 rounded-full bg-amber-400/15 px-1.5 py-0.5 text-[8px] font-semibold text-amber-200">
                              PREMIUM
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-[10px] text-[var(--sb-text-muted)]">
                          {getTypeLabel(
                            listing.type
                          )}
                          {listing.address
                            ? ` · ${listing.address}`
                            : ""}
                        </p>

                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="text-[12px] font-semibold text-[var(--sb-text-strong)]">
                            {formatPrice(
                              listing.price,
                              listing.currency
                            )}
                          </span>

                          <span className="text-[9px] text-[var(--sb-text-muted)]">
                            {listing.is_active
                              ? "Активно"
                              : "Неактивно"}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          )}
      </div>
    );
  }

  /*
   * Profile view
   */
  return (
    <>
      <div className="px-4 py-5">
        <div className="flex flex-col items-center text-center">
          <button
            type="button"
            onClick={() =>
              setEditProfileOpen(
                true
              )
            }
            className="group relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-[var(--sb-accent-soft)] text-[var(--sb-accent)]"
            aria-label="Редактировать профиль"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-[24px] font-semibold">
                {displayName
                  .slice(
                    0,
                    1
                  )
                  .toUpperCase()}
              </span>
            )}

            <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition group-hover:opacity-100">
              <span className="text-[11px] font-semibold">
                Изменить
              </span>
            </span>
          </button>

          <p className="mt-3 text-[15px] font-semibold text-[var(--sb-text-strong)]">
            {displayName}
          </p>

          {user?.email && (
            <p className="mt-1 max-w-full truncate text-[11px] text-[var(--sb-text-muted)]">
              {user.email}
            </p>
          )}
        </div>

        <div className="mt-5 space-y-2">
          <button
            type="button"
            onClick={
              handleOpenMyListings
            }
            className="flex min-h-[42px] w-full items-center rounded-xl px-3 text-left text-[13px] font-medium text-[var(--sb-text-strong)] transition hover:bg-white/5"
          >
            Мои объявления
          </button>

          <button
            type="button"
            className="flex min-h-[42px] w-full items-center rounded-xl px-3 text-left text-[13px] font-medium text-[var(--sb-text-strong)] transition hover:bg-white/5"
          >
            Избранное
          </button>

          <button
            type="button"
            onClick={() =>
              setEditProfileOpen(
                true
              )
            }
            className="flex min-h-[42px] w-full items-center rounded-xl px-3 text-left text-[13px] font-medium text-[var(--sb-text-strong)] transition hover:bg-white/5"
          >
            Настройки профиля
          </button>
        </div>

        <button
          type="button"
          onClick={
            handleLogout
          }
          className="mt-4 min-h-[42px] w-full rounded-xl border border-white/8 px-4 text-[13px] font-medium text-white/55 transition hover:border-white/15 hover:bg-white/5 hover:text-white/80"
        >
          Выйти
        </button>
      </div>

      <ProfileEditModal
        open={
          editProfileOpen
        }
        onClose={() =>
          setEditProfileOpen(
            false
          )
        }
      />
    </>
  );
}

export default memo(
  ProfileWorkspace
);