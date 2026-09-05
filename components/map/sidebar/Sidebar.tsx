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

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getSectionById,
  mainSections,
  secondarySections,
} from "./sidebarConfig";

import {
  useSidebarState,
} from "./useSidebarState";

import {
  SidebarNavigation,
} from "./SidebarNavigation";

import {
  SidebarFooter,
} from "./SidebarFooter";

import {
  SidebarWorkspace,
} from "./SidebarWorkspace";

import {
  SidebarOverlay,
} from "./SidebarOverlay";

import {
  IconRenderer,
} from "./IconRenderer";

import {
  MenuRailIcon,
  ChevronLeftIcon,
} from "./icons";

import {
  useTranslation,
} from "@/lib/i18n";

import {
  useSettings,
} from "@/lib/settings/provider";

import type {
  FavoriteListing,
  ListingHistoryItem,
} from "@/lib/supabase/api";

import {
  useResponsiveUIScale,
} from "@/components/layout/useResponsiveUIScale";

import type {
  SearchRadius,
} from "./WorkspaceRenderer";

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
    filters: Record<
      string,
      unknown
    >
  ) => void;

  /**
   * Вызывается при выборе объявления
   * из FavoritesWorkspace.
   */
  onFavoriteSelect?: (
    favorite: FavoriteListing
  ) => void;

  /**
   * Вызывается при выборе объявления
   * из HistoryWorkspace.
   */
  onHistorySelect?: (
    item: ListingHistoryItem
  ) => void;

  /**
   * Запускает инструмент
   * "Моё местоположение".
   */
  onLocateMe?: () => void;

  /**
   * Текущий радиус поиска
   * вокруг пользователя.
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
}

const RAIL_WIDTH = 56;

const PANEL_WIDTH = 360;

const CONTENT_WIDTH =
  PANEL_WIDTH -
  RAIL_WIDTH;

const SIDEBAR_TOP = 20;

const SIDEBAR_LEFT = 20;

const SIDEBAR_BOTTOM = 230;

export default function Sidebar({
  theme = "dark",

  onApplyFilters,

  onFavoriteSelect,

  onHistorySelect,

  onLocateMe,

  searchRadius,

  onRadiusChange,
}: SidebarProps) {
  const {
    t,
  } = useTranslation();

  const {
    theme: settingsTheme,
  } = useSettings();

  const uiScale =
    useResponsiveUIScale({
      mode: "sidebar",
    });

  const state =
    useSidebarState(
      true
    );

  const {
    collapsed,
    toggleCollapsed,
    setCollapsed,

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

  const [
    validationError,
    setValidationError,
  ] = useState(false);

  const activeMainSection =
    getSectionById(
      activeMainId
    );

  const secondarySection =
    getSectionById(
      secondaryId
    );

  const isOverlayMode =
    breakpoint !==
    "desktop";

  /**
   * На tablet/mobile Sidebar раскрывается поверх карты.
   */
  const expanded =
    isOverlayMode
      ? mobileOpen
      : !collapsed;

  const handleSelectMain =
    useCallback(
      (
        id: string
      ) => {
        setValidationError(
          false
        );

        /**
         * Повторное нажатие на уже активную категорию
         * закрывает Sidebar.
         *
         * Desktop:
         *   сворачиваем panel через collapsed.
         *
         * Tablet/mobile:
         *   закрываем overlay через mobileOpen.
         *
         * При этом activeMainId сбрасывается через closeMain().
         */
        if (
          activeMainId === id
        ) {
          closeMain();

          if (
            isOverlayMode
          ) {
            setMobileOpen(
              false
            );
          } else {
            setCollapsed(
              true
            );
          }

          return;
        }

        /**
         * Нажатие на другую категорию:
         * открываем существующий workspace.
         */
        openMain(id);

        if (
          isOverlayMode
        ) {
          setMobileOpen(
            true
          );
        }
      },
      [
        activeMainId,
        closeMain,
        openMain,
        isOverlayMode,
        setMobileOpen,
        setCollapsed,
      ]
    );

  useEffect(() => {
    const handleOpenSidebarSection = (
      event: Event
    ) => {
      const customEvent =
        event as CustomEvent<{
          sectionId?: string;
        }>;

      const sectionId =
        customEvent.detail?.sectionId;

      if (!sectionId) {
        return;
      }

      const isMainSection =
        mainSections.some(
          (section) =>
            section.id === sectionId
        );

      if (!isMainSection) {
        return;
      }

      handleSelectMain(sectionId);
    };

    window.addEventListener(
      "jaymap:open-sidebar-section",
      handleOpenSidebarSection
    );

    return () => {
      window.removeEventListener(
        "jaymap:open-sidebar-section",
        handleOpenSidebarSection
      );
    };
  }, [handleSelectMain]);

  const handleSelectSecondary =
    useCallback(
      (
        id: string
      ) => {
        setValidationError(
          false
        );

        openSecondary(id);

        if (
          isOverlayMode
        ) {
          setMobileOpen(
            true
          );
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
  const handleApply =
    useCallback(
      () => {
        if (
          !activeMainSection
        ) {
          return;
        }

        const sectionId =
          activeMainSection.id;

        const result =
          applyDraft(
            sectionId
          );

        if (
          !result.valid
        ) {
          setValidationError(
            true
          );

          console.warn(
            "[Sidebar] Invalid filters:",
            result.issues
          );

          return;
        }

        setValidationError(
          false
        );

        onApplyFilters?.(
          sectionId,
          result.filter
        );

        /**
         * На mobile после успешного Apply закрываем
         * overlay, чтобы пользователь снова видел карту.
         */
        if (
          isOverlayMode
        ) {
          setMobileOpen(
            false
          );
        }
      },
      [
        activeMainSection,
        applyDraft,
        onApplyFilters,
        isOverlayMode,
        setMobileOpen,
      ]
    );

  const handleCloseOverlay =
    useCallback(
      () => {
        setMobileOpen(
          false
        );
      },
      [
        setMobileOpen,
      ]
    );

  /**
   * Свайп от левого края для открытия Sidebar
   * на mobile.
   */
  const touchStartX =
    useRef<number | null>(
      null
    );

  useEffect(() => {
    if (
      breakpoint !==
      "mobile"
    ) {
      return;
    }

    const onTouchStart =
      (
        event: TouchEvent
      ) => {
        const x =
          event.touches[0]
            ?.clientX ??
          0;

        if (
          x < 24
        ) {
          touchStartX.current =
            x;
        }
      };

    const onTouchMove =
      (
        event: TouchEvent
      ) => {
        if (
          touchStartX.current ===
          null
        ) {
          return;
        }

        const currentX =
          event.touches[0]
            ?.clientX ??
          0;

        const deltaX =
          currentX -
          touchStartX.current;

        if (
          deltaX > 60
        ) {
          setMobileOpen(
            true
          );

          touchStartX.current =
            null;
        }
      };

    const onTouchEnd =
      () => {
        touchStartX.current =
          null;
      };

    window.addEventListener(
      "touchstart",
      onTouchStart,
      {
        passive: true,
      }
    );

    window.addEventListener(
      "touchmove",
      onTouchMove,
      {
        passive: true,
      }
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

  /**
   * =========================================================
   * RESPONSIVE GEOMETRY
   * =========================================================
   *
   * Мы масштабируем ВЕСЬ существующий Sidebar.
   *
   * При этом физические границы сохраняются:
   *
   * top    = 20px
   * left   = 20px
   * bottom = 230px
   *
   * Поэтому используем обратное масштабирование
   * CSS-размеров до transform.
   *
   * Пример при scale = 0.8:
   *
   * logical top:
   *   20 / 0.8 = 25
   *
   * после scale:
   *   25 × 0.8 = 20px
   *
   * Высота рассчитывается таким же образом.
   */
  const sidebarLogicalTop =
    SIDEBAR_TOP /
    uiScale;

  const sidebarLogicalLeft =
    SIDEBAR_LEFT /
    uiScale;

  const sidebarPhysicalHeight =
    `calc(100vh - ${
      SIDEBAR_TOP +
      SIDEBAR_BOTTOM
    }px)`;

  const sidebarLogicalHeight =
    `calc(${sidebarPhysicalHeight} / ${uiScale})`;

  /**
   * В мобильном закрытом состоянии раньше
   * Sidebar скрывался через Tailwind transform.
   *
   * Здесь этот transform собираем вручную,
   * чтобы одновременно сохранить:
   *
   * translateX
   * +
   * scale
   */
  const sidebarTransform =
    breakpoint ===
      "mobile" &&
    !mobileOpen
      ? `translateX(calc(-100% - 40px)) scale(${uiScale})`
      : `translateX(0) scale(${uiScale})`;

  return (
    <div
      data-sidebar-theme={
        settingsTheme
      }
    >
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
        aria-label={t(
          "sidebar.panelLabel"
        )}
        style={{
          width:
            panelWidth,

          height:
            sidebarLogicalHeight,

          position:
            "fixed",

          top:
            `${sidebarLogicalTop}px`,

          left:
            `${sidebarLogicalLeft}px`,

          zIndex:
            50,

          transform:
            sidebarTransform,

          transformOrigin:
            "top left",
        }}
        className={[
          "rounded-[var(--sb-radius-panel)]",
          "border border-[var(--sb-border)]",
          "bg-[var(--sb-bg)]",
          "shadow-[var(--sb-shadow)]",
          "backdrop-blur-[var(--sb-blur)]",
          "flex overflow-hidden",

          "transition-transform duration-[220ms] ease-out",
        ].join(" ")}
      >
        {/* ==================================================
            RAIL
            ================================================== */}

        <div
          style={{
            width:
              RAIL_WIDTH,
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
                if (
                  isOverlayMode
                ) {
                  setMobileOpen(
                    (
                      value
                    ) =>
                      !value
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
              aria-expanded={
                expanded
              }
              className={[
                "mx-auto flex h-11 w-11",
                "items-center justify-center",
                "rounded-full",
                "text-[var(--sb-icon-idle)]",
                "transition-colors duration-150",
                "hover:bg-[var(--sb-hover-bg)]",
                "hover:text-[var(--sb-icon-hover)]",
              ].join(
                " "
              )}
            >
              <IconRenderer
                icon={
                  expanded
                    ? ChevronLeftIcon
                    : MenuRailIcon
                }
                size={
                  20
                }
              />
            </button>

            <SidebarNavigation
              sections={
                mainSections
              }
              activeId={
                activeMainId
              }
              onSelect={
                handleSelectMain
              }
            />
          </div>

          <SidebarFooter
            sections={
              secondarySections
            }
            activeId={
              secondaryId
            }
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
            width:
              CONTENT_WIDTH,
          }}
          aria-hidden={
            !expanded
          }
          className={[
            "h-full shrink-0",
            "border-l border-[var(--sb-divider)]",
            "transition-[transform,opacity]",
            "duration-[250ms] ease-out",
            "will-change-transform",

            expanded
              ? "translate-x-0 opacity-100"
              : "pointer-events-none translate-x-[-24px] opacity-0",
          ].join(
            " "
          )}
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
              ].join(
                " "
              )}
            >
              Проверьте значения
              фильтров.
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
            onFavoriteSelect={
              onFavoriteSelect
            }
            onHistorySelect={
              onHistorySelect
            }
            onLocateMe={
              onLocateMe
            }
            searchRadius={
              searchRadius
            }
            onRadiusChange={
              onRadiusChange
            }
          />
        </div>
      </aside>
    </div>
  );
}