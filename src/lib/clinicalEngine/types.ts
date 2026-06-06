export type BiomarkerStatus =
  | "critical_low"
  | "low"
  | "normal"
  | "high"
  | "critical_high"
  | "unknown";

export type ConfidenceLevel = "HIGH" | "MODERATE" | "LOW" | "INSUFFICIENT";
export type ClinicalUrgency = 1 | 2 | 3 | 4 | 5;

export type BiomarkerCategory =
  | "red_blood_cells"
  | "white_blood_cells"
  | "platelets"
  | "metabolic"
  | "lipid"
  | "thyroid"
  | "liver"
  | "kidney"
  | "electrolytes"
  | "vitamins_minerals"
  | "hormones"
  | "other";

export interface ExtractedBiomarker {
  name: string;
  value: number | string;
  unit: string | null;
  labRefMin: number | null;
  labRefMax: number | null;
  labRefText: string | null;
}

export interface EvaluatedBiomarker extends ExtractedBiomarker {
  normalizedName: string;
  numericValue: number | null;
  status: BiomarkerStatus;
  deviationPercent: number | null;
  clinicalUrgency: ClinicalUrgency;
  category: BiomarkerCategory;
}

export interface Evidence {
  biomarkerName: string;
  value: number | string;
  unit: string | null;
  status: BiomarkerStatus;
  direction: "supports" | "conflicts";
  explanation: string;
}

export interface CriterionDefinition {
  biomarkerPattern: RegExp | string;
  requiredStatus: BiomarkerStatus | BiomarkerStatus[];
  explanation: string;
}

export interface ClinicalPattern {
  id: string;
  displayName: string;
  requiredCount: number;
  requiredCriteria: CriterionDefinition[];
  supportingCriteria: CriterionDefinition[];
  conflictingCriteria: CriterionDefinition[];
  confirmationTests: string[];
  clinicalUrgency: ClinicalUrgency;
  patientNote: string;
  canConcludeAt: ConfidenceLevel;
}

export interface PatternEvaluation {
  pattern: ClinicalPattern;
  confidenceLevel: ConfidenceLevel;
  confidenceScore: number;
  supportingEvidence: Evidence[];
  conflictingEvidence: Evidence[];
  canDisplay: boolean;
  displayName: string;
  clinicalPriority: number;
}

export interface PriorityFinding {
  rank: number;
  headline: string;
  patientExplanation: string;
  urgency: ClinicalUrgency;
  relatedBiomarkers: string[];
}

export interface CriticalAlert {
  biomarkerName: string;
  value: number;
  unit: string | null;
  message: string;
}

export interface RulesEngineOutput {
  evaluatedBiomarkers: EvaluatedBiomarker[];
  patternEvaluations: PatternEvaluation[];
  priorityFindings: PriorityFinding[];
  criticalAlerts: CriticalAlert[];
  dataQualityWarnings: string[];
  overallClinicalScore: number;
  canAnalyze: boolean;
}
