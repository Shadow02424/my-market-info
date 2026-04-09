"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import DarkModeToggle from "@/components/DarkModeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import SearchBar from "@/components/SearchBar";
import AnimatedSection from "@/components/AnimatedSection";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

interface Country {
  name: { common: string };
  flags: { svg: string; alt?: string };
  capital?: string[];
  cca2: string;
}

type QuizMode = "flag" | "capital";
type Difficulty = "easy" | "medium" | "hard";

const CHOICES_COUNT: Record<Difficulty, number> = { easy: 2, medium: 4, hard: 6 };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getDailySeed(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 16807 + 0) % 2147483647;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function QuizPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const q = t.quiz;

  const [countries, setCountries] = useState<Country[]>([]);
  const [mode, setMode] = useState<QuizMode>("flag");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [isDaily, setIsDaily] = useState(true);

  const [questions, setQuestions] = useState<Country[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [choices, setChoices] = useState<Country[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);

  const totalQuestions = 10;

  useEffect(() => {
    fetch("https://restcountries.com/v3.1/all?fields=name,flags,capital,cca2")
      .then((r) => r.json())
      .then((data: Country[]) => {
        setCountries(data.filter((c) => c.flags.svg && c.name.common));
      })
      .catch(() => {});
  }, []);

  const startGame = useCallback(() => {
    if (countries.length < totalQuestions) return;
    const shuffled = isDaily
      ? seededShuffle(countries, getDailySeed() + mode.charCodeAt(0))
      : shuffle(countries);
    const qs = shuffled.slice(0, totalQuestions);
    setQuestions(qs);
    setQuestionIndex(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setSelected(null);
    setShowResult(false);
    setGameOver(false);
    setStarted(true);
  }, [countries, isDaily, mode]);

  useEffect(() => {
    if (!started || questions.length === 0 || questionIndex >= questions.length) return;
    const correct = questions[questionIndex];
    const numChoices = CHOICES_COUNT[difficulty];
    const others = shuffle(countries.filter((c) => c.cca2 !== correct.cca2)).slice(0, numChoices - 1);
    setChoices(shuffle([correct, ...others]));
    setSelected(null);
    setShowResult(false);
  }, [questionIndex, started, questions, countries, difficulty]);

  const handleAnswer = (name: string) => {
    if (showResult) return;
    setSelected(name);
    setShowResult(true);
    const correct = questions[questionIndex].name.common;
    if (name === correct) {
      setScore((s) => s + 1);
      setStreak((s) => {
        const next = s + 1;
        setBestStreak((b) => Math.max(b, next));
        return next;
      });
    } else {
      setStreak(0);
    }
  };

  const nextQuestion = () => {
    if (questionIndex + 1 >= totalQuestions) {
      setGameOver(true);
    } else {
      setQuestionIndex((i) => i + 1);
    }
  };

  const current = questions[questionIndex];

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
            <Link href="/rankings" className="atlas-pill">{t.nav.rankings}</Link>
          </nav>
          <div className="flex items-center gap-0.5">
            <LanguageSwitcher />
            <DarkModeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 pt-24 pb-16">
        {!started ? (
          /* Setup Screen */
          <AnimatedSection>
            <div className="atlas-card p-8 text-center compass-rose">
              <span className="atlas-section-label block mb-3">Challenge</span>
              <h1
                className="text-3xl sm:text-4xl font-bold mb-2"
                style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", color: "var(--text-primary)" }}
              >
                {q.title}
              </h1>
              <p className="mb-8" style={{ color: "var(--text-secondary)" }}>{q.subtitle}</p>

              {/* Mode selection */}
              <div className="mb-6">
                <label className="atlas-section-label block mb-3">{q.mode}</label>
                <div className="flex justify-center gap-2">
                  {(["flag", "capital"] as QuizMode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`atlas-pill text-sm px-5 py-2 transition-all ${mode === m ? "atlas-pill-active" : ""}`}
                    >
                      {q[`mode_${m}` as keyof typeof q]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div className="mb-6">
                <label className="atlas-section-label block mb-3">{q.difficulty}</label>
                <div className="flex justify-center gap-2">
                  {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`atlas-pill text-sm px-5 py-2 transition-all ${difficulty === d ? "atlas-pill-active" : ""}`}
                    >
                      {q[`diff_${d}` as keyof typeof q]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Daily toggle */}
              <div className="mb-8">
                <label className="flex items-center justify-center gap-3 cursor-pointer">
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{q.daily_challenge}</span>
                  <button
                    onClick={() => setIsDaily(!isDaily)}
                    className="relative w-11 h-6 rounded-full transition-colors"
                    style={{ background: isDaily ? "var(--atlas-gold)" : "var(--atlas-border-light)" }}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        isDaily ? "translate-x-5" : ""
                      }`}
                    />
                  </button>
                </label>
                <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                  {isDaily ? q.daily_on : q.daily_off}
                </p>
              </div>

              <button
                onClick={startGame}
                disabled={countries.length === 0}
                className="px-8 py-3 rounded-full text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(135deg, var(--atlas-gold), var(--atlas-gold-dim))",
                  color: "var(--text-inverse)",
                  boxShadow: "0 4px 20px var(--atlas-gold-glow)",
                }}
              >
                {countries.length === 0 ? q.loading : q.start}
              </button>
            </div>
          </AnimatedSection>
        ) : gameOver ? (
          /* Results Screen */
          <AnimatedSection>
            <div className="atlas-card p-8 text-center compass-rose">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="text-6xl mb-4"
              >
                {score >= 8 ? "🏆" : score >= 5 ? "⭐" : "📚"}
              </motion.div>
              <h2
                className="text-2xl font-bold mb-2"
                style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", color: "var(--text-primary)" }}
              >
                {q.game_over}
              </h2>
              <p className="text-4xl font-bold mb-1 text-gradient-gold">{score}/{totalQuestions}</p>
              <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
                {q.best_streak}: {bestStreak}
              </p>

              <div className="flex justify-center gap-3">
                <button
                  onClick={startGame}
                  className="px-6 py-2.5 rounded-full text-sm font-bold transition-all"
                  style={{
                    background: "linear-gradient(135deg, var(--atlas-gold), var(--atlas-gold-dim))",
                    color: "var(--text-inverse)",
                  }}
                >
                  {q.play_again}
                </button>
                <button
                  onClick={() => setStarted(false)}
                  className="atlas-pill text-sm px-6 py-2.5"
                >
                  {q.change_settings}
                </button>
              </div>
            </div>
          </AnimatedSection>
        ) : current ? (
          /* Game Screen */
          <div className="space-y-6">
            {/* Progress & Score */}
            <AnimatedSection>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                  {q.question} {questionIndex + 1}/{totalQuestions}
                </span>
                <div className="flex items-center gap-4 text-sm">
                  <span style={{ color: "var(--text-tertiary)" }}>
                    {q.score}: <span className="font-bold text-gradient-gold">{score}</span>
                  </span>
                  {streak > 1 && (
                    <motion.span
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="font-bold"
                      style={{ color: "var(--atlas-gold)" }}
                    >
                      🔥 {streak}
                    </motion.span>
                  )}
                </div>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--atlas-border)" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, var(--atlas-gold), var(--atlas-teal))" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${((questionIndex + 1) / totalQuestions) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </AnimatedSection>

            {/* Question */}
            <AnimatePresence mode="wait">
              <motion.div
                key={questionIndex}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.25 }}
              >
                <div className="atlas-card p-6 text-center">
                  {mode === "flag" ? (
                    <>
                      <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
                        {q.which_country_flag}
                      </p>
                      <img
                        src={current.flags.svg}
                        alt="Mystery flag"
                        className="w-48 h-32 object-cover rounded-xl shadow-lg mx-auto mb-6"
                        style={{ border: "1px solid var(--atlas-border)" }}
                      />
                    </>
                  ) : (
                    <>
                      <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
                        {q.which_country_capital}
                      </p>
                      <p
                        className="text-4xl font-bold mb-6"
                        style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", color: "var(--text-primary)" }}
                      >
                        {current.capital?.[0] || "???"}
                      </p>
                    </>
                  )}

                  {/* Choices */}
                  <div className={`grid gap-3 ${CHOICES_COUNT[difficulty] <= 2 ? "grid-cols-1 max-w-xs mx-auto" : "grid-cols-2"}`}>
                    {choices.map((c) => {
                      const isCorrect = c.name.common === current.name.common;
                      const isSelected = selected === c.name.common;

                      let bg = "var(--atlas-surface)";
                      let borderCol = "var(--atlas-border)";
                      let textCol = "var(--text-primary)";

                      if (showResult) {
                        if (isCorrect) {
                          bg = "rgba(16, 185, 129, 0.15)";
                          borderCol = "var(--atlas-emerald)";
                          textCol = "var(--atlas-emerald)";
                        } else if (isSelected) {
                          bg = "rgba(244, 63, 94, 0.15)";
                          borderCol = "var(--atlas-rose)";
                          textCol = "var(--atlas-rose)";
                        } else {
                          textCol = "var(--text-tertiary)";
                        }
                      }

                      return (
                        <button
                          key={c.cca2}
                          onClick={() => handleAnswer(c.name.common)}
                          disabled={showResult}
                          className="px-4 py-3 text-sm font-semibold rounded-xl border-2 transition-all"
                          style={{
                            background: bg,
                            borderColor: borderCol,
                            color: textCol,
                            transform: showResult && isCorrect ? "scale(1.02)" : undefined,
                          }}
                          onMouseEnter={(e) => {
                            if (!showResult) {
                              e.currentTarget.style.borderColor = "var(--atlas-gold)";
                              e.currentTarget.style.background = "var(--atlas-surface-alt)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!showResult) {
                              e.currentTarget.style.borderColor = "var(--atlas-border)";
                              e.currentTarget.style.background = "var(--atlas-surface)";
                            }
                          }}
                        >
                          {c.name.common}
                        </button>
                      );
                    })}
                  </div>

                  {/* Next button */}
                  {showResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6"
                    >
                      <button
                        onClick={nextQuestion}
                        className="px-6 py-2.5 rounded-full text-sm font-bold transition-all"
                        style={{
                          background: "linear-gradient(135deg, var(--atlas-gold), var(--atlas-gold-dim))",
                          color: "var(--text-inverse)",
                        }}
                      >
                        {questionIndex + 1 >= totalQuestions ? q.see_results : q.next}
                      </button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        ) : null}
      </main>
    </div>
  );
}
