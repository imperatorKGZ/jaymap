/**
 * useSidebarState.ts
 * ------------------------------------------------------------
 * Центральное состояние Sidebar.
 *
 * Здесь разделены:
 *
 * 1. draftFilters
 *    То, что пользователь сейчас редактирует в интерфейсе.
 *
 * 2. appliedFilters
 *    Последняя успешно применённая и нормализованная версия
 *    фильтров, которая была отправлена наружу.
 *
 * Поэтому:
 *
 * изменение контролов
 *      ↓
 * draft
 *
 * Apply
 *      ↓
 * validation
 *      ↓
 * normalization
 *      ↓
 * applied
 *
 * Cancel
 *      ↓
 * последний успешный draft
 *
 * Reset
 *      ↓
 * defaults
 * ------------------------------------------------------------
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import {
  normalizeFilter,
} from "@/lib/filters/normalize";

import {
  validateWorkspaceFilters,
  type ValidationIssue,
} from "@/lib/filters/validators";

import type {
  ListingsFilter,
} from "@/lib/filters/types";

export type Breakpoint = "desktop" | "tablet" | "mobile";

function getBreakpoint(width: number): Breakpoint {
  if (width < 768) return "mobile";
  if (width < 1200) return "tablet";
  return "desktop";
}

export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>(() =>
    typeof window === "undefined"
      ? "desktop"
      : getBreakpoint(window.innerWidth)
  );

  useEffect(() => {
    const onResize = () => {
      setBp(getBreakpoint(window.innerWidth));
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return bp;
}

type SectionFilters = Record<string, unknown>;
type FiltersStore = Record<string, SectionFilters>;
type AppliedFiltersStore = Record<string, ListingsFilter>;

export interface ApplyDraftSuccess {
  valid: true;
  filter: ListingsFilter;
  issues: [];
}

export interface ApplyDraftFailure {
  valid: false;
  filter: null;
  issues: ValidationIssue[];
}

export type ApplyDraftResult =
  | ApplyDraftSuccess
  | ApplyDraftFailure;

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

  /**
   * Backward-compatible alias.
   *
   * Старые компоненты Sidebar пока используют `filters`.
   * На этом этапе он указывает на draftFilters.
   */
  filters: FiltersStore;

  /**
   * Текущие значения, которые пользователь редактирует.
   */
  draftFilters: FiltersStore;

  /**
   * Последние успешно применённые фильтры
   * уже в canonical backend формате.
   */
  appliedFilters: AppliedFiltersStore;

  /**
   * Изменение одного значения draft.
   */
  setFilter: (
    sectionId: string,
    key: string,
    value: unknown
  ) => void;

  /**
   * Получение draft-значений конкретного workspace
   * поверх переданных defaults.
   */
  getSectionFilters: <T extends Record<string, unknown>>(
    sectionId: string,
    defaults: T
  ) => T;

  /**
   * Проверяет и применяет draft.
   *
   * В случае успеха:
   * draft → normalize → applied
   */
  applyDraft: (
    sectionId: string
  ) => ApplyDraftResult;

  /**
   * Сбрасывает draft конкретного workspace в defaults.
   * Applied filters НЕ изменяются.
   */
  resetDraft: <T extends Record<string, unknown>>(
    sectionId: string,
    defaults: T
  ) => void;

  /**
   * Возвращает draft конкретного workspace
   * к последнему успешно применённому UI-состоянию.
   */
  cancelDraft: (
    sectionId: string
  ) => void;

  breakpoint: Breakpoint;

  mobileOpen: boolean;
  setMobileOpen: Dispatch<SetStateAction<boolean>>;
}

