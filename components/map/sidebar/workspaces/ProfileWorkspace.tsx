"use client";

import {
  memo,
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
  deleteListingPermanently,
  type ListingStatus,
  updateListingStatus,
} from "@/lib/supabase/api";

import MyListingsWorkspace from "./MyListingsWorkspace";

import ListingEditModal from "@/components/listings/ListingEditModal";

interface MyListingForActions {
  id: string;
  title: string;

  status:
    | "draft"
    | "published"
    | "paused"
    | "archived";

  is_active: boolean;
}

type ProfileView =
  | "profile"
  | "my-listings";

function ProfileWorkspace(
  props: WorkspaceProps
) {
  const {
    t,
  } = useTranslation();

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
    editListingId,
    setEditListingId,
  ] = useState<
    string | null
  >(null);

  const [
    listingsRefreshKey,
    setListingsRefreshKey,
  ] = useState(0);

  const displayName =
    useMemo(
      () => {
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
      },
      [
        profile?.display_name,
        user?.user_metadata,
        user?.email,
      ]
    );

  const avatarUrl =
  profile?.avatar_url?.trim() ||
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
    () => {
      if (!user) {
        return;
      }

      setView(
        "my-listings"
      );
    };

  const handleBackToProfile =
    () => {
      setView(
        "profile"
      );
    };

  const handleEditListing =
    (
      listing: MyListingForActions
    ) => {
      setEditListingId(
        listing.id
      );
    };

  const handleChangeListingStatus =
    async (
      listing: MyListingForActions,
      status: ListingStatus
    ): Promise<boolean> => {
      try {
        await updateListingStatus(
          listing.id,
          status
        );

        return true;
      } catch (error) {
        console.error(
          "[ProfileWorkspace] Status update failed:",
          error
        );

        return false;
      }
    };

  const handleDeleteListing =
    async (
      listing: MyListingForActions
    ): Promise<boolean> => {
      try {
        await deleteListingPermanently(
          listing.id
        );

        return true;
      } catch (error) {
        console.error(
          "[ProfileWorkspace] Permanent listing delete failed:",
          error
        );

        return false;
      }
    };

  const handleListingSaved =
    () => {
      setEditListingId(
        null
      );

      setListingsRefreshKey(
        (previous) =>
          previous + 1
      );
    };

  /*
   * Guest
   */
  if (
    !loading &&
    !user
  ) {
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
              {t(
                "profile.guest"
              )}
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
              setAuthModalOpen(true)
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
            setAuthModalOpen(false)
          }
        />
      </>
    );
  }

  /*
   * Loading
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
   * My listings
   */
  if (
    view ===
    "my-listings"
  ) {
    return (
      <>
        <div className="flex h-full min-h-0 flex-col">
          <button
            type="button"
            onClick={
              handleBackToProfile
            }
            className="flex h-10 shrink-0 items-center gap-2 border-b border-[var(--sb-border)] px-4 text-[12px] font-medium text-[var(--sb-text-muted)] transition-colors hover:text-[var(--sb-text-strong)]"
          >
            <span className="text-[15px] leading-none">
              ←
            </span>

            Профиль
          </button>

          <div className="sb-scroll min-h-0 flex-1 overflow-y-auto">
            <MyListingsWorkspace
              key={
                listingsRefreshKey
              }
              {...props}
              onEditListing={
                handleEditListing
              }
              onChangeStatus={
                handleChangeListingStatus
              }
              onDeleteListing={
                handleDeleteListing
              }
            />
          </div>
        </div>

        {/* ВАЖНО:
            редактор НЕ является частью sidebar layout.
            Сам ListingEditModal использует Portal в document.body.
        */}
        <ListingEditModal
          open={
            editListingId !== null
          }
          listingId={
            editListingId
          }
          onClose={() =>
            setEditListingId(null)
          }
          onSaved={
            handleListingSaved
          }
        />
      </>
    );
  }

  /*
   * Profile
   */
  return (
    <>
      <div className="px-4 py-5">
        <div className="flex flex-col items-center text-center">
          <button
            type="button"
            onClick={() =>
              setEditProfileOpen(true)
            }
            className="group relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-[var(--sb-accent-soft)] text-[var(--sb-accent)]"
            aria-label="Редактировать профиль"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src =
                    "/jaymap-default-avatar.svg";
                }}
                className="h-full w-full object-cover"
              />
            ) : (
              <img
                src="/jaymap-default-avatar.svg"
                alt="JayMap"
                className="h-full w-full object-cover"
              />
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
              setEditProfileOpen(true)
            }
            className="flex min-h-[42px] w-full items-center rounded-xl px-3 text-left text-[13px] font-medium text-[var(--sb-text-strong)] transition hover:bg-white/5"
          >
            Настройки профиля
          </button>
        </div>

        <button
          type="button"
          onClick={handleLogout}
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
          setEditProfileOpen(false)
        }
      />
    </>
  );
}

export default memo(
  ProfileWorkspace
);