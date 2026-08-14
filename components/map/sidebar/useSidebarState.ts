/**
 * useSidebarState.ts
 * ------------------------------------------------------------
 * Вся логика состояния Sidebar в одном хуке:
 *  - collapsed / expanded
 *  - активный ОСНОВНОЙ раздел (режим приложения)
 *  - открытый ВСПОМОГАТЕЛЬНЫЙ раздел (оверлей поверх рабочей области,
 *    никогда не уничтожает состояние основного раздела)
 *  - хранилище фильтров по разделам (не теряется при переключениях)
 *  - адаптивность (desktop / tablet / mobile)
 * ------------------------------------------------------------
 */
import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";

export type Breakpoint = "desktop" | "tablet" | "mobile";

function getBreakpoint(width: number): Breakpoint {
  if (width < 768) return "mobile";
  if (width < 1200) return "tablet";
  return "desktop";
}

export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>(() =>
    typeof window === "undefined" ? "desktop" : getBreakpoint(window.innerWidth)
  );

  useEffect(() => {
    const onResize = () => setBp(getBreakpoint(window.innerWidth));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return bp;
}

export interface SidebarState {
  collapsed: boolean;
  toggleCollapsed: () => void;
  setCollapsed: (v: boolean) => void;

  activeMainId: string | null;
  openMain: (id: string) => void;
  closeMain: () => void;

  secondaryId: string | null;
  openSecondary: (id: string) => void;
  closeSecondary: () => void;

  filters: Record<string, Record<string, unknown>>;
  setFilter: (sectionId: string, key: string, value: unknown) => void;
  getSectionFilters: <T extends Record<string, unknown>>(sectionId: string, defaults: T) => T;

  breakpoint: Breakpoint;
  mobileOpen: boolean;
  setMobileOpen: Dispatch<SetStateAction<boolean>>;
}

export function useSidebarState(initialCollapsed = false): SidebarState {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [activeMainId, setActiveMainId] = useState<string | null>(null);
  const [secondaryId, setSecondaryId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, Record<string, unknown>>>({});
  const [mobileOpen, setMobileOpen] = useState(false);
  const breakpoint = useBreakpoint();

  const toggleCollapsed = useCallback(() => setCollapsed((v) => !v), []);

  const openMain = useCallback((id: string) => {
    setActiveMainId(id);
    setSecondaryId(null); // основной раздел — новый рабочий контекст
    setCollapsed(false);
  }, []);

  const closeMain = useCallback(() => {
    setActiveMainId(null);
    setSecondaryId(null);
  }, []);

  const openSecondary = useCallback((id: string) => {
    // Вспомогательный раздел — оверлей. activeMainId и его filters НЕ трогаем.
    setSecondaryId(id);
    setCollapsed(false);
  }, []);

  const closeSecondary = useCallback(() => setSecondaryId(null), []);

  const setFilter = useCallback((sectionId: string, key: string, value: unknown) => {
    setFilters((prev) => ({
      ...prev,
      [sectionId]: { ...prev[sectionId], [key]: value },
    }));
  }, []);

  const getSectionFilters = useCallback(
    <T extends Record<string, unknown>>(sectionId: string, defaults: T): T => {
      return { ...defaults, ...(filters[sectionId] as T | undefined) };
    },
    [filters]
  );

  return useMemo(
    () => ({
      collapsed,
      toggleCollapsed,
      setCollapsed,
      activeMainId,
      openMain,
      closeMain,
      secondaryId,
      openSecondary,
      closeSecondary,
      filters,
      setFilter,
      getSectionFilters,
      breakpoint,
      mobileOpen,
      setMobileOpen,
    }),
    [
      collapsed,
      toggleCollapsed,
      activeMainId,
      openMain,
      closeMain,
      secondaryId,
      openSecondary,
      closeSecondary,
      filters,
      setFilter,
      getSectionFilters,
      breakpoint,
      mobileOpen,
    ]
  );
}
