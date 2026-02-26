"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth as useClerkAuth, useUser } from "@clerk/nextjs";
import { Heart, Trash2, Star, ShieldCheck, ArrowLeft, Loader2 } from "lucide-react";
import { API_CONFIG } from '@/config/constants';
import { MobileDashboardNav } from "@/components/dashboard/MobileDashboardNav";

interface FavoriteItem {
  id: string;
  post_id: string;
  post_name: string | null;
  post_image_url: string | null;
  instructor_name: string | null;
  city_price: number | null;
  yard_price: number | null;
  rating: number | null;
  review_count: number | null;
  created_at: string;
}

interface FavoritesResponse {
  favorites: FavoriteItem[];
  total: number;
}

export default function FavoritesPage() {
  const { getToken, isSignedIn } = useClerkAuth();
  const { user } = useUser();
  const isInstructor = (user?.publicMetadata?.userType as string) === "instructor";
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  const fetchFavorites = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        setError("Please sign in to view your favorites");
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/favorites`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError("Session expired. Please sign in again.");
        } else if (response.status === 404) {
          setError("User not found. Please contact support.");
        } else {
          // Try to extract error detail from response body
          let detail = "";
          try {
            const errorBody = await response.json();
            if (errorBody.detail) {
              detail = typeof errorBody.detail === 'string' 
                ? errorBody.detail 
                : JSON.stringify(errorBody.detail);
            }
          } catch { /* ignore parse errors */ }
          setError(detail || `Failed to load favorites (Error ${response.status})`);
          console.error("Favorites API error:", response.status, detail);
        }
        setIsLoading(false);
        return;
      }

      const data: FavoritesResponse = await response.json();
      setFavorites(data.favorites);
      setError(null);
    } catch (err) {
      setError("Failed to load favorites. Please try again.");
      console.error("Error fetching favorites:", err);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (isSignedIn) {
      fetchFavorites();
    } else {
      setIsLoading(false);
      setError("Please sign in to view your favorites");
    }
  }, [isSignedIn, fetchFavorites]);

  const handleRemoveFavorite = async (postId: string) => {
    try {
      setRemovingIds((prev) => new Set(prev).add(postId));

      const token = await getToken();
      if (!token) return;

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/favorites/${postId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setFavorites((prev) => prev.filter((fav) => fav.post_id !== postId));
      }
    } catch (err) {
      console.error("Error removing favorite:", err);
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading favorites...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to load favorites</h2>
            <p className="text-gray-500 mb-6">{error}</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#F03D3D] text-white font-bold rounded-xl hover:bg-[#d63333] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <MobileDashboardNav isInstructor={isInstructor} />
      <div className="max-w-6xl mx-auto px-6 mt-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-xl">
              <Heart className="w-6 h-6 text-[#F03D3D]" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">My Favorites</h1>
          </div>
          <p className="text-gray-500">
            {favorites.length} {favorites.length === 1 ? "instructor" : "instructors"} saved
          </p>
        </div>

        {/* Empty State */}
        {favorites.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <Heart className="w-20 h-20 text-gray-200 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-3">No favorites yet</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Start exploring instructors and save your favorites by clicking the heart icon on their profiles.
            </p>
            <Link
              href="/find-instructors"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#F03D3D] text-white font-bold rounded-xl hover:bg-[#d63333] transition-colors shadow-lg shadow-red-500/20"
            >
              Find Instructors
            </Link>
          </div>
        ) : (
          /* Favorites Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((favorite) => (
              <div
                key={favorite.id}
                className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-[#F03D3D]/30 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 group"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex gap-4">
                    <div className="relative">
                      <div
                        className={`w-16 h-16 rounded-2xl ${favorite.post_image_url ? "" : "bg-gradient-to-br from-gray-100 to-gray-200"
                          } overflow-hidden shadow-inner`}
                      >
                        {favorite.post_image_url ? (
                          <img
                            src={favorite.post_image_url}
                            alt={favorite.instructor_name || "Instructor"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-xl">
                            {favorite.instructor_name?.charAt(0) || "?"}
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-white p-1 rounded-full shadow-sm">
                        <ShieldCheck className="w-4 h-4 text-green-500 fill-green-100" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#F03D3D] transition-colors line-clamp-1">
                        {favorite.instructor_name || "Unknown Instructor"}
                      </h3>
                      {favorite.post_name && (
                        <p className="text-sm text-gray-500 mb-1">{favorite.post_name}</p>
                      )}
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-bold text-gray-900">
                          {favorite.rating?.toFixed(1) || "N/A"}
                        </span>
                        <span className="text-xs text-gray-400">
                          ({favorite.review_count || 0} reviews)
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveFavorite(favorite.post_id)}
                    disabled={removingIds.has(favorite.post_id)}
                    className="p-2 text-gray-400 hover:text-[#F03D3D] hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    aria-label="Remove from favorites"
                  >
                    {removingIds.has(favorite.post_id) ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* Price & Action */}
                <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                      Hourly Rate
                    </span>
                    <div className="flex items-center gap-3">
                      {favorite.city_price && (
                        <span className="text-sm font-semibold text-gray-900">
                          ₾{favorite.city_price}
                        </span>
                      )}
                      {favorite.yard_price && (
                        <span className="text-sm font-semibold text-gray-900">
                          ₾{favorite.yard_price}
                        </span>
                      )}
                      {!favorite.city_price && !favorite.yard_price && (
                        <span className="text-sm text-gray-500">N/A</span>
                      )}
                    </div>
                  </div>
                  <Link href={`/instructors/${favorite.post_id}`} className="w-1/2">
                    <button className="w-full py-2.5 px-4 bg-white border-2 border-[#F03D3D] text-[#F03D3D] rounded-xl font-bold text-sm hover:bg-[#F03D3D] hover:text-white transition-all shadow-sm hover:shadow-md active:scale-95">
                      View Profile
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
