"use client";

/**
 * Sidebar.tsx
 * ------------------------------------------------------------
 * Корневой компонент Sidebar.
 *
 * Основная схема применения фильтров:
 *
 * Workspace
 *    ↓
 * draftFilters
 *    ↓
 * Apply
 *    ↓
 * validate
 *    ↓
 * normalize
 *    ↓
 * appliedFilters
 *    ↓
 * onApplyFilters
 *
 * Визуальная архитектура Sidebar сохраняется:
 * - rail
 * - expanded panel
 * - desktop/tablet/mobile
 * - secondary overlays
 * - lazy workspaces
 * ------------------------------------------------------------
 */

import { useCallback, useEffect, useRef, useState } from "react";

import {
  getSectionById,
  mainSections,
  secondarySections,
} from "./sidebarConfig";

import { useSidebarState } from "./useSidebarState";

import { SidebarNavigation } from "./SidebarNavigation";
import { SidebarFooter } from "./SidebarFooter";
import { SidebarWorkspace } from "./SidebarWorkspace";
import { SidebarOverlay } from "./SidebarOverlay";
import { IconRenderer } from "./IconRenderer";
import {
  MenuRailIcon,
  ChevronLeftIcon,
} from "./icons";

import { useTranslation } from "@/lib/i18n";

import "./theme.css";

export type SidebarTheme =
  | "dark"
  | "light"
  | "custom";

interface SidebarProps {
  theme?: SidebarTheme;

  /**
   * Вызывается только после успешного:
   *
   * validate → normalize → applied
   */
  onApplyFilters?: (
    sectionId: string,
    filters: Record<string, unknown>
  ) => void;
}

const RAIL_WIDTH = 56;
const PANEL_WIDTH = 360;
const CONTENT_WIDTH = PANEL_WIDTH - RAIL_WIDTH;

