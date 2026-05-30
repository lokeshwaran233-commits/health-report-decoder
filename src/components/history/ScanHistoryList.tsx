import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ScanHistoryItem } from "./ScanHistoryItem";
import { SelectionActionBar } from "./SelectionActionBar";
import { ClearAllModal } from "./ClearAllModal";
import { useScanHistory } from "@/hooks/useScanHistory";
import type { ScanInterpretationResult } from "@/types/scan";

interface ScanHistoryListProps {
  scans: ScanInterpretationResult[];
}

interface ConfirmState {
  open: boolean;
  count: number;
  onConfirm: () => void;
}

export function ScanHistoryList({ scans }: ScanHistoryListProps) {
  const h = useScanHistory();
  const [showClearAll, setShowClearAll] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState>({
    open: false,
    count: 0,
    onConfirm: () => {},
  });
  const selectedIds = Array.from(h.selected);

  const askRemoveSelected = () => {
    setConfirm({
      open: true,
      count: selectedIds.length,
      onConfirm: () => {
        void h.removeSelected(selectedIds);
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
            Clear scan history
          </button>
        )}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3 pb-24">
        <AnimatePresence>
          {scans.map((s) => (
            <ScanHistoryItem
              key={s.id}
              scan={s}
              selecting={h.selecting}
              selected={h.selected.has(s.id)}
              onToggleSelect={() => h.toggleSelect(s.id)}
              onDelete={() => h.removeOne(s.id)}
              busy={h.busy}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {h.selecting && (
          <SelectionActionBar
            count={selectedIds.length}
            label="scan"
            onCancel={h.exitSelection}
            onRemove={askRemoveSelected}
            busy={h.busy}
          />
        )}
      </AnimatePresence>

      {confirm.open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[65] flex items-center justify-center bg-black/50 px-4"
          onClick={() => setConfirm({ open: false, count: 0, onConfirm: () => {} })}
        >
          <div className="w-full max-w-md rounded-card bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-brand-dark">
              Remove {confirm.count} scan{confirm.count === 1 ? "" : "s"}?
            </h3>
            <p className="mt-2 text-sm text-brand-muted">
              These {confirm.count} scan{confirm.count === 1 ? "" : "s"} will be permanently deleted.
            </p>
            <p className="mt-1 text-xs text-brand-coral">
              Note: Deleting scans also permanently removes their AI analysis reports.
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
                Remove {confirm.count} scan{confirm.count === 1 ? "" : "s"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ClearAllModal
        open={showClearAll}
        onClose={() => setShowClearAll(false)}
        onConfirm={async () => {
          await h.clearAllHistory();
          setShowClearAll(false);
        }}
        title="Clear all scan history?"
        body={`This will permanently delete all ${scans.length} scan${scans.length === 1 ? "" : "s"} and their AI analysis results. This action cannot be undone.`}
        confirmLabel="Clear scan history"
        busy={h.busy}
      />
    </>
  );
}

export default ScanHistoryList;
