"use client";

import { Heart } from "lucide-react";
import { useIsFavorite } from "@/contexts/FavoritesContext";
import { useAuth as useClerkAuth } from "@clerk/nextjs";
import { useState } from "react";

interface FavoriteButtonProps {
  postId: string;
  size?: "sm" | "md" | "lg";
  variant?: "icon" | "button";
  className?: string;
}

const sizeClasses = {
  sm: "p-1.5",
  md: "p-2",
  lg: "p-3",
};

const iconSizes = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

export default function FavoriteButton({
  postId,
  size = "md",
  variant = "icon",
  className = "",
}: FavoriteButtonProps) {
  const { isSignedIn } = useClerkAuth();
  const { isFavorited, toggle } = useIsFavorite(postId);
  const [isToggling, setIsToggling] = useState(false);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isSignedIn) {
      // Optionally show a sign-in prompt
      return;
    }

    setIsToggling(true);
    await toggle();
    setIsToggling(false);
  };

  if (!isSignedIn) {
    return null;
  }

  if (variant === "button") {
    return (
      <button
        onClick={handleToggleFavorite}
        disabled={isToggling}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
          isFavorited
            ? "bg-red-50 text-[#F03D3D] border border-red-200"
            : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-red-50 hover:text-[#F03D3D] hover:border-red-200"
        } ${isToggling ? "opacity-50" : ""} ${className}`}
        aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
      >
        <Heart
          className={`${iconSizes[size]} transition-all ${isFavorited ? "fill-[#F03D3D]" : ""}`}
        />
        <span>{isFavorited ? "Favourited" : "Favourite"}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleToggleFavorite}
      disabled={isToggling}
      className={`${sizeClasses[size]} rounded-full transition-all ${
        isFavorited
          ? "bg-red-50 text-[#F03D3D]"
          : "bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-[#F03D3D]"
      } ${isToggling ? "opacity-50" : ""} ${className}`}
      aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart
        className={`${iconSizes[size]} transition-all ${isFavorited ? "fill-[#F03D3D]" : ""}`}
      />
    </button>
  );
}
