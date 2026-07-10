'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Locale, defaultTranslations, Translations } from './types';

// Constants
const LOCALE_STORAGE_KEY = 'clickstudio-locale';
const DEFAULT_LOCALE: Locale = 'en';
const SUPPORTED_LOCALES: Locale[] = ['en', 'es', 'fr'];

// Context type
interface I18nContextType {
  locale: Locale;
  translations: Translations;
  setLocale: (locale: Locale) => void;
  t: <K extends keyof Translations>(key: K) => Translations[K];
  n: (path: string) => string;
}

// Create context
const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Provider component
interface I18nProviderProps {
  children: ReactNode;
  initialLocale?: Locale;
}

export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale ?? DEFAULT_LOCALE);

  // Initialize locale from localStorage on mount
  useEffect(() => {
    const savedLocale = typeof window !== 'undefined' ? localStorage.getItem(LOCALE_STORAGE_KEY) : null;
    if (savedLocale && SUPPORTED_LOCALES.includes(savedLocale as Locale)) {
      setLocaleState(savedLocale as Locale);
    } else {
      // Try to detect browser locale
      const browserLocale = typeof window !== 'undefined' ? window.navigator.language.split('-')[0] : null;
      if (browserLocale && SUPPORTED_LOCALES.includes(browserLocale as Locale)) {
        setLocaleState(browserLocale as Locale);
      }
    }
  }, []);

  // Save locale to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    }
  }, [locale]);

  // Get translations for current locale
  const translations = defaultTranslations[locale] ?? defaultTranslations[DEFAULT_LOCALE] as Translations;

  // Translation function with nested path support
  const t = <K extends keyof Translations>(key: K): Translations[K] => {
    return translations[key];
  };

  // Helper to access nested translations safely
  const getNested = <T,>(obj: T, path: string): unknown => {
    return path.split('.').reduce((current: unknown, key: string) => {
      return current && typeof current === 'object' && key in current
        ? (current as Record<string, unknown>)[key]
        : undefined;
    }, obj as unknown);
  };

  // Nested translation function
  const n = (path: string): string => {
    const result = getNested(translations, path);
    return typeof result === 'string' ? result : path;
  };

  // Set locale handler
  const setLocale = (newLocale: Locale) => {
    if (SUPPORTED_LOCALES.includes(newLocale)) {
      setLocaleState(newLocale);
    }
  };

  const value: I18nContextType = {
    locale,
    translations,
    setLocale,
    t,
    n,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// Custom hook
export function useTranslations(): I18nContextType {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useTranslations must be used within an I18nProvider');
  }
  return context;
}

// Helper function to get translations on server
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
