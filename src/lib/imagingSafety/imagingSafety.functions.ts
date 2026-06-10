import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { runImagingSafetyPipeline } from "./pipeline";
import type { FinalSafetyReport, SafetyPipelineInput } from "./types";

const MAX_IMAGE_B64 = 6_000_000;

const modality = z.enum([
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
const region = z.enum([
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

const inputSchema = z.object({
  modality,
  bodyRegion: region,
  imageBase64: z.string().min(50).max(MAX_IMAGE_B64).optional(),
  mimeType: z.string().min(3).max(64).optional(),
  language: z.enum(["en", "ta", "hi", "te"]).optional(),
});

const SYSTEM_PROMPT = `You are a cautious medical imaging assistant. Return ONLY valid JSON matching this schema:
{
  "detectedRegion": "<region or unknown>",
  "detectedView": "<view or null>",
  "laterality": "left|right|midline|unknown|null",
  "qualityHints": ["<string>", ...],
  "findings": [{
    "label": "<short clinical label>",
    "description": "<one sentence, plain language, no diagnosis verbs, no doses>",
    "significance": "normal_variant|incidental|abnormal|critical",
    "confidence": "HIGH|MODERATE|LOW|INSUFFICIENT",
    "evidence": [{"locator": "<where in image>", "description": "<what you see>"}]
  }]
}
Rules:
- Every finding MUST include at least one evidence entry with a real locator.
- Never use "definitely", "confirms", "diagnosed with", or specific drug doses.
- If image quality is too poor, return findings: [] and put reasons in qualityHints.`;

interface RawObs {
  detectedRegion?: string;
  detectedView?: string;
  laterality?: string;
  qualityHints?: string[];
  findings?: SafetyPipelineInput["rawObservations"] extends infer T
    ? T extends { findings?: infer F }
      ? F
      : never
    : never;
}

function tryParseJson(raw: string): RawObs | null {
  try {
    return JSON.parse(raw) as RawObs;
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]) as RawObs;
    } catch {
      return null;
    }
  }
}

export const analyzeScanSafe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => inputSchema.parse(d))
  .handler(async ({ data }): Promise<FinalSafetyReport> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    let rawObservations: SafetyPipelineInput["rawObservations"] | undefined;
    const modelChain: string[] = [];

    if (apiKey && data.imageBase64 && data.mimeType) {
      modelChain.push("google/gemini-2.5-pro");
      try {
        const resp = await fetch(
          "https://ai.gateway.lovable.dev/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-pro",
              temperature: 0,
              max_tokens: 3000,
              messages: [
                { role: "system", content: SYSTEM_PROMPT },
                {
                  role: "user",
                  content: [
                    {
                      type: "image_url",
                      image_url: {
                        url: `data:${data.mimeType};base64,${data.imageBase64}`,
                      },
                    },
                    {
                      type: "text",
                      text: `Modality: ${data.modality}. Expected region: ${data.bodyRegion}. Return JSON only.`,
                    },
                  ],
                },
              ],
            }),
          },
        );
        if (resp.ok) {
          const json = (await resp.json()) as {
            choices?: { message?: { content?: string } }[];
          };
          const txt = json.choices?.[0]?.message?.content ?? "";
          const parsed = tryParseJson(txt);
          if (parsed) {
            rawObservations = {
              detectedRegion: parsed.detectedRegion,
              detectedView: parsed.detectedView,
              laterality: parsed.laterality,
              qualityHints: parsed.qualityHints,
              findings: parsed.findings,
            };
          }
        } else {
          console.warn("[analyzeScanSafe] gateway returned", resp.status);
        }
      } catch (e) {
        console.warn("[analyzeScanSafe] gateway error", e);
      }
    }

    const report = runImagingSafetyPipeline(
      {
        modality: data.modality,
        bodyRegion: data.bodyRegion,
        imageBase64: data.imageBase64,
        mimeType: data.mimeType,
        rawObservations,
        language: data.language,
      },
      { modelChain, promptText: SYSTEM_PROMPT },
    );

    // Phase 12 audit — best-effort write to existing log table.
    try {
      const { supabaseAdmin } = await import(
        "@/integrations/supabase/client.server"
      );
      await supabaseAdmin.from("guard_violations_log").insert({
        text: `imaging-safety:${report.audit.pipelineVersion}:${report.decision}`,
        severity: report.decision === "defer" ? "block" : "info",
      });
    } catch (e) {
      console.warn("[analyzeScanSafe] audit write skipped", e);
    }

    return report;
  });
