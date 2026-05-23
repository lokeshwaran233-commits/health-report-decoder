/**
 * Server-side analysis endpoint.
 *
 * Day 1: typed stub.
 * Day 2: will POST to the Lovable AI Gateway with a Gemini model and
 * tool-calling, then run the response through src/lib/normalizeAnalysis.ts
 * to produce a strict AnalysisResult.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const analyzeInputSchema = z.object({
  text: z.string().min(20).max(50000),
  source: z.enum(["pdf", "image", "text", "sample"]),
});

export type AnalyzeResponse =
  | { status: "not_implemented"; message: string }
  | { status: "ok"; raw: string };

export const analyzeReport = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => analyzeInputSchema.parse(input))
  .handler(async (): Promise<AnalyzeResponse> => {
    return {
      status: "not_implemented",
      message: "Analysis pipeline ships on Day 2.",
    };
  });
