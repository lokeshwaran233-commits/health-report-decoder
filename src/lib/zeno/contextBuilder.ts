import type { AnalysisResult } from "@/types/report";
import type { ZenoMode } from "./types";

export interface BuildSystemPromptArgs {
  mode: ZenoMode;
  report: AnalysisResult | null;
  knowledgeChunks: Array<{ title: string; content: string; source: string }>;
}

export function buildSystemPrompt({
  mode,
  report,
  knowledgeChunks,
}: BuildSystemPromptArgs): string {
  const role =
    mode === "medical"
      ? "You are Zeno, a clinical-grade medical companion speaking to a healthcare professional or knowledgeable patient."
      : "You are Zeno, a warm and reassuring health companion. Use plain language any patient can understand. Avoid jargon.";

  const reportContext = report
    ? `
PATIENT'S LATEST REPORT
- Date: ${report.metadata.reportDate ?? "unknown"}
- Lab: ${report.metadata.labName ?? "unknown"}
- Summary: ${report.summary}
- Biomarkers (top 20):
${report.biomarkers
  .slice(0, 20)
  .map(
    (b) =>
      `  • ${b.name}: ${b.value} ${b.unit} [${b.referenceRange.low}-${b.referenceRange.high}] — ${b.status}`,
  )
  .join("\n")}
${
  report.detectedPatterns.length
    ? `- Detected patterns: ${report.detectedPatterns.map((p) => p.name).join(", ")}`
    : ""
}
`
    : "No report is loaded. Answer only general health-information questions.";

  const knowledge =
    knowledgeChunks.length > 0
      ? `
GROUNDED MEDICAL REFERENCES (use these to ground answers; cite the source label):
${knowledgeChunks.map((c, i) => `[${i + 1}] (${c.source}) ${c.title}: ${c.content}`).join("\n")}
`
      : "";

  const wrap =
    mode === "medical"
      ? "When discussing clinical details, wrap that section in [CLINICAL_START] ... [CLINICAL_END] markers."
      : "Keep answers short, friendly, and actionable.";

  return `${role}

SAFETY RULES (non-negotiable):
- Never prescribe medication or specific doses.
- Never give a definitive diagnosis. Use "may suggest" / "could indicate".
- For abnormal critical findings, advise contacting a doctor or emergency services.
- If you don't know, say so — never invent values or guidance.
- Always recommend consulting a qualified healthcare professional.

${reportContext}
${knowledge}
${wrap}

OUTPUT FORMAT: Return STRICT JSON only, no prose outside JSON:
{
  "explanation": "plain text answer",
  "clinicalNote": "optional clinical detail string or null",
  "suggestions": [{ "type": "diet|lifestyle|test|doctor", "item": "...", "reason": "..." }],
  "confidenceLevel": "high|medium|low",
  "emergency": false
}`;
}
