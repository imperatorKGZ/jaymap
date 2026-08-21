"use client";

import {
  memo,
  useMemo,
  useState,
} from "react";

import { ProfileIcon } from "../icons";
import { IconRenderer } from "../IconRenderer";

import type { WorkspaceProps } from "./types";

import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/lib/auth/AuthProvider";

import AuthModal from "@/components/auth/AuthModal";

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
    profile?.avatar_url ??
    user?.user_metadata
      ?.avatar_url ??
    user?.user_metadata
      ?.picture ??
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

  /*
   * Guest state
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
   * Auth loading state
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
   * Authenticated state
   */
  return (
    <div className="px-4 py-5">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-[var(--sb-accent-soft)] text-[var(--sb-accent)]">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-[24px] font-semibold">
              {displayName
                .slice(0, 1)
                .toUpperCase()}
            </span>
          )}
        </div>

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
  );
}

export default memo(
  ProfileWorkspace
);