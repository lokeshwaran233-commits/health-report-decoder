// ═══════════════════════════════════════════════════════════════════════════
// UltraGuard — Layer 4: Structured Output Enforcement
//
// Forces the model output into a strict, validated JSON schema.
// When models write in prose they drift into "storytelling" which leads
// to hallucinations. Forcing structured JSON with typed fields breaks
// this drift.
//
// Key insight: By forcing the model to populate BOTH "label" AND
// "visual_evidence_in_source", we break the hallucination chain before
// it starts. A model cannot fill that field without grounding the claim.
// ═══════════════════════════════════════════════════════════════════════════

import { z } from "zod";
import type {
  RawLLMFinding,
  RawLLMObservations,
  UltraGuardedFinding,
  GuardViolation,
} from "./types";

// ── Zod Schema ────────────────────────────────────────────────────────────

const EvidenceSchema = z.object({
  locator: z.string().min(3, "Evidence locator too vague — must specify location"),
  description: z.string().min(5, "Evidence description too brief"),
});

const FindingSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(3).max(120),
  description: z.string().min(10).max(800),
  significance: z.enum(["normal_variant", "incidental", "abnormal", "critical"]),
  confidence: z.enum(["HIGH", "MODERATE", "LOW", "INSUFFICIENT"]),
  evidence: z
    .array(EvidenceSchema)
    .min(0) // We enforce minimum separately based on significance
    .max(10),
  visual_evidence_in_source: z.string().optional(),
});

const ObservationsSchema = z.object({
  detectedRegion: z.string().optional(),
  detectedView: z.string().nullable().optional(),
  laterality: z.string().nullable().optional(),
  qualityHints: z.array(z.string()).optional(),
  insufficientData: z.boolean().optional(),
  insufficientDataReason: z.string().nullable().optional(),
  findings: z.array(FindingSchema).optional(),
});

// ── Validation Result ─────────────────────────────────────────────────────

export interface SchemaEnforcementResult {
  valid: boolean;
  parsedObservations: RawLLMObservations | null;
  schemaViolations: GuardViolation[];
  normalizedFindings: RawLLMFinding[];
  declaredInsufficientData: boolean;
  insufficientDataReason: string | null;
}

// ── Parsing helper ────────────────────────────────────────────────────────

function tryParseJson(raw: string): unknown | null {
  // Attempt 1: direct parse
  try {
    return JSON.parse(raw);
  } catch {
    // noop
  }
  // Attempt 2: extract first JSON object (strip markdown fences)
  const stripped = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  try {
    return JSON.parse(stripped);
  } catch {
    // noop
  }
  // Attempt 3: extract JSON block
  const m = raw.match(/\{[\s\S]*\}/);
  if (m) {
    try {
      return JSON.parse(m[0]);
    } catch {
      // noop
    }
  }
  return null;
}

// ── Core enforcement function ─────────────────────────────────────────────

/**
 * Validates and normalises raw LLM output against the required JSON schema.
 * Returns structured violations that feed into the guard pipeline.
 */
