"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

interface Country {
  name: { common: string };
  cca2: string;
  flags: { svg: string };
}

interface CountrySelectorProps {
  label: string;
  selected: string;
  onSelect: (name: string) => void;
}

export default function CountrySelector({ label, selected, onSelect }: CountrySelectorProps) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [countries, setCountries] = useState<Country[]>([]);
  const [filtered, setFiltered] = useState<Country[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("https://restcountries.com/v3.1/all?fields=name,cca2,flags")
      .then((r) => r.json())
      .then((data: Country[]) => {
        setCountries(data.sort((a, b) => a.name.common.localeCompare(b.name.common)));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setFiltered([]);
      setOpen(false);
      return;
    }
    const q = query.toLowerCase();
    setFiltered(countries.filter((c) => c.name.common.toLowerCase().includes(q)).slice(0, 8));
    setOpen(true);
  }, [query, countries]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectCountry = (name: string) => {
    setQuery("");
    setOpen(false);
    onSelect(name);
  };

  const selectedCountry = countries.find((c) => c.name.common === selected);

  return (
    <div ref={ref} className="relative w-full">
      <label className="atlas-section-label block mb-2">{label}</label>
      {selected && selectedCountry ? (
        <div
          className="flex items-center gap-3 p-3 rounded-xl"
          style={{
            background: "var(--atlas-surface)",
            border: "1px solid var(--atlas-border)",
          }}
        >
          <img src={selectedCountry.flags.svg} alt="" className="w-8 h-5 object-cover rounded shadow-sm" />
          <span className="flex-1 font-medium" style={{ color: "var(--text-primary)" }}>{selected}</span>
          <button
            onClick={() => onSelect("")}
            className="text-sm transition-colors"
            style={{ color: "var(--text-tertiary)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--atlas-rose)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
          >
            &times;
          </button>
        </div>
      ) : (
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.nav.search_placeholder}
          className="w-full px-4 py-2.5 rounded-xl transition-all search-glow"
          style={{
            background: "var(--atlas-surface)",
            border: "1px solid var(--atlas-border)",
            color: "var(--text-primary)",
          }}
        />
      )}
      <AnimatePresence>
        {open && filtered.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute z-50 mt-2 w-full glass-card overflow-hidden"
            style={{ maxHeight: "18rem" }}
          >
            {filtered.map((c) => (
              <li
                key={c.cca2}
                onClick={() => selectCountry(c.name.common)}
                className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors"
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--atlas-surface-alt)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <img src={c.flags.svg} alt="" className="w-7 h-5 object-cover rounded shadow-sm" />
                <span className="text-sm" style={{ color: "var(--text-primary)" }}>{c.name.common}</span>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
