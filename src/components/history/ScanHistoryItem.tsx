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
          <div className="relative" ref={popRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmOpen((v) => !v);
              }}
              aria-label="Scan options"
              className="p-2 -m-1 text-brand-hint hover:text-brand-dark transition-colors"
            >
              <MoreVertical className="h-4 w-4" aria-hidden="true" />
            </button>
            {confirmOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.15 }}
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-9 z-30 w-[260px] rounded-xl bg-[#1A2235] border border-[#1E2D42] p-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-white">Remove this scan?</p>
                    <p className="text-xs text-[#8B9BAE] mt-1">
                      This scan and its AI analysis will be permanently removed.
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setConfirmOpen(false)}
                    className="text-sm text-[#8B9BAE] hover:text-white px-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setConfirmOpen(false);
                      onDelete();
                    }}
                    className="inline-flex items-center gap-1.5 rounded-btn bg-[#EF4444] text-white px-3 py-1.5 text-sm font-medium hover:bg-[#DC2626] disabled:opacity-60"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Remove
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </motion.article>
  );
}

export default ScanHistoryItem;
