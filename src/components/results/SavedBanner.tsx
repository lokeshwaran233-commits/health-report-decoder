import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, X } from "lucide-react";

const SESSION_KEY = "reportrx_saved_banner_dismissed";

export function SavedBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
    } catch {
      // ignore
    }
    setVisible(true);
    const t = setTimeout(() => dismiss(), 5000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = () => {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // ignore
    }
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="rounded-btn bg-brand-teal-light text-brand-teal px-4 py-2.5 flex items-center gap-2 text-sm"
          role="status"
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          <span className="flex-1">
            Your report analysis has been saved to your history on this device.
          </span>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={dismiss}
            className="p-1 hover:opacity-70"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SavedBanner;
