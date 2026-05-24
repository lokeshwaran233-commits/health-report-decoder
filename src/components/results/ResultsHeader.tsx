import { Download, Share2 } from "lucide-react";
import { Button } from "@/components/rx/Button";
import type { AnalysisResult } from "@/types/report";

export interface ResultsHeaderProps {
  result: AnalysisResult;
  counts: { normal: number; watch: number; flagged: number };
  onShare: () => void;
  onDownload: () => void;
  onAnalyseAnother: () => void;
}

function Pill({
  count,
  label,
  bg,
  fg,
  dot,
}: {
  count: number;
  label: string;
  bg: string;
  fg: string;
  dot: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-pill px-3.5 py-1.5 text-[13px] font-medium ${bg} ${fg}`}
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full ${dot}`}
      />
      {count} {label}
    </span>
  );
}

export function ResultsHeader({
  result,
  counts,
  onShare,
  onDownload,
  onAnalyseAnother,
}: ResultsHeaderProps) {
  const { metadata } = result;
  const title = metadata.patientName
    ? `${metadata.patientName}'s lab report`
    : "Lab report analysis";
  const sub = [metadata.reportDate, metadata.labName]
    .filter(Boolean)
    .join(" · ");

  return (
    <header className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        <h1 className="text-lg font-semibold text-brand-dark truncate">
          {title}
        </h1>
        {sub && <p className="mt-0.5 text-sm text-brand-muted">{sub}</p>}

        <div className="mt-4 flex flex-wrap gap-2">
          <Pill
            count={counts.normal}
            label="Normal"
            bg="bg-brand-teal-light"
            fg="text-brand-teal"
            dot="bg-brand-teal"
          />
          <Pill
            count={counts.watch}
            label="To watch"
            bg="bg-brand-amber-light"
            fg="text-brand-amber"
            dot="bg-brand-amber"
          />
          <Pill
            count={counts.flagged}
            label="Flagged"
            bg="bg-brand-coral-light"
            fg="text-brand-coral"
            dot="bg-brand-coral"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 md:shrink-0">
        <Button
          variant="secondary"
          size="md"
          onClick={onShare}
          leftIcon={<Share2 className="h-4 w-4" aria-hidden="true" />}
        >
          Share summary
        </Button>
        <Button
          variant="secondary"
          size="md"
          onClick={onDownload}
          leftIcon={<Download className="h-4 w-4" aria-hidden="true" />}
        >
          Download PDF
        </Button>
        <Button variant="ghost" size="md" onClick={onAnalyseAnother}>
          Analyse another
        </Button>
      </div>
    </header>
  );
}

export default ResultsHeader;
