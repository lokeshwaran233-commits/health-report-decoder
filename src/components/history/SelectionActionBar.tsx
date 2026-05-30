import { motion } from "framer-motion";

interface SelectionActionBarProps {
  count: number;
  label?: string;
  onCancel: () => void;
  onRemove: () => void;
  busy?: boolean;
  removeLabel?: string;
}

export function SelectionActionBar({
  count,
  label = "report",
  onCancel,
  onRemove,
  busy,
  removeLabel = "Remove selected",
}: SelectionActionBarProps) {
  if (count === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.2 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 rounded-full bg-[#1A2235] border border-[#1E2D42] px-5 py-3 shadow-[0_8px_40px_rgba(0,0,0,0.6)]"
    >
      <span className="text-sm font-medium text-white">
        {count} {label}
        {count === 1 ? "" : "s"} selected
      </span>
      <button
        type="button"
        onClick={onCancel}
        disabled={busy}
        className="text-sm text-[#8B9BAE] hover:text-white px-2"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onRemove}
        disabled={busy}
        className="rounded-full bg-[#EF4444] text-white px-5 py-2 text-sm font-medium hover:bg-[#DC2626] transition disabled:opacity-60"
      >
        {busy ? "…" : removeLabel}
      </button>
    </motion.div>
  );
}

export default SelectionActionBar;
