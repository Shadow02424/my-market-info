"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRecent } from "@/context/RecentContext";
import { useLanguage } from "@/context/LanguageContext";

interface Country {
  name: { common: string };
  cca2: string;
  flags: { svg: string };
}

export default function RecentlyViewed() {
  const { recent } = useRecent();
  const { t } = useLanguage();
  const router = useRouter();
  const [countries, setCountries] = useState<Country[]>([]);

  useEffect(() => {
    fetch("https://restcountries.com/v3.1/all?fields=name,cca2,flags")
      .then((r) => r.json())
      .then((data: Country[]) => setCountries(data))
      .catch(() => {});
  }, []);

  if (recent.length === 0) return null;

  const recentCountries = recent
    .map((name) => countries.find((c) => c.name.common === name))
    .filter(Boolean) as Country[];

  if (recentCountries.length === 0 && recent.length > 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <span className="atlas-section-label">
          {t.recent.title}
        </span>
        <div className="flex-1 h-px" style={{ background: "var(--atlas-border)" }} />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {recentCountries.map((c) => (
          <button
            key={c.cca2}
            onClick={() => router.push(`/country/${encodeURIComponent(c.name.common)}`)}
            className="glass-card flex items-center gap-2.5 px-3.5 py-2.5 shrink-0 group"
            style={{ borderRadius: "var(--radius-xl)" }}
          >
            <img src={c.flags.svg} alt="" className="w-7 h-5 object-cover rounded shadow-sm" />
            <span className="text-sm font-medium whitespace-nowrap" style={{ color: "var(--text-primary)" }}>
              {c.name.common}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
