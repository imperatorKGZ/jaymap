"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type SidebarTheme =
  | "dark"
  | "light"
  | "custom";

const STORAGE_KEY =
  "jaymap-sidebar-theme";

const DEFAULT_THEME: SidebarTheme =
  "dark";

const SUPPORTED_THEMES: readonly SidebarTheme[] = [
  "dark",
  "light",
  "custom",
];

function isSidebarTheme(
  value: string | null
): value is SidebarTheme {
  return (
    value !== null &&
    (
      SUPPORTED_THEMES as readonly string[]
    ).includes(value)
  );
}

interface SettingsContextValue {
  theme: SidebarTheme;
  setTheme: (
    theme: SidebarTheme
  ) => void;
}

const SettingsContext =
  createContext<SettingsContextValue | null>(
    null
  );

export function SettingsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [
    theme,
    setThemeState,
  ] = useState<SidebarTheme>(
    DEFAULT_THEME
  );

  useEffect(() => {
    try {
      const stored =
        window.localStorage.getItem(
          STORAGE_KEY
        );

      if (isSidebarTheme(stored)) {
        setThemeState(stored);
      }
    } catch {
      // localStorage может быть недоступен.
      // В этом случае остаёмся на теме по умолчанию.
    }
  }, []);

  const setTheme = useCallback(
    (nextTheme: SidebarTheme) => {
      setThemeState(nextTheme);

      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          nextTheme
        );
      } catch {
        // Игнорируем ошибку хранения.
        // Тема всё равно применяется в рамках текущей сессии.
      }
    },
    []
  );

  const value =
    useMemo<SettingsContextValue>(
      () => ({
        theme,
        setTheme,
      }),
      [
        theme,
        setTheme,
      ]
    );

  return (
    <SettingsContext.Provider
      value={value}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const context =
    useContext(SettingsContext);

  if (!context) {
    throw new Error(
      "useSettings must be used within a SettingsProvider"
    );
  }

  return context;
}