export default function Sidebar({
  theme = "dark",
  onApplyFilters,
}: SidebarProps) {
  const { t } = useTranslation();

  const state = useSidebarState(true);

  const {
    collapsed,
    toggleCollapsed,

    activeMainId,
    openMain,
    closeMain,

    secondaryId,
    openSecondary,
    closeSecondary,

    setFilter,

    getSectionFilters,

    applyDraft,

    breakpoint,

    mobileOpen,
    setMobileOpen,
  } = state;

  const [validationError, setValidationError] =
    useState(false);

  const activeMainSection =
    getSectionById(activeMainId);

  const secondarySection =
    getSectionById(secondaryId);

  const isOverlayMode =
    breakpoint !== "desktop";

  /**
   * На tablet/mobile Sidebar раскрывается поверх карты.
   */
  const expanded = isOverlayMode
    ? mobileOpen
    : !collapsed;

  const handleSelectMain = useCallback(
    (id: string) => {
      setValidationError(false);

      openMain(id);

      if (isOverlayMode) {
        setMobileOpen(true);
      }
    },
    [
      openMain,
      isOverlayMode,
      setMobileOpen,
    ]
  );

  const handleSelectSecondary = useCallback(
    (id: string) => {
      setValidationError(false);

      openSecondary(id);

      if (isOverlayMode) {
        setMobileOpen(true);
      }
    },
    [
      openSecondary,
      isOverlayMode,
      setMobileOpen,
    ]
  );

  /**
   * Главная точка Apply.
   *
   * Никакого getSectionFilters() → API напрямую.
   *
   * Сначала state.applyDraft():
   *
   * draft
   * → validate
   * → normalize
   * → applied
   */
  const handleApply = useCallback(() => {
    if (!activeMainSection) {
      return;
    }

    const sectionId =
      activeMainSection.id;

    const result =
      applyDraft(sectionId);

    if (!result.valid) {
      /**
       * Пока не меняем систему i18n.
       * Просто показываем локальный browser-safe state.
       *
       * На следующем этапе сделаем полноценный
       * inline validation message с переводами.
       */
      setValidationError(true);

      console.warn(
        "[Sidebar] Invalid filters:",
        result.issues
      );

      return;
    }

    setValidationError(false);

    onApplyFilters?.(
      sectionId,
      result.filter
    );

    /**
     * На mobile после успешного Apply закрываем
     * overlay, чтобы пользователь снова видел карту.
     */
    if (isOverlayMode) {
      setMobileOpen(false);
    }
  }, [
    activeMainSection,
    applyDraft,
    onApplyFilters,
    isOverlayMode,
    setMobileOpen,
  ]);

  const handleCloseOverlay = useCallback(
    () => {
      setMobileOpen(false);
    },
    [setMobileOpen]
  );

  /**
   * Свайп от левого края для открытия Sidebar
   * на mobile.
   */
  const touchStartX =
    useRef<number | null>(null);

  useEffect(() => {
    if (breakpoint !== "mobile") {
      return;
    }

    const onTouchStart = (
      event: TouchEvent
    ) => {
      const x =
        event.touches[0]?.clientX ?? 0;

      if (x < 24) {
        touchStartX.current = x;
      }
    };

    const onTouchMove = (
      event: TouchEvent
    ) => {
      if (touchStartX.current === null) {
        return;
      }

      const currentX =
        event.touches[0]?.clientX ?? 0;

      const deltaX =
        currentX - touchStartX.current;

      if (deltaX > 60) {
        setMobileOpen(true);
        touchStartX.current = null;
      }
    };

    const onTouchEnd = () => {
      touchStartX.current = null;
    };

    window.addEventListener(
      "touchstart",
      onTouchStart,
      { passive: true }
    );

    window.addEventListener(
      "touchmove",
      onTouchMove,
      { passive: true }
    );

    window.addEventListener(
      "touchend",
      onTouchEnd
    );

    return () => {
      window.removeEventListener(
        "touchstart",
        onTouchStart
      );

      window.removeEventListener(
        "touchmove",
        onTouchMove
      );

      window.removeEventListener(
        "touchend",
        onTouchEnd
      );
    };
  }, [
    breakpoint,
    setMobileOpen,
  ]);

  const panelWidth =
    expanded
      ? PANEL_WIDTH
      : RAIL_WIDTH;

  return (
    <div data-sidebar-theme={theme}>
      <SidebarOverlay
        visible={
          isOverlayMode &&
          mobileOpen
        }
        onClose={
          handleCloseOverlay
        }
      />

      <aside
        aria-label={t("sidebar.panelLabel")}
        style={{
          width: panelWidth,
          position: "fixed",
          top: "20px",
          left: "20px",
          bottom: "230px",
          zIndex: 50,
        }}
        className={[
          "rounded-[var(--sb-radius-panel)]",
          "border border-[var(--sb-border)]",
          "bg-[var(--sb-bg)]",
          "shadow-[var(--sb-shadow)]",
          "backdrop-blur-[var(--sb-blur)]",
          "flex overflow-hidden",
          breakpoint === "mobile" &&
          !mobileOpen
            ? "-translate-x-[calc(100%+40px)]"
            : "translate-x-0",
          "transition-transform duration-[220ms] ease-out",
        ].join(" ")}
      >
        {/* ==================================================
            RAIL
            ================================================== */}

        <div
          style={{
            width: RAIL_WIDTH,
          }}
          className={[
            "flex h-full shrink-0",
            "flex-col justify-between",
            "py-3 overflow-y-auto",
            "overflow-x-hidden scrollbar-none",
          ].join(" ")}
        >
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                if (isOverlayMode) {
                  setMobileOpen(
                    (value) => !value
                  );
                } else {
                  toggleCollapsed();
                }
              }}
              aria-label={
                expanded
                  ? t(
                      "sidebar.collapsePanel"
                    )
                  : t(
                      "sidebar.expandPanel"
                    )
              }
              aria-expanded={expanded}
              className={[
                "mx-auto flex h-11 w-11",
                "items-center justify-center",
                "rounded-full",
                "text-[var(--sb-icon-idle)]",
                "transition-colors duration-150",
                "hover:bg-[var(--sb-hover-bg)]",
                "hover:text-[var(--sb-icon-hover)]",
              ].join(" ")}
            >
              <IconRenderer
                icon={
                  expanded
                    ? ChevronLeftIcon
                    : MenuRailIcon
                }
                size={20}
              />
            </button>

            <SidebarNavigation
              sections={mainSections}
              activeId={activeMainId}
              onSelect={
                handleSelectMain
              }
            />
          </div>

          <SidebarFooter
            sections={
              secondarySections
            }
            activeId={secondaryId}
            onSelect={
              handleSelectSecondary
            }
          />
        </div>

        {/* ==================================================
            WORKSPACE
            ================================================== */}

        <div
          style={{
            width: CONTENT_WIDTH,
          }}
          aria-hidden={!expanded}
          className={[
            "h-full shrink-0",
            "border-l border-[var(--sb-divider)]",
            "transition-[transform,opacity]",
            "duration-[250ms] ease-out",
            "will-change-transform",
            expanded
              ? "translate-x-0 opacity-100"
              : "pointer-events-none translate-x-[-24px] opacity-0",
          ].join(" ")}
        >
          {validationError && (
            <div
              role="alert"
              className={[
                "absolute",
                "left-[calc(100%-304px)]",
                "top-3",
                "z-10",
                "w-[288px]",
                "rounded-xl",
                "border",
                "border-red-300/50",
                "bg-red-50/95",
                "px-3.5",
                "py-2.5",
                "text-[12px]",
                "font-medium",
                "text-red-700",
                "shadow-lg",
              ].join(" ")}
            >
              Проверьте значения фильтров.
            </div>
          )}

          <SidebarWorkspace
            mainSections={
              mainSections
            }
            activeMainSection={
              activeMainSection
            }
            secondarySection={
              secondarySection
            }
            state={{
              openMain:
                handleSelectMain,
              closeMain,
              closeSecondary,
              getSectionFilters,
              setFilter,
            }}
            onApply={
              handleApply
            }
          />
        </div>
      </aside>
    </div>
  );
}