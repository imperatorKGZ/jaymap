import { memo } from "react";

import type { WorkspaceProps } from "./types";

import { useTranslation } from "@/lib/i18n";

interface SubscriptionsFilters {
  newListings: boolean;
  priceDrops: boolean;
}

export const SUBSCRIPTIONS_DEFAULTS: SubscriptionsFilters = {
  newListings: true,
  priceDrops: false,
};

function SubscriptionsWorkspace({
  values: _values,
  setValue: _setValue,
}: WorkspaceProps<SubscriptionsFilters>) {
  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-col px-5 py-5">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div
          aria-hidden="true"
          className={[
            "mb-5 flex h-16 w-16 items-center justify-center",
            "rounded-[22px]",
            "border border-[var(--sb-border)]",
            "bg-[var(--sb-accent-soft)]",
            "text-[var(--sb-accent)]",
          ].join(" ")}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M14 4.5V2.75M14 25.25V23.5M4.5 14H2.75M25.25 14H23.5M7.28 7.28L6.04 6.04M21.96 21.96L20.72 20.72M20.72 7.28L21.96 6.04M6.04 21.96L7.28 20.72"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
            <circle
              cx="14"
              cy="14"
              r="5.25"
              stroke="currentColor"
              strokeWidth="1.7"
            />
          </svg>
        </div>

        <div className="mb-2 inline-flex items-center rounded-full border border-[var(--sb-accent)]/30 bg-[var(--sb-accent-soft)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--sb-accent)]">
          В разработке
        </div>

        <h2 className="mb-3 text-[20px] font-semibold tracking-[-0.02em] text-[var(--sb-text-strong)]">
          Подписки
        </h2>

        <p className="max-w-[250px] text-[13px] leading-5 text-[var(--sb-text-muted)]">
          {t("subscriptions.description")}
        </p>

        <div className="mt-7 flex items-center gap-2">
          <div className="flex h-9 items-center gap-2 rounded-full border border-[var(--sb-border)] bg-[var(--sb-hover-bg)] px-3.5">
            <span
              aria-hidden="true"
              className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--sb-text-strong)] text-[9px] font-bold text-[var(--sb-bg-solid)]"
            >
              T
            </span>
            <span className="text-[12px] font-medium text-[var(--sb-text)]">
              Telegram
            </span>
          </div>

          <div className="flex h-9 items-center gap-2 rounded-full border border-[var(--sb-border)] bg-[var(--sb-hover-bg)] px-3.5">
            <span
              aria-hidden="true"
              className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--sb-text-strong)] text-[9px] font-bold text-[var(--sb-bg-solid)]"
            >
              W
            </span>
            <span className="text-[12px] font-medium text-[var(--sb-text)]">
              WhatsApp
            </span>
          </div>
        </div>

        <div className="mt-7 w-full max-w-[248px] rounded-[var(--sb-radius-control)] border border-[var(--sb-border)] bg-[var(--sb-bg-solid)] px-4 py-3">
          <p className="text-[12px] font-medium text-[var(--sb-text-strong)]">
            Скоро
          </p>

          <p className="mt-1 text-[11px] leading-4 text-[var(--sb-text-muted)]">
            Персональный подбор объявлений
            по вашим критериям.
          </p>
        </div>
      </div>
    </div>
  );
}

export default memo(
  SubscriptionsWorkspace
);