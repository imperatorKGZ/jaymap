"use client";

/**
 * Sidebar.tsx
 * ------------------------------------------------------------
 * Корневой компонент. Собирает рейку навигации + рабочую область
 * в единую плавающую панель — в том же визуальном языке, что и
 * Navbar (стеклянный, плавающий, со скруглениями, не касается
 * краёв экрана).
 *
 * Ничего не хардкодит: список разделов приходит из sidebarConfig.tsx,
 * иконки — из IconRenderer, рабочие области — из WorkspaceRenderer.
 * ------------------------------------------------------------
 */
import { useCallback, useEffect, useRef } from "react";
import { getSectionById, mainSections, secondarySections } from "./sidebarConfig";
import { useSidebarState } from "./useSidebarState";
import { SidebarNavigation } from "./SidebarNavigation";
import { SidebarFooter } from "./SidebarFooter";
import { SidebarWorkspace } from "./SidebarWorkspace";
import { SidebarOverlay } from "./SidebarOverlay";
import { IconRenderer } from "./IconRenderer";
import { MenuRailIcon, ChevronLeftIcon } from "./icons";
import { useTranslation } from "@/lib/i18n";
import "./theme.css";

export type SidebarTheme = "dark" | "light" | "custom";

interface SidebarProps {
  theme?: SidebarTheme;
  /** Вызывается при нажатии "Показать объекты" — прокинуть в карту/список. */
  onApplyFilters?: (sectionId: string, filters: Record<string, unknown>) => void;
}

const RAIL_WIDTH = 56; // px, свёрнутое состояние
const PANEL_WIDTH = 360; // px, раскрытое состояние
const CONTENT_WIDTH = PANEL_WIDTH - RAIL_WIDTH;

export default function Sidebar({ theme = "dark", onApplyFilters }: SidebarProps) {
  const { t } = useTranslation();

  const handleApplyDefault = useCallback((sectionId: string, filters: Record<string, unknown>) => {
    // Дефолтное поведение, если onApplyFilters не передан (например, когда
    // родитель — серверный компонент и не может передать функцию через границу).
    // eslint-disable-next-line no-console
    console.log("[Sidebar] apply", sectionId, filters);
  }, []);
  const applyFilters = onApplyFilters ?? handleApplyDefault;

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
    getSectionFilters,
    setFilter,
    breakpoint,
    mobileOpen,
    setMobileOpen,
  } = state;

  const activeMainSection = getSectionById(activeMainId);
  const secondarySection = getSectionById(secondaryId);

  const isOverlayMode = breakpoint !== "desktop";

  // На tablet/mobile "раскрыть" сайдбар = вынести его поверх карты.
  const expanded = isOverlayMode ? mobileOpen : !collapsed;

  const handleSelectMain = useCallback(
    (id: string) => {
      openMain(id);
      if (isOverlayMode) setMobileOpen(true);
    },
    [openMain, isOverlayMode, setMobileOpen]
  );

  const handleSelectSecondary = useCallback(
    (id: string) => {
      openSecondary(id);
      if (isOverlayMode) setMobileOpen(true);
    },
    [openSecondary, isOverlayMode, setMobileOpen]
  );

  const handleApply = useCallback(() => {
    if (activeMainSection) {
      const values = getSectionFilters(activeMainSection.id, {});
      applyFilters(activeMainSection.id, values);
      if (isOverlayMode) setMobileOpen(false);
    }
  }, [activeMainSection, getSectionFilters, applyFilters, isOverlayMode, setMobileOpen]);

  const handleCloseOverlay = useCallback(() => setMobileOpen(false), [setMobileOpen]);

  // --- Свайп для мобильного открытия (свайп от левого края экрана) ---
  const touchStartX = useRef<number | null>(null);
  useEffect(() => {
    if (breakpoint !== "mobile") return;
    const onTouchStart = (e: TouchEvent) => {
      const x = e.touches[0].clientX;
      if (x < 24) touchStartX.current = x;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (touchStartX.current === null) return;
      const dx = e.touches[0].clientX - touchStartX.current;
      if (dx > 60) {
        setMobileOpen(true);
        touchStartX.current = null;
      }
    };
    const onTouchEnd = () => {
      touchStartX.current = null;
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [breakpoint, setMobileOpen]);

  const panelWidth = expanded ? PANEL_WIDTH : RAIL_WIDTH;

  return (
    <div data-sidebar-theme={theme}>
      <SidebarOverlay visible={isOverlayMode && mobileOpen} onClose={handleCloseOverlay} />

      <aside
        aria-label={t("sidebar.panelLabel")}
        style={{
          width: panelWidth,
          position: "fixed",
          top: "20px",      // расстояние сверху
          left: "20px",     // расстояние слева
          bottom: "230px",   // расстояние снизу
          zIndex: 50,
        }}
        className={[
          "rounded-[var(--sb-radius-panel)] border border-[var(--sb-border)]",
          "bg-[var(--sb-bg)] shadow-[var(--sb-shadow)] backdrop-blur-[var(--sb-blur)]",
          "flex overflow-hidden",
          breakpoint === "mobile" && !mobileOpen
            ? "-translate-x-[calc(100%+40px)]"
            : "translate-x-0",
          "transition-transform duration-[220ms] ease-out",
        ].join(" ")}
      >
        {/* ===== Рейка (72px) — всегда видна, только иконки ===== */}
        <div
          style={{ width: RAIL_WIDTH }}
          className="flex h-full shrink-0 flex-col justify-between py-3 overflow-y-auto overflow-x-hidden scrollbar-none"
        >
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => (isOverlayMode ? setMobileOpen((v) => !v) : toggleCollapsed())}
              aria-label={expanded ? t("sidebar.collapsePanel") : t("sidebar.expandPanel")}
              aria-expanded={expanded}
              className="mx-auto flex h-11 w-11 items-center justify-center rounded-full text-[var(--sb-icon-idle)] transition-colors duration-150 hover:bg-[var(--sb-hover-bg)] hover:text-[var(--sb-icon-hover)]"
            >
              <IconRenderer icon={expanded ? ChevronLeftIcon : MenuRailIcon} size={20} />
            </button>

            <SidebarNavigation sections={mainSections} activeId={activeMainId} onSelect={handleSelectMain} />
          </div>

          <SidebarFooter sections={secondarySections} activeId={secondaryId} onSelect={handleSelectSecondary} />
        </div>

        {/* ===== Рабочая область (288px) — видна только в раскрытом состоянии ===== */}
        <div
          style={{ width: CONTENT_WIDTH }}
          aria-hidden={!expanded}
          className={[
            "h-full shrink-0 border-l border-[var(--sb-divider)]",
            "transition-[transform,opacity] duration-[250ms] ease-out will-change-transform",
            expanded ? "translate-x-0 opacity-100" : "pointer-events-none translate-x-[-24px] opacity-0",
          ].join(" ")}
        >
          <SidebarWorkspace
            mainSections={mainSections}
            activeMainSection={activeMainSection}
            secondarySection={secondarySection}
            state={{
              openMain: handleSelectMain,
              closeMain,
              closeSecondary,
              getSectionFilters,
              setFilter,
            }}
            onApply={handleApply}
          />
        </div>
      </aside>
    </div>
  );
}
