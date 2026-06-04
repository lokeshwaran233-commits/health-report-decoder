import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion, useReducedMotion } from "framer-motion";
import { MessageCircle, Mic, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/rx/Button";
import { createShareToken } from "@/lib/cloudSync.functions";
import { AudioService } from "@/lib/audioService";
import type { AnalysisResult } from "@/types/report";

export interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  result: AnalysisResult;
  counts: { normal: number; watch: number; flagged: number };
}

const LANG_STORAGE_KEY = "rx_audio_lang";

export function ShareModal({ open, onClose, result, counts }: ShareModalProps) {
  const reduceMotion = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  const mintToken = useServerFn(createShareToken);

  const [summaryUrl, setSummaryUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState<"summary" | "audio" | null>(null);

  const summarySnapshot = useMemo(
    () => ({
      kind: "summary" as const,
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

  const buildAudioSnapshot = () => {
    const language =
      typeof window !== "undefined"
        ? (localStorage.getItem(LANG_STORAGE_KEY) ?? "en")
        : "en";
    return {
      kind: "audio" as const,
      metadata: {
        patientName: result.metadata.patientName ?? null,
        reportDate: result.metadata.reportDate ?? null,
        labName: result.metadata.labName ?? null,
      },
      language,
      summaryText: AudioService.buildScript(result, language),
    };
  };

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setSummaryUrl(null);
      setAudioUrl(null);
    }
  }, [open]);

  if (!open) return null;

  const ensureSummary = async (): Promise<string | null> => {
    if (summaryUrl) return summaryUrl;
    if (typeof window === "undefined") return null;
    setBusy("summary");
    try {
      const { token } = await mintToken({
        data: { snapshot: summarySnapshot, type: "summary" },
      });
      const url = `${window.location.origin}/s/${token}`;
      setSummaryUrl(url);
      return url;
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Couldn't create share link",
      );
      return null;
    } finally {
      setBusy(null);
    }
  };

  const ensureAudio = async (): Promise<string | null> => {
    if (audioUrl) return audioUrl;
    if (typeof window === "undefined") return null;
    setBusy("audio");
    try {
      const { token } = await mintToken({
        data: { snapshot: buildAudioSnapshot(), type: "audio" },
      });
      const url = `${window.location.origin}/s/${token}`;
      setAudioUrl(url);
      return url;
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Couldn't create audio link",
      );
      return null;
    } finally {
      setBusy(null);
    }
  };

  const copySummary = async () => {
    const url = await ensureSummary();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Shareable link copied — expires in 1 hour");
    } catch {
      toast.error("Couldn't copy — please try again");
    }
  };

  const summaryWhatsApp = async () => {
    const url = await ensureSummary();
    if (!url) return;
    const text = encodeURIComponent(
      `Check out my ReportRx health summary → ${url}\n(This link expires in 1 hour)`,
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const copyAudio = async () => {
    const url = await ensureAudio();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Audio link copied! Valid for 1 hour.");
    } catch {
      toast.error("Couldn't copy — please try again");
    }
  };

  const audioWhatsApp = async () => {
    const url = await ensureAudio();
    if (!url) return;
    const text = encodeURIComponent(
      `Listen to my ReportRx health summary → ${url}\n(Audio link expires in 1 hour)`,
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
        className="w-full max-w-md rounded-card bg-white p-6 shadow-2xl relative max-h-[90dvh] overflow-y-auto"
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
            onClick={copySummary}
            disabled={busy !== null}
          >
            {busy === "summary" ? "Creating link…" : "Copy shareable link"}
          </Button>
          {summaryUrl && (
            <p className="text-xs text-brand-hint break-all bg-brand-surface rounded-btn px-3 py-2">
              {summaryUrl}
            </p>
          )}
          <button
            type="button"
            onClick={summaryWhatsApp}
            disabled={busy !== null}
            className="w-full inline-flex items-center justify-center gap-2 rounded-btn bg-[#25D366] text-white h-11 px-4 text-sm font-medium hover:opacity-90 transition disabled:opacity-60"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Share via WhatsApp
          </button>
        </div>

        {/* Audio share section */}
        <div className="my-6 flex items-center gap-3 text-xs text-brand-hint">
          <span className="h-px flex-1 bg-brand-border" />
          or
          <span className="h-px flex-1 bg-brand-border" />
        </div>

        <h3 className="flex items-center gap-2 text-base font-semibold text-brand-dark">
          <Mic className="h-4 w-4 text-brand-teal" aria-hidden="true" />
          Share as audio
        </h3>
        <p className="mt-1 text-sm text-brand-muted">
          Send a link that reads out this summary — great for family members.
        </p>

        <div className="mt-4 space-y-3">
          <button
            type="button"
            onClick={copyAudio}
            disabled={busy !== null}
            className="w-full inline-flex items-center justify-center gap-2 rounded-btn border-2 border-brand-teal text-brand-teal bg-white h-11 px-4 text-sm font-semibold hover:bg-brand-teal hover:text-white transition-colors disabled:opacity-60"
          >
            <Mic className="h-4 w-4" aria-hidden="true" />
            {busy === "audio" ? "Creating audio link…" : "Copy audio link"}
          </button>
          {audioUrl && (
            <p className="text-xs text-brand-hint break-all bg-brand-surface rounded-btn px-3 py-2">
              {audioUrl}
            </p>
          )}
          <button
            type="button"
            onClick={audioWhatsApp}
            disabled={busy !== null}
            className="w-full inline-flex items-center justify-center gap-2 rounded-btn bg-[#25D366] text-white h-11 px-4 text-sm font-medium hover:opacity-90 transition disabled:opacity-60"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Send audio via WhatsApp
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default ShareModal;
