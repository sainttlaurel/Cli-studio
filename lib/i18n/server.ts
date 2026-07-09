import { Locale, defaultTranslations, Translations } from './types';

// Constants
const DEFAULT_LOCALE: Locale = 'en';
const SUPPORTED_LOCALES: Locale[] = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh'];

// Get translations on server
export function getTranslations(locale: Locale = DEFAULT_LOCALE): Translations {
  return defaultTranslations[locale] ?? defaultTranslations[DEFAULT_LOCALE] as Translations;
}

// Get supported locales
export function getSupportedLocales(): Locale[] {
  return SUPPORTED_LOCALES;
}

// Get default locale
export function getDefaultLocale(): Locale {
  return DEFAULT_LOCALE;
}
