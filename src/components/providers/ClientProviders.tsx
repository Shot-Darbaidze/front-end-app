"use client";

import { ReactNode } from "react";
import { LanguageProvider } from "@/contexts/LanguageContext";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { QueryProvider } from "@/providers/QueryProvider";
import type { Locale } from "@/lib/i18n";

export default function ClientProviders({ children, locale }: { children: ReactNode; locale?: Locale }) {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <LanguageProvider initialLocale={locale}>
          {children}
        </LanguageProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}
