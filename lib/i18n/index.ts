/**
 * index.ts — единая точка входа в легковесную систему локализации.
 *
 * Использование:
 *   import { LanguageProvider } from "@/lib/i18n";       // один раз, в RootLayout
 *   import { useTranslation } from "@/lib/i18n";         // в любом клиентском компоненте
 */
export { LanguageProvider, SUPPORTED_LANGUAGES } from "./provider";
export type { Language } from "./provider";
export { useTranslation } from "./useTranslation";
export type { TranslationKey } from "./useTranslation";
export type { Locale } from "./locales/ru";
