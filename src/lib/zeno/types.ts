export type ZenoMode = "simple" | "medical";

export interface ZenoSuggestion {
  type: "diet" | "lifestyle" | "test" | "doctor";
  item: string;
  reason: string;
}

export interface ZenoMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  clinicalNote?: string | null;
  suggestions?: ZenoSuggestion[];
  emergency?: boolean;
  confidence?: "high" | "medium" | "low";
  createdAt: string;
}

export interface ZenoEmergencyAlert {
  biomarker: string;
  value: number;
  threshold: string;
  severity: "high" | "critical";
  advice: string;
}