export function enforceStructuredOutput(
  rawLlmOutput: string
): SchemaEnforcementResult {
  const violations: GuardViolation[] = [];

  // Step 1: JSON parse
  const parsed = tryParseJson(rawLlmOutput);
  if (!parsed) {
    return {
      valid: false,
      parsedObservations: null,
      schemaViolations: [
        {
          layer: "structured_output_enforcement",
          severity: "BLOCK",
          code: "JSON_PARSE_FAILURE",
          message:
            "LLM returned non-JSON output. Medical imaging findings MUST be in strict JSON. " +
            "Free-text prose is rejected — it enables hallucination drift.",
          affectedClaim: rawLlmOutput.slice(0, 200),
        },
      ],
      normalizedFindings: [],
      declaredInsufficientData: false,
      insufficientDataReason: null,
    };
  }

  // Step 2: Zod schema validation
  const result = ObservationsSchema.safeParse(parsed);
  if (!result.success) {
    result.error.issues.forEach((issue) => {
      violations.push({
        layer: "structured_output_enforcement",
        severity: "WARN",
        code: `SCHEMA_VIOLATION_${issue.code.toUpperCase()}`,
        message: `Schema violation at ${issue.path.join(".")}: ${issue.message}`,
      });
    });
  }

  const obs = result.success
    ? (result.data as RawLLMObservations)
    : (parsed as RawLLMObservations);

  // Step 3: Per-finding structural checks
  const rawFindings = obs.findings ?? [];
  const normalizedFindings: RawLLMFinding[] = [];

  rawFindings.forEach((finding, idx) => {
    const fid = finding.id ?? `f${idx + 1}`;

    // 3a: Empty evidence check
    if (!finding.evidence || finding.evidence.length === 0) {
      violations.push({
        layer: "structured_output_enforcement",
        severity: "BLOCK",
        code: "FINDING_MISSING_EVIDENCE",
        message:
          `Finding "${finding.label ?? fid}" has ZERO evidence entries. ` +
          `The chain-of-evidence protocol requires at least one locator+description pair. ` +
          `A label without evidence is a hallucination by definition.`,
        findingId: fid,
        suggestedFix: 'Add at least one evidence entry with "locator" and "description"',
      });
    }

    // 3b: Empty visual_evidence_in_source check
    if (
      !finding.visual_evidence_in_source ||
      finding.visual_evidence_in_source.trim().length < 10
    ) {
      violations.push({
        layer: "structured_output_enforcement",
        severity: "BLOCK",
        code: "MISSING_VISUAL_EVIDENCE_FIELD",
        message:
          `Finding "${finding.label ?? fid}" is missing "visual_evidence_in_source". ` +
          `This field is mandatory. It is the chain-break prevention field: ` +
          `the model MUST describe what it sees before naming a pathology.`,
        findingId: fid,
      });
    }

    // 3c: Vague locator check
    const hasVagueLocators = finding.evidence?.some(
      (e) =>
        (e.locator ?? "").trim().length < 5 ||
        /^(the image|seen|visible|present|noted|found)$/i.test(
          (e.locator ?? "").trim()
        )
    );
    if (hasVagueLocators) {
      violations.push({
        layer: "structured_output_enforcement",
        severity: "WARN",
        code: "VAGUE_EVIDENCE_LOCATOR",
        message:
          `Finding "${finding.label ?? fid}" has a vague evidence locator. ` +
          `Locators must be anatomically specific (e.g. 'Right lower lobe, posterior segment, axial slice ~34').`,
        findingId: fid,
      });
    }

    // 3d: HIGH confidence with single evidence entry
    if (finding.confidence === "HIGH" && (finding.evidence?.length ?? 0) <= 1) {
      violations.push({
        layer: "structured_output_enforcement",
        severity: "WARN",
        code: "HIGH_CONFIDENCE_SINGLE_EVIDENCE",
        message:
          `Finding "${finding.label ?? fid}" claims HIGH confidence but has only ${finding.evidence?.length ?? 0} evidence entry. ` +
          `HIGH confidence requires multi-plane or multi-evidence grounding.`,
        findingId: fid,
        suggestedFix: "Downgrade to MODERATE or add additional evidence entries",
      });
    }

    // Normalise the finding
    normalizedFindings.push({
      ...finding,
      id: fid,
    });
  });

  // Step 4: Detect insufficientData declaration
  const declaredInsufficientData = obs.insufficientData === true;
  const insufficientDataReason = obs.insufficientDataReason ?? null;

  // If the model declared insufficient data but also returned findings, that's contradictory
  if (declaredInsufficientData && rawFindings.length > 0) {
    violations.push({
      layer: "structured_output_enforcement",
      severity: "WARN",
      code: "CONTRADICTION_INSUFFICIENT_DATA_WITH_FINDINGS",
      message:
        "Model declared insufficientData=true but also returned findings. " +
        "These are contradictory. Treating as insufficient data and dropping all findings.",
    });
  }

  const hasBlocks = violations.some((v) => v.severity === "BLOCK");

  return {
    valid: !hasBlocks,
    parsedObservations: obs,
    schemaViolations: violations,
    normalizedFindings: declaredInsufficientData ? [] : normalizedFindings,
    declaredInsufficientData,
    insufficientDataReason,
  };
}

// ── Convert raw findings to UltraGuarded format ───────────────────────────

export function normalizeToUltraGuardedFindings(
  rawFindings: RawLLMFinding[]
): UltraGuardedFinding[] {
  return rawFindings.map((f, idx): UltraGuardedFinding => {
    const id = f.id ?? `f${idx + 1}`;
    const significance = ["normal_variant", "incidental", "abnormal", "critical"].includes(
      f.significance ?? ""
    )
      ? (f.significance as UltraGuardedFinding["significance"])
      : "abnormal";

    const confidence = ["HIGH", "MODERATE", "LOW", "INSUFFICIENT"].includes(
      f.confidence ?? ""
    )
      ? (f.confidence as UltraGuardedFinding["confidence"])
      : "LOW";

    return {
      id,
      label: (f.label ?? "Unlabelled finding").slice(0, 120),
      description: (f.description ?? "").slice(0, 800),
      significance,
      confidence,
      evidence: (f.evidence ?? [])
        .filter((e) => (e.locator ?? "").trim().length > 0)
        .map((e) => ({
          locator: (e.locator ?? "").trim(),
          description: (e.description ?? "").trim(),
        })),
      caveats: [],
      guardApproved: false, // Set by later layers
      guardRejected: false,
      rejectionReasons: [],
    };
  });
}

