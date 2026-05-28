import { motion, useReducedMotion } from "framer-motion";
import { Check, FileUp, FlaskConical, Sparkles, ClipboardCheck, MessageCircle, Share2 } from "lucide-react";
import type { AnalysisResult } from "@/types/report";
import { uploadStore } from "@/lib/uploadStore";

interface Props {
  result: AnalysisResult;
  counts: { normal: number; watch: number; flagged: number };
}

const CATEGORY_LABELS: Record<string, string> = {
  blood: "Blood",
  liver: "Liver",
  kidney: "Kidney",
  thyroid: "Thyroid",
  metabolic: "Metabolic",
  vitamin: "Vitamin",
  other: "Other",
};

export function ResultsFlowGraphic({ result, counts }: Props) {
  const reduce = useReducedMotion();
  const meta = uploadStore.getFileMeta();
  const total = counts.normal + counts.watch + counts.flagged || 1;

  const steps = [
    {
      Icon: FileUp,
      label: "Uploaded",
      sub: meta?.name ? meta.name.slice(0, 28) : "Report received",
    },
    {
      Icon: FlaskConical,
      label: "Extracted",
      sub: `${result.biomarkers.length} biomarkers`,
    },
    {
      Icon: Sparkles,
      label: "Analysed",
      sub: "AI insights generated",
    },
    {
      Icon: ClipboardCheck,
      label: "Insights ready",
      sub: new Date(result.metadata.uploadedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ];

  // Category counts
  const categoryCounts = result.biomarkers.reduce<Record<string, number>>(
    (acc, b) => {
      acc[b.category] = (acc[b.category] ?? 0) + 1;
      return acc;
    },
    {},
  );
  const categoryEntries = Object.entries(categoryCounts).sort(
    (a, b) => b[1] - a[1],
  );

  const pct = (n: number) => `${Math.max((n / total) * 100, n > 0 ? 6 : 0)}%`;

  return (
    <section
      aria-label="Report processing flow and status overview"
      className="rounded-card bg-white border border-brand-border p-5 md:p-6 space-y-7"
    >
      <div>
        <h2 className="text-base font-semibold text-brand-dark">
          Your report journey
        </h2>
        <p className="mt-1 text-[13px] text-brand-muted">
          From upload to insights — every step we ran.
        </p>

        <ol className="mt-5 flex items-start justify-between gap-2 overflow-x-auto pb-2">
          {steps.map((s, i) => (
            <li
              key={s.label}
              className="flex items-start gap-2 min-w-[140px] flex-1"
            >
              <div className="flex flex-col items-center text-center w-full">
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    duration: reduce ? 0 : 0.35,
                    delay: reduce ? 0 : i * 0.12,
                  }}
                  className="relative h-10 w-10 rounded-full bg-brand-teal text-white flex items-center justify-center shadow-sm"
                >
                  <s.Icon className="h-4 w-4" aria-hidden="true" />
                  <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-white border border-brand-teal flex items-center justify-center">
                    <Check
                      className="h-2.5 w-2.5 text-brand-teal"
                      aria-hidden="true"
                    />
                  </span>
                </motion.div>
                <p className="mt-2 text-[13px] font-medium text-brand-dark">
                  {s.label}
                </p>
                <p className="text-[11px] text-brand-muted truncate max-w-[120px]">
                  {s.sub}
                </p>
              </div>
              {i < steps.length - 1 && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{
                    duration: reduce ? 0 : 0.4,
                    delay: reduce ? 0 : 0.12 * i + 0.18,
                  }}
                  style={{ transformOrigin: "left" }}
                  className="hidden sm:block flex-1 h-px mt-5 border-t border-dashed border-brand-teal"
                />
              )}
            </li>
          ))}
        </ol>
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm font-semibold text-brand-dark">
            Status distribution
          </h3>
          <span className="text-[12px] text-brand-muted">
            {total} biomarkers
          </span>
        </div>
        <div
          role="img"
          aria-label={`${counts.normal} normal, ${counts.watch} to watch, ${counts.flagged} flagged`}
          className="mt-3 flex h-3 w-full overflow-hidden rounded-pill bg-brand-border"
        >
          {counts.normal > 0 && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: pct(counts.normal) }}
              transition={{ duration: reduce ? 0 : 0.6 }}
              className="bg-brand-teal"
            />
          )}
          {counts.watch > 0 && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: pct(counts.watch) }}
              transition={{ duration: reduce ? 0 : 0.6, delay: reduce ? 0 : 0.1 }}
              className="bg-brand-amber"
            />
          )}
          {counts.flagged > 0 && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: pct(counts.flagged) }}
              transition={{ duration: reduce ? 0 : 0.6, delay: reduce ? 0 : 0.2 }}
              className="bg-brand-coral"
            />
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-4 text-[12px] text-brand-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-brand-teal" /> Normal{" "}
            <strong className="text-brand-dark">{counts.normal}</strong>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-brand-amber" /> Watch{" "}
            <strong className="text-brand-dark">{counts.watch}</strong>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-brand-coral" /> Flagged{" "}
            <strong className="text-brand-dark">{counts.flagged}</strong>
          </span>
        </div>
      </div>

      {categoryEntries.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-brand-dark">
            Where the markers sit
          </h3>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {categoryEntries.map(([cat, n]) => {
              const w = Math.round((n / total) * 100);
              return (
                <div
                  key={cat}
                  className="rounded-btn border border-brand-border bg-brand-surface px-3 py-2"
                >
                  <div className="flex items-baseline justify-between">
                    <span className="text-[12px] font-medium text-brand-dark">
                      {CATEGORY_LABELS[cat] ?? cat}
                    </span>
                    <span className="text-[12px] text-brand-muted">{n}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-white overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${w}%` }}
                      transition={{ duration: reduce ? 0 : 0.5 }}
                      className="h-full bg-brand-teal"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

export default ResultsFlowGraphic;
