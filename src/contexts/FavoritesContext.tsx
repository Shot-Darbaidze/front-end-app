"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { useAuth as useClerkAuth } from "@clerk/nextjs";
import { API_CONFIG } from "@/services/constants";

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

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { getToken, isSignedIn } = useClerkAuth();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
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

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/favorites`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data: { favorites: FavoriteItem[] } = await response.json();
        const favoriteIds = new Set(data.favorites.map((f) => f.post_id));
        setFavorites(favoriteIds);
      }
    } catch (error) {
      console.error("Failed to fetch favorites:", error);
    } finally {
      setIsLoading(false);
    }
  }, [getToken, isSignedIn]);

  // Fetch favorites on mount and when sign-in state changes
  useEffect(() => {
    refreshFavorites();
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
        console.error("Failed to toggle favorite:", error);
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
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
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
