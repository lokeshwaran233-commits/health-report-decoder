import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ReportHistoryItem } from "./ReportHistoryItem";
import { SelectionActionBar } from "./SelectionActionBar";
import { ClearAllModal } from "./ClearAllModal";
import { useReportHistory } from "@/hooks/useReportHistory";
import type { AnalysisResult } from "@/types/report";

interface ReportHistoryListProps {
  reports: AnalysisResult[];
  cloudIds: Set<string>;
}

interface ConfirmState {
  open: boolean;
  count: number;
  onConfirm: () => void;
}

export function ReportHistoryList({ reports, cloudIds }: ReportHistoryListProps) {
  const h = useReportHistory();
  const [showClearAll, setShowClearAll] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState>({
    open: false,
    count: 0,
    onConfirm: () => {},
  });

  const selectedIds = Array.from(h.selected);
  const selectedCloudIds = selectedIds.filter((id) => cloudIds.has(id));

  const askRemoveSelected = () => {
    setConfirm({
      open: true,
      count: selectedIds.length,
      onConfirm: () => {
        void h.removeSelected(selectedIds, selectedCloudIds);
        setConfirm({ open: false, count: 0, onConfirm: () => {} });
      },
    });
  };

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={h.toggleSelectionMode}
          className="text-sm font-medium text-brand-teal hover:underline"
        >
          {h.selecting ? "Done" : "Select"}
        </button>
        {!h.selecting && (
          <button
            type="button"
            onClick={() => setShowClearAll(true)}
            className="text-[13px] font-medium text-brand-coral hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3 pb-24">
        <AnimatePresence>
          {reports.map((r) => (
            <ReportHistoryItem
              key={r.id}
              result={r}
              selecting={h.selecting}
              selected={h.selected.has(r.id)}
              isLocalOnly={!cloudIds.has(r.id)}
              onToggleSelect={() => h.toggleSelect(r.id)}
              onDelete={() => h.removeOne(r.id, !cloudIds.has(r.id))}
              busy={h.busy}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {h.selecting && (
          <SelectionActionBar
            count={selectedIds.length}
            label="report"
            onCancel={h.exitSelection}
            onRemove={askRemoveSelected}
            busy={h.busy}
          />
        )}
      </AnimatePresence>

      {/* Confirm bulk remove */}
      {confirm.open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[65] flex items-center justify-center bg-black/50 px-4"
          onClick={() => setConfirm({ open: false, count: 0, onConfirm: () => {} })}
        >
          <div
            className="w-full max-w-md rounded-card bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-brand-dark">
              Remove {confirm.count} report{confirm.count === 1 ? "" : "s"}?
            </h3>
            <p className="mt-2 text-sm text-brand-muted">
              These {confirm.count} lab report{confirm.count === 1 ? "" : "s"} will be permanently removed from your history.
            </p>
            <div className="mt-5 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setConfirm({ open: false, count: 0, onConfirm: () => {} })}
                className="px-4 h-10 rounded-btn text-sm text-brand-muted hover:text-brand-dark"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={h.busy}
                onClick={confirm.onConfirm}
                className="px-4 h-10 rounded-btn bg-[#EF4444] text-white text-sm font-medium hover:bg-[#DC2626] disabled:opacity-60"
              >
                Remove {confirm.count} report{confirm.count === 1 ? "" : "s"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ClearAllModal
        open={showClearAll}
        onClose={() => setShowClearAll(false)}
        onConfirm={async () => {
          await h.clearAllHistory(cloudIds.size > 0);
          setShowClearAll(false);
        }}
        title={`Clear all lab report history?`}
        body={`This will permanently delete all ${reports.length} lab report${reports.length === 1 ? "" : "s"} from your history. This action cannot be undone.`}
        confirmLabel="Clear all history"
        busy={h.busy}
      />
    </>
  );
}

export default ReportHistoryList;
