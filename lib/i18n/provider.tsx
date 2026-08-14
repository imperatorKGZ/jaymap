"use client";

/**
 * provider.tsx
 * ------------------------------------------------------------
 * Единственный React-контекст, который нужно добавить в RootLayout.
 * Ничего больше в Layout менять не нужно.
 *
 * Отвечает только за:
 *  - хранение текущего языка (localStorage, ключ "jaymap-language");
 *  - синхронизацию <html lang="...">;
 *  - раздачу { language, setLanguage } через контекст.
 *
 * Сами переводы и хук t() находятся в useTranslation.ts —
 * этот файл про язык, а не про строки.
 * ------------------------------------------------------------
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Language = "ru" | "en" | "ky";

export const SUPPORTED_LANGUAGES: readonly Language[] = ["ru", "en", "ky"];
const STORAGE_KEY = "jaymap-language";
const DEFAULT_LANGUAGE: Language = "ru";

function isLanguage(value: string | null): value is Language {
  return value !== null && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);

  // При первом монтировании на клиенте читаем сохранённый язык.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (isLanguage(stored)) {
        setLanguageState(stored);
      }
    } catch {
      // localStorage может быть недоступен (приватный режим и т.п.) —
      // в этом случае просто остаёмся на языке по умолчанию.
    }
  }, []);

  // Синхронизируем <html lang="..."> при каждой смене языка.
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Игнорируем ошибки хранения — язык всё равно применится в рамках сессии.
    }
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({ language, setLanguage }),
    [language, setLanguage]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguageContext(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguageContext must be used within a LanguageProvider");
  }
  return ctx;
}
