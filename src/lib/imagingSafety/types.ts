// Imaging Safety Pipeline — parallel namespace, never imported by legacy /scan.
// Implements the 12-phase roadmap from the uploaded safety document.

import type { ImageScanModality, BodyRegion } from "@/types/scan";

export type SafetyModality = ImageScanModality;

export type ConfidenceBand = "HIGH" | "MODERATE" | "LOW" | "INSUFFICIENT";
export type SafetyDecision = "release" | "release_with_caveat" | "defer";
export type QualityVerdict = "adequate" | "suboptimal" | "inadequate";

export interface PhaseInputReport {
  ok: boolean;
  detectedMime: string;
  isLikelyOriginal: boolean; // false suggests a screenshot / re-encode
  rejectReason?: string;
}

export interface PhaseQualityReport {
  verdict: QualityVerdict;
  score: number; // 0-100
  reasons: string[];
  modalitySpecific: Record<string, string | number | boolean>;
}

export interface PhaseAnatomyReport {
  matchesExpected: boolean;
  detectedRegion: BodyRegion | "unknown";
  detectedView: string | null;
  laterality: "left" | "right" | "midline" | "unknown" | null;
  confidence: ConfidenceBand;
  notes: string[];
}

export interface Evidence {
  // Image-grounded snippet describing WHERE in the study the finding is supported.
  locator: string; // e.g. "PLAX, frame ~12, septum"
  description: string; // observation tying to the finding
}

export interface CalibratedFinding {
  id: string;
  label: string; // short clinical label e.g. "Reduced LVEF"
  plain: string; // patient-safe phrasing
  significance: "normal_variant" | "incidental" | "abnormal" | "critical";
  confidence: ConfidenceBand;
  evidence: Evidence[];
  caveats: string[];
}

export interface CriticReport {
  overreach: string[]; // claims the critic flagged as unsupported
  removedFindingIds: string[];
  addedCaveats: Record<string, string[]>; // findingId -> caveats
}

export interface SafetyRuleHit {
  rule: string;
  severity: "info" | "warn" | "block";
  message: string;
}

export interface DeferralReason {
  code:
    | "input_rejected"
    | "image_quality"
    | "anatomy_mismatch"
    | "no_grounded_findings"
    | "critic_blocked"
    | "safety_block";
  message: string;
}

export interface SafetyAuditEntry {
  pipelineVersion: string;
  modelChain: string[];
  promptHash: string;
  inputHash: string;
  decision: SafetyDecision;
  createdAt: string;
}

export interface FinalSafetyReport {
  decision: SafetyDecision;
  deferrals: DeferralReason[];
  modality: SafetyModality;
  bodyRegion: BodyRegion;
  phases: {
    input: PhaseInputReport;
    quality: PhaseQualityReport;
    anatomy: PhaseAnatomyReport;
    critic: CriticReport;
    safety: SafetyRuleHit[];
  };
  findings: CalibratedFinding[];
  patientSummary: string;
  clinicianBrief: string;
  audit: SafetyAuditEntry;
}

export interface SafetyPipelineInput {
  modality: SafetyModality;
  bodyRegion: BodyRegion;
  imageBase64?: string;
  mimeType?: string;
  // Optional pre-extracted observations from an LLM step.
  rawObservations?: {
    findings?: Array<{
      label?: string;
      description?: string;
      significance?: string;
      confidence?: string;
      evidence?: Array<{ locator?: string; description?: string }>;
    }>;
    detectedRegion?: string;
    detectedView?: string;
    laterality?: string;
    qualityHints?: string[];
  };
  language?: "en" | "ta" | "hi" | "te";
}

export const PIPELINE_VERSION = "imaging-safety-1.0";
