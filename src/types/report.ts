export type BiomarkerStatus = "normal" | "watch" | "flagged";
export type BiomarkerCategory =
  | "blood"
  | "liver"
  | "kidney"
  | "thyroid"
  | "metabolic"
  | "vitamin"
  | "other";

export interface ReferenceRange {
  low: number;
  high: number;
  unit: string;
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
}

export interface ReportMetadata {
  patientName?: string;
  reportDate?: string;
  labName?: string;
  uploadedAt: string;
}

export interface AnalysisResult {
  id: string;
  metadata: ReportMetadata;
  biomarkers: Biomarker[];
  summary: string;
  doctorQuestions: string[];
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
