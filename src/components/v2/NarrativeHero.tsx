import type { NarrativeSummary } from "@/lib/clinical2026/types";

export function NarrativeHero({ summary }: { summary: NarrativeSummary }) {
  return (
    <div className="rounded-2xl bg-brand-card dark:bg-gradient-to-br dark:from-[#0F1623] dark:to-[#080C14] border border-brand-border dark:border-[#1C2A3E] overflow-hidden">
      <div className="px-6 py-5">
        <p
          className="text-lg sm:text-xl text-brand-dark dark:text-white font-medium leading-snug mb-3"
          style={{ fontFamily: "Fraunces, Georgia, serif" }}
        >
          {summary.headline}
        </p>
        <p className="text-sm text-brand-muted dark:text-white/55 leading-relaxed mb-5">
          {summary.bigPicture}
        </p>
        <div className="flex gap-4 flex-wrap">
          {summary.improved.length > 0 && (
            <span className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">
              ✓ {summary.improved.length} improved
            </span>
          )}
          {summary.worsened.length > 0 && (
            <span className="text-orange-600 dark:text-orange-400 text-sm font-medium">
              ⚠ {summary.worsened.length} needs attention
            </span>
          )}
          {summary.stable.length > 0 && (
            <span className="text-brand-muted dark:text-white/35 text-sm">
              → {summary.stable.length} stable
            </span>
          )}
        </div>
      </div>
      {summary.oneThatMattersMost && (
        <div className="px-6 py-3 bg-orange-50 dark:bg-orange-950/40 border-t border-orange-300 dark:border-orange-500/20">
          <p className="text-xs text-brand-dark dark:text-white/60 leading-relaxed">
            <span className="text-orange-700 dark:text-orange-400 font-bold tracking-widest uppercase mr-2">
              Most important now
            </span>
            <span className="text-orange-700 dark:text-orange-300 font-medium">
              {summary.oneThatMattersMost.displayName}
            </span>
            {" — "}
            {summary.oneThatMattersMost.trendSentence}
          </p>
        </div>
      )}
    </div>
  );
}
