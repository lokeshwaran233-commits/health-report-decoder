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

    // Enforce entitlement quota BEFORE spending the (expensive) vision call.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { readEntitlements, recordDecode } = await import("@/lib/billing/quota.server");
    const quotaSnapshot = await readEntitlements(supabaseAdmin, context.userId);
    if (!quotaSnapshot.allowed) {
      fail(
        "QUOTA_EXCEEDED",
        quotaSnapshot.reason === "quota-hit"
          ? "You've used your free scan for this period. Upgrade your plan or add credits to continue."
          : "We couldn't verify your plan. Please refresh and try again.",
      );
    }

    // Server-side magic-byte sniff — never trust the client's declared MIME.
    if (data.type === "scan_image") {
      const { verifyImageBase64 } = await import("@/lib/security/magicBytes.server");
      const check = verifyImageBase64(data.content, data.mimeType);
      if (!check.ok) fail("API_ERROR", check.error ?? "Invalid scan upload.");
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

    // ── 12-PHASE IMAGING SAFETY PIPELINE (image modalities only) ────────────
    // Drives the user-facing verdict: defer on poor quality / anatomy mismatch /
    // safety blocks (STEMI, PE-without-contrast, ADC-dependency, etc.), strip
    // overreach flagged by the critic, and attach caveats.
    if (data.type === "scan_image") {
      try {
        const { runImagingSafetyPipeline } = await import(
          "@/lib/imagingSafety/pipeline"
        );
        const sigMap: Record<
          string,
          "normal_variant" | "incidental" | "abnormal" | "critical"
        > = {
          normal_variant: "normal_variant",
          incidental: "incidental",
          abnormal: "abnormal",
          critical: "critical",
        };
        const rawObservations = {
          findings: result.professional.findings.map((f) => ({
            label: f.description?.slice(0, 80) || f.location || "finding",
            description: f.characterisation || f.description || "",
            significance: sigMap[f.significance] ?? "abnormal",
            confidence: "MODERATE" as const,
            evidence: f.location
              ? [{ locator: f.location, description: f.description || "" }]
              : [],
          })),
          detectedRegion: data.bodyRegion,
          qualityHints: [
            result.imageQualityNote,
            ...result.cannotAssess,
          ].filter((s): s is string => Boolean(s && s.trim())),
        };

        const safety = runImagingSafetyPipeline(
          {
            modality: data.modality,
            bodyRegion: data.bodyRegion,
            imageBase64: data.content,
            mimeType: data.mimeType,
            rawObservations,
            language: data.language,
          },
          { modelChain: [model], promptText: systemPrompt },
        );

        if (safety.decision === "defer") {
          const reason = safety.deferrals[0];
          const code =
            reason?.code === "image_quality" ||
            reason?.code === "input_rejected"
              ? "INADEQUATE_IMAGE"
              : "NO_DATA_FOUND";
          try {
            const { supabaseAdmin: admin } = await import(
              "@/integrations/supabase/client.server"
            );
            await admin.from("guard_violations_log").insert({
              violation_text: `imaging-safety:${safety.audit.pipelineVersion}:defer:${reason?.code ?? "unknown"}`,
              severity: "block",
              engine_version: safety.audit.pipelineVersion,
            });
          } catch {
            /* non-blocking */
          }
          fail(
            code,
            reason?.message ||
              "This scan could not be safely interpreted. Please have a clinician review it directly.",
          );
        }

        // release / release_with_caveat — apply critic removals + caveats.
        const removedIds = new Set(safety.phases.critic.removedFindingIds);
        if (removedIds.size) {
          result.professional.findings = result.professional.findings.filter(
            (_, i) => !removedIds.has(`f${i + 1}`),
          );
        }

        const blockSafetyMsgs = safety.phases.safety
          .filter((h) => h.severity === "block")
          .map((h) => h.message);
        const warnSafetyMsgs = safety.phases.safety
          .filter((h) => h.severity === "warn")
          .map((h) => h.message);

        if (blockSafetyMsgs.length) {
          result.criticalAlerts = Array.from(
            new Set([...result.criticalAlerts, ...blockSafetyMsgs]),
          );
        }
        if (
          warnSafetyMsgs.length ||
          safety.decision === "release_with_caveat"
        ) {
          result.professional.limitations = [
            ...result.professional.limitations,
            ...warnSafetyMsgs,
            ...blockSafetyMsgs,
          ];
          const caveatPrefix =
            safety.decision === "release_with_caveat"
              ? "Released with caveat — clinician review recommended. "
              : "";
          result.aiConfidenceNote =
            `${caveatPrefix}${result.aiConfidenceNote ?? ""}`.trim();
        }
        if (safety.clinicianBrief) {
          result.professional.impression = [
            result.professional.impression,
            "",
            safety.clinicianBrief,
          ]
            .filter(Boolean)
            .join("\n");
        }
        if (safety.patientSummary && safety.decision !== "release") {
          result.layman.whatThisMeans =
            `${safety.patientSummary}\n\n${result.layman.whatThisMeans ?? ""}`.trim();
        }
      } catch (err) {
        if (err && typeof err === "object" && "code" in err) throw err;
        console.error("[analyzeScan] imaging safety pipeline error:", err);
      }
    }

    // BLOCKING safety pass on patient-facing layman text — same hallucination
    // guard the lab-report path uses. Strips definitive-diagnosis verbs,
    // drug-dose recommendations, and prohibited phrases.
    try {
      const { runHallucinationGuard } = await import(
        "@/lib/clinicalEngine/hallucinationGuard"
      );
      result.layman.summary = runHallucinationGuard(
        result.layman.summary ?? "",
      ).sanitizedText;
      result.layman.whatThisMeans = runHallucinationGuard(
        result.layman.whatThisMeans ?? "",
      ).sanitizedText;
      result.layman.keyFindings = result.layman.keyFindings.map((f) => ({
        ...f,
        plainEnglish: runHallucinationGuard(f.plainEnglish ?? "").sanitizedText,
      }));
      result.layman.nextSteps = result.layman.nextSteps.map(
        (s) => runHallucinationGuard(s).sanitizedText,
      );
    } catch (err) {
      console.error("[analyzeScan] hallucination guard skipped:", err);
    }

    // UltraGuard 9-layer audit pass (non-blocking; logs hallucination risk).
    try {
      const { guardAndAudit } = await import("@/lib/ultraguard/guardAndAudit.server");
      await guardAndAudit({
        rawLlmOutput: content,
        surface: "scan",
        userId: context.userId,
        modality: String(modality),
        bodyRegion: String(data.bodyRegion),
        contextSummary: `Scan • ${modality} • ${data.bodyRegion}`,
      });
    } catch (err) {
      console.error("[analyzeScan] UltraGuard audit skipped:", err);
    }

    // Record decode against entitlements (best-effort).
    await recordDecode(supabaseAdmin, context.userId, quotaSnapshot);

    return result;
  });
