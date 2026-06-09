import { useEffect, useState } from "react";

interface LastReport {
  date: string;
  labName?: string | null;
  topFlag?: string | null;
  topFlagValue?: string | null;
  overallStatus: "great" | "watch" | "act_now";
}

interface Props {
  userName: string;
  lastReport: LastReport;
  daysSince: number;
  onUploadNew: () => void;
  onAskZeno: () => void;
  onViewHistory: () => void;
}

export function ReturningUserWelcome({
  userName,
  lastReport,
  daysSince,
  onUploadNew,
  onAskZeno,
  onViewHistory,
}: Props) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const firstName = userName.split(" ")[0];
  const timeLabel =
    daysSince === 0
      ? "today"
      : daysSince === 1
        ? "yesterday"
        : daysSince < 7
          ? `${daysSince} days ago`
          : daysSince < 30
            ? `${Math.round(daysSince / 7)} weeks ago`
            : `${Math.round(daysSince / 30)} months ago`;

  return (
    <div
      className={`max-w-lg mx-auto px-4 py-8 transition-all duration-500 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="mb-6">
        <p className="text-sm text-brand-teal font-medium mb-1">Welcome back</p>
        <h2
          className="text-2xl sm:text-3xl font-medium text-brand-dark dark:text-white leading-tight"
          style={{ fontFamily: "Fraunces, Georgia, serif" }}
        >
          Good to see you, {firstName}.
        </h2>
      </div>

      <div className="rounded-2xl bg-brand-card dark:bg-[#0F1623] border border-brand-border dark:border-[#1C2A3E] p-5 mb-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs text-brand-muted dark:text-white/35 uppercase tracking-wide font-medium">
              Your last report
            </p>
            <p className="text-sm text-brand-dark dark:text-white/70 mt-0.5">
              {lastReport.labName ?? "Lab report"} · {timeLabel}
            </p>
          </div>
          <div
            className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
              lastReport.overallStatus === "great"
                ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30"
                : lastReport.overallStatus === "watch"
                  ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/30"
                  : "bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-500/30"
            }`}
          >
            {lastReport.overallStatus === "great"
              ? "✓ All clear"
              : lastReport.overallStatus === "watch"
                ? "⚠ Watch"
                : "! Act now"}
          </div>
        </div>

        {lastReport.topFlag && (
          <div className="bg-brand-surface dark:bg-[#080C14] rounded-xl p-3 border border-brand-border dark:border-[#1C2A3E]">
            <p className="text-xs text-brand-muted dark:text-white/40 mb-1">
              Last flagged
            </p>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-brand-dark dark:text-white/85">
                {lastReport.topFlag}
              </p>
              {lastReport.topFlagValue && (
                <span className="text-sm font-mono text-amber-700 dark:text-amber-300">
                  {lastReport.topFlagValue}
                </span>
              )}
            </div>
            <p className="text-xs text-brand-muted dark:text-white/35 mt-1.5">
              You flagged this for monitoring. Let's see if it's changed.
            </p>
          </div>
        )}
      </div>

      <button
        onClick={onUploadNew}
        className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-gradient-to-r from-brand-teal to-brand-teal-mid text-white font-semibold text-base hover:opacity-95 transition-all shadow-lg mb-3"
      >
        Upload my new report
      </button>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onAskZeno}
          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-card dark:bg-white/[0.03] border border-brand-border dark:border-white/[0.07] text-brand-dark dark:text-white/60 text-sm hover:border-brand-teal/40 hover:text-brand-teal transition-all"
        >
          Ask Zeno about last results
        </button>
        <button
          onClick={onViewHistory}
          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-card dark:bg-white/[0.03] border border-brand-border dark:border-white/[0.07] text-brand-dark dark:text-white/60 text-sm hover:border-brand-hint dark:hover:border-white/20 transition-all"
        >
          View my health story
        </button>
      </div>
    </div>
  );
}
