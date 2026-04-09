"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import DarkModeToggle from "@/components/DarkModeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import SearchBar from "@/components/SearchBar";
import CountrySelector from "@/components/CountrySelector";
import AnimatedSection from "@/components/AnimatedSection";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Radar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, RadialLinearScale, PointElement, LineElement, Filler, Title, Tooltip, Legend);

interface CountryData {
  name: { common: string; official: string };
  flags: { svg: string; alt?: string };
  capital?: string[];
  population: number;
  area?: number;
  region: string;
  subregion?: string;
  continents?: string[];
  latlng?: number[];
  landlocked?: boolean;
  unMember?: boolean;
  economics: Record<string, { label: string; data: { year: number; value: number | null }[] }>;
  practical: {
    currency: string[];
    languages: string[];
    government: { type: string; headOfState: string; legislature: string } | null;
    telephone: { callingCode: string; emergencyNumber: string };
    climate: { season: string; description: string; currentMonth: string };
    religions: string[];
    timezones: string[];
    drivingSide: string;
  };
}

function formatCompact(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return n.toLocaleString();
  return n.toString();
}

function StatRow({
  label,
  valueA,
  valueB,
  highlight,
}: {
  label: string;
  valueA: string;
  valueB: string;
  highlight?: "a" | "b" | "none";
}) {
  return (
    <div className="grid grid-cols-3 gap-4 py-3" style={{ borderBottom: "1px solid var(--atlas-border)" }}>
      <span
        className={`text-sm text-right font-medium ${
          highlight === "a" ? "text-gradient-gold" : ""
        }`}
        style={{ color: highlight === "a" ? undefined : "var(--text-secondary)" }}
      >
        {valueA}
      </span>
      <span className="text-xs text-center font-semibold self-center atlas-section-label" style={{ letterSpacing: "0.05em" }}>
        {label}
      </span>
      <span
        className={`text-sm ${highlight === "b" ? "" : ""}`}
        style={{ color: highlight === "b" ? "var(--atlas-teal)" : "var(--text-secondary)" }}
      >
        {valueB}
      </span>
    </div>
  );
}

function getLatestEconomicValue(
  data: CountryData | null,
  indicatorId: string,
): number | null {
  if (!data?.economics[indicatorId]) return null;
  const points = data.economics[indicatorId].data;
  if (points.length === 0) return null;
  return points[points.length - 1].value;
}

