// Adapts the existing AnalysisResult (src/types/report.ts) into the 2026
// RulesEngineOutput shape consumed by the v2 engine + UI.
import type { AnalysisResult, Biomarker } from "@/types/report";
import type {
  BiomarkerStatus,
  EvaluatedBiomarker,
  RulesEngineOutput,
} from "./types";
import { polarityFor } from "./polarity";

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function mapStatus(b: Biomarker): BiomarkerStatus {
  if (b.criticalFlag) {
    if (typeof b.value === "number" && b.referenceRange) {
      return b.value > b.referenceRange.high ? "critical_high" : "critical_low";
    }
    return "critical_high";
  }
  if (b.status === "normal") return "normal";
  if (b.status === "watch" || b.status === "flagged") {
    if (typeof b.value === "number" && b.referenceRange) {
      return b.value > b.referenceRange.high ? "high" : "low";
    }
  }
  return "normal";
}

function mapCategory(c: string): string {
  switch (c) {
    case "blood":
      return "red_blood_cells";
    case "metabolic":
      return "metabolic";
    case "cardio":
      return "lipid";
    case "liver":
      return "liver";
    case "kidney":
      return "kidney";
    case "thyroid":
      return "thyroid";
    case "vitamin":
      return "vitamins_minerals";
    default:
      return c || "other";
  }
}

export function adaptAnalysisResult(result: AnalysisResult): RulesEngineOutput {
  const evaluatedBiomarkers: EvaluatedBiomarker[] = result.biomarkers.map(
    (b) => {
      const normalizedName = normalize(b.name);
      const status = mapStatus(b);
      const deviationPercent =
        typeof b.value === "number" && b.referenceRange
          ? status === "normal"
            ? null
            : Math.round(
                ((b.value -
                  (b.value > b.referenceRange.high
                    ? b.referenceRange.high
                    : b.referenceRange.low)) /
                  Math.abs(
                    b.value > b.referenceRange.high
                      ? b.referenceRange.high || 1
                      : b.referenceRange.low || 1,
                  )) *
                  100,
              )
          : null;
      return {
        normalizedName,
        name: b.name,
        displayName: b.name,
        value: b.value,
        unit: b.unit,
        status,
        category: mapCategory(b.category),
        deviationPercent,
        confidence: "HIGH",
        hasConflicts: false,
        polarity: polarityFor(normalizedName),
        referenceMin: b.referenceRange?.low,
        referenceMax: b.referenceRange?.high,
      };
    },
  );

  const criticalAlerts = evaluatedBiomarkers.filter(
    (b) => b.status === "critical_low" || b.status === "critical_high",
  );

  return {
    evaluatedBiomarkers,
    criticalAlerts,
    reportDate: result.metadata.reportDate ?? result.metadata.uploadedAt,
    reportId: result.id,
  };
}
