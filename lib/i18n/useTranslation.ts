"use client";

/**
 * useTranslation.ts
 * ------------------------------------------------------------
 * const { t, language, setLanguage } = useTranslation();
 * t("sidebar.sections.rental")
 *
 * t() принимает только реально существующие в словаре пути
 * (проверяется типом NestedKeyOf<Locale> на этапе компиляции),
 * так что опечатка в ключе — это ошибка TypeScript, а не пустая
 * строка в рантайме.
 * ------------------------------------------------------------
 */
import { useCallback } from "react";
import { useLanguageContext } from "./provider";
import { ru, type Locale } from "./locales/ru";
import { en } from "./locales/en";
import { ky } from "./locales/ky";

const dictionaries: Record<"ru" | "en" | "ky", Locale> = { ru, en, ky };

type NestedKeyOf<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${NestedKeyOf<T[K]>}`;
}[keyof T & string];

export type TranslationKey = NestedKeyOf<Locale>;

function resolvePath(dictionary: Locale, path: TranslationKey): string {
  const segments = path.split(".");
  let current: unknown = dictionary;

  for (const segment of segments) {
    if (typeof current === "object" && current !== null && segment in current) {
      current = (current as Record<string, unknown>)[segment];
    } else {
      return path;
    }
  }

  return typeof current === "string" ? current : path;
}

export function useTranslation() {
  const { language, setLanguage } = useLanguageContext();

  const t = useCallback(
    (key: TranslationKey): string => resolvePath(dictionaries[language], key),
    [language]
  );

  return { t, language, setLanguage };
}
