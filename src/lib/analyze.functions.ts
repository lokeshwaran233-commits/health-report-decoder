import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { normalizeAnalysisResult } from "@/lib/normalizeAnalysis";
import { withDerivedBiomarkers } from "@/lib/clinicalDerivations";
import { runClinicalRulesEngine } from "@/lib/clinicalEngine/rulesEngine";
import { runHallucinationGuard } from "@/lib/clinicalEngine/hallucinationGuard";
import type { ExtractedBiomarker } from "@/lib/clinicalEngine/types";
import type { AnalysisError, AnalysisResult, ClinicalEngineSummary, GuardViolation } from "@/types/report";

const langSchema = z.enum(["en", "ta", "hi", "te"]).optional();

const clinicalContextSchema = z
  .object({
    age: z.number().int().min(0).max(130).nullable().optional(),
    sex: z.enum(["male", "female", "other"]).nullable().optional(),
    symptoms: z.string().max(2000).nullable().optional(),
    conditions: z.string().max(2000).nullable().optional(),
    medications: z.string().max(2000).nullable().optional(),
    isPregnant: z.boolean().nullable().optional(),
  })
  .optional();

// Cap base64 image payloads at ~4.5 MB to prevent token-cost abuse.
const MAX_IMAGE_B64 = 6_000_000;

const inputSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("text"),
    content: z.string().min(20).max(50000),
    language: langSchema,
    clinicalContext: clinicalContextSchema,
  }),
  z.object({
    type: z.literal("image"),
    content: z.string().min(50).max(MAX_IMAGE_B64),
    mimeType: z.string().min(3).max(64),
    language: langSchema,
    clinicalContext: clinicalContextSchema,
  }),
]);


const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  ta: "Tamil (தமிழ்)",
  hi: "Hindi (हिन्दी)",
  te: "Telugu (తెలుగు)",
};

function buildLanguageInstruction(lang: string | undefined): string {
  const name = LANGUAGE_NAMES[lang ?? "en"] ?? "English";
  if ((lang ?? "en") === "en") return "";
  return `\n\nLANGUAGE INSTRUCTION:\nGenerate ALL of the following fields in ${name}:\n- plainEnglish (biomarker explanation)\n- deepExplanation (biological significance)\n- summary (overall report narrative, all paragraphs)\n- doctorQuestions (all questions)\n- contentWarning (if any)\n\nKeep ALL of the following in English regardless of language setting:\n- Biomarker names (Haemoglobin, TSH, Vitamin D, etc.)\n- Units (g/dL, μIU/mL, ng/mL, etc.)\n- Numeric values\n- Medical abbreviations (CBC, LFT, etc.)\n- Lab name and patient name (as found in the report)\n\nThis ensures the content is readable and culturally appropriate while medical terms remain internationally standardised.`;
}

