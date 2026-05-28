import { AlertOctagon } from "lucide-react";
import type { AnalysisResult } from "@/types/report";

export interface CriticalValuesBannerProps {
  result: AnalysisResult;
}

export function CriticalValuesBanner({ result }: CriticalValuesBannerProps) {
  const critical = result.biomarkers.filter((b) => b.criticalFlag);
  if (critical.length === 0) return null;

  return (
    <section
      role="alert"
      aria-live="polite"
      className="rounded-card border-2 border-brand-coral bg-brand-coral-light/60 p-5 shadow-card"
    >
      <div className="flex items-start gap-3">
        <span className="relative shrink-0">
          <AlertOctagon
            className="h-6 w-6 text-brand-coral"
            aria-hidden="true"
          />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-brand-coral animate-ping" />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-brand-coral" />
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-brand-dark">
            One or more results need prompt medical attention
          </h2>
          <p className="mt-1 text-[13px] text-brand-dark/80 leading-relaxed">
            Please contact your doctor today regarding the value
            {critical.length === 1 ? "" : "s"} below. ReportRx is not a
            substitute for urgent medical care.
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {critical.map((b) => (
              <li
                key={b.id}
                className="rounded-pill bg-white border border-brand-coral/40 px-3 py-1 text-[13px] text-brand-coral font-medium"
              >
                {b.name}: {b.value} {b.unit}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default CriticalValuesBanner;
