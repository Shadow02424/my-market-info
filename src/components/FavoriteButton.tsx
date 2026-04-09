"use client";

import { motion } from "framer-motion";
import { useFavorites } from "@/context/FavoritesContext";

interface FavoriteButtonProps {
  country: string;
  size?: "sm" | "md";
}

export default function FavoriteButton({ country, size = "md" }: FavoriteButtonProps) {
  const { toggleFavorite, isFavorite } = useFavorites();
  const favorited = isFavorite(country);

  return (
    <motion.button
      onClick={() => toggleFavorite(country)}
      whileTap={{ scale: 0.8 }}
      className={`transition-colors ${size === "sm" ? "p-1" : "p-2"}`}
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
    >
      <motion.svg
        key={favorited ? "filled" : "outline"}
        initial={{ scale: 0.5 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        className={`${size === "sm" ? "w-5 h-5" : "w-6 h-6"}`}
        style={{ color: favorited ? "var(--atlas-rose)" : "var(--text-tertiary)" }}
        viewBox="0 0 24 24"
        fill={favorited ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </motion.svg>
    </motion.button>
  );
}