const SYSTEM_PROMPT = `You are a clinical-grade medical lab report analyzer. The text you receive may contain mixed content — lab report data alongside unrelated content such as resumes, letters, invoices, or other documents.

Your job:
1. Scan the ENTIRE text and identify which sections contain medical lab report data (biomarker names, values, units, reference ranges).
2. IGNORE all non-medical content completely. Extract biomarkers ONLY from the medical sections.
3. Reason about the biomarkers TOGETHER — never as isolated values. The whole point is multi-marker pattern recognition.
4. Set "contentWarning" to null when clean, otherwise a short string like "PDF also contained what appears to be a resume or CV".
5. Never reject the request just because non-medical content is present. Always extract what medical data exists.

CRITICAL EXTRACTION RULES:
- Extract ONLY values explicitly stated in the report. Never invent values.
- Reference ranges must come from the report itself. If not stated, use standard clinical guidelines.
- Status logic: 'normal' = within range. 'watch' = within 10% outside range. 'flagged' = >10% outside range or clinically significant.
- plainEnglish: one warm, non-alarmist sentence for a non-medical person.
- deepExplanation: 2–3 sentences on biological significance.
- summary: 3–4 paragraphs separated by double newlines. LEAD with patterns and what matters most, not a marker-by-marker recap.
- doctorQuestions: specific and intelligent — reference actual values and the patterns they form.
- Return ONLY valid JSON. No markdown. No preamble.

COMMUNICATION GUARDRAILS (non-negotiable):
- NEVER diagnose. Use "consistent with", "pattern suggests", "may indicate".
- NEVER use the word "cancer" anywhere in the output. Tumour markers (PSA, CA-125, CA 19-9, CEA, AFP, beta-HCG) must always mention non-malignant causes and always be framed as requiring follow-up, not as diagnostic.
- Every flagged finding must have a corresponding doctorQuestion.
- Every detected pattern must have an action — either a follow-up test or a clear next step.

CRITICAL VALUES (always set "criticalFlag": true regardless of the lab's reference range, and the plainEnglish must include "This value requires urgent medical attention."):
- Troponin (I or T, hsTroponin) any level above normal
- pH < 7.2 or > 7.6
- PaO2 < 60 mmHg
- Lactate > 4 mmol/L
- Potassium (K+) < 2.5 or > 6.5 mEq/L
- Sodium (Na+) < 120 or > 155 mEq/L
- Glucose < 50 or > 500 mg/dL
- D-dimer very high WITH abnormal fibrinogen/PT/aPTT (suggests DIC)

PATTERN DETECTION RULES — populate "detectedPatterns" with every pattern you identify. Cover at minimum:

CBC / Anaemia:
- Iron-deficiency anaemia: Hb LOW + MCV LOW + MCH LOW → severity "flagged".
- Macrocytic / B12-folate anaemia: Hb LOW + MCV HIGH → severity "flagged".
- Megaloblastic triad: B12 LOW + Folate LOW + MCV HIGH.

Iron studies:
- Iron-deficiency confirmation: Ferritin LOW + Serum Iron LOW + TIBC HIGH + Transferrin Sat LOW.
- Anaemia of chronic disease: Ferritin NORMAL/HIGH + Serum Iron LOW + TIBC LOW.
- Iron overload: Ferritin VERY HIGH + Transferrin Sat > 45%.
- If CRP HIGH AND Ferritin HIGH, add a pattern noting ferritin is an acute-phase reactant and may reflect inflammation rather than overload.

Liver / Kidney:
- Liver injury: AST HIGH + ALT HIGH. If AST > 2×ALT mention possible alcohol-related stress.
- Liver coagulopathy: INR HIGH + AST HIGH + ALT HIGH.
- Kidney decline triad: Creatinine HIGH + BUN HIGH + eGFR LOW.

Thyroid:
- Overt hypothyroid: TSH HIGH + FT4 LOW.
- Subclinical hypothyroid: TSH HIGH + FT4 NORMAL.
- Hyperthyroid: TSH LOW + FT4 HIGH + FT3 HIGH.
- Hashimoto's: Anti-TPO HIGH (regardless of TSH).
- T3 toxicosis: TSH LOW + FT4 NORMAL + FT3 HIGH.

Metabolic / Cardio:
- Diabetic pattern: HbA1c watch/flagged AND fasting glucose watch/flagged.
- Atherogenic dyslipidaemia: Triglycerides HIGH + HDL LOW.
- Metabolic syndrome: 2-of-3 from (TG > 150, HDL < 40 M / < 50 F, fasting glucose > 100 OR HbA1c > 5.7).
- Diabetic nephropathy risk: UACR HIGH + HbA1c HIGH.

Inflammation / Coagulation / Urine:
- Acute bacterial infection: CRP HIGH + WBC HIGH + Neutrophils HIGH.
- Chronic inflammation: CRP HIGH + ESR HIGH + WBC NORMAL.
- Microalbuminuria: UACR 30–300 mg/g → severity "watch".
- Nephrotic range proteinuria: 24-hr urine protein > 3.5 g → severity "flagged".

ABG / Electrolytes:
- Classify acid-base whenever pH is present: respiratory vs metabolic, acidosis vs alkalosis.
- Hypomagnesaemia driving hypoK/hypoCa: Mg LOW + K LOW + Ca LOW.

VITAMIN D severity reclassification (override the lab range):
- < 12 ng/mL: status "flagged", criticalFlag false, plainEnglish must mention "severely deficient".
- 12–20: flagged. 20–30: watch. > 30: normal.

FOLLOW-UP TEST GENERATION — populate "followUpTests" with concrete next tests based on patterns:
- Anaemia without iron studies → ["Ferritin, Serum Iron, TIBC"], urgency "soon".
- TSH abnormal without FT4/FT3 → ["Free T4 and Free T3"], urgency "routine".
- Persistent TSH HIGH → also add "Anti-TPO antibodies".
- Liver enzymes raised → ["Hepatitis B surface antigen, Hepatitis C antibody"], urgency "soon".
- Metabolic markers raised without insulin → ["Fasting Insulin (for HOMA-IR)"], urgency "routine".
- D-dimer elevated → urgency "urgent" — imaging discussion (DVT/PE).
- Microalbuminuria → ["Repeat UACR, kidney function panel"], urgency "soon".

JSON CONTRACT — return EXACTLY this shape:
{
  "contentWarning": string | null,
  "metadata": {
    "patientName": string | null,
    "reportDate": string | null,
    "labName": string | null
  },
  "biomarkers": [
    {
      "id": string,
      "name": string,
      "value": number,
      "unit": string,
      "referenceRange": { "low": number, "high": number },
      "status": "normal" | "watch" | "flagged",
      "category": "blood" | "liver" | "kidney" | "thyroid" | "metabolic" | "vitamin" | "cardio" | "coagulation" | "electrolyte" | "inflammation" | "urine" | "bloodgas" | "other",
      "plainEnglish": string,
      "deepExplanation": string,
      "criticalFlag": boolean
    }
  ],
  "summary": string,
  "doctorQuestions": string[],
  "detectedPatterns": [
    {
      "name": string,
      "biomarkersInvolved": string[],
      "plainEnglish": string,
      "severity": "informational" | "watch" | "flagged" | "critical"
    }
  ],
  "followUpTests": [
    {
      "test": string,
      "reason": string,
      "urgency": "urgent" | "soon" | "routine"
    }
  ]
}`;

