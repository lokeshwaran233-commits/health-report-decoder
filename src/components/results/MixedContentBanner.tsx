import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

export interface MixedContentBannerProps {
  message: string;
}

export function MixedContentBanner({ message }: MixedContentBannerProps) {
  const [visible, setVisible] = useState(true);

  return (
    <AnimatePresence initial={true}>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -12, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -12, height: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          role="status"
          className="overflow-hidden"
        >
          <div className="rounded-card border border-brand-amber bg-brand-amber-light px-4 py-3 flex items-start gap-3">
            <AlertTriangle
              className="text-brand-amber shrink-0 mt-0.5"
              size={18}
              aria-hidden="true"
            />
            <div className="flex-1 min-w-0">
              <p className="text-brand-amber" style={{ fontWeight: 600, fontSize: 14 }}>
                Mixed content detected
              </p>
              <p
                className="text-brand-muted mt-0.5"
                style={{ fontWeight: 400, fontSize: 13 }}
              >
                {message} We've analysed only the lab report data.
              </p>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-pill bg-brand-teal-light text-brand-teal px-2.5 py-1 text-xs font-medium shrink-0">
              ✓ Lab report extracted successfully
            </span>
            <button
              type="button"
              onClick={() => setVisible(false)}
              aria-label="Dismiss"
              className="text-brand-amber hover:opacity-70 transition-opacity shrink-0"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default MixedContentBanner;
