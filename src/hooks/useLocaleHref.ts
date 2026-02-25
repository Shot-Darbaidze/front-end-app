"use client";

import { usePathname } from "next/navigation";
import { getLocaleFromPathname, defaultLocale } from "@/lib/i18n";

/**
 * Returns a function that prefixes a path with the current locale.
 * Usage: const localeHref = useLocaleHref();
 *        <Link href={localeHref("/find-instructors")} />
 */
export function useLocaleHref() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname) ?? defaultLocale;

  return (path: string) => {
    if (path === "/") return `/${locale}`;
    return `/${locale}${path}`;
  };
}
