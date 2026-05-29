// Scan Decoder types. Sprints 1–3+ enable all modality picks; image-capable
// modalities go through the vision model, report_text uses chat model.

export type ImageScanModality =
  | "xray"
  | "ct"
  | "mri"
  | "ultrasound"
  | "pet"
  | "echo"
  | "eeg"
  | "ecg"
  | "mammogram"
  | "dexa"
  | "angiography"
  | "nuclear";

export type ScanModality = ImageScanModality | "report_text";

export type BodyRegion =
  | "head_brain"
  | "spine"
  | "chest_lungs"
  | "heart_cardiac"
  | "abdomen"
  | "pelvis"
  | "musculoskeletal"
  | "breast"
  | "vascular"
  | "neck_thyroid"
  | "orbit_eye"
  | "obstetric"
  | "whole_body"
  | "unknown";

export type ScanUrgency = "routine" | "urgent" | "critical";
export type ScanImageQuality = "adequate" | "suboptimal" | "inadequate";

export type FindingSignificance =
  | "normal_variant"
  | "incidental"
  | "abnormal"
  | "critical";

export type DifferentialLikelihood = "possible" | "probable" | "cannot_exclude";

export interface ScanFinding {
  location: string;
  description: string;
  significance: FindingSignificance;
  characterisation: string;
}

export interface ScanDifferential {
  diagnosis: string;
  likelihood: DifferentialLikelihood;
  supportingFindings: string[];
  againstFindings: string[];
}

export type LaymanFindingSignificance =
  | "normal"
  | "minor"
  | "significant"
  | "urgent";

export interface LaymanFinding {
  area: string;
  plainEnglish: string;
  significance: LaymanFindingSignificance;
  analogy?: string;
}

export interface ProfessionalOutput {
  findings: ScanFinding[];
  impression: string;
  differentials: ScanDifferential[];
  recommendations: string[];
  limitations: string[];
  urgency: ScanUrgency;
}

export interface LaymanOutput {
  summary: string;
  keyFindings: LaymanFinding[];
  whatThisMeans: string;
  nextSteps: string[];
  questionsForDoctor: string[];
}

export interface ScanInterpretationResult {
  id: string;
  modality: ScanModality;
  bodyRegion: BodyRegion;
  clinicalContext?: string | null;
  language?: string;
  imageQuality: ScanImageQuality;
  imageQualityNote?: string;

  professional: ProfessionalOutput;
  layman: LaymanOutput;

  indeterminateFindings: string[];
  criticalAlerts: string[];
  cannotAssess: string[];
  aiConfidenceNote: string;

  createdAt: string;
}

export interface ScanAnalysisError {
  code:
    | "API_ERROR"
    | "RATE_LIMIT"
    | "PAYMENT_REQUIRED"
    | "PARSE_ERROR"
    | "INADEQUATE_IMAGE"
    | "NO_DATA_FOUND";
  message: string;
}

export interface ScanExtraContext {
  contrastUsed?: boolean | null;
  sequences?: string | null;
  ultrasoundType?: string | null;
  echoType?: string | null;
  isPregnant?: boolean | null;
}

export type ScanInput =
  | {
      type: "report_text";
      content: string;
      bodyRegion: BodyRegion;
      clinicalContext?: string | null;
      language?: string;
    }
  | {
      type: "scan_image";
      modality: ImageScanModality;
      content: string; // base64 (no data URL prefix)
      mimeType: string;
      bodyRegion: BodyRegion;
      clinicalContext?: string | null;
      language?: string;
      extra?: ScanExtraContext;
    };
