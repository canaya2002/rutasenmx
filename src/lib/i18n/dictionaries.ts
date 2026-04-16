import type { Locale } from './config';

const dictionaries = {
  es: () => import('./locales/es.json').then((m) => m.default),
  en: () => import('./locales/en.json').then((m) => m.default),
};

export async function getDictionary(locale: Locale) {
  return dictionaries[locale]();
}

export type Dictionary = Awaited<ReturnType<typeof getDictionary>>;