export function useSidebarState(
  initialCollapsed = false
): SidebarState {
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  const [activeMainId, setActiveMainId] = useState<string | null>(
    null
  );

  const [secondaryId, setSecondaryId] = useState<string | null>(
    null
  );

  /**
   * Current editable UI values.
   */
  const [draftFilters, setDraftFilters] =
    useState<FiltersStore>({});

  /**
   * Last successful normalized backend filters.
   */
  const [appliedFilters, setAppliedFilters] =
    useState<AppliedFiltersStore>({});

  /**
   * Raw UI snapshot from the last successful Apply.
   *
   * Почему это отдельно:
   *
   * UI хранит значения вроде:
   *   priceMin = "40 000"
   *
   * а canonical filter хранит:
   *   priceMin = 40000
   *
   * Cancel должен восстановить именно UI-состояние,
   * поэтому одного appliedFilters недостаточно.
   */
  const [lastAppliedDrafts, setLastAppliedDrafts] =
    useState<FiltersStore>({});

  const [mobileOpen, setMobileOpen] = useState(false);

  const breakpoint = useBreakpoint();

  const toggleCollapsed = useCallback(() => {
    setCollapsed((value) => !value);
  }, []);

  const openMain = useCallback((id: string) => {
    setActiveMainId(id);

    /**
     * При открытии основного раздела закрываем secondary overlay,
     * но НИЧЕГО не удаляем из draft/applied state.
     */
    setSecondaryId(null);

    /**
     * Основной раздел должен быть раскрыт.
     */
    setCollapsed(false);
  }, []);

  const closeMain = useCallback(() => {
    setActiveMainId(null);
    setSecondaryId(null);
  }, []);

  const openSecondary = useCallback((id: string) => {
    /**
     * Secondary section — overlay.
     *
     * activeMainId и его фильтры остаются нетронутыми.
     */
    setSecondaryId(id);

    setCollapsed(false);
  }, []);

  const closeSecondary = useCallback(() => {
    setSecondaryId(null);
  }, []);

  const setFilter = useCallback(
    (
      sectionId: string,
      key: string,
      value: unknown
    ) => {
      setDraftFilters((previous) => ({
        ...previous,

        [sectionId]: {
          ...(previous[sectionId] ?? {}),
          [key]: value,
        },
      }));
    },
    []
  );

  const getSectionFilters = useCallback(
    <T extends Record<string, unknown>>(
      sectionId: string,
      defaults: T
    ): T => {
      return {
        ...defaults,
        ...(draftFilters[sectionId] as Partial<T> | undefined),
      };
    },
    [draftFilters]
  );

  const applyDraft = useCallback(
    (sectionId: string): ApplyDraftResult => {
      const values = draftFilters[sectionId] ?? {};

      /**
       * 1. Validate raw UI state.
       */
      const validation = validateWorkspaceFilters(
        sectionId,
        values
      );

      if (!validation.valid) {
        return {
          valid: false,
          filter: null,
          issues: validation.issues,
        };
      }

      /**
       * 2. Convert UI values into canonical backend filter.
       */
      const normalized = normalizeFilter(
        sectionId,
        values
      );

      /**
       * 3. Store normalized filter as the last applied
       * backend state.
       */
      setAppliedFilters((previous) => ({
        ...previous,
        [sectionId]: normalized,
      }));

      /**
       * 4. Store a raw snapshot separately so Cancel can
       * restore the exact UI values.
       */
      setLastAppliedDrafts((previous) => ({
        ...previous,
        [sectionId]: {
          ...values,
        },
      }));

      return {
        valid: true,
        filter: normalized,
        issues: [],
      };
    },
    [draftFilters]
  );

  const resetDraft = useCallback(
    <T extends Record<string, unknown>>(
      sectionId: string,
      defaults: T
    ) => {
      /**
       * Reset affects ONLY draft.
       *
       * Последний Apply остаётся нетронутым.
       */
      setDraftFilters((previous) => ({
        ...previous,
        [sectionId]: {
          ...defaults,
        },
      }));
    },
    []
  );

  const cancelDraft = useCallback(
    (sectionId: string) => {
      const lastApplied = lastAppliedDrafts[sectionId];

      /**
       * Если Apply раньше не нажимался, просто ничего
       * не меняем. Workspace продолжает использовать defaults.
       */
      if (!lastApplied) {
        return;
      }

      setDraftFilters((previous) => ({
        ...previous,
        [sectionId]: {
          ...lastApplied,
        },
      }));
    },
    [lastAppliedDrafts]
  );

  /**
   * Старые части Sidebar пока используют `filters`.
   *
   * Оставляем alias на draftFilters, чтобы переход был
   * поэтапным и не ломал существующую UI-архитектуру.
   */
  const filters = draftFilters;

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
      draftFilters,
      appliedFilters,

      setFilter,
      getSectionFilters,

      applyDraft,
      resetDraft,
      cancelDraft,

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
      draftFilters,
      appliedFilters,
      setFilter,
      getSectionFilters,
      applyDraft,
      resetDraft,
      cancelDraft,
      breakpoint,
      mobileOpen,
    ]
  );
}