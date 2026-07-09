'use client';

import { useState, useEffect } from 'react';
import { useTranslations, getSupportedLocales } from '@/lib/i18n';
import { Globe } from 'lucide-react';

const LOCALE_LABELS: Record<string, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  pt: 'Português',
  ja: '日本語',
  ko: '한국어',
  zh: '中文',
};

// Unified language dropdown component that works on click
export function LanguageDropdown({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useTranslations();
  const supportedLocales = getSupportedLocales();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          inline-flex items-center gap-1.5 px-2 py-1.5 text-xs font-semibold text-muted-foreground
          transition-colors hover:bg-secondary/50 hover:text-primary rounded-lg sm:px-3
          ${compact ? 'hidden sm:inline-flex' : 'inline-flex'}
        `}
      >
        <Globe size={compact ? 14 : 16} />
        {!compact && <span className="hidden sm:inline">{t('settings').language}</span>}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-1 w-40 rounded-xl bg-background shadow-2xl border border-border py-2 z-50">
            <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              {t('settings').language}
            </div>
            <div className="border-t border-border/50 my-1" />
            {supportedLocales.map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => {
                  setLocale(loc);
                  setIsOpen(false);
                }}
                className={`
                  w-full px-3 py-2 text-sm text-foreground hover:bg-secondary/50
                  transition-colors flex items-center justify-between
                  ${locale === loc ? 'bg-secondary/30 font-semibold' : ''}
                `}
              >
                <span>{LOCALE_LABELS[loc] ?? loc}</span>
                {locale === loc && (
                  <span className="text-primary text-xs font-bold">●</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Backward compatibility - alias LanguageDropdown as LanguageSwitcher
export const LanguageSwitcher = LanguageDropdown;
