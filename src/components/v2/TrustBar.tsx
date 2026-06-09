import { useEffect, useRef, useState } from "react";

interface Props {
  confidenceScore: number;
  modelVersion: string;
  reportDate?: string | null;
  onHowItWorks: () => void;
  onDataRights: () => void;
  onDeleteData: () => void;
}

export function TrustBar({
  confidenceScore,
  modelVersion,
  onHowItWorks,
  onDataRights,
  onDeleteData,
}: Props) {
  const [displayed, setDisplayed] = useState(0);
  const animated = useRef(false);

  useEffect(() => {
    if (animated.current) return;
    animated.current = true;
    const duration = 1200;
    const steps = 60;
    const inc = confidenceScore / steps;
    let curr = 0;
    const iv = setInterval(() => {
      curr = Math.min(curr + inc, confidenceScore);
      setDisplayed(Math.round(curr));
      if (curr >= confidenceScore) clearInterval(iv);
    }, duration / steps);
    return () => clearInterval(iv);
  }, [confidenceScore]);

  const scoreColor =
    confidenceScore >= 80
      ? "text-emerald-600 dark:text-emerald-400"
      : confidenceScore >= 60
        ? "text-amber-600 dark:text-amber-400"
        : "text-orange-600 dark:text-orange-400";

  return (
    <div
      className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-4 py-2.5 bg-brand-surface dark:bg-[#080C14] border-b border-brand-border dark:border-[#1C2A3E] text-xs"
      role="banner"
      aria-label="Security and trust information"
    >
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-brand-teal dark:text-[#00D9A3]">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path
              d="M6 1L2 2.5v3c0 2.5 1.8 4.3 4 5 2.2-.7 4-2.5 4-5v-3L6 1z"
              stroke="currentColor"
              strokeWidth="1.2"
              fill="none"
            />
            <path
              d="M4 6l1.5 1.5 3-3"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
          <span className="font-medium">End-to-end encrypted</span>
        </div>

        <span className="text-brand-hint hidden sm:block">·</span>

        <div className="flex items-center gap-1.5">
          <span className="text-brand-muted dark:text-white/40">AI confidence:</span>
          <span className={`font-mono font-semibold tabular-nums ${scoreColor}`}>
            {displayed}%
          </span>
          <div
            className="relative w-16 h-1.5 rounded-full bg-brand-border dark:bg-white/10 overflow-hidden"
            role="progressbar"
            aria-valuenow={confidenceScore}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`AI confidence ${confidenceScore}%`}
          >
            <div
              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out ${
                confidenceScore >= 80
                  ? "bg-emerald-500"
                  : confidenceScore >= 60
                    ? "bg-amber-500"
                    : "bg-orange-500"
              }`}
              style={{ width: `${displayed}%` }}
            />
          </div>
        </div>

        <span className="text-brand-hint hidden sm:block">·</span>

        <span className="text-brand-muted dark:text-white/30">
          Model: <span className="text-brand-dark dark:text-white/50">{modelVersion}</span>
        </span>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <button
          onClick={onHowItWorks}
          className="text-brand-muted hover:text-brand-teal dark:hover:text-[#00D9A3] transition-colors underline underline-offset-2"
        >
          How this works
        </button>
        <span className="text-brand-hint">·</span>
        <button
          onClick={onDataRights}
          className="text-brand-muted hover:text-brand-teal dark:hover:text-[#00D9A3] transition-colors underline underline-offset-2"
        >
          Your data rights
        </button>
        <span className="text-brand-hint">·</span>
        <button
          onClick={onDeleteData}
          className="text-brand-muted hover:text-red-500 transition-colors underline underline-offset-2"
        >
          Delete my data
        </button>
      </div>
    </div>
  );
}
