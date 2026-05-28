import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { normaliseScanResult } from "@/lib/normalizeScan";
import type {
  ScanAnalysisError,
  ScanInterpretationResult,
} from "@/types/scan";

const langSchema = z.enum(["en", "ta", "hi", "te"]).optional();

const regionSchema = z.enum([
  "head_brain",
  "spine",
  "chest_lungs",
  "heart_cardiac",
  "abdomen",
  "pelvis",
  "musculoskeletal",
  "breast",
  "vascular",
  "neck_thyroid",
  "orbit_eye",
  "obstetric",
  "whole_body",
  "unknown",
]);

const inputSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("report_text"),
    content: z.string().min(20).max(50000),
    bodyRegion: regionSchema,
    clinicalContext: z.string().max(2000).nullable().optional(),
    language: langSchema,
  }),
  z.object({
    type: z.literal("xray_image"),
    content: z.string().min(50),
    mimeType: z.string().min(3).max(64),
    bodyRegion: regionSchema,
    clinicalContext: z.string().max(2000).nullable().optional(),
    language: langSchema,
  }),
]);

const LANG_NAMES: Record<string, string> = {
  en: "English",
  ta: "Tamil (தமிழ்)",
  hi: "Hindi (हिन्दी)",
  te: "Telugu (తெలుగు)",
};

function languageInstruction(lang: string | undefined): string {
  const code = (lang ?? "en").split("-")[0];
  if (code === "en") return "";
  const name = LANG_NAMES[code] ?? "English";
  return `\n\nLANGUAGE INSTRUCTION:\nWrite the entire "layman" object (summary, keyFindings.plainEnglish, whatThisMeans, nextSteps, questionsForDoctor) in ${name}. Keep the "professional" object, anatomical terms, measurements, and units in English.`;
}

const HONESTY_HEADER = `You are an AI assistant supporting medical imaging interpretation, with knowledge equivalent to a board-certified radiologist across modalities.

ABSOLUTE RULES — VIOLATIONS ARE UNACCEPTABLE:

1. NEVER hallucinate findings. Only describe what is explicitly visible in the image or stated in the report text. If something is not visible, say "not clearly visualised" or "cannot be adequately assessed".
2. NEVER make a definitive diagnosis. Use: "appearances are consistent with...", "findings may represent...", "cannot exclude...", "indeterminate — requires further evaluation", "clinical correlation recommended".
3. NEVER provide percentage probability estimates.
4. ALWAYS assess image quality FIRST. If inadequate, set imageQuality to "inadequate", populate imageQualityNote, and DO NOT attempt detailed interpretation — return empty findings arrays.
5. ALWAYS populate "limitations" (what was not assessed: slice thickness, single projection, no contrast, FOV cut-off, etc.) and "cannotAssess".
6. CRITICAL FINDINGS must populate "criticalAlerts" even if not definitive — flag if it could represent a life-threatening condition.
7. NEVER downplay a finding to reassure. Accuracy over comfort.
8. NEVER use the words "definitely", "certainly", "confirms", "proves", "rules out", or "you have cancer" as standalone conclusions.
9. NO demographic assumptions (age, sex, pregnancy) unless explicitly stated. If significance varies, state so.
10. If no prior imaging available, add to limitations: "No prior imaging available for comparison. Interval change cannot be assessed."

DIFFERENTIAL LIKELIHOOD must be one of: "possible", "probable", "cannot_exclude". No percentages.

OUTPUT: Return STRICTLY valid JSON matching the schema below. No markdown, no preamble, no text outside the JSON.

{
  "imageQuality": "adequate" | "suboptimal" | "inadequate",
  "imageQualityNote": string | null,
  "professional": {
    "findings": [{ "location": string, "description": string, "significance": "normal_variant" | "incidental" | "abnormal" | "critical", "characterisation": string }],
    "impression": string,
    "differentials": [{ "diagnosis": string, "likelihood": "possible" | "probable" | "cannot_exclude", "supportingFindings": string[], "againstFindings": string[] }],
    "recommendations": string[],
    "limitations": string[],
    "urgency": "routine" | "urgent" | "critical"
  },
  "layman": {
    "summary": string,
    "keyFindings": [{ "area": string, "plainEnglish": string, "significance": "normal" | "minor" | "significant" | "urgent", "analogy": string | null }],
    "whatThisMeans": string,
    "nextSteps": string[],
    "questionsForDoctor": string[]
  },
  "indeterminateFindings": string[],
  "criticalAlerts": string[],
  "cannotAssess": string[],
  "aiConfidenceNote": string
}`;

