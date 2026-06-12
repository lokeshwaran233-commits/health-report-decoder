export type BiomarkerStatus = "normal" | "watch" | "flagged";
export type BiomarkerCategory =
  | "blood"
  | "liver"
  | "kidney"
  | "thyroid"
  | "metabolic"
  | "vitamin"
  | "cardio"
  | "coagulation"
  | "electrolyte"
  | "inflammation"
  | "urine"
  | "bloodgas"
  | "other";

export interface ReferenceRange {
  low: number;
  high: number;
  unit?: string;
}

export interface Biomarker {
  id: string;
  name: string;
  value: number;
  unit: string;
  referenceRange: ReferenceRange;
  status: BiomarkerStatus;
  category: BiomarkerCategory;
  plainEnglish: string;
  deepExplanation: string;
  /** Set true for non-negotiable critical values requiring urgent attention. */
  criticalFlag?: boolean;
  /** True when computed client-side (e.g. HOMA-IR, Anion Gap). */
  derived?: boolean;
}

export interface ReportMetadata {
  patientName?: string | null;
  reportDate?: string | null;
  labName?: string | null;
  uploadedAt: string;
}

export type PatternSeverity = "informational" | "watch" | "flagged" | "critical";
export type FollowUpUrgency = "urgent" | "soon" | "routine";

export interface DetectedPattern {
  name: string;
  biomarkersInvolved: string[];
  plainEnglish: string;
  severity: PatternSeverity;
}

export interface FollowUpTest {
  test: string;
  reason: string;
  urgency: FollowUpUrgency;
}

export interface ClinicalContext {
  age?: number | null;
  sex?: "male" | "female" | "other" | null;
  symptoms?: string | null;
  conditions?: string | null;
  medications?: string | null;
  isPregnant?: boolean | null;
}

export interface GuardViolation {
  text: string;
  severity: string;
}

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [k: string]: JsonValue };

export interface ClinicalEngineSummary {
  version: string;
  patternEvaluations: JsonValue[];
  priorityFindings: JsonValue[];
  criticalAlerts: JsonValue[];
  dataQualityWarnings: string[];
  overallClinicalScore: number;
  evaluatedBiomarkers: JsonValue[];
  guardHadCritical: boolean;
  guardViolations: GuardViolation[];
}


export interface AnalysisResult {
  id: string;
  metadata: ReportMetadata;
  biomarkers: Biomarker[];
  summary: string;
  doctorQuestions: string[];
  contentWarning: string | null;
  detectedPatterns: DetectedPattern[];
  followUpTests: FollowUpTest[];
  clinicalEngine?: ClinicalEngineSummary | null;
}

export type UploadStatus =
  | "idle"
  | "uploading"
  | "extracting"
  | "analyzing"
  | "done"
  | "error";

export interface UploadState {
  status: UploadStatus;
  file?: File;
  extractedText?: string;
  error?: string;
  progress?: number;
}

export type SupportedLang = "en" | "ta" | "hi" | "te";

export type AnalyzeInput =
  | { type: "text"; content: string; language?: SupportedLang; clinicalContext?: ClinicalContext }
  | { type: "image"; content: string; mimeType: string; language?: SupportedLang; clinicalContext?: ClinicalContext };


export interface FileMeta {
  name: string;
  size: number;
  type: string;
}

export type AnalysisErrorCode =
  | "PARSE_ERROR"
  | "NO_DATA_FOUND"
  | "API_ERROR"
  | "RATE_LIMIT"
  | "PAYMENT_REQUIRED"
  | "QUOTA_EXCEEDED";

export interface AnalysisError {
  code: AnalysisErrorCode;
  message: string;
}
