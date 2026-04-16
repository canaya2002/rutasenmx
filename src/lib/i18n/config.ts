export const defaultLocale = 'es' as const;
export const locales = ['es', 'en'] as const;
export type Locale = (typeof locales)[number];

export function isValidLocale(locale: string): locale is Locale {
  return (locales as readonly string[]).includes(locale);
}
