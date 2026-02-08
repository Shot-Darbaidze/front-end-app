"use client";

import { ReactNode } from "react";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <FavoritesProvider>
          {children}
        </FavoritesProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
