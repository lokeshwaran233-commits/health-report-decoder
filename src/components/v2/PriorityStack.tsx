import { useState } from "react";
import type { PriorityItem } from "@/lib/clinical2026/types";

interface Props {
  items: PriorityItem[];
  isLoading?: boolean;
}

const CFG = {
  act_now: {
    bg: "bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-950/60",
    border:
      "border-orange-300 dark:border-orange-500/25 hover:border-orange-400 dark:hover:border-orange-500/50",
    badge:
      "bg-orange-100 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-500/30",
    label: "ACT THIS WEEK",
  },
  watch: {
    bg: "bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50",
    border:
      "border-amber-300 dark:border-amber-500/20 hover:border-amber-400 dark:hover:border-amber-500/40",
    badge:
      "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30",
    label: "WATCH THIS MONTH",
  },
  great: {
    bg: "bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-950/40",
    border:
      "border-emerald-300 dark:border-emerald-500/15 hover:border-emerald-400 dark:hover:border-emerald-500/35",
    badge:
      "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20",
    label: "GREAT — KEEP IT UP",
  },
  stable: {
    bg: "bg-brand-surface dark:bg-white/[0.02] hover:bg-brand-border/30 dark:hover:bg-white/[0.04]",
    border:
      "border-brand-border dark:border-white/[0.06] hover:border-brand-hint dark:hover:border-white/[0.12]",
    badge:
      "bg-brand-border dark:bg-white/5 text-brand-muted dark:text-white/40 border border-brand-border dark:border-white/10",
    label: "STABLE — NO ACTION",
  },
} as const;

export function PriorityStack({ items, isLoading }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (isLoading) {
    return (
      <section className="mb-8">
        <div className="text-sm text-brand-muted dark:text-white/40">
          Analyzing your report…
        </div>
      </section>
    );
  }

  const groups = {
    act_now: items.filter((i) => i.urgencyLevel === "act_now"),
    watch: items.filter((i) => i.urgencyLevel === "watch"),
    great: items.filter((i) => i.urgencyLevel === "great"),
    stable: items.filter((i) => i.urgencyLevel === "stable"),
  };

  return (
    <section
      id="priority-stack"
      aria-label="Report priority stack"
      className="mb-8"
    >
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-base font-semibold text-brand-dark dark:text-white/90 tracking-tight"
          style={{ fontFamily: "Fraunces, Georgia, serif" }}
        >
          Your Report at a Glance
        </h3>
        <span className="text-xs text-brand-muted dark:text-white/35 font-medium">
          {items.length} values · sorted by importance
        </span>
      </div>

      <div className="space-y-2" role="list">
        {(Object.entries(groups) as [keyof typeof groups, PriorityItem[]][])
          .filter(([, g]) => g.length > 0)
          .map(([urgency, group]) => {
            const cfg = CFG[urgency];
            return (
              <div key={urgency} role="listitem">
                {(urgency === "great" || urgency === "stable") && (
                  <div className="flex items-center gap-3 my-3">
                    <div className="h-px flex-1 bg-brand-border dark:bg-white/[0.06]" />
                    <span className="text-[10px] font-medium tracking-[0.1em] uppercase text-brand-muted dark:text-white/25">
                      {cfg.label}
                    </span>
                    <div className="h-px flex-1 bg-brand-border dark:bg-white/[0.06]" />
                  </div>
                )}

                {group.map((item, idx) => {
                  const isExp = expanded === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`rounded-xl border ${cfg.bg} ${cfg.border} transition-all duration-200 ease-out overflow-hidden mb-2`}
                      style={{
                        animation: `fadeUp 0.4s ease forwards ${idx * 60}ms`,
                        opacity: 0,
                      }}
                    >
                      <button
                        className="w-full text-left px-4 py-3 flex items-center gap-3"
                        onClick={() => setExpanded(isExp ? null : item.id)}
                        aria-expanded={isExp}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-brand-dark dark:text-white/90 truncate">
                              {item.displayName}
                            </span>
                            {(urgency === "act_now" || urgency === "watch") && (
                              <span
                                className={`text-[10px] font-semibold tracking-[0.08em] uppercase px-2 py-0.5 rounded-full ${cfg.badge}`}
                              >
                                {cfg.label}
                              </span>
                            )}
                          </div>
                          {item.outcomeSentence && (
                            <p className="text-xs text-brand-muted dark:text-white/45 mt-0.5 leading-relaxed line-clamp-1">
                              {item.outcomeSentence}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-sm font-mono font-medium text-brand-dark dark:text-white/85">
                            {item.value}
                            {item.unit ? ` ${item.unit}` : ""}
                          </div>
                          <svg
                            className={`w-4 h-4 text-brand-muted dark:text-white/30 transition-transform duration-200 ${
                              isExp ? "rotate-180" : ""
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </button>

                      {isExp && item.actionItems.length > 0 && (
                        <div className="px-4 pb-4 pt-1 border-t border-brand-border dark:border-white/[0.06]">
                          {item.actionItems.map((a, i) => (
                            <div key={i} className="flex items-start gap-2 mt-2">
                              <span
                                className={`text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded flex-shrink-0 mt-0.5 ${
                                  a.timeframe === "7d"
                                    ? "bg-orange-100 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300"
                                    : a.timeframe === "doctor"
                                      ? "bg-sky-100 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300"
                                      : "bg-brand-border dark:bg-white/8 text-brand-muted dark:text-white/40"
                                }`}
                              >
                                {a.timeframe === "7d"
                                  ? "This week"
                                  : a.timeframe === "doctor"
                                    ? "Doctor"
                                    : "30 days"}
                              </span>
                              <span
                                className={`text-xs leading-relaxed ${
                                  a.isHighPriority
                                    ? "text-brand-dark dark:text-white/75"
                                    : "text-brand-muted dark:text-white/45"
                                }`}
                              >
                                {a.action}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
      </div>
    </section>
  );
}
