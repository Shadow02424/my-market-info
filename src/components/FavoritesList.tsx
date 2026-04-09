"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useFavorites } from "@/context/FavoritesContext";
import { useLanguage } from "@/context/LanguageContext";
import FavoriteButton from "./FavoriteButton";

interface Country {
  name: { common: string };
  cca2: string;
  flags: { svg: string };
}

export default function FavoritesList() {
  const { favorites } = useFavorites();
  const { t } = useLanguage();
  const router = useRouter();
  const [countries, setCountries] = useState<Country[]>([]);

  useEffect(() => {
    fetch("https://restcountries.com/v3.1/all?fields=name,cca2,flags")
      .then((r) => r.json())
      .then((data: Country[]) => setCountries(data))
      .catch(() => {});
  }, []);

  if (favorites.length === 0) return null;

  const favCountries = favorites
    .map((name) => countries.find((c) => c.name.common === name))
    .filter(Boolean) as Country[];

  if (favCountries.length === 0 && favorites.length > 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <span className="atlas-section-label">
          {t.favorites.title} ({favCountries.length})
        </span>
        <div className="flex-1 h-px" style={{ background: "var(--atlas-border)" }} />
      </div>
      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {favCountries.map((c) => (
            <motion.button
              key={c.cca2}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              onClick={() => router.push(`/country/${encodeURIComponent(c.name.common)}`)}
              className="glass-card flex items-center gap-2.5 px-3.5 py-2.5 group"
              style={{ borderRadius: "var(--radius-xl)" }}
            >
              <img src={c.flags.svg} alt="" className="w-7 h-5 object-cover rounded shadow-sm" />
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {c.name.common}
              </span>
              <span onClick={(e) => e.stopPropagation()}>
                <FavoriteButton country={c.name.common} size="sm" />
              </span>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
