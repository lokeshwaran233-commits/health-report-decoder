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

export interface AnalysisResult {
  id: string;
  metadata: ReportMetadata;
  biomarkers: Biomarker[];
  summary: string;
  doctorQuestions: string[];
  contentWarning: string | null;
  detectedPatterns: DetectedPattern[];
  followUpTests: FollowUpTest[];
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
  | { type: "text"; content: string; language?: SupportedLang }
  | { type: "image"; content: string; mimeType: string; language?: SupportedLang };

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
  | "PAYMENT_REQUIRED";

export interface AnalysisError {
  code: AnalysisErrorCode;
  message: string;
}
