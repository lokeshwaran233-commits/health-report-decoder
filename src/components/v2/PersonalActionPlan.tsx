import { useState } from "react";
import type { PersonalActionPlan as Plan } from "@/lib/clinical2026/types";

interface Props {
  plan: Plan;
  onZenoClick: () => void;
  onDoctorBriefClick: () => void;
}

export function PersonalActionPlan({
  plan,
  onZenoClick,
  onDoctorBriefClick,
}: Props) {
  const [activeTab, setActiveTab] = useState<"7d" | "30d" | "doctor">("7d");
  const items =
    activeTab === "7d"
      ? plan.actions7Day
      : activeTab === "30d"
        ? plan.actions30Day
        : plan.doctorItems;

  return (
    <div className="rounded-2xl bg-brand-card dark:bg-[#0A1628] border border-brand-border dark:border-[#1C2A3E] overflow-hidden mb-6">
      <div className="px-5 py-4 border-b border-brand-border dark:border-[#1C2A3E] bg-gradient-to-r from-brand-teal-light dark:from-[#0D4A3A]/50 to-transparent">
        <div className="flex items-center gap-2 mb-1">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M3 8h10M8 3l5 5-5 5"
              stroke="currentColor"
              className="text-brand-teal dark:text-[#00D9A3]"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <h3 className="text-sm font-semibold tracking-wide uppercase text-brand-teal dark:text-[#00D9A3] font-mono">
            Your Personal Action Plan
          </h3>
        </div>
        <p className="text-xs text-brand-muted dark:text-white/40">
          Based on your report — specific, actionable, time-bound
        </p>
      </div>

      <div className="px-5 py-4 bg-brand-teal-light/40 dark:bg-[#0D4A3A]/20 border-b border-brand-border dark:border-[#1C2A3E]">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-brand-teal/20 border border-brand-teal/40 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-[10px] font-bold text-brand-teal">1</span>
          </div>
          <div>
            <p className="text-sm font-medium text-brand-dark dark:text-white/90 leading-relaxed">
              {plan.topPriority}
            </p>
            <p className="text-xs text-brand-muted dark:text-white/40 mt-1">
              This is the one that matters most right now
            </p>
          </div>
        </div>
      </div>

      <div className="flex border-b border-brand-border dark:border-[#1C2A3E]">
        {(["7d", "30d", "doctor"] as const).map((tab) => (
          <button
            key={tab}
            className={`flex-1 py-2.5 text-xs font-semibold tracking-wide uppercase transition-colors ${
              activeTab === tab
                ? "text-brand-teal border-b-2 border-brand-teal -mb-px bg-brand-teal-light/40 dark:bg-[#0D4A3A]/20"
                : "text-brand-muted dark:text-white/35 hover:text-brand-dark dark:hover:text-white/60"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "7d"
              ? "Next 7 days"
              : tab === "30d"
                ? "Next 30 days"
                : "Doctor visit"}
          </button>
        ))}
      </div>

      <div className="px-5 py-4 min-h-[100px]">
        {items.length === 0 ? (
          <p className="text-sm text-brand-muted dark:text-white/40 italic">
            No specific actions for this timeframe.
          </p>
        ) : (
          items.map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-3 py-2 border-b border-brand-border/50 dark:border-white/[0.04] last:border-0"
              style={{
                animation: `fadeUp 0.3s ease forwards ${i * 60}ms`,
                opacity: 0,
              }}
            >
              <svg
                className="mt-1 flex-shrink-0 text-brand-teal dark:text-[#00D9A3]"
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M2 6l3 3 5-5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="text-sm text-brand-dark dark:text-white/70 leading-relaxed">
                {item}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="px-5 py-4 border-t border-brand-border dark:border-[#1C2A3E] bg-brand-surface dark:bg-black/20 flex flex-col sm:flex-row gap-2">
        <button
          onClick={onZenoClick}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-teal text-white text-sm font-medium hover:bg-brand-teal-mid transition-colors"
        >
          Ask Zeno about any of this
        </button>
        <button
          onClick={onDoctorBriefClick}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-surface dark:bg-white/5 border border-brand-border dark:border-white/10 text-brand-dark dark:text-white/70 text-sm font-medium hover:bg-brand-border/30 dark:hover:bg-white/8 transition-colors"
        >
          Doctor Appointment Brief
        </button>
      </div>

      {plan.encouragement && (
        <div className="px-5 py-3 bg-brand-card dark:bg-[#0A1628] border-t border-brand-border dark:border-[#1C2A3E]">
          <p className="text-xs text-brand-muted dark:text-white/35 italic leading-relaxed">
            {plan.encouragement}
          </p>
        </div>
      )}
    </div>
  );
}
