import { useState } from "react";
import { Copy, FileText, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/rx/Button";
import type { AnalysisResult } from "@/types/report";

export interface InsightsSectionProps {
  result: AnalysisResult;
}

function renderSummary(text: string) {
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);
  return paragraphs.map((p, idx) => {
    if (idx === 0) {
      const dotIdx = p.indexOf(".");
      if (dotIdx > -1) {
        return (
          <p
            key={idx}
            className="text-[15px] text-brand-muted leading-[1.75] mb-3"
          >
            <strong className="text-brand-dark">{p.slice(0, dotIdx + 1)}</strong>
            {p.slice(dotIdx + 1)}
          </p>
        );
      }
    }
    return (
      <p
        key={idx}
        className="text-[15px] text-brand-muted leading-[1.75] mb-3"
      >
        {p}
      </p>
    );
  });
}

export function InsightsSection({ result }: InsightsSectionProps) {
  const [copiedAll, setCopiedAll] = useState(false);

  const copyOne = async (q: string) => {
    try {
      await navigator.clipboard.writeText(q);
      toast.success("Question copied to clipboard");
    } catch {
      toast.error("Couldn't copy — please try again");
    }
  };

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(
        result.doctorQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n"),
      );
      setCopiedAll(true);
      toast.success("All questions copied");
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      toast.error("Couldn't copy — please try again");
    }
  };

  return (
    <div className="space-y-8">
      <section
        aria-labelledby="summary-heading"
        className="rounded-card bg-white border border-brand-border border-l-[3px] border-l-brand-teal-light p-6"
      >
        <h2
          id="summary-heading"
          className="flex items-center gap-2 text-lg font-semibold text-brand-dark mb-4"
        >
          <FileText className="h-4 w-4 text-brand-teal" aria-hidden="true" />
          Your report summary
        </h2>
        {renderSummary(result.summary)}
      </section>

      <section
        aria-labelledby="questions-heading"
        className="rounded-card bg-white border border-brand-border p-6"
      >
        <h2
          id="questions-heading"
          className="flex items-center gap-2 text-lg font-semibold text-brand-dark"
        >
          <MessageSquare className="h-4 w-4 text-brand-teal" aria-hidden="true" />
          Take these to your next appointment
        </h2>
        <p className="mt-1 text-[13px] text-brand-muted">
          Generated based on your specific results.
        </p>

        <ol className="mt-5 space-y-3">
          {result.doctorQuestions.map((q, i) => (
            <li
              key={i}
              className="flex items-start gap-3 rounded-btn border border-brand-border p-3"
            >
              <span
                className="shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-full bg-brand-teal text-white text-xs font-semibold"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <p className="flex-1 text-sm text-brand-dark leading-relaxed">
                {q}
              </p>
              <button
                type="button"
                onClick={() => copyOne(q)}
                aria-label="Copy question to clipboard"
                className="text-brand-muted hover:text-brand-teal transition-colors p-1"
              >
                <Copy className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ol>

        <div className="mt-5">
          <Button variant="secondary" size="md" fullWidth onClick={copyAll}>
            {copiedAll ? "Copied to clipboard ✓" : "Copy all questions"}
          </Button>
        </div>
      </section>
    </div>
  );
}

export default InsightsSection;
