import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DetectedPattern, PatternSeverity } from "@/types/report";

export interface PatternsSectionProps {
  patterns: DetectedPattern[];
}

const SEVERITY_META: Record<
  PatternSeverity,
  { border: string; tint: string; label: string; chip: string }
> = {
  informational: {
    border: "border-l-brand-teal",
    tint: "bg-brand-teal-light/30",
    label: "Insight",
    chip: "bg-brand-teal-light text-brand-teal",
  },
  watch: {
    border: "border-l-brand-amber",
    tint: "bg-brand-amber-light/40",
    label: "To watch",
    chip: "bg-brand-amber-light text-brand-amber",
  },
  flagged: {
    border: "border-l-brand-coral",
    tint: "bg-brand-coral-light/40",
    label: "Flagged pattern",
    chip: "bg-brand-coral-light text-brand-coral",
  },
  critical: {
    border: "border-l-brand-coral",
    tint: "bg-brand-coral-light/60",
    label: "Critical pattern",
    chip: "bg-brand-coral text-white",
  },
};

function humanise(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function PatternsSection({ patterns }: PatternsSectionProps) {
  if (patterns.length === 0) return null;

  return (
    <section aria-labelledby="patterns-heading" className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-brand-teal" aria-hidden="true" />
        <h2
          id="patterns-heading"
          className="text-base font-semibold text-brand-dark"
        >
          Patterns we noticed across your results
        </h2>
      </div>
      <p className="text-[13px] text-brand-muted">
        These connect multiple markers into one clinical picture — they often
        matter more than any single value on its own.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {patterns.map((p, i) => {
          const meta = SEVERITY_META[p.severity];
          return (
            <article
              key={`${p.name}-${i}`}
              className={cn(
                "rounded-card bg-white border border-brand-border border-l-[3px] p-4",
                meta.border,
                meta.tint,
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold text-brand-dark">
                  {humanise(p.name)}
                </h3>
                <span
                  className={cn(
                    "shrink-0 rounded-pill px-2 py-0.5 text-[11px] font-medium",
                    meta.chip,
                  )}
                >
                  {meta.label}
                </span>
              </div>
              <p className="mt-2 text-[13px] text-brand-dark/80 leading-relaxed">
                {p.plainEnglish}
              </p>
              {p.biomarkersInvolved.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {p.biomarkersInvolved.map((b) => (
                    <li
                      key={b}
                      className="rounded-pill bg-white border border-brand-border px-2 py-0.5 text-[11px] text-brand-muted"
                    >
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default PatternsSection;
