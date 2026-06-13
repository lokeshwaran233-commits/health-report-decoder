import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const STORAGE_KEY = "reportrx-guide-seen";

export function GuideButton() {
  const [hintOpen, setHintOpen] = useState(false);
  const [seen, setSeen] = useState(true);

  useEffect(() => {
    try {
      const wasSeen = window.localStorage.getItem(STORAGE_KEY) === "1";
      setSeen(wasSeen);
      if (!wasSeen) {
        const t = setTimeout(() => setHintOpen(true), 1200);
        return () => clearTimeout(t);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const dismissHint = () => {
    setHintOpen(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setSeen(true);
  };

  const handleClick = () => {
    dismissHint();
    const el = document.getElementById("how-it-works");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="fixed left-4 bottom-6 z-40 flex items-end gap-2">
      <motion.button
        type="button"
        onClick={handleClick}
        aria-label="Open guided tour — How ReportRx works"
        title="Guide — see how it works"
        whileTap={{ scale: 0.92 }}
        className="relative h-12 w-12 rounded-full bg-brand-teal text-white shadow-lg flex items-center justify-center font-bold text-base hover:bg-brand-teal-mid transition-colors"
      >
        G
        {!seen && (
          <span className="absolute inset-0 rounded-full bg-brand-teal animate-ping opacity-40" />
        )}
      </motion.button>

      <AnimatePresence>
        {hintOpen && (
          <motion.div
            role="tooltip"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
            className="mb-1 max-w-[240px] rounded-card bg-white border border-brand-border shadow-lg p-3 text-[13px] text-brand-dark relative"
          >
            <button
              type="button"
              onClick={dismissHint}
              aria-label="Dismiss"
              className="absolute top-1.5 right-1.5 p-1 text-brand-muted hover:text-brand-dark"
            >
              <X className="h-3 w-3" />
            </button>
            <p className="font-semibold text-brand-teal mb-1">New here?</p>
            <p className="text-brand-muted leading-snug pr-3">
              Tap the <span className="font-semibold text-brand-dark">G</span> to see how ReportRx works.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default GuideButton;
