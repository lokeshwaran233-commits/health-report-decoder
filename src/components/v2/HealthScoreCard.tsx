import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { HealthScoreResult } from "@/lib/clinical2026/types";

interface Props {
  healthScore: HealthScoreResult;
  onShare: () => void;
}

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function HealthScoreCard({ healthScore, onShare }: Props) {
  const [animated, setAnimated] = useState(0);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const target = healthScore.score;
    const steps = 80;
    const inc = target / steps;
    let curr = 0;
    const iv = setInterval(() => {
      curr = Math.min(curr + inc, target);
      setAnimated(Math.round(curr));
      if (curr >= target) clearInterval(iv);
    }, 1500 / steps);
    return () => clearInterval(iv);
  }, [healthScore.score]);

  useIsoLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const DPR = window.devicePixelRatio ?? 1;
    const W = 120;
    const H = 80;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    const cx = W / 2;
    const cy = H - 10;
    const r = 50;
    const startAngle = Math.PI;
    const endAngle = 2 * Math.PI;

    ctx.clearRect(0, 0, W, H);

    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.strokeStyle =
      document.documentElement.classList.contains("dark")
        ? "rgba(255,255,255,0.07)"
        : "rgba(0,0,0,0.06)";
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.stroke();

    const pct = animated / 100;
    const scoreEnd = startAngle + (endAngle - startAngle) * pct;
    const gradient = ctx.createLinearGradient(0, 0, W, 0);
    gradient.addColorStop(0, "#0F6E56");
    gradient.addColorStop(1, "#00D9A3");

    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, scoreEnd);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.stroke();
  }, [animated]);

  const change = healthScore.change ?? 0;
  const changeSign = change > 0 ? "+" : "";
  const changeColor =
    change > 0
      ? "text-emerald-600 dark:text-emerald-400"
      : change < 0
        ? "text-orange-600 dark:text-orange-400"
        : "text-brand-muted";

  return (
    <div className="rounded-2xl bg-brand-card dark:bg-[#0F1623] border border-brand-border dark:border-[#1C2A3E] overflow-hidden mb-6">
      <div className="px-5 pt-5 pb-4 flex items-start gap-5">
        <div className="flex-shrink-0 flex flex-col items-center">
          <canvas ref={canvasRef} className="w-[120px] h-[80px]" aria-hidden="true" />
          <div className="-mt-6 text-center">
            <p
              className="text-3xl font-mono font-bold text-brand-dark dark:text-white tabular-nums"
              aria-label={`Health score ${healthScore.score} out of 100`}
            >
              {animated}
            </p>
          </div>
        </div>

        <div className="flex-1 min-w-0 pt-1">
          <div className="flex items-center gap-2 mb-1">
            <h3
              className="text-base font-semibold text-brand-dark dark:text-white"
              style={{ fontFamily: "Fraunces, Georgia, serif" }}
            >
              Health Score
            </h3>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                healthScore.grade === "A"
                  ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30"
                  : healthScore.grade === "B"
                    ? "bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-500/30"
                    : healthScore.grade === "C"
                      ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/30"
                      : "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-300 dark:border-red-500/30"
              }`}
            >
              {healthScore.grade}
            </span>
          </div>
          <p className="text-sm text-brand-muted dark:text-white/55 mb-2">
            {healthScore.gradeLabel}
          </p>

          {healthScore.change !== null && (
            <p className={`text-xs font-medium ${changeColor}`}>
              {changeSign}
              {healthScore.change} points since last report
            </p>
          )}

          {healthScore.percentile && (
            <p className="text-xs text-brand-muted dark:text-white/35 mt-1">
              Top {100 - healthScore.percentile}% of ReportRx users your age
            </p>
          )}
        </div>
      </div>

      <button
        className="w-full flex items-center justify-between px-5 py-2.5 border-t border-brand-border dark:border-[#1C2A3E] hover:bg-brand-surface dark:hover:bg-white/[0.02] transition-colors text-xs text-brand-muted hover:text-brand-dark dark:hover:text-white/70"
        onClick={() => setShowBreakdown((s) => !s)}
        aria-expanded={showBreakdown}
      >
        <span>Score breakdown by category</span>
        <svg
          className={`w-3.5 h-3.5 transition-transform ${showBreakdown ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showBreakdown && (
        <div className="px-5 pb-4 space-y-2">
          {healthScore.breakdown.map((b) => (
            <div key={b.category} className="flex items-center gap-3">
              <span className="text-xs text-brand-muted dark:text-white/50 w-32 flex-shrink-0">
                {b.label}
              </span>
              <div className="flex-1 h-1.5 rounded-full bg-brand-border dark:bg-white/[0.07] overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    b.score >= 80
                      ? "bg-emerald-500"
                      : b.score >= 60
                        ? "bg-amber-500"
                        : "bg-orange-500"
                  }`}
                  style={{ width: `${b.score}%`, transition: "width 0.8s ease" }}
                />
              </div>
              <span className="text-xs font-mono text-brand-muted dark:text-white/50 w-8 text-right">
                {b.score}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="px-5 pb-4">
        <button
          onClick={onShare}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-brand-teal/40 text-brand-teal text-sm font-medium hover:bg-brand-teal-light/40 dark:hover:bg-[#00D9A3]/10 transition-colors"
        >
          Share my Health Score
        </button>
      </div>
    </div>
  );
}
