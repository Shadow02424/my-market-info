"use client";

import { motion } from "framer-motion";
import { useVisited } from "@/context/VisitedContext";
import { useLanguage } from "@/context/LanguageContext";

interface VisitedButtonProps {
  country: string;
}

export default function VisitedButton({ country }: VisitedButtonProps) {
  const { toggleVisited, isVisited } = useVisited();
  const { t } = useLanguage();
  const visited = isVisited(country);

  return (
    <motion.button
      onClick={() => toggleVisited(country)}
      whileTap={{ scale: 0.95 }}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
      style={{
        background: visited ? "rgba(16, 185, 129, 0.15)" : "var(--atlas-surface)",
        color: visited ? "var(--atlas-emerald)" : "var(--text-secondary)",
        border: `1px solid ${visited ? "rgba(16, 185, 129, 0.3)" : "var(--atlas-border)"}`,
      }}
    >
      <motion.span
        key={visited ? "check" : "empty"}
        initial={{ scale: 0.5, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
      >
        {visited ? "✓" : "○"}
      </motion.span>
      {visited ? t.visited.visited : t.visited.mark}
    </motion.button>
  );
}
