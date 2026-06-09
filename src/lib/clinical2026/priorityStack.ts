import type {
  EvaluatedBiomarker,
  PriorityItem,
  RulesEngineOutput,
} from "./types";
import { buildFallbackOutcome, buildFallbackActions } from "./fallbacks";

const SEVERITY: Record<string, number> = {
  critical_high: 4,
  critical_low: 4,
  high: 3,
  low: 2,
  normal: 0,
};

export type SynthesizeFn = (
  b: EvaluatedBiomarker,
) => Promise<{ outcomeSentence: string; actionItems: PriorityItem["actionItems"] }>;

export async function buildPriorityStack(
  out: RulesEngineOutput,
  synthesize?: SynthesizeFn,
): Promise<PriorityItem[]> {
  const ranked = [...out.evaluatedBiomarkers].sort(
    (a, b) => (SEVERITY[b.status] ?? 0) - (SEVERITY[a.status] ?? 0),
  );

  return Promise.all(
    ranked.map(async (b) => {
      const urgencyLevel: PriorityItem["urgencyLevel"] =
        b.status === "critical_low" || b.status === "critical_high"
          ? "act_now"
          : b.status === "low" || b.status === "high"
            ? "watch"
            : b.deviationPercent === null
              ? "great"
              : "stable";

      const urgencyLabel =
        urgencyLevel === "act_now"
          ? "ACT THIS WEEK"
          : urgencyLevel === "watch"
            ? "WATCH THIS MONTH"
            : urgencyLevel === "great"
              ? "GREAT — KEEP IT UP"
              : "STABLE — NO ACTION";

      const { outcomeSentence, actionItems } = synthesize
        ? await synthesize(b)
        : {
            outcomeSentence:
              b.status === "normal" ? "" : buildFallbackOutcome(b),
            actionItems: b.status === "normal" ? [] : buildFallbackActions(b),
          };

      return {
        id: b.normalizedName,
        biomarkerName: b.normalizedName,
        displayName: b.displayName,
        value: b.value,
        unit: b.unit,
        urgencyLevel,
        urgencyLabel,
        timeframe:
          urgencyLevel === "act_now"
            ? "This week"
            : urgencyLevel === "watch"
              ? "This month"
              : "Routine",
        outcomeSentence,
        actionItems,
      };
    }),
  );
}
