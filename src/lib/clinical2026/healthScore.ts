import type {
  EvaluatedBiomarker,
  HealthScoreResult,
  RulesEngineOutput,
  ScoreBreakdown,
} from "./types";

const CATEGORY_WEIGHTS: Record<string, number> = {
  red_blood_cells: 20,
  white_blood_cells: 15,
  metabolic: 20,
  lipid: 15,
  kidney: 10,
  liver: 10,
  thyroid: 5,
  vitamins_minerals: 5,
};

function biomarkerScore(b: EvaluatedBiomarker): number {
  const deviation = Math.abs(b.deviationPercent ?? 0);
  switch (b.status) {
    case "normal":
      return 100;
    case "low":
    case "high":
      return Math.max(0, 100 - deviation * 2);
    case "critical_low":
    case "critical_high":
      return 0;
    default:
      return 50;
  }
}

export function calculateHealthScore(
  out: RulesEngineOutput,
  previousScore?: number | null,
): HealthScoreResult {
  const biomarkers = out.evaluatedBiomarkers;
  if (biomarkers.length === 0) {
    return {
      score: 0,
      previousScore: previousScore ?? null,
      change: null,
      grade: "F",
      gradeLabel: "Insufficient data",
      breakdown: [],
      percentile: null,
    };
  }

  const categoryGroups: Record<string, EvaluatedBiomarker[]> = {};
  for (const b of biomarkers) {
    const cat = b.category ?? "other";
    (categoryGroups[cat] ||= []).push(b);
  }

  const breakdown: ScoreBreakdown[] = [];
  let totalWeightedScore = 0;
  let totalWeight = 0;

  for (const [cat, items] of Object.entries(categoryGroups)) {
    const weight = CATEGORY_WEIGHTS[cat] ?? 5;
    const avg =
      items.reduce((sum, b) => sum + biomarkerScore(b), 0) / items.length;
    totalWeightedScore += (avg / 100) * weight;
    totalWeight += weight;
    breakdown.push({
      category: cat,
      score: Math.round(avg),
      maxScore: 100,
      label: cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    });
  }

  const raw = totalWeight > 0 ? (totalWeightedScore / totalWeight) * 100 : 0;
  const score = Math.round(Math.max(0, Math.min(100, raw)));
  const grade: HealthScoreResult["grade"] =
    score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 60 ? "D" : "F";
  const gradeLabel =
    score >= 90
      ? "Excellent"
      : score >= 80
        ? "Good"
        : score >= 70
          ? "Fair"
          : score >= 60
            ? "Needs attention"
            : "Requires action";
  const change = previousScore != null ? score - previousScore : null;
  const percentile = Math.min(99, Math.max(1, Math.round(score * 0.95)));

  return {
    score,
    previousScore: previousScore ?? null,
    change,
    grade,
    gradeLabel,
    breakdown,
    percentile,
  };
}
