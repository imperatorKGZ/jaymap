import { memo } from "react";

import type { WorkspaceProps } from "./types";

import {
  useTranslation,
} from "@/lib/i18n";

export type SearchRadius =
  | null
  | 3000
  | 5000
  | 10000;

interface MapLayersWorkspaceProps
  extends WorkspaceProps<
    Record<string, unknown>
  > {
  /**
   * Текущий радиус поиска.
   *
   * null = выключен.
   */
  searchRadius?: SearchRadius;

  /**
   * Изменение радиуса поиска.
   */
  onRadiusChange?: (
    radius: SearchRadius
  ) => void;

  /**
   * Запускает определение
   * местоположения пользователя.
   */
  onLocateMe?: () => void;
}

function MapLayersWorkspace({
  searchRadius = null,
  onRadiusChange,
  onLocateMe,
}: MapLayersWorkspaceProps) {
  const {
    t,
  } =
    useTranslation();

  return (
    <div className="flex flex-col gap-1 px-5 py-5">
      {/* =====================================================
          МОЁ МЕСТОПОЛОЖЕНИЕ
          ===================================================== */}

      <button
        type="button"
        onClick={
          onLocateMe
        }
        className="flex min-h-11 w-full items-center gap-3 rounded-[var(--sb-radius-control)] px-3 text-left transition hover:bg-[var(--sb-hover-bg)] active:bg-[var(--sb-active-bg)]"
      >
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[var(--sb-hover-bg)]"
          aria-hidden="true"
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6FC9C2"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle
              cx="12"
              cy="12"
              r="3.5"
            />

            <path d="M12 2.5v5" />

            <path d="M12 16.5v5" />

            <path d="M2.5 12h5" />

            <path d="M16.5 12h5" />

            <circle
              cx="12"
              cy="12"
              r="1"
              fill="#6FC9C2"
              stroke="none"
            />
          </svg>
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium text-[var(--sb-text)]">
            Моё местоположение
          </span>

          <span className="mt-0.5 block text-[11px] font-normal text-[var(--sb-text-muted)]">
            Показать или скрыть на карте
          </span>
        </span>
      </button>

      {/* =====================================================
          РАДИУС ПОИСКА
          ===================================================== */}

      <div className="mt-3 px-3">
        <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--sb-text-muted)]">
          Радиус поиска
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={() =>
              onRadiusChange?.(
                null
              )
            }
            aria-pressed={
              searchRadius ===
              null
            }
            className={[
              "h-9 rounded-[10px]",
              "border border-[var(--sb-divider)]",
              "text-[12px] font-medium",
              "transition-colors duration-150",
              searchRadius ===
              null
                ? "bg-[var(--sb-hover-bg)] text-[var(--sb-text)]"
                : "text-[var(--sb-text-muted)] hover:bg-[var(--sb-hover-bg)] hover:text-[var(--sb-text)]",
            ].join(" ")}
          >
            Выкл.
          </button>

          <button
            type="button"
            onClick={() =>
              onRadiusChange?.(
                3000
              )
            }
            aria-pressed={
              searchRadius ===
              3000
            }
            className={[
              "h-9 rounded-[10px]",
              "border border-[var(--sb-divider)]",
              "text-[12px] font-medium",
              "transition-colors duration-150",
              searchRadius ===
              3000
                ? "border-[#6FC9C2] bg-[#6FC9C2]/10 text-[#6FC9C2]"
                : "text-[var(--sb-text-muted)] hover:bg-[var(--sb-hover-bg)] hover:text-[var(--sb-text)]",
            ].join(" ")}
          >
            3 км
          </button>

          <button
            type="button"
            onClick={() =>
              onRadiusChange?.(
                5000
              )
            }
            aria-pressed={
              searchRadius ===
              5000
            }
            className={[
              "h-9 rounded-[10px]",
              "border border-[var(--sb-divider)]",
              "text-[12px] font-medium",
              "transition-colors duration-150",
              searchRadius ===
              5000
                ? "border-[#6FC9C2] bg-[#6FC9C2]/10 text-[#6FC9C2]"
                : "text-[var(--sb-text-muted)] hover:bg-[var(--sb-hover-bg)] hover:text-[var(--sb-text)]",
            ].join(" ")}
          >
            5 км
          </button>

          <button
            type="button"
            onClick={() =>
              onRadiusChange?.(
                10000
              )
            }
            aria-pressed={
              searchRadius ===
              10000
            }
            className={[
              "h-9 rounded-[10px]",
              "border border-[var(--sb-divider)]",
              "text-[12px] font-medium",
              "transition-colors duration-150",
              searchRadius ===
              10000
                ? "border-[#6FC9C2] bg-[#6FC9C2]/10 text-[#6FC9C2]"
                : "text-[var(--sb-text-muted)] hover:bg-[var(--sb-hover-bg)] hover:text-[var(--sb-text)]",
            ].join(" ")}
          >
            10 км
          </button>
        </div>

        <div className="mt-2 text-[10px] leading-4 text-[var(--sb-text-muted)]">
          Поиск объявлений вокруг вашего местоположения
        </div>
      </div>
    </div>
  );
}

export default memo(
  MapLayersWorkspace
);