export default function ComparePage() {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const c = t.compare;

  const [countryA, setCountryA] = useState("");
  const [countryB, setCountryB] = useState("");
  const [dataA, setDataA] = useState<CountryData | null>(null);
  const [dataB, setDataB] = useState<CountryData | null>(null);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const stepTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (!countryA) { setDataA(null); return; }
    setLoadingA(true);
    fetch(`/api/country/${encodeURIComponent(countryA)}?locale=${locale}`)
      .then((r) => r.ok ? r.json() : null)
      .then(setDataA)
      .catch(() => setDataA(null))
      .finally(() => setLoadingA(false));
  }, [countryA, locale]);

  useEffect(() => {
    if (!countryB) { setDataB(null); return; }
    setLoadingB(true);
    fetch(`/api/country/${encodeURIComponent(countryB)}?locale=${locale}`)
      .then((r) => r.ok ? r.json() : null)
      .then(setDataB)
      .catch(() => setDataB(null))
      .finally(() => setLoadingB(false));
  }, [countryB, locale]);

  // Progressive loading messages
  useEffect(() => {
    stepTimers.current.forEach(clearTimeout);
    stepTimers.current = [];
    if (!loadingA && !loadingB) { setLoadingStep(""); return; }
    setLoadingStep("Fetching country data...");
    stepTimers.current.push(setTimeout(() => setLoadingStep("Gathering economic indicators..."), 2500));
    stepTimers.current.push(setTimeout(() => setLoadingStep("Compiling travel & cultural info..."), 5500));
    stepTimers.current.push(setTimeout(() => setLoadingStep("Almost there..."), 9000));
    return () => stepTimers.current.forEach(clearTimeout);
  }, [loadingA, loadingB]);

  const bothLoaded = dataA && dataB;

  const comparisonIndicators = [
    { id: "population", label: c.population, getVal: (d: CountryData) => d.population },
    { id: "area", label: c.area, getVal: (d: CountryData) => d.area || 0 },
    { id: "density", label: c.density, getVal: (d: CountryData) => d.area ? d.population / d.area : 0 },
  ];

  const economicIndicators = [
    { id: "NY.GDP.MKTP.CD", label: "GDP (USD)" },
    { id: "NY.GDP.MKTP.KD.ZG", label: c.gdp_growth },
    { id: "FP.CPI.TOTL.ZG", label: c.inflation },
    { id: "SL.UEM.TOTL.ZS", label: c.unemployment },
    { id: "SP.DYN.LE00.IN", label: c.life_expectancy },
  ];

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
            <Link href="/quiz" className="atlas-pill">{t.nav.quiz}</Link>
            <Link href="/rankings" className="atlas-pill">{t.nav.rankings}</Link>
          </nav>
          <div className="flex items-center gap-0.5">
            <LanguageSwitcher />
            <DarkModeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-24 pb-16">
        <AnimatedSection>
          <div className="text-center mb-8">
            <span className="atlas-section-label block mb-2">VS</span>
            <h1 className="text-3xl sm:text-4xl font-bold" style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", color: "var(--text-primary)" }}>
              {c.title}
            </h1>
            <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>{c.subtitle}</p>
          </div>
        </AnimatedSection>

        {/* Country Selectors */}
        <AnimatedSection delay={0.05}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <CountrySelector label={c.country_a} selected={countryA} onSelect={setCountryA} />
            <CountrySelector label={c.country_b} selected={countryB} onSelect={setCountryB} />
          </div>
        </AnimatedSection>

        {/* Loading — rich skeleton */}
        {(loadingA || loadingB) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Flag header skeletons */}
            <div className="grid grid-cols-2 gap-6">
              {[0, 1].map((i) => (
                <div key={i} className="atlas-card p-5 flex flex-col items-center gap-3">
                  <div className="skeleton w-20 h-14 rounded-lg" />
                  <div className="skeleton h-5 w-32 rounded-md" />
                  <div className="skeleton h-3 w-24 rounded-md" />
                </div>
              ))}
            </div>
            {/* Stats skeleton */}
            <div className="atlas-card p-6 space-y-4">
              <div className="skeleton h-4 w-28 rounded-md" />
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="grid grid-cols-3 gap-4">
                  <div className="skeleton h-4 w-full rounded-md" />
                  <div className="skeleton h-3 w-16 mx-auto rounded-md" />
                  <div className="skeleton h-4 w-full rounded-md" />
                </div>
              ))}
            </div>
            {/* Chart skeleton */}
            <div className="atlas-card p-6">
              <div className="skeleton h-4 w-40 rounded-md mb-4" />
              <div className="skeleton h-56 w-full rounded-xl" />
            </div>
            {/* Progress indicator */}
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--atlas-gold)", borderTopColor: "transparent" }} />
              </div>
              <p className="text-sm animate-pulse" style={{ color: "var(--text-tertiary)" }}>
                {loadingStep}
              </p>
            </div>
          </motion.div>
        )}

        {/* Results */}
        {bothLoaded && (
          <div className="space-y-6">
            {/* Flag Headers */}
            <AnimatedSection delay={0.1}>
              <div className="grid grid-cols-2 gap-6">
                {[dataA, dataB].map((d, idx) => (
                  <div key={idx} className="atlas-card p-5 text-center">
                    <img src={d.flags.svg} alt={d.name.common} className="w-20 h-14 object-cover rounded-lg shadow-md mx-auto mb-3" />
                    <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", color: "var(--text-primary)" }}>
                      {d.name.common}
                    </h2>
                    <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                      {d.region} &middot; {d.subregion}
                    </p>
                  </div>
                ))}
              </div>
            </AnimatedSection>

            {/* Key Stats */}
            <AnimatedSection delay={0.15}>
              <div className="atlas-card p-6">
                <h3 className="atlas-section-label mb-4">{c.key_stats}</h3>
                <StatRow label={c.capital} valueA={dataA.capital?.join(", ") || "N/A"} valueB={dataB.capital?.join(", ") || "N/A"} />
                <StatRow label={c.population} valueA={formatCompact(dataA.population)} valueB={formatCompact(dataB.population)} highlight={dataA.population > dataB.population ? "a" : "b"} />
                <StatRow label={c.area} valueA={dataA.area ? `${dataA.area.toLocaleString()} km²` : "N/A"} valueB={dataB.area ? `${dataB.area.toLocaleString()} km²` : "N/A"} highlight={(dataA.area || 0) > (dataB.area || 0) ? "a" : "b"} />
                <StatRow label={c.density} valueA={dataA.area ? `${(dataA.population / dataA.area).toFixed(1)}/km²` : "N/A"} valueB={dataB.area ? `${(dataB.population / dataB.area).toFixed(1)}/km²` : "N/A"} />
                <StatRow label={c.currency} valueA={dataA.practical.currency.join(", ")} valueB={dataB.practical.currency.join(", ")} />
                <StatRow label={c.languages} valueA={dataA.practical.languages.join(", ")} valueB={dataB.practical.languages.join(", ")} />
                <StatRow label={c.timezones} valueA={dataA.practical.timezones.join(", ")} valueB={dataB.practical.timezones.join(", ")} />
                <StatRow label={c.driving_side} valueA={dataA.practical.drivingSide} valueB={dataB.practical.drivingSide} />
              </div>
            </AnimatedSection>

            {/* Economic Bar Chart */}
            <AnimatedSection delay={0.2}>
              <div className="atlas-card p-6">
                <h3 className="atlas-section-label mb-4">{c.economic_comparison}</h3>
                <div className="h-72 mb-6">
                  <Bar
                    data={{
                      labels: comparisonIndicators.map((i) => i.label),
                      datasets: [
                        {
                          label: dataA.name.common,
                          data: comparisonIndicators.map((i) => i.getVal(dataA)),
                          backgroundColor: "rgba(240, 165, 0, 0.5)",
                          borderColor: "rgb(240, 165, 0)",
                          borderWidth: 1.5,
                          borderRadius: 6,
                        },
                        {
                          label: dataB.name.common,
                          data: comparisonIndicators.map((i) => i.getVal(dataB)),
                          backgroundColor: "rgba(20, 184, 166, 0.5)",
                          borderColor: "rgb(20, 184, 166)",
                          borderWidth: 1.5,
                          borderRadius: 6,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: "top", labels: { color: "var(--text-secondary)" } },
                        tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatCompact(ctx.parsed.y ?? 0)}` } },
                      },
                      scales: {
                        y: { ticks: { callback: (val) => formatCompact(val as number), color: "var(--text-tertiary)" }, grid: { color: "rgba(148, 163, 184, 0.08)" } },
                        x: { grid: { display: false }, ticks: { color: "var(--text-tertiary)" } },
                      },
                    }}
                  />
                </div>

                <h4 className="atlas-section-label mb-3">{c.economic_indicators}</h4>
                {economicIndicators.map((ind) => {
                  const valA = getLatestEconomicValue(dataA, ind.id);
                  const valB = getLatestEconomicValue(dataB, ind.id);
                  const fmtA = valA !== null ? formatCompact(valA) : "N/A";
                  const fmtB = valB !== null ? formatCompact(valB) : "N/A";
                  return (
                    <StatRow
                      key={ind.id}
                      label={ind.label}
                      valueA={fmtA}
                      valueB={fmtB}
                      highlight={
                        valA !== null && valB !== null
                          ? ind.id === "SL.UEM.TOTL.ZS" || ind.id === "FP.CPI.TOTL.ZG"
                            ? valA < valB ? "a" : "b"
                            : valA > valB ? "a" : "b"
                          : "none"
                      }
                    />
                  );
                })}
              </div>
            </AnimatedSection>

            {/* Radar Chart */}
            <AnimatedSection delay={0.22}>
              <div className="atlas-card p-6">
                <h3 className="atlas-section-label mb-4">{c.radar_title}</h3>
                <div className="max-w-md mx-auto">
                  <Radar
                    data={{
                      labels: [c.population, c.area, c.density, c.life_expectancy, c.gdp_growth, c.unemployment],
                      datasets: [
                        {
                          label: dataA.name.common,
                          data: (() => {
                            const valAGdp = getLatestEconomicValue(dataA, "NY.GDP.MKTP.KD.ZG");
                            const valBGdp = getLatestEconomicValue(dataB, "NY.GDP.MKTP.KD.ZG");
                            const valAUnem = getLatestEconomicValue(dataA, "SL.UEM.TOTL.ZS");
                            const valBUnem = getLatestEconomicValue(dataB, "SL.UEM.TOTL.ZS");
                            const valALife = getLatestEconomicValue(dataA, "SP.DYN.LE00.IN");
                            const valBLife = getLatestEconomicValue(dataB, "SP.DYN.LE00.IN");
                            const maxPop = Math.max(dataA.population, dataB.population) || 1;
                            const maxArea = Math.max(dataA.area || 0, dataB.area || 0) || 1;
                            const densA = dataA.area ? dataA.population / dataA.area : 0;
                            const densB = dataB.area ? dataB.population / dataB.area : 0;
                            const maxDens = Math.max(densA, densB) || 1;
                            const maxLife = Math.max(valALife || 0, valBLife || 0) || 1;
                            const maxGdp = Math.max(Math.abs(valAGdp || 0), Math.abs(valBGdp || 0)) || 1;
                            const maxUnem = Math.max(valAUnem || 0, valBUnem || 0) || 1;
                            return [
                              (dataA.population / maxPop) * 100,
                              ((dataA.area || 0) / maxArea) * 100,
                              (densA / maxDens) * 100,
                              ((valALife || 0) / maxLife) * 100,
                              (Math.abs(valAGdp || 0) / maxGdp) * 100,
                              100 - ((valAUnem || 0) / maxUnem) * 100,
                            ];
                          })(),
                          backgroundColor: "rgba(240, 165, 0, 0.15)",
                          borderColor: "rgb(240, 165, 0)",
                          borderWidth: 2,
                          pointBackgroundColor: "rgb(240, 165, 0)",
                        },
                        {
                          label: dataB.name.common,
                          data: (() => {
                            const valAGdp = getLatestEconomicValue(dataA, "NY.GDP.MKTP.KD.ZG");
                            const valBGdp = getLatestEconomicValue(dataB, "NY.GDP.MKTP.KD.ZG");
                            const valAUnem = getLatestEconomicValue(dataA, "SL.UEM.TOTL.ZS");
                            const valBUnem = getLatestEconomicValue(dataB, "SL.UEM.TOTL.ZS");
                            const valALife = getLatestEconomicValue(dataA, "SP.DYN.LE00.IN");
                            const valBLife = getLatestEconomicValue(dataB, "SP.DYN.LE00.IN");
                            const maxPop = Math.max(dataA.population, dataB.population) || 1;
                            const maxArea = Math.max(dataA.area || 0, dataB.area || 0) || 1;
                            const densA = dataA.area ? dataA.population / dataA.area : 0;
                            const densB = dataB.area ? dataB.population / dataB.area : 0;
                            const maxDens = Math.max(densA, densB) || 1;
                            const maxLife = Math.max(valALife || 0, valBLife || 0) || 1;
                            const maxGdp = Math.max(Math.abs(valAGdp || 0), Math.abs(valBGdp || 0)) || 1;
                            const maxUnem = Math.max(valAUnem || 0, valBUnem || 0) || 1;
                            return [
                              (dataB.population / maxPop) * 100,
                              ((dataB.area || 0) / maxArea) * 100,
                              (densB / maxDens) * 100,
                              ((valBLife || 0) / maxLife) * 100,
                              (Math.abs(valBGdp || 0) / maxGdp) * 100,
                              100 - ((valBUnem || 0) / maxUnem) * 100,
                            ];
                          })(),
                          backgroundColor: "rgba(20, 184, 166, 0.15)",
                          borderColor: "rgb(20, 184, 166)",
                          borderWidth: 2,
                          pointBackgroundColor: "rgb(20, 184, 166)",
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { position: "top", labels: { color: "var(--text-secondary)" } },
                        tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.r.toFixed(0)}%` } },
                      },
                      scales: {
                        r: {
                          beginAtZero: true,
                          max: 100,
                          ticks: { display: false },
                          grid: { color: "rgba(148, 163, 184, 0.1)" },
                          pointLabels: { font: { size: 11 }, color: "var(--text-tertiary)" },
                        },
                      },
                    }}
                  />
                </div>
                <p className="text-xs text-center mt-3" style={{ color: "var(--text-tertiary)" }}>{c.radar_note}</p>
              </div>
            </AnimatedSection>

            {/* Government */}
            <AnimatedSection delay={0.25}>
              <div className="atlas-card p-6">
                <h3 className="atlas-section-label mb-4">{c.government}</h3>
                <StatRow label={c.gov_type} valueA={dataA.practical.government?.type || "N/A"} valueB={dataB.practical.government?.type || "N/A"} />
                <StatRow label={c.head_of_state} valueA={dataA.practical.government?.headOfState || "N/A"} valueB={dataB.practical.government?.headOfState || "N/A"} />
                <StatRow label={c.un_member} valueA={dataA.unMember ? t.country.yes : t.country.no} valueB={dataB.unMember ? t.country.yes : t.country.no} />
              </div>
            </AnimatedSection>

            {/* Climate */}
            <AnimatedSection delay={0.3}>
              <div className="atlas-card p-6">
                <h3 className="atlas-section-label mb-4">{c.climate}</h3>
                <div className="grid grid-cols-2 gap-6">
                  {[dataA, dataB].map((d, idx) => (
                    <div key={idx}>
                      <span className="atlas-pill" style={{ background: "rgba(14, 165, 233, 0.12)", color: "#38bdf8", borderColor: "rgba(14, 165, 233, 0.25)" }}>
                        {d.practical.climate.season}
                      </span>
                      <p className="text-sm leading-relaxed mt-2" style={{ color: "var(--text-secondary)" }}>
                        {d.practical.climate.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          </div>
        )}

        {/* Empty state */}
        {!bothLoaded && !loadingA && !loadingB && (
          <AnimatedSection delay={0.1}>
            <div className="text-center py-20">
              <div className="mx-auto mb-6 w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "var(--atlas-surface)", border: "1px solid var(--atlas-border)" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-tertiary)" }}>
                  <path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <p className="text-lg font-medium" style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", color: "var(--text-secondary)" }}>
                {c.empty_state}
              </p>
            </div>
          </AnimatedSection>
        )}

        {/* Disclaimer */}
        <div className="max-w-5xl mx-auto mt-10 pt-6 border-t flex flex-col items-center gap-2" style={{ borderColor: "var(--atlas-border)" }}>
          <div className="flex items-center gap-2 mb-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--atlas-gold)", opacity: 0.7 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Disclaimer</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3 text-center">
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{t.disclaimer.data_accuracy}</span>
            <span className="hidden sm:inline text-xs" style={{ color: "var(--atlas-border)" }}>&middot;</span>
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{t.disclaimer.not_official}</span>
            <span className="hidden sm:inline text-xs" style={{ color: "var(--atlas-border)" }}>&middot;</span>
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{t.disclaimer.educational}</span>
          </div>
        </div>
      </main>
    </div>
  );
}
