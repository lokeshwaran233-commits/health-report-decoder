import { useEffect, useMemo, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/rx/Button";
import { encodeShare, type SharedSummaryPayload } from "@/lib/shareCodec";
import type { AnalysisResult } from "@/types/report";

export interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  result: AnalysisResult;
  counts: { normal: number; watch: number; flagged: number };
}

export function ShareModal({ open, onClose, result, counts }: ShareModalProps) {
  const reduceMotion = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const payload: SharedSummaryPayload = {
      metadata: {
        patientName: result.metadata.patientName ?? null,
        reportDate: result.metadata.reportDate ?? null,
        labName: result.metadata.labName ?? null,
      },
      statusCounts: counts,
      summary: result.summary,
      doctorQuestions: result.doctorQuestions,
    };
    const encoded = encodeShare(payload);
    return `${window.location.origin}/results?share=${encoded}`;
  }, [result, counts]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Shareable link copied");
    } catch {
      toast.error("Couldn't copy — please try again");
    }
  };

  const openWhatsApp = () => {
    const firstSentence = result.summary.split(".")[0] + ".";
    const text = encodeURIComponent(
      `I decoded my lab report with ReportRx.\n\n${firstSentence}\n\nDecode yours free: ${shareUrl}`,
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-title"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.18 }}
        className="w-full max-w-md rounded-card bg-white p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close share dialog"
          className="absolute top-3 right-3 p-1.5 text-brand-muted hover:text-brand-dark"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
        <h2 id="share-title" className="text-lg font-semibold text-brand-dark">
          Share your report summary
        </h2>
        <p className="mt-1 text-sm text-brand-muted">
          This shares only the summary — no raw report data is included.
        </p>

        <div className="mt-5 space-y-3">
          <Button variant="primary" size="md" fullWidth onClick={copyLink}>
            Copy shareable link
          </Button>
          <div className="flex items-center gap-3 text-xs text-brand-hint">
            <span className="h-px flex-1 bg-brand-border" />
            or
            <span className="h-px flex-1 bg-brand-border" />
          </div>
          <button
            type="button"
            onClick={openWhatsApp}
            className="w-full inline-flex items-center justify-center gap-2 rounded-btn bg-[#25D366] text-white h-11 px-4 text-sm font-medium hover:opacity-90 transition"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Share via WhatsApp
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default ShareModal;
