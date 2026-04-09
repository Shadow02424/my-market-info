"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

interface VisitedContextType {
  visited: string[];
  toggleVisited: (country: string) => void;
  isVisited: (country: string) => boolean;
  visitedCount: number;
}

const VisitedContext = createContext<VisitedContextType>({
  visited: [],
  toggleVisited: () => {},
  isVisited: () => false,
  visitedCount: 0,
});

export function VisitedProvider({ children }: { children: ReactNode }) {
  const [visited, setVisited] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("visited");
      if (saved) setVisited(JSON.parse(saved));
    } catch {}
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("visited", JSON.stringify(visited));
  }, [visited, mounted]);

  const toggleVisited = useCallback((country: string) => {
    setVisited((prev) =>
      prev.includes(country)
        ? prev.filter((c) => c !== country)
        : [...prev, country],
    );
  }, []);

  const isVisited = useCallback(
    (country: string) => visited.includes(country),
    [visited],
  );

  if (!mounted) return null;

  return (
    <VisitedContext.Provider value={{ visited, toggleVisited, isVisited, visitedCount: visited.length }}>
      {children}
    </VisitedContext.Provider>
  );
}

export const useVisited = () => useContext(VisitedContext);
