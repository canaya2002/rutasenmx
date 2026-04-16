import { cookies, headers } from 'next/headers';
import { defaultLocale, type Locale, isValidLocale } from './config';
import { getDictionary } from './dictionaries';

const LOCALE_COOKIE = 'rutasmx_locale';

/**
 * Get the current locale from the request (cookie or header).
 * Use this in server components and server actions.
 */
export async function getLocale(): Promise<Locale> {
  // Try cookie first
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  if (cookieLocale && isValidLocale(cookieLocale)) {
    return cookieLocale;
  }

  // Try middleware-set header
  const headerStore = await headers();
  const headerLocale = headerStore.get('x-locale');
  if (headerLocale && isValidLocale(headerLocale)) {
    return headerLocale;
  }

  return defaultLocale;
}

/**
 * Get the dictionary for the current request locale.
 */
export async function getTranslations() {
  const locale = await getLocale();
  return getDictionary(locale);
}
