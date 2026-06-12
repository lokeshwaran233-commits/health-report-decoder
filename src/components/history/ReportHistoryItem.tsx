import { motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadStore } from "@/lib/uploadStore";
import { relativeTime } from "@/lib/relativeTime";
import type { AnalysisResult } from "@/types/report";

interface ReportHistoryItemProps {
  result: AnalysisResult;
  selecting: boolean;
  selected: boolean;
  isLocalOnly: boolean;
  onToggleSelect: () => void;
  onDelete: () => void;
  busy?: boolean;
}

function statusCounts(result: AnalysisResult) {
  const counts = { normal: 0, watch: 0, flagged: 0 };
  for (const b of result.biomarkers) counts[b.status] += 1;
  return counts;
}

export function ReportHistoryItem({
  result,
  selecting,
  selected,
  isLocalOnly,
  onToggleSelect,
  onDelete,
  busy,
}: ReportHistoryItemProps) {
  const navigate = useNavigate();

  const counts = statusCounts(result);
  const name = result.metadata.patientName || "Lab Report";
  const lab = result.metadata.labName || "Lab report";
  const reportDate = result.metadata.reportDate || "";

  const handleClick = () => {
    if (selecting) {
      onToggleSelect();
      return;
    }
    uploadStore.setHistoryView(result);
    void navigate({ to: "/results" });
  };

  const borderLeft =
    counts.flagged > 0
      ? "border-l-brand-coral"
      : counts.watch > 0
        ? "border-l-brand-amber"
        : "border-l-brand-teal-mid";

  return (
    <motion.article
      layout
      exit={{ opacity: 0, x: -20, transition: { duration: 0.25 } }}
      className={cn(
        "relative rounded-card bg-white border border-brand-border border-l-[3px] p-5 transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] cursor-pointer",
        borderLeft,
        selected && "ring-2 ring-brand-teal/40 bg-brand-teal-light/30",
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {selecting && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect();
            }}
            aria-label={selected ? "Deselect report" : "Select report"}
            className={cn(
              "h-5 w-5 mt-0.5 rounded-full border-2 flex items-center justify-center shrink-0 transition",
              selected ? "bg-brand-teal border-brand-teal" : "border-brand-hint",
            )}
          >
            {selected && (
              <svg viewBox="0 0 16 16" className="h-3 w-3 text-white">
                <path
                  d="M3 8.5l3 3 7-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-[15px] font-semibold text-brand-dark truncate">{name}</h3>
            {reportDate && (
              <span className="text-[13px] text-brand-muted shrink-0">{reportDate}</span>
            )}
          </div>
          <div className="mt-1 flex items-center justify-between gap-3">
            <span className="text-[13px] text-brand-muted truncate">{lab}</span>
            <span className="text-[12px] text-brand-hint shrink-0">
              {relativeTime(result.metadata.uploadedAt)}
            </span>
          </div>
          <div className="mt-3 flex gap-2 flex-wrap text-[12px]">
            <span className="rounded-pill bg-brand-teal-light text-brand-teal px-2.5 py-0.5">
              {counts.normal} Normal
            </span>
            <span className="rounded-pill bg-brand-amber-light text-brand-amber px-2.5 py-0.5">
              {counts.watch} To watch
            </span>
            <span className="rounded-pill bg-brand-coral-light text-brand-coral px-2.5 py-0.5">
              {counts.flagged} Flagged
            </span>
          </div>
        </div>

        {!selecting && (
          <button
            type="button"
            disabled={busy}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label="Remove report"
            className="p-2 -m-1 text-brand-hint hover:text-brand-coral transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </motion.article>
  );
}

export default ReportHistoryItem;
