'use client';

import { createContext, useContext, useCallback, useState, useEffect } from 'react';
import type { Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/dictionaries';

interface LocaleContextType {
  locale: Locale;
  dictionary: Dictionary;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextType | null>(null);

export function LocaleProvider({
  locale: initialLocale,
  dictionary: initialDictionary,
  children,
}: {
  locale: Locale;
  dictionary: Dictionary;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState(initialLocale);
  const [dictionary, setDictionary] = useState(initialDictionary);

  // Keep state in sync with server-provided props (e.g. after a full page reload
  // when the cookie has changed and the server passes the new locale/dictionary).
  useEffect(() => {
    setLocaleState(initialLocale);
    setDictionary(initialDictionary);
  }, [initialLocale, initialDictionary]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    // Set cookie for persistence
    document.cookie = `rutasmx_locale=${newLocale};path=/;max-age=${365 * 24 * 60 * 60};samesite=lax`;
    // Reload to get new server-rendered content with the updated locale
    window.location.reload();
  }, []);

  return (
    <LocaleContext.Provider value={{ locale, dictionary, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
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
