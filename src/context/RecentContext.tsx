"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

interface RecentContextType {
  recent: string[];
  addRecent: (country: string) => void;
}

const MAX_RECENT = 8;

const RecentContext = createContext<RecentContextType>({
  recent: [],
  addRecent: () => {},
});

export function RecentProvider({ children }: { children: ReactNode }) {
  const [recent, setRecent] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("recent");
      if (saved) setRecent(JSON.parse(saved));
    } catch {}
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("recent", JSON.stringify(recent));
  }, [recent, mounted]);

  const addRecent = useCallback((country: string) => {
    setRecent((prev) => {
      const filtered = prev.filter((c) => c !== country);
      return [country, ...filtered].slice(0, MAX_RECENT);
    });
  }, []);

  if (!mounted) return null;

  return (
    <RecentContext.Provider value={{ recent, addRecent }}>
      {children}
    </RecentContext.Provider>
  );
}

export const useRecent = () => useContext(RecentContext);
