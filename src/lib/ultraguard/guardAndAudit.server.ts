// Server-only helper to run the UltraGuard pipeline against a raw model
// response without blocking the user-facing flow. Audit + violations are
// persisted; existing pipelines keep their current return shapes.

import { createHash } from "crypto";
import { runUltraGuard, type UltraGuardInput } from "./orchestrator";

export type UltraGuardSurface = "scan" | "lab" | "zeno";

export interface FireAndForgetInput {
  rawLlmOutput: string;
  surface: UltraGuardSurface;
  userId?: string | null;
  modality?: string;
  bodyRegion?: string;
  contextSummary?: string;
  /** Raw IP — will be sha256-hashed before persistence. */
  ip?: string | null;
  /** Pre-computed IP hash — use when you already hashed it upstream. */
  ipHash?: string | null;
  runValidator?: boolean;
}

function hashIp(ip?: string | null): string | null {
  if (!ip) return null;
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

/**
 * Runs the UltraGuard pipeline against a raw model response. Resolves once
 * the pipeline + audit insert complete. Catches every error — callers can
 * always proceed regardless of the verdict, but they can also inspect it.
 */
export async function guardAndAudit(
  input: FireAndForgetInput,
): Promise<Awaited<ReturnType<typeof runUltraGuard>> | null> {
  const params: UltraGuardInput = {
    rawLlmOutput: input.rawLlmOutput,
    surface: input.surface,
    userId: input.userId ?? null,
    ipHash: input.ipHash ?? hashIp(input.ip),
    modality: input.modality,
    bodyRegion: input.bodyRegion,
    contextSummary: input.contextSummary,
    runValidator: input.runValidator ?? false,
  };
  try {
    return await runUltraGuard(params);
  } catch (err) {
    console.error("[UltraGuard] pipeline error (non-blocking):", err);
    return null;
  }
}
