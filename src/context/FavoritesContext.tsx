"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

interface FavoritesContextType {
  favorites: string[];
  toggleFavorite: (country: string) => void;
  isFavorite: (country: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType>({
  favorites: [],
  toggleFavorite: () => {},
  isFavorite: () => false,
});

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("favorites");
      if (saved) setFavorites(JSON.parse(saved));
    } catch {}
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites, mounted]);

  const toggleFavorite = useCallback((country: string) => {
    setFavorites((prev) =>
      prev.includes(country)
        ? prev.filter((c) => c !== country)
        : [...prev, country],
    );
  }, []);

  const isFavorite = useCallback(
    (country: string) => favorites.includes(country),
    [favorites],
  );

  if (!mounted) return null;

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export const useFavorites = () => useContext(FavoritesContext);
