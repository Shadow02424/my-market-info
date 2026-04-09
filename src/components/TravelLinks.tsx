"use client";

import { useLanguage } from "@/context/LanguageContext";

interface TravelLinksProps {
  countryName: string;
  capital?: string;
}

export default function TravelLinks({ countryName, capital }: TravelLinksProps) {
  const { t } = useLanguage();
  const tr = t.travel;
  const destination = capital || countryName;
  const encodedDest = encodeURIComponent(destination);
  const encodedCountry = encodeURIComponent(countryName);

  const links = [
    {
      label: tr.flights,
      description: tr.flights_desc,
      url: `https://www.google.com/travel/flights?q=flights+to+${encodedDest}`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      ),
      accentColor: "var(--atlas-blue)",
    },
    {
      label: tr.hotels,
      description: tr.hotels_desc,
      url: `https://www.google.com/travel/hotels/${encodedDest}`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      accentColor: "var(--atlas-emerald)",
    },
    {
      label: tr.things_to_do,
      description: tr.things_desc,
      url: `https://www.google.com/travel/things-to-do?q=${encodedCountry}+things+to+do`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      accentColor: "var(--atlas-gold)",
    },
    {
      label: tr.visa_info,
      description: tr.visa_desc,
      url: `https://www.google.com/search?q=${encodedCountry}+visa+requirements`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      accentColor: "var(--atlas-violet)",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {links.map((link) => (
        <a
          key={link.label}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-3 p-4 rounded-xl transition-all group"
          style={{
            background: "var(--atlas-surface-alt)",
            border: "1px solid var(--atlas-border)",
            color: link.accentColor,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = `0 4px 20px rgba(0,0,0,0.2)`;
            e.currentTarget.style.borderColor = link.accentColor;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "";
            e.currentTarget.style.boxShadow = "";
            e.currentTarget.style.borderColor = "var(--atlas-border)";
          }}
        >
          <span className="mt-0.5 shrink-0">{link.icon}</span>
          <div>
            <span className="block text-sm font-bold">{link.label}</span>
            <span className="block text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>{link.description}</span>
          </div>
          <svg className="w-4 h-4 ml-auto mt-0.5 shrink-0 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      ))}
    </div>
  );
}
