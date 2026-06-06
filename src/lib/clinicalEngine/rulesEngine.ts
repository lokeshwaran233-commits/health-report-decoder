import { normalizeBiomarkerName } from "./biomarkerNormalizer";
import { CLINICAL_PATTERNS } from "./clinicalPatterns";
import type {
  BiomarkerCategory,
  BiomarkerStatus,
  ClinicalUrgency,
  ConfidenceLevel,
  CriterionDefinition,
  CriticalAlert,
  Evidence,
  EvaluatedBiomarker,
  ExtractedBiomarker,
  PatternEvaluation,
  PriorityFinding,
  RulesEngineOutput,
} from "./types";

const CRITICAL_OVERRIDES: Record<
  string,
  { criticalLow?: number; criticalHigh?: number }
> = {
  hemoglobin: { criticalLow: 7.0, criticalHigh: 20.0 },
  wbc: { criticalLow: 2.0, criticalHigh: 30.0 },
  platelets: { criticalLow: 50, criticalHigh: 1000 },
  glucose: { criticalLow: 50, criticalHigh: 500 },
  potassium: { criticalLow: 2.5, criticalHigh: 6.5 },
  sodium: { criticalLow: 120, criticalHigh: 160 },
  creatinine: { criticalHigh: 10 },
};

const URGENCY_MAP: Record<string, ClinicalUrgency> = {
  hemoglobin: 4,
  wbc: 4,
  platelets: 4,
  glucose: 4,
  potassium: 5,
  sodium: 5,
  creatinine: 4,
  mcv: 2,
  mch: 2,
  mchc: 2,
  rdw: 2,
  neutrophils: 3,
  lymphocytes: 3,
  eosinophils: 2,
  alt: 3,
  ast: 3,
  tsh: 3,
  cholesterol_total: 2,
  ldl: 2,
  hdl: 2,
};

const CATEGORY_MAP: Record<string, BiomarkerCategory> = {
  hemoglobin: "red_blood_cells",
  rbc: "red_blood_cells",
  hematocrit: "red_blood_cells",
  mcv: "red_blood_cells",
  mch: "red_blood_cells",
  mchc: "red_blood_cells",
  rdw: "red_blood_cells",
  wbc: "white_blood_cells",
  neutrophils: "white_blood_cells",
  lymphocytes: "white_blood_cells",
  monocytes: "white_blood_cells",
  eosinophils: "white_blood_cells",
  basophils: "white_blood_cells",
  platelets: "platelets",
  mpv: "platelets",
  glucose: "metabolic",
  hba1c: "metabolic",
  creatinine: "kidney",
  urea: "kidney",
  uric_acid: "kidney",
  alt: "liver",
  ast: "liver",
  alp: "liver",
  bilirubin_total: "liver",
  tsh: "thyroid",
  t3: "thyroid",
  t4: "thyroid",
  ft4: "thyroid",
  cholesterol_total: "lipid",
  ldl: "lipid",
  hdl: "lipid",
  triglycerides: "lipid",
  ferritin: "vitamins_minerals",
  serum_iron: "vitamins_minerals",
  vitamin_d: "vitamins_minerals",
  vitamin_b12: "vitamins_minerals",
  potassium: "electrolytes",
  sodium: "electrolytes",
};

const CONFIDENCE_ORDER: Record<ConfidenceLevel, number> = {
  INSUFFICIENT: 0,
  LOW: 1,
  MODERATE: 2,
  HIGH: 3,
};

export function evaluateBiomarker(b: ExtractedBiomarker): EvaluatedBiomarker {
  const normalizedName = normalizeBiomarkerName(b.name);
  const numericValue =
    typeof b.value === "number"
      ? b.value
      : typeof b.value === "string"
        ? parseFloat(b.value)
        : null;

  let status: BiomarkerStatus = "unknown";
  let deviationPercent: number | null = null;

  if (numericValue !== null && !isNaN(numericValue)) {
    const crit = CRITICAL_OVERRIDES[normalizedName];
    if (crit?.criticalLow !== undefined && numericValue < crit.criticalLow) {
      status = "critical_low";
    } else if (
      crit?.criticalHigh !== undefined &&
      numericValue > crit.criticalHigh
    ) {
      status = "critical_high";
    } else if (b.labRefMin !== null && b.labRefMax !== null) {
      if (numericValue < b.labRefMin) {
        status = "low";
        deviationPercent = ((b.labRefMin - numericValue) / b.labRefMin) * 100;
      } else if (numericValue > b.labRefMax) {
        status = "high";
        deviationPercent = ((numericValue - b.labRefMax) / b.labRefMax) * 100;
      } else {
        status = "normal";
        deviationPercent = 0;
      }
    }
  }

  return {
    ...b,
    normalizedName,
    numericValue,
    status,
    deviationPercent,
    clinicalUrgency: URGENCY_MAP[normalizedName] ?? 1,
    category: CATEGORY_MAP[normalizedName] ?? "other",
  };
}

function biomarkerMatchesCriterion(
  biomarker: EvaluatedBiomarker,
  criterion: CriterionDefinition,
): boolean {
  const nameMatch =
    criterion.biomarkerPattern instanceof RegExp
      ? criterion.biomarkerPattern.test(biomarker.normalizedName)
      : biomarker.normalizedName === criterion.biomarkerPattern;
  if (!nameMatch) return false;
  const requiredStatuses = Array.isArray(criterion.requiredStatus)
    ? criterion.requiredStatus
    : [criterion.requiredStatus];
  return requiredStatuses.includes(biomarker.status);
}

