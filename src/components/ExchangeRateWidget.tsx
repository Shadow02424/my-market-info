"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
}

const DISPLAY_CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "CNY"];

interface ExchangeRateWidgetProps {
  currencyCodes: string[];
}

export default function ExchangeRateWidget({ currencyCodes }: ExchangeRateWidgetProps) {
  const { t } = useLanguage();
  const ex = t.exchange;
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("1");

  const primaryCode = currencyCodes[0] || "USD";

  useEffect(() => {
    setLoading(true);
    fetch(`https://api.frankfurter.dev/v1/latest?base=${primaryCode}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        setRates({ base: data.base, rates: data.rates });
      })
      .catch(() => setRates(null))
      .finally(() => setLoading(false));
  }, [primaryCode]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-4">
        <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--atlas-gold)", borderTopColor: "transparent" }} />
        <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>{ex.loading}</span>
      </div>
    );
  }

  if (!rates || Object.keys(rates.rates).length === 0) {
    return <p className="text-sm py-2" style={{ color: "var(--text-tertiary)" }}>{ex.unavailable}</p>;
  }

  const numAmount = parseFloat(amount) || 1;
  const displayRates = DISPLAY_CURRENCIES.filter(
    (c) => c !== primaryCode && rates.rates[c] !== undefined,
  );

  return (
    <div>
      {/* Amount input */}
      <div className="flex items-center gap-3 mb-4">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="0"
          step="any"
          className="w-28 px-3 py-2 rounded-lg text-sm transition-all search-glow"
          style={{
            background: "var(--atlas-surface-alt)",
            border: "1px solid var(--atlas-border)",
            color: "var(--text-primary)",
          }}
        />
        <span className="text-sm font-bold" style={{ color: "var(--atlas-gold)" }}>{primaryCode}</span>
        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>=</span>
      </div>

      {/* Rates grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {displayRates.map((code) => (
          <div
            key={code}
            className="rounded-lg px-3 py-2.5 text-center"
            style={{ background: "var(--atlas-surface-alt)", border: "1px solid var(--atlas-border)" }}
          >
            <span className="block text-xs mb-1 coord-text">{code}</span>
            <span className="block text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              {(numAmount * rates.rates[code]).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs mt-3" style={{ color: "var(--text-tertiary)" }}>{ex.source}</p>
    </div>
  );
}
