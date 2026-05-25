import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { uploadStore } from "@/lib/uploadStore";
import { relativeTime } from "@/lib/relativeTime";
import type { AnalysisResult } from "@/types/report";

export interface HistoryCardProps {
  result: AnalysisResult;
  onDelete: (id: string) => void;
}

function statusColor(result: AnalysisResult): {
  border: string;
  counts: { normal: number; watch: number; flagged: number };
} {
  const counts = { normal: 0, watch: 0, flagged: 0 };
  for (const b of result.biomarkers) counts[b.status] += 1;
  const border =
    counts.flagged > 0
      ? "border-l-[#D85A30]"
      : counts.watch > 0
        ? "border-l-[#EF9F27]"
        : "border-l-[#1D9E75]";
  return { border, counts };
}

export function HistoryCard({ result, onDelete }: HistoryCardProps) {
  const navigate = useNavigate();
  const { border, counts } = statusColor(result);
  const name = result.metadata.patientName || "Lab Report";
  const lab = result.metadata.labName || "Lab report";
  const reportDate = result.metadata.reportDate || "";
  const uploadedAt = result.metadata.uploadedAt;

  const handleView = () => {
    uploadStore.setHistoryView(result);
    void navigate({ to: "/results" });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    uploadStore.deleteHistoryItem(result.id);
    onDelete(result.id);
    toast.success("Report removed from history");
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40, transition: { duration: 0.3 } }}
      transition={{ duration: 0.25 }}
      className={cn(
        "rounded-card bg-white border border-brand-border border-l-[3px] p-5 transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]",
        border,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[15px] font-semibold text-brand-dark">{name}</h3>
        {reportDate && (
          <span className="text-[13px] text-brand-muted shrink-0">
            {reportDate}
          </span>
        )}
      </div>
      <div className="mt-1 flex items-center justify-between gap-3">
        <span className="text-[13px] text-brand-muted">{lab}</span>
        <span className="text-[12px] text-brand-hint shrink-0">
          Uploaded {relativeTime(uploadedAt)}
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

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={handleView}
          className="text-sm font-medium text-brand-teal hover:underline"
        >
          View results →
        </button>
        <button
          type="button"
          onClick={handleDelete}
          aria-label={`Delete ${name}`}
          className="p-2 -m-2 text-brand-hint hover:text-brand-coral transition-colors"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </motion.article>
  );
}

export default HistoryCard;
