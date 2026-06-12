import { motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { Trash2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { scanStore } from "@/lib/scanStore";
import type { ScanInterpretationResult } from "@/types/scan";

interface ScanHistoryItemProps {
  scan: ScanInterpretationResult;
  selecting: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onDelete: () => void;
  busy?: boolean;
}

export function ScanHistoryItem({
  scan,
  selecting,
  selected,
  onToggleSelect,
  onDelete,
  busy,
}: ScanHistoryItemProps) {
  const navigate = useNavigate();

  const urgency = scan.professional?.urgency ?? "routine";
  const urgencyBadge = cn(
    "inline-block text-[11px] uppercase tracking-wide px-2 py-0.5 rounded-pill",
    urgency === "critical"
      ? "bg-brand-coral text-white"
      : urgency === "urgent"
        ? "bg-amber-200 text-amber-900"
        : "bg-emerald-100 text-emerald-900",
  );

  const handleClick = () => {
    if (selecting) {
      onToggleSelect();
      return;
    }
    scanStore.setLastResult(scan);
    void navigate({ to: "/scan-results", search: { id: scan.id } });
  };

  return (
    <motion.article
      layout
      exit={{ opacity: 0, x: -20, transition: { duration: 0.25 } }}
      onClick={handleClick}
      className={cn(
        "relative rounded-card bg-white border border-brand-border p-4 transition cursor-pointer hover:border-brand-teal/60",
        selected && "ring-2 ring-brand-teal/40 bg-brand-teal-light/30 border-l-[3px] border-l-brand-teal",
      )}
    >
      <div className="flex items-start gap-3">
        {selecting && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect();
            }}
            aria-label={selected ? "Deselect scan" : "Select scan"}
            className={cn(
              "h-5 w-5 mt-0.5 rounded-full border-2 flex items-center justify-center shrink-0",
              selected ? "bg-brand-teal border-brand-teal" : "border-brand-hint",
            )}
          >
            {selected && (
              <svg viewBox="0 0 16 16" className="h-3 w-3 text-white">
                <path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-brand-dark capitalize truncate">
                {scan.modality.replace(/_/g, " ")} · {scan.bodyRegion.replace(/_/g, " ")}
              </div>
              <div className="text-xs text-brand-muted mt-0.5">
                {new Date(scan.createdAt).toLocaleString()}
              </div>
              {scan.professional?.impression && (
                <p className="text-sm text-brand-dark mt-2 line-clamp-2">
                  {scan.professional.impression}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className={urgencyBadge}>{urgency}</span>
              {scan.criticalAlerts.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] text-brand-coral">
                  <AlertTriangle className="h-3 w-3" aria-hidden="true" /> Critical
                </span>
              )}
            </div>
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
            aria-label="Remove scan"
            className="p-2 -m-1 text-brand-hint hover:text-brand-coral transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </motion.article>
  );
}

export default ScanHistoryItem;
