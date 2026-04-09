"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import CountryCard from "@/components/CountryCard";
import DarkModeToggle from "@/components/DarkModeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import SearchBar from "@/components/SearchBar";
import { useLanguage } from "@/context/LanguageContext";
import { useRecent } from "@/context/RecentContext";

export default function CountryPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = use(params);
  const { t, locale } = useLanguage();
  const router = useRouter();
  const { addRecent } = useRecent();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadingStep, setLoadingStep] = useState(t.country.loading_country);

  useEffect(() => {
    setLoading(true);
    setError("");
    setData(null);
    setLoadingStep(t.country.loading_country);

    const timer = setTimeout(
      () => setLoadingStep(t.country.loading_economics),
      2000,
    );
    const timer2 = setTimeout(
      () => setLoadingStep(t.country.loading_travel),
      5000,
    );

    fetch(`/api/country/${encodeURIComponent(name)}?locale=${locale}`)
      .then((r) => {
        if (!r.ok) throw new Error("Country not found");
        return r.json();
      })
      .then((json) => {
        setData(json);
        addRecent(json.name?.common || decodeURIComponent(name));
      })
      .catch(() => {
        setError(t.country.not_found);
      })
      .finally(() => {
        setLoading(false);
        clearTimeout(timer);
        clearTimeout(timer2);
      });
  }, [name, locale, t]);

  return (
    <div className="min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      {/* Navigation */}
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
          <div className="flex-1 flex justify-center">
            <SearchBar />
          </div>
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

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 pt-24 pb-16">
        {/* Loading State — Rich skeleton shimmer */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-3xl mx-auto space-y-6"
          >
            {/* Hero card skeleton */}
            <div className="atlas-card overflow-hidden">
              <div className="skeleton h-44 sm:h-52" style={{ borderRadius: 0 }} />
              <div className="px-6 pb-6 pt-4 space-y-3">
                <div className="skeleton h-9 w-56 rounded-lg" />
                <div className="skeleton h-4 w-36 rounded-md" />
                <div className="flex gap-2">
                  <div className="skeleton h-7 w-24 rounded-full" />
                  <div className="skeleton h-7 w-20 rounded-full" />
                  <div className="skeleton h-7 w-16 rounded-full" />
                </div>
              </div>
            </div>
            {/* Weather skeleton */}
            <div className="atlas-card p-6">
              <div className="skeleton h-3 w-32 rounded-md mb-4" />
              <div className="flex items-center gap-6">
                <div className="skeleton w-12 h-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-8 w-28 rounded-md" />
                  <div className="skeleton h-4 w-20 rounded-md" />
                </div>
              </div>
            </div>
            {/* Geographic section skeleton */}
            <div className="atlas-card p-6 space-y-3">
              <div className="skeleton h-3 w-40 rounded-md" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex gap-2">
                    <div className="skeleton h-4 w-28 rounded-md" />
                    <div className="skeleton h-4 flex-1 rounded-md" />
                  </div>
                ))}
              </div>
            </div>
            {/* Government skeleton */}
            <div className="atlas-card p-6 space-y-3">
              <div className="skeleton h-3 w-32 rounded-md" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-2">
                  <div className="skeleton h-4 w-32 rounded-md" />
                  <div className="skeleton h-4 flex-1 rounded-md" />
                </div>
              ))}
            </div>
            {/* Economics skeleton */}
            <div className="atlas-card p-6">
              <div className="skeleton h-3 w-36 rounded-md mb-4" />
              <div className="flex gap-2 mb-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton h-7 w-16 rounded-full" />
                ))}
              </div>
              <div className="skeleton h-56 w-full rounded-xl" />
            </div>
            {/* Progress indicator */}
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--atlas-gold)", borderTopColor: "transparent" }} />
              </div>
              <p className="text-sm animate-pulse" style={{ color: "var(--text-tertiary)" }}>
                {loadingStep}
              </p>
            </div>
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto text-center py-24"
          >
            <div className="atlas-card p-10">
              {/* Error compass illustration */}
              <div className="mx-auto mb-6 w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "rgba(244, 63, 94, 0.1)", border: "1px solid rgba(244, 63, 94, 0.2)" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h2
                className="text-2xl font-bold mb-2"
                style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", color: "var(--text-primary)" }}
              >
                Lost at Sea
              </h2>
              <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>{error}</p>
              <button
                onClick={() => router.push("/")}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-all"
                style={{
                  background: "linear-gradient(135deg, var(--atlas-gold), var(--atlas-gold-dim))",
                  color: "var(--text-inverse)",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                </svg>
                {t.country.back_home}
              </button>
            </div>
          </motion.div>
        )}

        {/* Country Data */}
        {data && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <CountryCard data={data} />
          </motion.div>
        )}

        {/* Disclaimer */}
        {data && (
          <div className="max-w-3xl mx-auto mt-10 pt-6 border-t flex flex-col items-center gap-2" style={{ borderColor: "var(--atlas-border)" }}>
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
        )}
      </main>
    </div>
  );
}
