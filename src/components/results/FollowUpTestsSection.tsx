import { useState } from "react";
import { Check, Copy, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FollowUpTest, FollowUpUrgency } from "@/types/report";

export interface FollowUpTestsSectionProps {
  tests: FollowUpTest[];
}

const URGENCY_META: Record<
  FollowUpUrgency,
  { label: string; chip: string; hint: string }
> = {
  urgent: {
    label: "Urgent",
    chip: "bg-brand-coral text-white",
    hint: "Discuss at your next available appointment",
  },
  soon: {
    label: "Soon",
    chip: "bg-brand-amber-light text-brand-amber",
    hint: "Within 2–4 weeks",
  },
  routine: {
    label: "Routine",
    chip: "bg-brand-teal-light text-brand-teal",
    hint: "At your next scheduled check-up",
  },
};

function FollowUpCard({ test }: { test: FollowUpTest }) {
  const [copied, setCopied] = useState(false);
  const meta = URGENCY_META[test.urgency];

  const handleCopy = async () => {
    const message = `Based on my recent lab results, could we discuss adding ${test.test}? ${test.reason}.`;
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — no-op */
    }
  };

  return (
    <article className="rounded-card bg-white border border-brand-border p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <FlaskConical
            className="h-4 w-4 text-brand-teal shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <h3 className="text-sm font-semibold text-brand-dark break-words">
            {test.test}
          </h3>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-pill px-2 py-0.5 text-[11px] font-medium",
            meta.chip,
          )}
          title={meta.hint}
        >
          {meta.label}
        </span>
      </div>
      <p className="text-[13px] text-brand-muted leading-relaxed">
        {test.reason}
      </p>
      <button
        type="button"
        onClick={handleCopy}
        className="self-start inline-flex items-center gap-1.5 text-[12px] font-medium text-brand-teal hover:underline"
        aria-live="polite"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            Copied
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            Copy for doctor
          </>
        )}
      </button>
    </article>
  );
}

export function FollowUpTestsSection({ tests }: FollowUpTestsSectionProps) {
  if (tests.length === 0) return null;

  return (
    <section aria-labelledby="followups-heading" className="space-y-3">
      <div className="flex items-center gap-2">
        <FlaskConical className="h-4 w-4 text-brand-teal" aria-hidden="true" />
        <h2
          id="followups-heading"
          className="text-base font-semibold text-brand-dark"
        >
          Recommended follow-up tests
        </h2>
      </div>
      <p className="text-[13px] text-brand-muted">
        Based on patterns in your results, your doctor may consider adding:
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {tests.map((t, i) => (
          <FollowUpCard key={`${t.test}-${i}`} test={t} />
        ))}
      </div>
    </section>
  );
}

export default FollowUpTestsSection;
