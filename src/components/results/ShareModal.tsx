import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion, useReducedMotion } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/rx/Button";
import { createShareToken } from "@/lib/cloudSync.functions";
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
  const mintToken = useServerFn(createShareToken);

  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const snapshot = useMemo(
    () => ({
      metadata: {
        patientName: result.metadata.patientName ?? null,
        reportDate: result.metadata.reportDate ?? null,
        labName: result.metadata.labName ?? null,
      },
      statusCounts: counts,
      summary: result.summary,
      doctorQuestions: result.doctorQuestions,
      contentWarning: result.contentWarning,
    }),
    [result, counts],
  );

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Reset url whenever modal reopens for a fresh token
  useEffect(() => {
    if (!open) setShareUrl(null);
  }, [open]);

  if (!open) return null;

  const ensureToken = async (): Promise<string | null> => {
    if (shareUrl) return shareUrl;
    if (typeof window === "undefined") return null;
    setBusy(true);
    try {
      const { token } = await mintToken({
        data: { snapshot, type: "summary" },
      });
      const url = `${window.location.origin}/s/${token}`;
      setShareUrl(url);
      return url;
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Couldn't create share link",
      );
      return null;
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    const url = await ensureToken();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Shareable link copied — expires in 1 hour");
    } catch {
      toast.error("Couldn't copy — please try again");
    }
  };

  const openWhatsApp = async () => {
    const url = await ensureToken();
    if (!url) return;
    const text = encodeURIComponent(
      `Check out my ReportRx health summary → ${url}\n(This link expires in 1 hour)`,
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
          A short link is created on demand and expires automatically in 1 hour.
          Only the summary is shared — no raw biomarker values.
        </p>

        <div className="mt-5 space-y-3">
          <Button
            variant="primary"
            size="md"
            fullWidth
            onClick={copyLink}
            disabled={busy}
          >
            {busy ? "Creating link…" : "Copy shareable link"}
          </Button>
          {shareUrl && (
            <p className="text-xs text-brand-hint break-all bg-brand-surface rounded-btn px-3 py-2">
              {shareUrl}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-brand-hint">
            <span className="h-px flex-1 bg-brand-border" />
            or
            <span className="h-px flex-1 bg-brand-border" />
          </div>
          <button
            type="button"
            onClick={openWhatsApp}
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 rounded-btn bg-[#25D366] text-white h-11 px-4 text-sm font-medium hover:opacity-90 transition disabled:opacity-60"
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