function calculateConfidence(
  supporting: Evidence[],
  conflicting: Evidence[],
  requiredCount: number,
): { level: ConfidenceLevel; score: number } {
  if (supporting.length === 0) return { level: "INSUFFICIENT", score: 0 };
  const netScore = supporting.length - conflicting.length * 1.5;
  const rawScore = Math.max(
    0,
    Math.min(100, (netScore / (requiredCount + 2)) * 100),
  );
  if (conflicting.length > 0 && supporting.length <= conflicting.length) {
    return { level: "INSUFFICIENT", score: rawScore };
  }
  if (conflicting.length > 0) return { level: "LOW", score: rawScore };
  if (supporting.length >= requiredCount + 2)
    return { level: "HIGH", score: rawScore };
  if (supporting.length >= requiredCount)
    return { level: "MODERATE", score: rawScore };
  return { level: "LOW", score: rawScore };
}

export function runClinicalRulesEngine(
  extractedBiomarkers: ExtractedBiomarker[],
): RulesEngineOutput {
  const evaluated = extractedBiomarkers.map(evaluateBiomarker);

  const criticalAlerts: CriticalAlert[] = evaluated
    .filter(
      (b) => b.status === "critical_low" || b.status === "critical_high",
    )
    .map((b) => ({
      biomarkerName: b.name,
      value: (b.numericValue ?? 0) as number,
      unit: b.unit,
      message: `${b.name}: ${b.value} ${b.unit ?? ""} — ${
        b.status === "critical_low" ? "critically low" : "critically high"
      }. Seek medical attention.`,
    }));

  const patternEvaluations: PatternEvaluation[] = [];

  for (const pattern of CLINICAL_PATTERNS) {
    const supporting: Evidence[] = [];
    const conflicting: Evidence[] = [];

    for (const criterion of [
      ...pattern.requiredCriteria,
      ...pattern.supportingCriteria,
    ]) {
      const match = evaluated.find((b) =>
        biomarkerMatchesCriterion(b, criterion),
      );
      if (match) {
        supporting.push({
          biomarkerName: match.name,
          value: match.value,
          unit: match.unit,
          status: match.status,
          direction: "supports",
          explanation: criterion.explanation,
        });
      }
    }

    for (const criterion of pattern.conflictingCriteria) {
      const match = evaluated.find((b) =>
        biomarkerMatchesCriterion(b, criterion),
      );
      if (match) {
        conflicting.push({
          biomarkerName: match.name,
          value: match.value,
          unit: match.unit,
          status: match.status,
          direction: "conflicts",
          explanation: criterion.explanation,
        });
      }
    }

    if (supporting.length === 0) continue;

    const { level, score } = calculateConfidence(
      supporting,
      conflicting,
      pattern.requiredCount,
    );

    const meetsThreshold =
      CONFIDENCE_ORDER[level] >= CONFIDENCE_ORDER[pattern.canConcludeAt];
    const canDisplay = score > 20 && supporting.length > 0 && meetsThreshold;

    patternEvaluations.push({
      pattern,
      confidenceLevel: level,
      confidenceScore: Math.round(score),
      supportingEvidence: supporting,
      conflictingEvidence: conflicting,
      canDisplay,
      displayName:
        level === "LOW"
          ? `Low-evidence ${pattern.displayName}`
          : pattern.displayName,
      clinicalPriority: pattern.clinicalUrgency,
    });
  }

  const sortedPatterns = patternEvaluations
    .filter((p) => p.canDisplay)
    .sort((a, b) => {
      const scoreA = a.clinicalPriority * (a.confidenceScore / 100);
      const scoreB = b.clinicalPriority * (b.confidenceScore / 100);
      return scoreB - scoreA;
    });

  const priorityFindings: PriorityFinding[] = sortedPatterns
    .slice(0, 3)
    .map((p, i) => ({
      rank: i + 1,
      headline: p.pattern.displayName
        .replace("Possible ", "")
        .replace(" Pattern", ""),
      patientExplanation: p.pattern.patientNote,
      urgency: p.pattern.clinicalUrgency,
      relatedBiomarkers: p.supportingEvidence.map((e) => e.biomarkerName),
    }));

  const abnormalCount = evaluated.filter(
    (b) => b.status !== "normal" && b.status !== "unknown",
  ).length;
  const overallClinicalScore = Math.min(
    100,
    abnormalCount * 5 + criticalAlerts.length * 25 + sortedPatterns.length * 10,
  );

  const dataQualityWarnings: string[] = [];
  const noRefRange = evaluated.filter(
    (b) => b.labRefMin === null && b.labRefMax === null,
  );
  if (evaluated.length > 0 && noRefRange.length > evaluated.length * 0.3) {
    dataQualityWarnings.push(
      `Reference ranges could not be extracted for ${noRefRange.length} biomarkers. Status assessment may be incomplete.`,
    );
  }
  if (evaluated.length < 3) {
    dataQualityWarnings.push(
      "Fewer than 3 biomarkers were extracted. Pattern analysis is limited.",
    );
  }

  return {
    evaluatedBiomarkers: evaluated,
    patternEvaluations: sortedPatterns,
    priorityFindings,
    criticalAlerts,
    dataQualityWarnings,
    overallClinicalScore,
    canAnalyze: evaluated.length >= 2,
  };
}
