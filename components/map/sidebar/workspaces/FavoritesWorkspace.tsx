"use client";

import {
  memo,
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  FavoritesIcon,
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

import {
  getMyFavorites,
  type FavoriteListing,
} from "@/lib/supabase/api";

interface FavoritesWorkspaceProps
  extends WorkspaceProps {
  onFavoriteSelect?: (
    favorite: FavoriteListing
  ) => void;
}

const FAVORITE_EVENT =
  "jaymap:favorite-changed";

function formatFavoritePrice(
  price: number,
  currency: string
) {
  return `${new Intl.NumberFormat(
    "ru-RU"
  ).format(price)} ${currency}`;
}

function FavoritesWorkspace({
  onFavoriteSelect,
}: FavoritesWorkspaceProps) {
  const {
    t,
  } = useTranslation();

  const {
    user,
    loading: authLoading,
  } = useAuth();

  const [
    favorites,
    setFavorites,
  ] = useState<
    FavoriteListing[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState(false);

  const loadFavorites =
    useCallback(
      async () => {
        /*
         * Пока AuthProvider ещё определяет пользователя,
         * ничего не запрашиваем.
         */
        if (
          authLoading
        ) {
          return;
        }

        /*
         * Гость:
         * избранное не запрашиваем.
         */
        if (!user) {
          setFavorites(
            []
          );

          setLoading(
            false
          );

          setError(
            false
          );

          return;
        }

        setLoading(
          true
        );

        setError(
          false
        );

        try {
          const data =
            await getMyFavorites();

          setFavorites(
            data
          );
        } catch (
          loadError
        ) {
          console.error(
            "[FavoritesWorkspace] Load failed:",
            loadError
          );

          setFavorites(
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
      },
      [
        user,
        authLoading,
      ]
    );

  /*
   * Первичная загрузка.
   */
  useEffect(() => {
    void loadFavorites();
  }, [
    loadFavorites,
  ]);

  /*
   * Обновление после ♡ / ♥
   * в ListingPopup.
   */
  useEffect(() => {
    const handleFavoriteChanged =
      (
        event: Event
      ) => {
        const customEvent =
          event as CustomEvent<{
            listingId: string;
            isFavorite: boolean;
          }>;

        /*
         * Пока нас интересует сам факт изменения.
         * Повторно читаем БД, чтобы Sidebar всегда
         * отображал canonical state.
         */
        if (
          customEvent.detail
        ) {
          void loadFavorites();
        }
      };

    window.addEventListener(
      FAVORITE_EVENT,
      handleFavoriteChanged
    );

    return () => {
      window.removeEventListener(
        FAVORITE_EVENT,
        handleFavoriteChanged
      );
    };
  }, [
    loadFavorites,
  ]);

  /*
   * AuthProvider ещё не определил пользователя.
   */
  if (
    authLoading
  ) {
    return (
      <div className="flex flex-col gap-2 px-5 py-5">
        <div className="h-[62px] animate-pulse rounded-[var(--sb-radius-control)] bg-[var(--sb-hover-bg)]" />

        <div className="h-[62px] animate-pulse rounded-[var(--sb-radius-control)] bg-[var(--sb-hover-bg)]" />
      </div>
    );
  }

  /*
   * Гость.
   */
  if (!user) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
        <IconRenderer
          icon={
            FavoritesIcon
          }
          size={28}
          className="text-[var(--sb-text-muted)]"
        />

        <p className="text-[13px] text-[var(--sb-text-muted)]">
          Войдите, чтобы использовать избранное.
        </p>

        <p className="max-w-[210px] text-[11px] leading-relaxed text-[var(--sb-text-muted)] opacity-70">
          После входа здесь появятся
          сохранённые объявления.
        </p>
      </div>
    );
  }

  /*
   * Загрузка.
   */
  if (
    loading
  ) {
    return (
      <div className="flex flex-col gap-2 px-5 py-5">
        <div className="h-[62px] animate-pulse rounded-[var(--sb-radius-control)] bg-[var(--sb-hover-bg)]" />

        <div className="h-[62px] animate-pulse rounded-[var(--sb-radius-control)] bg-[var(--sb-hover-bg)]" />

        <div className="h-[62px] animate-pulse rounded-[var(--sb-radius-control)] bg-[var(--sb-hover-bg)]" />
      </div>
    );
  }

  /*
   * Реальная ошибка Supabase.
   */
  if (
    error
  ) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
        <IconRenderer
          icon={
            FavoritesIcon
          }
          size={28}
          className="text-[var(--sb-text-muted)]"
        />

        <p className="text-[13px] text-[var(--sb-text-muted)]">
          Не удалось загрузить избранное.
        </p>

        <button
          type="button"
          onClick={() =>
            void loadFavorites()
          }
          className="rounded-full bg-[var(--sb-cta)] px-4 py-2 text-[12px] font-semibold text-[var(--sb-cta-text)] transition hover:bg-[var(--sb-cta-hover)]"
        >
          Повторить
        </button>
      </div>
    );
  }

  /*
   * Пустое избранное.
   */
  if (
    favorites.length ===
    0
  ) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
        <IconRenderer
          icon={
            FavoritesIcon
          }
          size={28}
          className="text-[var(--sb-text-muted)]"
        />

        <p className="text-[13px] text-[var(--sb-text-muted)]">
          {t(
            "favorites.empty"
          )}
        </p>
      </div>
    );
  }

  /*
   * Реальный список.
   *
   * Только название + цена.
   * Без фото и дополнительных характеристик.
   */
  return (
    <div className="flex flex-col gap-2 px-5 py-5">
      {favorites.map(
        (
          favorite
        ) => (
          <button
            key={
              favorite.id
            }
            type="button"
            onClick={() =>
              onFavoriteSelect?.(
                favorite
              )
            }
            className="w-full rounded-[var(--sb-radius-control)] border border-[var(--sb-border)] px-3.5 py-3 text-left transition hover:border-white/15 hover:bg-[var(--sb-hover-bg)]"
          >
            <p className="truncate text-[13px] font-medium text-[var(--sb-text-strong)]">
              {
                favorite.title
              }
            </p>

            <p className="text-[12px] text-[var(--sb-text-muted)]">
              {formatFavoritePrice(
                favorite.price,
                favorite.currency
              )}
            </p>
          </button>
        )
      )}
    </div>
  );
}

export default memo(
  FavoritesWorkspace
);