const XRAY_BODY = `MODALITY: Plain Radiograph (X-Ray).

X-RAY LIMITATIONS (always include relevant items in "limitations"):
- 2D projection of 3D anatomy — structures overlap.
- Low soft-tissue contrast vs CT/MRI.
- Minimum lesion size for detection ≈ 1 cm.
- Technical factors (rotation, inspiration, exposure) affect interpretation.
- Single projection — pathology requiring multiple views may be missed.

CHEST X-RAY systematic review (ABCDE):
A — Airway: trachea midline, carina angle.
B — Bones: ribs (count, fractures), clavicles, shoulder, spine.
C — Cardiac: size (CTR < 0.5), borders, shape.
D — Diaphragm: level, costophrenic angles, free air below right hemidiaphragm.
E — Everything else: lung fields by zone, hilar regions, pleura, soft tissues, foreign bodies, lines/tubes.

Lung descriptors: opacification (location/extent/air bronchograms), hyperinflation, pneumothorax (visceral pleural line), pleural effusion (CP angle blunting suggests > 200 mL).

FRACTURE descriptor: "There is a [complete/incomplete] [transverse/oblique/spiral/comminuted] fracture of the [bone] at the [location] with [angulation/displacement/shortening] of [measurement] and [open/closed] pattern."

BONE DENSITY: osteopenia vs osteoporosis is unreliable on plain film — recommend DEXA.

CRITICAL X-RAY FINDINGS — populate criticalAlerts if seen or suspected:
- Tension pneumothorax (tracheal deviation + absent lung markings)
- Free air under diaphragm (hollow viscus perforation)
- Complete traumatic fracture at a weight-bearing site
- Fracture through growth plate in a child
- Pathological fracture through lytic lesion
- Large pleural effusion with mediastinal shift`;

const REPORT_TEXT_BODY = `MODE: Scan REPORT text (the user uploaded a written radiology/scan report, not the image itself).

You are interpreting the radiologist's written report — NOT the image. Your job:
- Translate the findings into BOTH professional (preserved terminology) and patient-friendly (plain English) outputs.
- Identify critical alerts, indeterminate findings, recommended follow-ups.
- Do NOT invent findings beyond what the report states.
- If the report mentions limitations (e.g., "limited by patient motion"), surface them in "limitations".
- If the report indicates serious or urgent findings, surface them in "criticalAlerts".
- Preserve units, measurements, and side (left/right) exactly as written.`;

function buildPrompt(
  mode: "xray_image" | "report_text",
  bodyRegion: string,
  clinicalContext: string | null | undefined,
  language: string | undefined,
): string {
  const modeBody = mode === "xray_image" ? XRAY_BODY : REPORT_TEXT_BODY;
  return `${HONESTY_HEADER}

${modeBody}

BODY REGION: ${bodyRegion}
CLINICAL CONTEXT: ${clinicalContext?.trim() ? clinicalContext : "Not provided"}${languageInstruction(language)}`;
}

function fail(code: ScanAnalysisError["code"], message: string): never {
  const err = new Error(message) as Error & ScanAnalysisError;
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

export const analyzeScan = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<ScanInterpretationResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      console.error("[analyzeScan] LOVABLE_API_KEY is not configured");
      fail("API_ERROR", "AI service is not configured on the server.");
    }

    const systemPrompt = buildPrompt(
      data.type,
      data.bodyRegion,
      data.clinicalContext ?? null,
      data.language,
    );

    const userMessage =
      data.type === "report_text"
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
                text: `This is an X-Ray image. Body region: ${data.bodyRegion}. Interpret per the X-Ray protocol and return the JSON.`,
              },
            ],
          };

    // X-ray vision needs higher-fidelity model than flash; report-text uses flash for cost.
    const model =
      data.type === "xray_image"
        ? "google/gemini-2.5-pro"
        : "google/gemini-2.5-flash";

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
            model,
            temperature: 0.1,
            max_tokens: 6000,
            messages: [
              { role: "system", content: systemPrompt },
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

    if (response.status === 429)
      fail("RATE_LIMIT", "AI rate limit reached. Please wait a minute.");
    if (response.status === 402)
      fail(
        "PAYMENT_REQUIRED",
        "AI credits exhausted on this workspace. Add credits in Settings > Workspace > Usage.",
      );
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
    if (!content) fail("PARSE_ERROR", "AI returned an empty response.");

    const parsed = tryParseJson(content);
    if (!parsed || typeof parsed !== "object")
      fail("PARSE_ERROR", "We couldn't read the AI response as JSON.");

    const result = normaliseScanResult(parsed, {
      modality: data.type === "xray_image" ? "xray" : "report_text",
      bodyRegion: data.bodyRegion,
      clinicalContext: data.clinicalContext ?? null,
      language: data.language,
    });

    // Short-circuit: if image is inadequate, surface a clear error in UI rather than empty results.
    if (
      result.imageQuality === "inadequate" &&
      result.professional.findings.length === 0
    ) {
      fail(
        "INADEQUATE_IMAGE",
        result.imageQualityNote ||
          "The image quality is inadequate for reliable interpretation. Please upload a clearer scan.",
      );
    }

    return result;
  });
