import type { ZenoSuggestion } from "./types";

export interface ParsedZenoResponse {
  explanation: string;
  clinicalNote: string | null;
  suggestions: ZenoSuggestion[];
  confidence: "high" | "medium" | "low";
  emergency: boolean;
}

/**
 * Parses Zeno's JSON-mode reply. Falls back to treating raw text as explanation.
 */
export function parseZenoResponse(raw: string): ParsedZenoResponse {
  const fallback = (text: string): ParsedZenoResponse => ({
    explanation: text.trim(),
    clinicalNote: null,
    suggestions: [],
    confidence: "medium",
    emergency: /\bemergency\b|\bcall (911|emergency|ambulance)\b/i.test(text),
  });

  const tryJson = (s: string) => {
    try {
      return JSON.parse(s);
    } catch {
      return null;
    }
  };

  let parsed: unknown =
    tryJson(raw) ?? tryJson(raw.match(/\{[\s\S]*\}/)?.[0] ?? "");

  if (!parsed || typeof parsed !== "object") return fallback(raw);

  const p = parsed as Record<string, unknown>;
  const explanation =
    typeof p.explanation === "string" ? p.explanation : String(raw);
  const clinicalNote =
    typeof p.clinicalNote === "string" && p.clinicalNote.length > 0
      ? p.clinicalNote
      : null;
  const confidence = ["high", "medium", "low"].includes(
    String(p.confidenceLevel),
  )
    ? (p.confidenceLevel as "high" | "medium" | "low")
    : "medium";
  const emergency = Boolean(p.emergency);
  const suggestions = Array.isArray(p.suggestions)
    ? (p.suggestions
        .filter(
          (s): s is ZenoSuggestion =>
            typeof s === "object" &&
            s !== null &&
            typeof (s as ZenoSuggestion).item === "string" &&
            typeof (s as ZenoSuggestion).reason === "string",
        )
        .slice(0, 8) as ZenoSuggestion[])
    : [];

  return { explanation, clinicalNote, suggestions, confidence, emergency };
}
