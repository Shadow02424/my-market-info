"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DarkModeToggle from "@/components/DarkModeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import SearchBar from "@/components/SearchBar";
import AnimatedSection from "@/components/AnimatedSection";
import { useLanguage } from "@/context/LanguageContext";

interface Country {
  name: { common: string };
  flags: { svg: string };
  cca2: string;
  population: number;
  area: number;
  region: string;
  capital?: string[];
  gini?: Record<string, number>;
}

type SortField = "population" | "area" | "density" | "name";
type SortDir = "asc" | "desc";

function formatNum(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return n.toLocaleString();
  return n.toString();
}

function getRegionClass(region: string): string {
  const r = region.toLowerCase();
  if (r === "europe") return "region-badge region-europe";
  if (r === "asia") return "region-badge region-asia";
  if (r === "africa") return "region-badge region-africa";
  if (r.includes("america")) return "region-badge region-americas";
  if (r === "oceania") return "region-badge region-oceania";
  if (r === "antarctic") return "region-badge region-antarctic";
  return "region-badge";
}

export default function RankingsPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const rk = t.rankings;
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>("population");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [regionFilter, setRegionFilter] = useState<string>("all");

  useEffect(() => {
    fetch("https://restcountries.com/v3.1/all?fields=name,flags,cca2,population,area,region,capital,gini")
      .then((r) => r.json())
      .then((data: Country[]) => setCountries(data.filter((c) => c.population > 0)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const regions = useMemo(
    () => ["all", ...Array.from(new Set(countries.map((c) => c.region))).sort()],
    [countries],
  );

  const sorted = useMemo(() => {
    let list = regionFilter === "all"
      ? [...countries]
      : countries.filter((c) => c.region === regionFilter);

    list.sort((a, b) => {
      let va: number | string;
      let vb: number | string;
      switch (sortField) {
        case "population": va = a.population; vb = b.population; break;
        case "area": va = a.area || 0; vb = b.area || 0; break;
        case "density": va = a.area ? a.population / a.area : 0; vb = b.area ? b.population / b.area : 0; break;
        case "name": va = a.name.common.toLowerCase(); vb = b.name.common.toLowerCase(); break;
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [countries, sortField, sortDir, regionFilter]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "name" ? "asc" : "desc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className="ml-1 text-xs" style={{ color: sortField === field ? "var(--atlas-gold)" : "var(--text-tertiary)" }}>
      {sortField === field ? (sortDir === "asc" ? "▲" : "▼") : "⇅"}
    </span>
  );

  return (
    <div className="min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 atlas-nav">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-sm font-medium transition-colors shrink-0"
            style={{ color: "var(--atlas-gold)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
            {t.country.back_home}
          </button>
          <div className="flex-1 flex justify-center"><SearchBar /></div>
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/compare" className="atlas-pill">{t.nav.compare}</Link>
            <Link href="/quiz" className="atlas-pill">{t.nav.quiz}</Link>
          </nav>
          <div className="flex items-center gap-0.5">
            <LanguageSwitcher />
            <DarkModeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-24 pb-16">
        <AnimatedSection>
          <div className="text-center mb-6">
            <span className="atlas-section-label block mb-2">Leaderboard</span>
            <h1 className="text-3xl sm:text-4xl font-bold" style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", color: "var(--text-primary)" }}>
              {rk.title}
            </h1>
            <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
              {rk.subtitle} ({sorted.length} {rk.countries})
            </p>
          </div>
        </AnimatedSection>

        {/* Region filters */}
        <AnimatedSection delay={0.05}>
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {regions.map((r) => (
              <button
                key={r}
                onClick={() => setRegionFilter(r)}
                className={`atlas-pill transition-all ${regionFilter === r ? "atlas-pill-active" : ""}`}
              >
                {r === "all" ? rk.all_regions : r}
              </button>
            ))}
          </div>
        </AnimatedSection>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="skeleton h-14 rounded-xl" />
            ))}
          </div>
        ) : (
          <AnimatedSection delay={0.1}>
            <div className="atlas-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--atlas-border)", background: "var(--atlas-surface-alt)" }}>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider w-12" style={{ color: "var(--text-tertiary)" }}>
                        #
                      </th>
                      <th
                        className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider cursor-pointer select-none"
                        onClick={() => toggleSort("name")}
                        style={{ color: sortField === "name" ? "var(--atlas-gold)" : "var(--text-tertiary)" }}
                      >
                        {rk.country}<SortIcon field="name" />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider hidden sm:table-cell" style={{ color: "var(--text-tertiary)" }}>
                        {rk.region}
                      </th>
                      <th
                        className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider cursor-pointer select-none"
                        onClick={() => toggleSort("population")}
                        style={{ color: sortField === "population" ? "var(--atlas-gold)" : "var(--text-tertiary)" }}
                      >
                        {rk.population}<SortIcon field="population" />
                      </th>
                      <th
                        className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider cursor-pointer select-none hidden md:table-cell"
                        onClick={() => toggleSort("area")}
                        style={{ color: sortField === "area" ? "var(--atlas-gold)" : "var(--text-tertiary)" }}
                      >
                        {rk.area}<SortIcon field="area" />
                      </th>
                      <th
                        className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider cursor-pointer select-none hidden md:table-cell"
                        onClick={() => toggleSort("density")}
                        style={{ color: sortField === "density" ? "var(--atlas-gold)" : "var(--text-tertiary)" }}
                      >
                        {rk.density}<SortIcon field="density" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((c, i) => (
                      <tr
                        key={c.cca2}
                        onClick={() => router.push(`/country/${encodeURIComponent(c.name.common)}`)}
                        className="cursor-pointer transition-colors"
                        style={{ borderBottom: "1px solid var(--atlas-border)" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "var(--atlas-surface-alt)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>
                          {i + 1}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <img src={c.flags.svg} alt="" className="w-7 h-5 object-cover rounded shadow-sm" loading="lazy" />
                            <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{c.name.common}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className={getRegionClass(c.region)}>{c.region}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono" style={{ color: "var(--text-secondary)" }}>
                          {formatNum(c.population)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono hidden md:table-cell" style={{ color: "var(--text-secondary)" }}>
                          {c.area ? `${c.area.toLocaleString()} km²` : "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-mono hidden md:table-cell" style={{ color: "var(--text-secondary)" }}>
                          {c.area ? `${(c.population / c.area).toFixed(1)}/km²` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </AnimatedSection>
        )}
      </main>
    </div>
  );
}
