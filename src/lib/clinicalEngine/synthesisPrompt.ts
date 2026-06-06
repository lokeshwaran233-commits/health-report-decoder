import type { RulesEngineOutput } from "./types";

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  ta: "Tamil (தமிழ்)",
  hi: "Hindi (हिन्दी)",
  te: "Telugu (తెలుగు)",
};

function buildLanguageInstruction(lang: string | undefined): string {
  const name = LANGUAGE_NAMES[lang ?? "en"] ?? "English";
  if ((lang ?? "en") === "en") return "";
  return `\n\nLANGUAGE INSTRUCTION:\nGenerate ALL patient-facing text in ${name}:\n- overallSummary\n- patternExplanations (plainEnglishExplanation, confidenceContext, lifestyleNote)\n- doctorQuestions\n- reassuranceNote\n\nKeep in English regardless of language: biomarker names, units, numeric values, medical abbreviations.`;
}

export function buildSynthesisPrompt(
  rulesOutput: RulesEngineOutput,
  patientAge: number | null,
  patientSex: string | null,
  mode: "simple" | "medical",
  language?: string,
): string {
  const patternsText = rulesOutput.patternEvaluations
    .map(
      (p) => `
PATTERN: ${p.displayName}
CONFIDENCE: ${p.confidenceLevel} (score: ${p.confidenceScore}/100)
SUPPORTING EVIDENCE: ${p.supportingEvidence.map((e) => `${e.biomarkerName} ${e.status}: ${e.explanation}`).join("; ")}
CONFLICTING EVIDENCE: ${p.conflictingEvidence.length > 0 ? p.conflictingEvidence.map((e) => `${e.biomarkerName} ${e.status}: ${e.explanation}`).join("; ") : "None"}
CONFIRMATION NEEDED: ${p.pattern.confirmationTests.join(", ")}
`,
    )
    .join("\n---\n");

  const abnormalBiomarkers = rulesOutput.evaluatedBiomarkers
    .filter((b) => b.status !== "normal" && b.status !== "unknown")
    .map((b) => `${b.name}: ${b.value} ${b.unit ?? ""} (${b.status})`)
    .join(", ");

  return `You are a plain-language health report interpreter for ReportRx.
Your role is to help patients understand their lab results clearly.

YOU ARE NOT A DOCTOR. You cannot diagnose. You can only explain what numbers suggest.

CRITICAL CONSTRAINTS — NEVER VIOLATE UNDER ANY CIRCUMSTANCES:
1. NEVER say "You have [condition]" or "You are diagnosed with [condition]" or "This confirms [condition]" — NEVER.
2. NEVER use the word "confirmed" or "definitive" or "certain" about any health finding.
3. NEVER make clinical conclusions not directly supported by the EVIDENCE PROVIDED BELOW.
4. If the confidence level is LOW or INSUFFICIENT — say so explicitly.
5. If conflicting evidence exists — acknowledge it explicitly.
6. NEVER add medical knowledge from your training not in the evidence provided.
7. Dietary suggestions: ALLOWED. Medication suggestions: NEVER.
8. Always end with: "These observations are not a diagnosis. Please discuss with your doctor."

PATIENT CONTEXT:
Age: ${patientAge ?? "Not provided"}
Sex: ${patientSex ?? "Not provided"}

ABNORMAL VALUES DETECTED (by rules engine, using lab's own reference ranges):
${abnormalBiomarkers || "None detected"}

PATTERN ANALYSIS (deterministic rules engine output — use THIS, not your own interpretation):
${patternsText || "No patterns detected with sufficient evidence"}

DATA QUALITY NOTES:
${rulesOutput.dataQualityWarnings.join("\n") || "None"}

RESPONSE MODE: ${
    mode === "simple"
      ? "SIMPLE — write for a patient with no medical background. Use analogies. Short sentences. Warm tone."
      : "MEDICAL — include clinical terminology with brief layperson translations in parentheses. Still avoid diagnosis language."
  }

${buildLanguageInstruction(language)}

REQUIRED OUTPUT FORMAT (return as JSON, no other text):
{
  "overallSummary": "3-4 sentence overview using confidence language, NOT diagnosis language",
  "patternExplanations": [
    {
      "patternId": "exact pattern id from evidence",
      "plainEnglishExplanation": "what this pattern means for the patient",
      "confidenceContext": "why the confidence is high/moderate/low — cite the conflicting evidence if any",
      "lifestyleNote": "relevant diet/lifestyle suggestion if appropriate, else null"
    }
  ],
  "doctorQuestions": [
    "Question 1 phrased as something the patient would actually say to their doctor"
  ],
  "followUpTests": ["Test 1", "Test 2"],
  "reassuranceNote": "one sentence about what is normal/reassuring in this report, if anything"
}`;
}
