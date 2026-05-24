import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { normalizeAnalysisResult } from "@/lib/normalizeAnalysis";
import type { AnalysisError, AnalysisResult } from "@/types/report";

const inputSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("text"),
    content: z.string().min(20).max(50000),
  }),
  z.object({
    type: z.literal("image"),
    content: z.string().min(50),
    mimeType: z.string().min(3).max(64),
  }),
]);

const SYSTEM_PROMPT = `You are a clinical lab report analyzer with expertise in biochemistry and haematology. Your job is to extract all biomarker values from a medical lab report and return structured JSON analysis.

CRITICAL RULES:
- Extract ONLY values explicitly stated in the report. Never invent values.
- Reference ranges must come from the report itself. If not stated, use standard clinical guidelines.
- Status logic: 'normal' = value within reference range. 'watch' = within 10% outside range. 'flagged' = more than 10% outside range or clinically significant.
- plainEnglish must be one warm, non-alarmist sentence written for a non-medical person.
- deepExplanation must be 2-3 sentences explaining biological significance.
- summary must be 3-4 paragraphs separated by double newlines: what's going well, what needs attention, any inter-related findings.
- doctorQuestions must be specific and intelligent — not generic. Reference actual values.
- Return ONLY valid JSON. No markdown. No preamble. No explanation outside the JSON.

Return this exact structure:
{
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
      "category": "blood" | "liver" | "kidney" | "thyroid" | "metabolic" | "vitamin" | "other",
      "plainEnglish": string,
      "deepExplanation": string
    }
  ],
  "summary": string,
  "doctorQuestions": string[]
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
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<AnalysisResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      fail("API_ERROR", "AI service is not configured. Please try again later.");
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
            max_tokens: 4000,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
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
    return normalized;
  });
