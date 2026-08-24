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
  getMyListingHistory,
  type ListingHistoryItem,
} from "@/lib/supabase/api";

interface HistoryWorkspaceProps
  extends WorkspaceProps {
  onHistorySelect?: (
    item: ListingHistoryItem
  ) => void;
}

function formatPrice(
  price: number,
  currency: string
) {
  return `${new Intl.NumberFormat(
    "ru-RU"
  ).format(price)} ${currency}`;
}

function HistoryWorkspace({
  onHistorySelect,
}: HistoryWorkspaceProps) {
  const {
    t,
  } = useTranslation();

  const {
    user,
    loading: authLoading,
  } = useAuth();

  const [
    history,
    setHistory,
  ] = useState<
    ListingHistoryItem[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState(false);

  const loadHistory =
    useCallback(
      async () => {
        /*
         * AuthProvider ещё определяет пользователя.
         */
        if (
          authLoading
        ) {
          return;
        }

        /*
         * Гость:
         * история не загружается.
         */
        if (!user) {
          setHistory([]);
          setLoading(false);
          setError(false);

          return;
        }

        setLoading(true);
        setError(false);

        try {
          const data =
            await getMyListingHistory();

          setHistory(
            data
          );
        } catch (
          loadError
        ) {
          console.error(
            "[HistoryWorkspace] Load failed:",
            loadError
          );

          setHistory([]);
          setError(true);
        } finally {
          setLoading(false);
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
    void loadHistory();
  }, [
    loadHistory,
  ]);

  /*
   * Авторизация ещё загружается.
   */
  if (
    authLoading
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
   * Гость.
   *
   * Просмотры гостя специально не сохраняются.
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
          Войдите, чтобы использовать историю.
        </p>

        <p className="max-w-[210px] text-[11px] leading-relaxed text-[var(--sb-text-muted)] opacity-70">
          После входа здесь появятся
          просмотренные объявления.
        </p>
      </div>
    );
  }

  /*
   * Загрузка истории.
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
   * Ошибка Supabase/API.
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
          Не удалось загрузить историю.
        </p>

        <button
          type="button"
          onClick={() =>
            void loadHistory()
          }
          className="rounded-full bg-[var(--sb-cta)] px-4 py-2 text-[12px] font-semibold text-[var(--sb-cta-text)] transition hover:bg-[var(--sb-cta-hover)]"
        >
          Повторить
        </button>
      </div>
    );
  }

  /*
   * История пустая.
   */
  if (
    history.length ===
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
          История просмотров пуста.
        </p>

        <p className="max-w-[210px] text-[11px] leading-relaxed text-[var(--sb-text-muted)] opacity-70">
          Открывайте объявления на карте —
          они появятся здесь.
        </p>
      </div>
    );
  }

  /*
   * Реальный список истории.
   *
   * Без фото и лишних параметров,
   * как в Избранном.
   */
  return (
    <div className="flex flex-col gap-2 px-5 py-5">
      {history.map(
        (
          item
        ) => (
          <button
            key={
              item.id
            }
            type="button"
            onClick={() =>
              onHistorySelect?.(
                item
              )
            }
            className="w-full rounded-[var(--sb-radius-control)] border border-[var(--sb-border)] px-3.5 py-3 text-left transition hover:border-white/15 hover:bg-[var(--sb-hover-bg)]"
          >
            <p className="truncate text-[13px] font-medium text-[var(--sb-text-strong)]">
              {
                item.title
              }
            </p>

            <p className="text-[12px] text-[var(--sb-text-muted)]">
              {formatPrice(
                item.price,
                item.currency
              )}
            </p>
          </button>
        )
      )}
    </div>
  );
}

export default memo(
  HistoryWorkspace
);