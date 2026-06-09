import { useState } from "react";
import type { HealthIntent } from "@/lib/clinical2026/types";
import { INTENT_CONFIG } from "@/lib/clinical2026/intent";

interface Props {
  onSelect: (intent: HealthIntent) => void;
  isReturningUser?: boolean;
  userName?: string | null;
}

const GROUPS: { title: string; intents: HealthIntent[] }[] = [
  {
    title: "What do you want to understand?",
    intents: [
      "cholesterol_heart",
      "blood_sugar_diabetes",
      "thyroid",
      "full_blood_count",
      "liver_kidney",
      "everything",
    ],
  },
  {
    title: "Or tell us more specifically:",
    intents: ["worried_about_results", "already_managing", "doctor_appointment"],
  },
];

export function IntentSelector({ onSelect, isReturningUser, userName }: Props) {
  const [selected, setSelected] = useState<HealthIntent | null>(null);

  const handle = (id: HealthIntent) => {
    setSelected(id);
    setTimeout(() => onSelect(id), 200);
  };

  return (
    <div
      className="max-w-lg mx-auto px-4 py-8"
      style={{ animation: "fadeUp 0.5s ease forwards", opacity: 0 }}
    >
      <div className="mb-6">
        <p className="text-sm text-brand-teal font-medium tracking-wide uppercase mb-2">
          {isReturningUser ? "Welcome back" : "Let's start"}
        </p>
        <h2
          className="text-2xl sm:text-3xl font-medium text-brand-dark dark:text-white leading-tight"
          style={{ fontFamily: "Fraunces, Georgia, serif" }}
        >
          {isReturningUser && userName
            ? `${userName.split(" ")[0]}, what would you like to understand today?`
            : "What do you want to understand today?"}
        </h2>
        <p className="text-sm text-brand-muted dark:text-white/40 mt-2 leading-relaxed">
          Your choice shapes how we explain your results — so tell us what
          matters to you.
        </p>
      </div>

      {GROUPS.map((group, gi) => (
        <div key={gi} className="mb-5">
          <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-brand-muted dark:text-white/30 mb-2.5">
            {group.title}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {group.intents.map((id) => {
              const cfg = INTENT_CONFIG[id];
              const isSel = selected === id;
              return (
                <button
                  key={id}
                  onClick={() => handle(id)}
                  aria-pressed={isSel}
                  className={`relative text-left px-4 py-3 rounded-xl border transition-all duration-150 ${
                    isSel
                      ? "bg-brand-teal-light dark:bg-[#0D4A3A] border-brand-teal shadow-lg"
                      : "bg-brand-card dark:bg-white/[0.025] border-brand-border dark:border-white/[0.07] hover:border-brand-teal/50 dark:hover:border-white/20"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`text-lg flex-shrink-0 transition-colors ${
                        isSel ? "text-brand-teal" : "text-brand-muted dark:text-white/40"
                      }`}
                      aria-hidden="true"
                    >
                      {cfg.icon}
                    </span>
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-medium leading-tight transition-colors ${
                          isSel
                            ? "text-brand-teal"
                            : "text-brand-dark dark:text-white/85"
                        }`}
                      >
                        {cfg.label}
                      </p>
                      <p className="text-xs text-brand-muted dark:text-white/35 mt-0.5 leading-relaxed">
                        {cfg.sublabel}
                      </p>
                    </div>
                  </div>
                  {isSel && (
                    <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-brand-teal flex items-center justify-center">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                        <path
                          d="M2 5l2 2 4-4"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <button
        onClick={() => onSelect("everything")}
        className="w-full text-center text-xs text-brand-muted hover:text-brand-dark dark:hover:text-white/50 transition-colors py-2 mt-1"
      >
        Skip and analyze everything →
      </button>
    </div>
  );
}
