"use client";

import { ReactNode } from "react";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <FavoritesProvider>
        {children}
      </FavoritesProvider>
    </LanguageProvider>
  );
}
