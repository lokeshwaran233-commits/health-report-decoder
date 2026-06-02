import { useState } from "react";
import { Sparkles } from "lucide-react";
import { ZenoPanel } from "./ZenoPanel";
import { detectEmergencies } from "@/lib/zeno/emergencyDetector";
import type { AnalysisResult } from "@/types/report";

export function ZenoOrb({ report }: { report: AnalysisResult | null }) {
  const [open, setOpen] = useState(false);
  const hasEmergency = report ? detectEmergencies(report.biomarkers).length > 0 : false;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-gradient-to-br from-brand-teal to-brand-teal-mid px-4 py-3 text-white shadow-lg hover:shadow-xl transition-shadow"
        aria-label="Open Zeno health companion"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
        </span>
        <Sparkles className="h-4 w-4" />
        <span className="text-sm font-medium">Ask Zeno</span>
        {hasEmergency && (
          <span className="ml-1 h-2 w-2 rounded-full bg-brand-coral ring-2 ring-white" />
        )}
      </button>
      <ZenoPanel open={open} onClose={() => setOpen(false)} report={report} />
    </>
  );
}
