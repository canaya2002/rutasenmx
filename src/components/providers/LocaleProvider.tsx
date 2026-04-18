'use client';

import { createContext, useContext, useCallback, useMemo } from 'react';
import type { Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/dictionaries';

interface LocaleContextType {
  locale: Locale;
  dictionary: Dictionary;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextType | null>(null);

export function LocaleProvider({
  locale,
  dictionary,
  children,
}: {
  locale: Locale;
  dictionary: Dictionary;
  children: React.ReactNode;
}) {
  // Locale changes always go through a full page reload, so we derive the
  // exposed context directly from the props coming in from the server.
  const setLocale = useCallback((newLocale: Locale) => {
    document.cookie = `rutasmx_locale=${newLocale};path=/;max-age=${365 * 24 * 60 * 60};samesite=lax`;
    window.location.reload();
  }, []);

  const value = useMemo<LocaleContextType>(
    () => ({ locale, dictionary, setLocale }),
    [locale, dictionary, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}

export function useTranslation() {
  const { dictionary } = useLocale();
  return dictionary;
}
