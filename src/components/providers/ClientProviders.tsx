"use client";

import { ReactNode } from "react";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import type { Locale } from "@/lib/i18n";

export default function ClientProviders({ children, locale }: { children: ReactNode; locale?: Locale }) {
  return (
    <ErrorBoundary>
      <LanguageProvider initialLocale={locale}>
        <FavoritesProvider>
          {children}
        </FavoritesProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
