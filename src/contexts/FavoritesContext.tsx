"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { useAuth as useClerkAuth } from "@clerk/nextjs";
import { API_CONFIG } from "@/config/constants";
import { logger } from "@/utils/secureLogger";

const FAVORITES_CACHE_KEY = "favorites-cache-v1";
const FAVORITES_CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const FAVORITES_TIMEOUT_MS = 5_000; // 5 seconds

interface FavoriteItem {
  id: string;
  post_id: string;
  created_at: string;
}

interface FavoritesContextType {
  favorites: Set<string>;
  isLoading: boolean;
  isFavorite: (postId: string) => boolean;
  toggleFavorite: (postId: string) => Promise<boolean>;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType>({
  favorites: new Set(),
  isLoading: false,
  isFavorite: () => false,
  toggleFavorite: async () => false,
  refreshFavorites: async () => { },
});

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { getToken, isSignedIn } = useClerkAuth();
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    // Initialize from cache for instant render
    if (typeof window === "undefined") return new Set();
    try {
      const cached = localStorage.getItem(FAVORITES_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as { ids?: string[]; timestamp?: number };
        if (parsed.timestamp && Date.now() - parsed.timestamp < FAVORITES_CACHE_TTL) {
          return new Set(parsed.ids || []);
        }
        localStorage.removeItem(FAVORITES_CACHE_KEY);
      }
    } catch { /* ignore */ }
    return new Set();
  });
  const [isLoading, setIsLoading] = useState(false);

  const refreshFavorites = useCallback(async () => {
    if (!isSignedIn) {
      setFavorites(new Set());
      return;
    }

    try {
      setIsLoading(true);
      const token = await getToken();
      if (!token) return;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FAVORITES_TIMEOUT_MS);

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/favorites`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (response.ok) {
        const data: { favorites: FavoriteItem[] } = await response.json();
        const favoriteIds = new Set(data.favorites.map((f) => f.post_id));
        setFavorites(favoriteIds);

        // Cache to localStorage
        try {
          localStorage.setItem(
            FAVORITES_CACHE_KEY,
            JSON.stringify({ ids: Array.from(favoriteIds), timestamp: Date.now() })
          );
        } catch { /* storage full — ignore */ }
      } else if (response.status !== 401) {
        // Only log non-auth errors (401 is expected when token is invalid/expired)
        // Try to extract error detail from response body
        let detail = `HTTP ${response.status}`;
        try {
          const errorBody = await response.json();
          if (errorBody.detail) {
            detail = typeof errorBody.detail === 'string' 
              ? errorBody.detail 
              : JSON.stringify(errorBody.detail);
          }
        } catch { /* ignore parse errors */ }
        logger.error('Failed to fetch favorites', new Error(detail));
      }
    } catch (error) {
      // Only log actual errors, not aborts or network timeouts
      if (error instanceof Error && error.name !== 'AbortError') {
        logger.error('Failed to fetch favorites', error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [getToken, isSignedIn]);

  // Fetch favorites after a short delay to avoid blocking initial paint
  useEffect(() => {
    const timer = setTimeout(() => {
      refreshFavorites();
    }, 100);
    return () => clearTimeout(timer);
  }, [refreshFavorites]);

  const isFavorite = useCallback(
    (postId: string): boolean => {
      return favorites.has(postId);
    },
    [favorites]
  );

  const toggleFavorite = useCallback(
    async (postId: string): Promise<boolean> => {
      if (!isSignedIn) {
        return false;
      }

      try {
        const token = await getToken();
        if (!token) return false;

        const response = await fetch(`${API_CONFIG.BASE_URL}/api/favorites/toggle`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ post_id: postId }),
        });

        if (response.ok) {
          const data: { is_favorited: boolean } = await response.json();

          setFavorites((prev) => {
            const next = new Set(prev);
            if (data.is_favorited) {
              next.add(postId);
            } else {
              next.delete(postId);
            }
            return next;
          });

          return data.is_favorited;
        }
        return isFavorite(postId);
      } catch (error) {
        logger.error('Failed to toggle favorite', error instanceof Error ? error : undefined, { postId });
        return isFavorite(postId);
      }
    },
    [getToken, isSignedIn, isFavorite]
  );

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isLoading,
        isFavorite,
        toggleFavorite,
        refreshFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextType {
  return useContext(FavoritesContext);
}

// Hook for checking if a specific post is favorited
export function useIsFavorite(postId: string): {
  isFavorited: boolean;
  isLoading: boolean;
  toggle: () => Promise<boolean>;
} {
  const { isFavorite, isLoading, toggleFavorite } = useFavorites();

  return {
    isFavorited: isFavorite(postId),
    isLoading,
    toggle: () => toggleFavorite(postId),
  };
}
