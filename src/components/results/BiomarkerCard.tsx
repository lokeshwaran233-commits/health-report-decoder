import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Biomarker } from "@/types/report";

export interface BiomarkerCardProps {
  biomarker: Biomarker;
  isTeaser?: boolean;
  expanded?: boolean;
  onToggleExpand?: (id: string) => void;
}

const STATUS_META: Record<
  Biomarker["status"],
  { label: string; pill: string; border: string; tint: string; text: string }
> = {
  normal: {
    label: "Normal",
    pill: "bg-brand-teal-light text-brand-teal",
    border: "border-l-[3px] border-l-[#1D9E75]",
    tint: "",
    text: "text-brand-teal",
  },
  watch: {
    label: "To watch",
    pill: "bg-brand-amber-light text-brand-amber",
    border: "border-l-[3px] border-l-[#EF9F27]",
    tint: "bg-[rgba(239,159,39,0.03)]",
    text: "text-brand-amber",
  },
  flagged: {
    label: "Flagged",
    pill: "bg-brand-coral-light text-brand-coral",
    border: "border-l-[3px] border-l-[#D85A30]",
    tint: "bg-[rgba(216,90,48,0.03)]",
    text: "text-brand-coral",
  },
};

const MARKER_COLOR: Record<Biomarker["status"], string> = {
  normal: "#1D9E75",
  watch: "#EF9F27",
  flagged: "#D85A30",
};

export function BiomarkerCard({
  biomarker: b,
  isTeaser = false,
  expanded = false,
  onToggleExpand,
}: BiomarkerCardProps) {
  const [localExpanded, setLocalExpanded] = useState(false);
  const reduceMotion = useReducedMotion();
  const meta = STATUS_META[b.status];

  const isExpanded = onToggleExpand ? expanded : localExpanded;

  const trackMin = b.referenceRange.low * 0.5;
  const trackMax = b.referenceRange.high * 1.5;
  const range = trackMax - trackMin || 1;
  const markerPercent = ((b.value - trackMin) / range) * 100;
  const clampedPercent = Math.min(Math.max(markerPercent, 2), 98);
  const normalLeft = ((b.referenceRange.low - trackMin) / range) * 100;
  const normalWidth =
    ((b.referenceRange.high - b.referenceRange.low) / range) * 100;

  const ariaLabel = `${b.name} value ${b.value} ${b.unit}, reference range ${b.referenceRange.low} to ${b.referenceRange.high}, status: ${b.status}`;

  const handleToggle = () => {
    if (isTeaser) return;
    if (onToggleExpand) onToggleExpand(b.id);
    else setLocalExpanded((v) => !v);
  };

  return (
    <article
      className={cn(
        "relative rounded-card bg-white border border-brand-border p-5 transition-all duration-200",
        meta.border,
        meta.tint,
        !isTeaser && "hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(15,110,86,0.1)]",
        isTeaser && "pointer-events-none select-none",
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="inline-flex items-center rounded-pill bg-brand-surface text-brand-muted text-[11px] px-2 py-0.5 uppercase tracking-wide">
          {b.category}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-pill text-[11px] font-medium px-2 py-0.5",
            meta.pill,
          )}
        >
          {b.status === "flagged" && (
            <AlertCircle className="h-3 w-3" aria-hidden="true" />
          )}
          {meta.label}
        </span>
      </div>

      <h3 className="text-base font-semibold text-brand-dark">{b.name}</h3>

      <div className="mt-1 flex items-baseline gap-1.5">
        <span className={cn("text-[32px] font-bold leading-none", meta.text)}>
          {b.value}
        </span>
        <span className="text-sm text-brand-muted">{b.unit}</span>
      </div>

      <div
        role="img"
        aria-label={ariaLabel}
        className="mt-5 relative h-2 w-full rounded-full bg-[#E5E5E3] overflow-visible"
      >
        <div
          className="absolute top-0 h-full rounded-full bg-[#1D9E75]/15"
          style={{ left: `${normalLeft}%`, width: `${normalWidth}%` }}
        />
        <motion.div
          className="absolute top-1/2"
          style={{ backgroundColor: MARKER_COLOR[b.status] }}
          initial={{ left: reduceMotion ? `${clampedPercent}%` : "0%" }}
          animate={{ left: `${clampedPercent}%` }}
          transition={{
            duration: reduceMotion ? 0 : 0.8,
            ease: [0.34, 1.56, 0.64, 1],
          }}
        >
          <div
            className="absolute rounded-full"
            style={{
              width: 12,
              height: 12,
              backgroundColor: MARKER_COLOR[b.status],
              transform: "translate(-50%, -50%)",
            }}
          />
          <div
            className="absolute"
            style={{
              width: 1.5,
              height: 20,
              backgroundColor: MARKER_COLOR[b.status],
              transform: "translate(-50%, -50%)",
              opacity: 0.6,
            }}
          />
        </motion.div>
      </div>

      <div className="mt-2 flex justify-between text-[11px] text-brand-muted">
        <span>{b.referenceRange.low}</span>
        <span className={meta.text} style={{ fontWeight: 600 }}>
          {b.value}
        </span>
        <span>{b.referenceRange.high}</span>
      </div>

      <p className="mt-4 text-sm text-brand-dark/80 leading-relaxed">
        {b.plainEnglish}
      </p>

      {!isTeaser && b.deepExplanation && (
        <>
          <button
            type="button"
            onClick={handleToggle}
            className="mt-3 text-xs font-medium text-brand-teal hover:underline"
            aria-expanded={isExpanded}
          >
            {isExpanded ? "Show less ↑" : "Why does this matter? ↓"}
          </button>
          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                key="deep"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.22 }}
                className="overflow-hidden"
              >
                <p className="mt-3 pl-3 border-l-2 border-brand-teal-light text-[13px] text-brand-muted leading-relaxed">
                  {b.deepExplanation}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </article>
  );
}

export default BiomarkerCard;