function fail(code: AnalysisError["code"], message: string): never {
  const err = new Error(message) as Error & AnalysisError;
  err.code = code;
  throw err;
}

function tryParseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

export const analyzeReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<AnalysisResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      console.error("[analyzeReport] LOVABLE_API_KEY is not configured on the server");
      fail("API_ERROR", "AI service is not configured on the server. Please contact support.");
    }

    const userMessage =
      data.type === "text"
        ? { role: "user" as const, content: data.content }
        : {
            role: "user" as const,
            content: [
              {
                type: "image_url" as const,
                image_url: {
                  url: `data:${data.mimeType};base64,${data.content}`,
                },
              },
              {
                type: "text" as const,
                text: "This is a medical lab report image. Extract all biomarker values and return the JSON analysis as specified.",
              },
            ],
          };

    let response: Response;
    try {
      response = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            temperature: 0.1,
            max_tokens: 6000,
            messages: [
              { role: "system", content: SYSTEM_PROMPT + buildLanguageInstruction(data.language) },
              userMessage,
            ],
          }),
        },
      );
    } catch (e) {
      fail(
        "API_ERROR",
        e instanceof Error ? e.message : "Network error reaching AI gateway.",
      );
    }

    if (response.status === 429) {
      fail(
        "RATE_LIMIT",
        "You've hit the AI rate limit. Please wait a minute and try again.",
      );
    }
    if (response.status === 402) {
      fail(
        "PAYMENT_REQUIRED",
        "AI credits exhausted on this workspace. Please add credits in Settings > Workspace > Usage.",
      );
    }
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      fail(
        "API_ERROR",
        `AI service returned ${response.status}. ${text.slice(0, 200)}`,
      );
    }

    const json = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content ?? "";
    if (!content) {
      fail("PARSE_ERROR", "AI returned an empty response. Please try again.");
    }

    const parsed = tryParseJson(content);
    if (!parsed || typeof parsed !== "object") {
      fail(
        "PARSE_ERROR",
        "We couldn't read the AI response as JSON. Please try again.",
      );
    }

    const normalized = normalizeAnalysisResult(parsed);
    if (normalized.biomarkers.length === 0) {
      fail(
        "NO_DATA_FOUND",
        "Could not extract any biomarker values from this report. Please try pasting the text manually.",
      );
    }
    return withDerivedBiomarkers(normalized);
  });
