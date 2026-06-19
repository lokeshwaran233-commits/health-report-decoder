// ═══════════════════════════════════════════════════════════════════════════
// UltraGuard — Layer 3: Multi-Agent Validator
//
// Runs a second LLM pass over the generator's findings using the adversarial
// validator system prompt (Layer 2). The validator's job is to actively look
// for ungrounded claims, knowledge injection, syndrome extrapolation, and
// confidence inflation.
//
// Server-only. Uses the Lovable AI Gateway via fetch (no SDK at module scope
// so this file is safe to import from server-function modules).
// ═══════════════════════════════════════════════════════════════════════════

import {
  buildValidatorSystemPrompt,
  buildValidatorUserMessage,
} from "./closedBookPrompts";
import { buildConstrainedPayload } from "./tokenConstraints";
import type {
  GuardViolation,
  MultiAgentVerdict,
  UltraGuardedFinding,
  ValidatorLLMOutput,
} from "./types";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-3-flash-preview";

export interface MultiAgentInput {
  findings: UltraGuardedFinding[];
  /** Raw generator JSON to hand to the validator. */
  generatorOutput: string;
  /** Modality label (e.g. "chest_xray", "lab_report", "zeno_chat"). */
  modality: string;
  /** Body region or "systemic" / "n/a". */
  bodyRegion: string;
  model?: string;
  apiKey?: string;
}

export interface MultiAgentResult {
  verdict: MultiAgentVerdict;
  violations: GuardViolation[];
  sanitizedFindings: UltraGuardedFinding[];
}

function emptyVerdict(reason: string): MultiAgentVerdict {
  return {
    enabled: false,
    roundTrips: 0,
    verdict: "SKIPPED",
    rejectedFindingIds: [],
    addedCaveats: {},
    validatorAssessment: reason,
  };
}

function tryParseValidatorOutput(raw: string): ValidatorLLMOutput | null {
  try {
    const trimmed = raw.trim().replace(/^```json\s*|\s*```$/g, "");
    const parsed = JSON.parse(trimmed) as Partial<ValidatorLLMOutput>;
    if (!parsed.verdict) return null;
    return {
      verdict: parsed.verdict,
      approvedFindingIds: parsed.approvedFindingIds ?? [],
      rejectedFindingIds: parsed.rejectedFindingIds ?? [],
      rejectionReasons: parsed.rejectionReasons ?? {},
      requiredCaveats: parsed.requiredCaveats ?? {},
      overallAssessment: parsed.overallAssessment ?? "",
    };
  } catch {
    return null;
  }
}

export async function runMultiAgentValidator(
  input: MultiAgentInput,
): Promise<MultiAgentResult> {
  const apiKey = input.apiKey ?? process.env.LOVABLE_API_KEY;
  if (!apiKey) {
    return {
      verdict: emptyVerdict("LOVABLE_API_KEY missing; validator skipped"),
      violations: [],
      sanitizedFindings: input.findings,
    };
  }

  if (input.findings.length === 0) {
    return {
      verdict: emptyVerdict("no findings to validate"),
      violations: [],
      sanitizedFindings: input.findings,
    };
  }

  const payload = buildConstrainedPayload({
    model: input.model ?? DEFAULT_MODEL,
    maxTokens: 1024,
    messages: [
      { role: "system", content: buildValidatorSystemPrompt() },
      {
        role: "user",
        content: buildValidatorUserMessage(
          input.generatorOutput,
          // SafetyModality / BodyRegion are narrow string unions — the validator
          // only embeds them as text, so we widen at the boundary.
          input.modality as never,
          input.bodyRegion as never,
        ),
      },
    ],
  });


  let response: Response;
  try {
    response = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    return {
      verdict: emptyVerdict(
        `validator transport error: ${err instanceof Error ? err.message : "unknown"}`,
      ),
      violations: [],
      sanitizedFindings: input.findings,
    };
  }

  if (!response.ok) {
    return {
      verdict: emptyVerdict(`validator HTTP ${response.status}`),
      violations: [],
      sanitizedFindings: input.findings,
    };
  }

  type GatewayResponse = { choices?: Array<{ message?: { content?: string } }> };
  const json = (await response.json()) as GatewayResponse;
  const content = json.choices?.[0]?.message?.content ?? "";
  const parsed = tryParseValidatorOutput(content);

  if (!parsed) {
    return {
      verdict: emptyVerdict("validator returned non-JSON output"),
      violations: [
        {
          layer: "multi_agent_validation",
          severity: "WARN",
          code: "VALIDATOR_PARSE_FAILURE",
          message: "Validator LLM output could not be parsed; verdict skipped.",
        },
      ],
      sanitizedFindings: input.findings,
    };
  }

  const rejectedIds = new Set(parsed.rejectedFindingIds);
  const violations: GuardViolation[] = [];
  const sanitizedFindings: UltraGuardedFinding[] = input.findings.map((f) => {
    const addedCaveats = parsed.requiredCaveats[f.id] ?? [];
    if (rejectedIds.has(f.id)) {
      const reason = parsed.rejectionReasons[f.id] ?? "validator rejection";
      violations.push({
        layer: "multi_agent_validation",
        severity: "DOWNGRADE",
        code: "VALIDATOR_REJECTED_FINDING",
        message: `Validator rejected "${f.label}" (${f.id}): ${reason}`,
        findingId: f.id,
      });
      return {
        ...f,
        guardRejected: true,
        rejectionReasons: [...f.rejectionReasons, `validator: ${reason}`],
        caveats: [...f.caveats, ...addedCaveats],
      };
    }
    return addedCaveats.length
      ? { ...f, caveats: [...f.caveats, ...addedCaveats] }
      : f;
  });

  return {
    verdict: {
      enabled: true,
      roundTrips: 1,
      verdict: parsed.verdict,
      rejectedFindingIds: parsed.rejectedFindingIds,
      addedCaveats: parsed.requiredCaveats,
      validatorAssessment: parsed.overallAssessment,
    },
    violations,
    sanitizedFindings,
  };
}
