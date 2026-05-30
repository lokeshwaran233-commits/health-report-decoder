import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

interface ClearAllModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body: string;
  confirmLabel?: string;
  busy?: boolean;
}

export function ClearAllModal({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel = "Clear all history",
  busy,
}: ClearAllModalProps) {
  const [typed, setTyped] = useState("");
  useEffect(() => {
    if (!open) setTyped("");
  }, [open]);

  if (!open) return null;
  const matched = typed.trim().toUpperCase() === "CLEAR";

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-md rounded-card bg-white p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 p-1.5 text-brand-muted hover:text-brand-dark"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
        <h2 className="text-lg font-semibold text-brand-dark">{title}</h2>
        <p className="mt-2 text-sm text-brand-muted">{body}</p>

        <label className="mt-5 block text-xs font-medium text-brand-muted mb-1">
          Type <span className="font-mono text-brand-dark">CLEAR</span> to confirm:
        </label>
        <input
          autoFocus
          type="text"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder="CLEAR"
          className={`w-full h-11 rounded-btn border px-3 text-sm font-mono uppercase text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-teal ${
            matched ? "border-brand-teal" : "border-brand-border"
          }`}
        />

        <div className="mt-5 flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 h-10 rounded-btn text-sm text-brand-muted hover:text-brand-dark"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!matched || busy}
            onClick={onConfirm}
            className="px-4 h-10 rounded-btn bg-[#EF4444] text-white text-sm font-medium hover:bg-[#DC2626] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {busy ? "Clearing…" : confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default ClearAllModal;
