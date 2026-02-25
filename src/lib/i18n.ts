export const locales = ["ka", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ka";

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

/**
 * Extract locale from a pathname. Returns null if no valid locale prefix found.
 */
export function getLocaleFromPathname(pathname: string): Locale | null {
  const segments = pathname.split("/");
  const maybeLocale = segments[1];
  if (maybeLocale && isValidLocale(maybeLocale)) {
    return maybeLocale;
  }
  return null;
}

/**
 * Remove the locale prefix from a pathname.
 * "/ka/find-instructors" → "/find-instructors"
 * "/en" → "/"
 */
export function removeLocaleFromPathname(pathname: string): string {
  const locale = getLocaleFromPathname(pathname);
  if (!locale) return pathname;
  const withoutLocale = pathname.replace(`/${locale}`, "") || "/";
  return withoutLocale;
}

/**
 * Add a locale prefix to a pathname.
 * "/find-instructors" → "/ka/find-instructors"
 */
export function addLocaleToPathname(pathname: string, locale: Locale): string {
  // Don't double-prefix
  if (getLocaleFromPathname(pathname)) {
    return pathname;
  }
  if (pathname === "/") return `/${locale}`;
  return `/${locale}${pathname}`;
}
