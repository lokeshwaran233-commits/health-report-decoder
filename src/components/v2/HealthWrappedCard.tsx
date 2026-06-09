import { useRef } from "react";
import type { NarrativeSummary } from "@/lib/clinical2026/types";

interface Props {
  summary: NarrativeSummary;
  onClose: () => void;
}

export function HealthWrappedCard({ summary, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleShare = async () => {
    const APP_URL = "https://reportrx.app";
    const shareText = `My ${summary.wrappedYear} Health Story via ReportRx\n${summary.headline}\n${APP_URL}`;
    try {
      const { default: html2canvas } = await import("html2canvas");
      if (!cardRef.current) throw new Error("no card");
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#080C14",
        scale: 2,
        useCORS: true,
      });
      const blob: Blob | null = await new Promise((res) =>
        canvas.toBlob((b) => res(b)),
      );
      if (!blob) throw new Error("toBlob failed");

      const file = new File(
        [blob],
        `health-story-${summary.wrappedYear}.png`,
        { type: "image/png" },
      );
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            title: "My Health Story",
            text: shareText,
            files: [file],
          });
          return;
        } catch (e) {
          if ((e as Error).name === "AbortError") return;
        }
      }
      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement("a"), {
        href: url,
        download: `health-story-${summary.wrappedYear}.png`,
      });
      a.click();
      URL.revokeObjectURL(url);
      window.open(
        `https://wa.me/?text=${encodeURIComponent(shareText)}`,
        "_blank",
        "noopener",
      );
    } catch {
      try {
        await navigator.clipboard.writeText(shareText);
      } catch {
        /* ignore */
      }
      window.open(
        `https://wa.me/?text=${encodeURIComponent(shareText)}`,
        "_blank",
        "noopener",
      );
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <div
          ref={cardRef}
          className="rounded-3xl overflow-hidden border border-[#1C2A3E] p-6"
          style={{
            background:
              "linear-gradient(135deg, #080C14 0%, #0D1828 50%, #080E1A 100%)",
          }}
        >
          <div className="flex items-center gap-2 mb-5">
            <div className="w-6 h-6 rounded-md bg-[#00D9A3] flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2 6l3 3 5-5"
                  stroke="#080C14"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-[10px] font-bold tracking-[0.12em] uppercase text-[#00D9A3]">
              ReportRx · {summary.wrappedYear} Health Story
            </span>
          </div>

          <h2
            className="text-2xl font-medium text-white leading-tight mb-5"
            style={{ fontFamily: "Fraunces, Georgia, serif" }}
          >
            {summary.headline}
          </h2>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] px-3 py-3">
              <p className="text-2xl font-mono font-semibold text-white">
                {summary.totalReports}
              </p>
              <p className="text-[11px] text-white/40 mt-0.5">Reports analyzed</p>
            </div>
            <div className="rounded-xl bg-emerald-950/40 border border-emerald-500/20 px-3 py-3">
              <p className="text-2xl font-mono font-semibold text-emerald-300">
                {summary.improved.length}
              </p>
              <p className="text-[11px] text-emerald-400/60 mt-0.5">
                Values improved
              </p>
            </div>
            {summary.healthScoreChange !== null && (
              <div className="col-span-2 rounded-xl bg-[#0D4A3A]/30 border border-[#0F6E56]/30 px-3 py-3">
                <p className="text-[10px] font-bold tracking-widest uppercase text-[#00D9A3] mb-1">
                  Health score change
                </p>
                <p className="text-sm font-medium text-white">
                  {summary.healthScoreChange > 0 ? "+" : ""}
                  {summary.healthScoreChange} points since last report
                </p>
              </div>
            )}
            {summary.improved[0] && (
              <div className="col-span-2 rounded-xl bg-[#0D4A3A]/30 border border-[#0F6E56]/30 px-3 py-3">
                <p className="text-[10px] font-bold tracking-widest uppercase text-[#00D9A3] mb-1">
                  Biggest win
                </p>
                <p className="text-sm font-medium text-white">
                  {summary.improved[0].displayName}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
            <p className="text-[10px] text-white/25">{summary.dateRange}</p>
            <p className="text-[10px] text-white/30 font-medium">reportrx.app</p>
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          <button
            onClick={handleShare}
            className="flex-1 py-3 rounded-xl bg-[#00D9A3] text-[#080C14] font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Save & Share
          </button>
          <button
            onClick={onClose}
            className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/50 text-sm hover:bg-white/10 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
