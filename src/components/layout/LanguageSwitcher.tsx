'use client';

import { useLocale } from '@/components/providers/LocaleProvider';

const LOCALE_LABELS: Record<string, string> = {
  es: 'ES',
  en: 'EN',
};

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <button
      type="button"
      onClick={() => setLocale(locale === 'es' ? 'en' : 'es')}
      className="flex items-center gap-1 rounded-full border border-white/15 bg-black/50 px-2.5 py-1 text-xs font-medium text-white shadow-lg shadow-black/20 backdrop-blur-xl transition hover:bg-black/60"
      aria-label={locale === 'es' ? 'Switch to English' : 'Cambiar a español'}
    >
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A9.015 9.015 0 003 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
      {LOCALE_LABELS[locale === 'es' ? 'en' : 'es']}
    </button>
  );
}
