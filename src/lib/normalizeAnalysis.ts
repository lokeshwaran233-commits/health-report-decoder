/**
 * Day 2 normalization layer.
 *
 * The Lovable AI Gateway returns Gemini tool-call arguments that may be
 * partial, mistyped, or missing categories. This module will map that raw
 * payload into the strict AnalysisResult / Biomarker shape defined in
 * src/types/report.ts, applying safe defaults for any omitted field.
 *
 * Intentionally empty for Day 1.
 */
import type { AnalysisResult } from "@/types/report";

export type RawAnalysisPayload = unknown;

export function normalizeAnalysis(
  _raw: RawAnalysisPayload,
): AnalysisResult | null {
  return null;
}
