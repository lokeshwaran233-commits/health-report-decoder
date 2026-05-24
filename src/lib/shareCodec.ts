/**
 * Unicode-safe base64 for share URLs. btoa() on raw JSON throws on any
 * non-ASCII character (μ, °, ≥, etc.), which every real lab report contains.
 */

export interface SharedSummaryPayload {
  metadata: {
    patientName: string | null;
    reportDate: string | null;
    labName: string | null;
  };
  statusCounts: { normal: number; watch: number; flagged: number };
  summary: string;
  doctorQuestions: string[];
}

export function encodeShare(payload: SharedSummaryPayload): string {
  const json = JSON.stringify(payload);
  return btoa(unescape(encodeURIComponent(json)));
}

export function decodeShare(encoded: string): SharedSummaryPayload | null {
  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    return JSON.parse(json) as SharedSummaryPayload;
  } catch {
    return null;
  }
}
