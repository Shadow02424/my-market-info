"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import Fuse from "fuse.js";

interface Country {
  name: { common: string };
  cca2: string;
  flags: { svg: string };
  region?: string;
}

function getRegionClass(region?: string): string {
  if (!region) return "";
  const r = region.toLowerCase();
  if (r === "europe") return "region-badge region-europe";
  if (r === "asia") return "region-badge region-asia";
  if (r === "africa") return "region-badge region-africa";
  if (r.includes("america")) return "region-badge region-americas";
  if (r === "oceania") return "region-badge region-oceania";
  if (r === "antarctic") return "region-badge region-antarctic";
  return "region-badge";
}

interface SearchBarProps {
  variant?: "hero" | "nav";
}

export default function SearchBar({ variant = "nav" }: SearchBarProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [countries, setCountries] = useState<Country[]>([]);
  const [filtered, setFiltered] = useState<Country[]>([]);
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("https://restcountries.com/v3.1/all?fields=name,cca2,flags,region")
      .then((r) => r.json())
      .then((data: Country[]) => {
        setCountries(data.sort((a, b) => a.name.common.localeCompare(b.name.common)));
      })
      .catch(() => {});
  }, []);

  const fuse = useMemo(
    () =>
      new Fuse(countries, {
        keys: ["name.common"],
        threshold: 0.4,
        distance: 100,
        minMatchCharLength: 1,
      }),
    [countries],
  );

  useEffect(() => {
    if (!query.trim()) {
      setFiltered([]);
      setOpen(false);
      setHighlightIndex(-1);
      return;
    }
    const results = fuse.search(query, { limit: 8 }).map((r) => r.item);
    setFiltered(results);
    setOpen(results.length > 0);
    setHighlightIndex(-1);
  }, [query, fuse]);

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
    router.push(`/country/${encodeURIComponent(name)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || filtered.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => (i + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => (i - 1 + filtered.length) % filtered.length);
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      selectCountry(filtered[highlightIndex].name.common);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const isHero = variant === "hero";

  return (
    <div ref={ref} className={`relative ${isHero ? "w-full" : "w-full max-w-md"}`}>
      {/* Search icon */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10" style={{ color: "var(--text-tertiary)" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>

      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t.nav.search_placeholder}
        aria-label="Search countries"
        aria-expanded={open}
        role="combobox"
        aria-autocomplete="list"
        className={`
          w-full pl-11 pr-4 rounded-full border transition-all duration-300 search-glow
          placeholder:transition-all placeholder:duration-300
          ${isHero
            ? "py-4 text-base md:text-lg"
            : "py-2.5 text-sm"
          }
        `}
        style={{
          background: "var(--atlas-surface)",
          borderColor: "var(--atlas-border)",
          color: "var(--text-primary)",
        }}
      />

      {/* Dropdown */}
      <AnimatePresence>
        {open && filtered.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute z-50 mt-2 w-full glass-card overflow-hidden"
            style={{ maxHeight: "24rem" }}
            role="listbox"
          >
            {filtered.map((c, i) => (
              <li
                key={c.cca2}
                onClick={() => selectCountry(c.name.common)}
                onMouseEnter={() => setHighlightIndex(i)}
                role="option"
                aria-selected={highlightIndex === i}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors duration-150 ${
                  highlightIndex === i ? "" : ""
                }`}
                style={{
                  background: highlightIndex === i ? "var(--atlas-surface-alt)" : "transparent",
                }}
              >
                <img
                  src={c.flags.svg}
                  alt=""
                  className="w-8 h-5 object-cover rounded shadow-sm"
                  loading="lazy"
                />
                <span className="flex-1 font-medium text-sm" style={{ color: "var(--text-primary)" }}>
                  {c.name.common}
                </span>
                {c.region && (
                  <span className={getRegionClass(c.region)}>
                    {c.region}
                  </span>
                )}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
