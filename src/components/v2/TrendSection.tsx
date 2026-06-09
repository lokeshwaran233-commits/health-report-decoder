import type { BiomarkerTrend } from "@/lib/clinical2026/types";

interface Props {
  title: string;
  items: BiomarkerTrend[];
  variant: "improved" | "worsened" | "stable";
  onSelect: (t: BiomarkerTrend) => void;
}

const STYLES = {
  improved: { heading: "text-emerald-600 dark:text-emerald-400", icon: "↑", bullet: "✓" },
  worsened: { heading: "text-orange-600 dark:text-orange-400", icon: "↓", bullet: "⚠" },
  stable: { heading: "text-brand-muted dark:text-white/40", icon: "→", bullet: "→" },
};

export function TrendSection({ title, items, variant, onSelect }: Props) {
  const st = STYLES[variant];
  return (
    <div>
      <h4 className={`text-xs font-bold tracking-[0.1em] uppercase mb-2 ${st.heading}`}>
        {st.bullet} {title}
      </h4>
      <div className="space-y-1.5">
        {items.map((t, i) => (
          <button
            key={t.normalizedName}
            onClick={() => onSelect(t)}
            className="w-full text-left flex items-center justify-between px-4 py-3 rounded-xl bg-brand-card dark:bg-white/[0.025] border border-brand-border dark:border-white/[0.05] hover:border-brand-teal/40 transition-all"
            style={{ animation: `fadeUp 0.4s ease forwards ${i * 50}ms`, opacity: 0 }}
          >
            <div className="flex items-center gap-3">
              <span className={`text-sm ${st.heading}`}>{st.icon}</span>
              <div>
                <p className="text-sm font-medium text-brand-dark dark:text-white/85">
                  {t.displayName}
                </p>
                <p className="text-xs text-brand-muted dark:text-white/40 mt-0.5 line-clamp-1">
                  {t.trendSentence}
                </p>
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-3">
              {t.trendPercent !== null && Math.abs(t.trendPercent) > 2 && (
                <p
                  className={`text-xs font-mono font-medium ${
                    variant === "improved"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : variant === "worsened"
                        ? "text-orange-600 dark:text-orange-400"
                        : "text-brand-muted"
                  }`}
                >
                  {t.trendPercent > 0 ? "+" : ""}
                  {t.trendPercent}%
                </p>
              )}
              <p className="text-[10px] text-brand-muted mt-0.5">View chart →</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
