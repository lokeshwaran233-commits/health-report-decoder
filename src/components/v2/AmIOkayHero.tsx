import { useEffect, useRef, useState } from "react";
import type { AmIOkayResult } from "@/lib/clinical2026/types";

interface Props {
  result: AmIOkayResult;
  patientName?: string | null;
}

const STATUS_STYLES = {
  great: {
    bg: "bg-emerald-50 dark:bg-emerald-950/60",
    border: "border-emerald-300 dark:border-emerald-500/30",
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-300",
    blob: "bg-emerald-400",
  },
  mostly_okay: {
    bg: "bg-sky-50 dark:bg-sky-950/60",
    border: "border-sky-300 dark:border-sky-500/30",
    dot: "bg-sky-500",
    text: "text-sky-700 dark:text-sky-300",
    blob: "bg-sky-400",
  },
  needs_attention: {
    bg: "bg-amber-50 dark:bg-amber-950/60",
    border: "border-amber-300 dark:border-amber-500/30",
    dot: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-300",
    blob: "bg-amber-400",
  },
  act_now: {
    bg: "bg-orange-50 dark:bg-orange-950/60",
    border: "border-orange-300 dark:border-orange-500/30",
    dot: "bg-orange-500",
    text: "text-orange-700 dark:text-orange-300",
    blob: "bg-orange-400",
  },
  critical: {
    bg: "bg-red-50 dark:bg-red-950/60",
    border: "border-red-300 dark:border-red-500/30",
    dot: "bg-red-500",
    text: "text-red-700 dark:text-red-300",
    blob: "bg-red-400",
  },
} as const;

export function AmIOkayHero({ result, patientName }: Props) {
  const [visible, setVisible] = useState(false);
  const [reveal, setReveal] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const st = STATUS_STYLES[result.status];

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => setReveal(true), 200);
      return () => clearTimeout(t);
    }
  }, [visible]);

  const label =
    result.status === "great"
      ? "All Clear"
      : result.status === "mostly_okay"
        ? "Mostly Healthy"
        : result.status === "needs_attention"
          ? "Needs Attention"
          : result.status === "act_now"
            ? "Action Required"
            : "Critical Alert";

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden rounded-2xl border shadow-xl ${st.bg} ${st.border} transition-all duration-700 ease-out mb-6 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
      role="region"
      aria-label="Health summary"
    >
      <div
        className={`absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-20 ${st.blob}`}
        aria-hidden="true"
      />

      <div className="relative px-6 py-5 sm:px-8 sm:py-6">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase bg-white/60 dark:bg-black/30 border ${st.border} ${st.text}`}
          >
            <span
              className={`inline-block w-2 h-2 rounded-full ${st.dot} animate-pulse`}
              aria-hidden="true"
            />
            {label}
          </span>
          {result.timeframe !== "routine" && (
            <span className="text-xs text-brand-muted dark:text-white/40 font-medium">
              Review within{" "}
              {result.timeframe === "24h"
                ? "24 hours"
                : result.timeframe === "7d"
                  ? "7 days"
                  : "30 days"}
            </span>
          )}
        </div>

        <h2
          className={`text-xl sm:text-2xl lg:text-3xl leading-tight text-brand-dark dark:text-white font-medium mb-2 transition-all duration-500 ease-out ${
            reveal ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
          style={{ fontFamily: "Fraunces, Georgia, serif" }}
        >
          {patientName ? `${patientName.split(" ")[0]}, ` : ""}
          {result.headline}
        </h2>

        <p
          className={`text-sm sm:text-base text-brand-muted dark:text-white/60 leading-relaxed mb-5 transition-all duration-500 delay-100 ease-out ${
            reveal ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
        >
          {result.subline}
        </p>

        <div
          className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 transition-all duration-500 delay-200 ease-out ${
            reveal ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
        >
          <div className={`flex items-center gap-2 text-sm font-medium ${st.text}`}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
              <path d="M7 4.5v3l2 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {result.actionSummary}
          </div>
          <span className="text-brand-hint hidden sm:block">·</span>
          <button
            className="text-sm text-brand-muted hover:text-brand-dark dark:hover:text-white/80 transition-colors underline underline-offset-2"
            onClick={() =>
              document
                .getElementById("priority-stack")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            See detailed breakdown ↓
          </button>
        </div>
      </div>
    </div>
  );
}
