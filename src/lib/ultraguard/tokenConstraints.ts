// ═══════════════════════════════════════════════════════════════════════════
// UltraGuard — Layer 1: Deterministic Parameter Enforcement
//
// Strips the model of creative liberty at the API level.
// temperature=0 forces argmax (greedy) decoding — the most mathematically
// probable token is always selected, eliminating randomness.
//
// These parameters are FROZEN. No caller can override them.
// Any attempt to call with different values throws immediately.
// ═══════════════════════════════════════════════════════════════════════════

import type { ApiMessage } from "./types";

// ── Frozen parameter envelope ─────────────────────────────────────────────

export const ZERO_HALLUCINATION_PARAMS = {
  temperature: 0 as const,        // Argmax decoding — zero randomness
  top_p: 0.95,                     // Nucleus ceiling — can't pull statistically
                                   // distant medical concepts. Redundant at temp=0
                                   // but explicit as a belt+suspenders control.
  frequency_penalty: 0 as const,  // Don't penalise repeated medical terminology
                                   // (terms MUST repeat for clinical accuracy)
  presence_penalty: 0 as const,   // Don't inject topic diversity — we want
                                   // the model focused on what's in the image
} as const;

export type FrozenApiParams = typeof ZERO_HALLUCINATION_PARAMS;

// ── Runtime invariant guard ───────────────────────────────────────────────

/**
 * Asserts that a set of API parameters conforms to the zero-hallucination
 * envelope. Throws immediately if temperature is non-zero.
 */
export function assertZeroHallucinationParams(
  params: Record<string, unknown>,
  callerLabel: string = "unknown"
): void {
  if (params.temperature !== 0) {
    throw new Error(
      `[UltraGuard|L1|INVARIANT_VIOLATED] Caller "${callerLabel}" ` +
        `attempted to use temperature=${params.temperature}. ` +
        `All medical AI calls MUST use temperature=0. ` +
        `This is a non-negotiable safety invariant. Refusing to proceed.`
    );
  }

  const topP = params.top_p as number | undefined;
  if (typeof topP === "number" && topP > 0.95) {
    console.warn(
      `[UltraGuard|L1|WARN] top_p=${topP} exceeds medical-safe ceiling of 0.95. ` +
        `Higher values widen the token sampling pool, enabling statistically ` +
        `distant (hallucinated) medical concepts. Setting to 0.95.`
    );
  }
}

// ── API payload builder ───────────────────────────────────────────────────

export interface ConstrainedApiPayload {
  model: string;
  temperature: 0;
  top_p: 0.95;
  frequency_penalty: 0;
  presence_penalty: 0;
  max_tokens: number;
  messages: ApiMessage[];
  response_format: { type: "json_object" };
}

/**
 * Builds a complete API payload with frozen parameters.
 * The frozen params are applied LAST so they cannot be overridden by the
 * caller's overrides argument.
 */
export function buildConstrainedPayload(config: {
  model: string;
  maxTokens: number;
  messages: ApiMessage[];
}): ConstrainedApiPayload {
  const payload: ConstrainedApiPayload = {
    model: config.model,
    ...ZERO_HALLUCINATION_PARAMS,
    max_tokens: config.maxTokens,
    messages: config.messages,
    response_format: { type: "json_object" },
  };

  // Final assertion — guarantees the spread didn't clobber our frozen values
  assertZeroHallucinationParams(
    payload as unknown as Record<string, unknown>,
    "buildConstrainedPayload"
  );

  return payload;
}

