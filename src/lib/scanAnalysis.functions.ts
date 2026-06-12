import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { normaliseScanResult } from "@/lib/normalizeScan";
import { buildScanPrompt } from "@/lib/scanPrompts";
import type {
  ImageScanModality,
  ScanAnalysisError,
  ScanInterpretationResult,
} from "@/types/scan";

// Cap base64 image payloads at ~4.5 MB to prevent token-cost abuse.
const MAX_IMAGE_B64 = 6_000_000;

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

const imageModalitySchema = z.enum([
  "xray",
  "ct",
  "mri",
  "ultrasound",
  "pet",
  "echo",
  "eeg",
  "ecg",
  "mammogram",
  "dexa",
  "angiography",
  "nuclear",
]);

const extraSchema = z
  .object({
    contrastUsed: z.boolean().nullable().optional(),
    sequences: z.string().max(500).nullable().optional(),
    ultrasoundType: z.string().max(200).nullable().optional(),
    echoType: z.string().max(200).nullable().optional(),
    isPregnant: z.boolean().nullable().optional(),
  })
  .optional();

const inputSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("report_text"),
    content: z.string().min(20).max(50000),
    bodyRegion: regionSchema,
    clinicalContext: z.string().max(2000).nullable().optional(),
    language: langSchema,
  }),
  z.object({
    type: z.literal("scan_image"),
    modality: imageModalitySchema,
    content: z.string().min(50).max(MAX_IMAGE_B64),
    mimeType: z.string().min(3).max(64),
    bodyRegion: regionSchema,
    clinicalContext: z.string().max(2000).nullable().optional(),
    language: langSchema,
    extra: extraSchema,
  }),
]);

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

function userInstructionFor(modality: ImageScanModality, bodyRegion: string): string {
  const niceName: Record<ImageScanModality, string> = {
    xray: "X-Ray",
    ct: "CT scan",
    mri: "MRI",
    ultrasound: "ultrasound",
    pet: "PET / PET-CT",
    echo: "echocardiogram",
    eeg: "EEG tracing",
    ecg: "12-lead ECG",
    mammogram: "mammogram",
    dexa: "DEXA scan",
    angiography: "angiogram",
    nuclear: "nuclear medicine study",
  };
  return `This is a ${niceName[modality]} image. Body region: ${bodyRegion}. Interpret per the modality protocol and return the JSON.`;
}

export const analyzeScan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data, context }): Promise<ScanInterpretationResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      console.error("[analyzeScan] LOVABLE_API_KEY is not configured");
      fail("API_ERROR", "AI service is not configured on the server.");
    }

    const modality =
      data.type === "scan_image" ? data.modality : "report_text";

    const systemPrompt = buildScanPrompt({
      mode: data.type,
      modality,
      bodyRegion: data.bodyRegion,
      clinicalContext: data.clinicalContext ?? null,
      language: data.language,
      extra: data.type === "scan_image" ? data.extra : undefined,
    });

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
                text: userInstructionFor(data.modality, data.bodyRegion),
              },
            ],
          };

    // Image modalities need higher-fidelity vision; report-text uses flash for cost.
    const model =
      data.type === "scan_image"
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
      modality,
      bodyRegion: data.bodyRegion,
      clinicalContext: data.clinicalContext ?? null,
      language: data.language,
    });

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

    try {
      await context.supabase.from("activity_events").insert({
        user_id: context.userId,
        feature: "scan",
        is_anonymous: false,
        meta: { modality: result.modality },
      });
    } catch (e) {
      console.error("[analyzeScan] activity log failed", e);
    }

    return result;
  });
