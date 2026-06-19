// ═══════════════════════════════════════════════════════════════════════════
// UltraGuard — Pipeline Orchestrator
//
// Runs the full 9-layer pipeline against a raw LLM JSON response and returns
// a single UltraGuardReport with a sentinel verdict.
//
// Flow:
//   Layer 4 → 5 → 6 → 7 → 8  (sync, deterministic)
//   Layer 3 (optional async validator pass)
//   Layer 9 (best-effort audit persistence)
//
// Designed to be called from a server function or server route. Does not
// import any browser-only code. The audit logger import lives in a separate
// `.server.ts` file and is loaded lazily so this module can also be used in
// a non-persistent dry-run mode.
// ═══════════════════════════════════════════════════════════════════════════

import { propagateConfidence } from "./confidencePropagator";
import { detectContradictions } from "./contradictionDetector";
import { validateEvidenceLinks } from "./evidenceLinkValidator";
import {
  enforceStructuredOutput,
  normalizeToUltraGuardedFindings,
} from "./structuredOutputEnforcer";
import { runSyndromeClusterGuard } from "./syndromeClusterGuard";
import { runMultiAgentValidator } from "./multiAgentValidator";
import type {
  AuditEntry,
  GuardLayer,
  GuardSentinel,
  GuardViolation,
  UltraGuardReport,
  UltraGuardedFinding,
} from "./types";

export const ULTRAGUARD_VERSION = "1.0.0";

export interface UltraGuardInput {
  /** Raw model output (must be JSON per Layer 4 enforcement). */
  rawLlmOutput: string;
  /** Short summary of the input context for the validator (e.g. "Chest CT, axial"). */
  contextSummary?: string;
  /** Modality label for the validator prompt. */
  modality?: string;
  /** Body region label for the validator prompt. */
  bodyRegion?: string;
  /** Whether to run the second-pass validator LLM. Defaults to false. */
  runValidator?: boolean;
  /** Validator LLM model (override default). */
  validatorModel?: string;
  /** Surface this run belongs to — used by the audit logger. */
  surface?: "scan" | "lab" | "zeno";
  /** Owner of the run (for RLS). Null/undefined = anonymous. */
  userId?: string | null;
  /** Hash of the caller's IP (for anonymous quota correlation). */
  ipHash?: string | null;
  /** Skip audit logging (useful for tests / dry runs). */
  skipAudit?: boolean;
}

function decideSentinel(
  violations: GuardViolation[],
  approvedCount: number,
  declaredInsufficientData: boolean,
): { sentinel: GuardSentinel; blockedByLayer: GuardLayer | null } {
  const blockingViolation = violations.find((v) => v.severity === "BLOCK");
  if (blockingViolation) {
    return { sentinel: "BLOCKED", blockedByLayer: blockingViolation.layer };
  }
  if (declaredInsufficientData || approvedCount === 0) {
    return { sentinel: "INSUFFICIENT_DATA", blockedByLayer: null };
  }
  const hasCaveat =
    violations.some((v) => v.severity === "DOWNGRADE" || v.severity === "WARN");
  return {
    sentinel: hasCaveat ? "RELEASE_WITH_CAVEAT" : "RELEASE",
    blockedByLayer: null,
  };
}

export async function runUltraGuard(input: UltraGuardInput): Promise<UltraGuardReport> {
  const t0 = Date.now();
  const audit: AuditEntry[] = [];
  let seq = 0;
  const log = (
    layer: GuardLayer,
    action: AuditEntry["action"],
    detail: string,
    startedAt: number,
    findingId?: string,
  ) => {
    seq += 1;
    audit.push({
      seq,
      timestamp: new Date().toISOString(),
      layer,
      action,
      findingId,
      detail,
      durationMs: Date.now() - startedAt,
    });
  };

  const allViolations: GuardViolation[] = [];
  const allDowngrades: UltraGuardReport["downgrades"] = [];

  // ── Layer 4: Structured Output Enforcement ──────────────────────────────
  const tL4 = Date.now();
  const schemaResult = enforceStructuredOutput(input.rawLlmOutput);
  allViolations.push(...schemaResult.schemaViolations);
  log(
    "structured_output_enforcement",
    schemaResult.valid ? "PASS" : "BLOCK",
    schemaResult.valid
      ? `parsed ${schemaResult.normalizedFindings.length} findings`
      : `schema invalid: ${schemaResult.schemaViolations.length} violations`,
    tL4,
  );

  let findings: UltraGuardedFinding[] = normalizeToUltraGuardedFindings(
    schemaResult.normalizedFindings,
  );

  // If Layer 4 already blocked, short-circuit but still build an audit-ready report.
  let qualityHints: string[] = schemaResult.parsedObservations?.qualityHints ?? [];

  if (schemaResult.valid && findings.length > 0) {
    // ── Layer 5: Evidence-Link Validation ────────────────────────────────
    const tL5 = Date.now();
    const evidenceRes = validateEvidenceLinks(findings);
    allViolations.push(...evidenceRes.violations);
    allDowngrades.push(...evidenceRes.downgrades);
    findings = evidenceRes.sanitizedFindings;
    log(
      "evidence_link_validation",
      evidenceRes.violations.length ? "DOWNGRADE" : "PASS",
      `${evidenceRes.violations.length} violations, ${evidenceRes.downgrades.length} downgrades`,
      tL5,
    );

    // ── Layer 6: Syndrome Cluster Guard ──────────────────────────────────
    const tL6 = Date.now();
    const syndromeRes = runSyndromeClusterGuard(findings);
    allViolations.push(...syndromeRes.violations);
    findings = syndromeRes.sanitizedFindings;
    log(
      "syndrome_cluster_guard",
      syndromeRes.violations.length ? "WARN" : "PASS",
      `claimed=${syndromeRes.syndromeClusterResult.syndromesClaimed.length}, blocked=${syndromeRes.syndromeClusterResult.blocked.length}`,
      tL6,
    );

    // ── Layer 7: Contradiction Detection ─────────────────────────────────
    const tL7 = Date.now();
    const contradictionRes = detectContradictions(findings);
    allViolations.push(...contradictionRes.violations);
    findings = contradictionRes.sanitizedFindings;
    log(
      "contradiction_detection",
      contradictionRes.violations.length ? "WARN" : "PASS",
      `${contradictionRes.contradictionsFound} contradictions`,
      tL7,
    );

    // ── Layer 8: Confidence Propagation ──────────────────────────────────
    const tL8 = Date.now();
    const confidenceRes = propagateConfidence(findings, qualityHints);
    allViolations.push(...confidenceRes.violations);
    allDowngrades.push(...confidenceRes.downgrades);
    findings = confidenceRes.sanitizedFindings;
    log(
      "confidence_propagation",
      confidenceRes.downgrades.length ? "DOWNGRADE" : "PASS",
      `${confidenceRes.downgrades.length} downgrades`,
      tL8,
    );
  }

  // ── Layer 3: Multi-Agent Validator (optional) ───────────────────────────
  let multiAgentVerdict: UltraGuardReport["multiAgent"] = {
    enabled: false,
    roundTrips: 0,
    verdict: "SKIPPED",
    rejectedFindingIds: [],
    addedCaveats: {},
    validatorAssessment: "validator pass disabled",
  };

  if (input.runValidator && findings.length > 0) {
    const tL3 = Date.now();
    const validatorRes = await runMultiAgentValidator({
      findings,
      generatorOutput: input.rawLlmOutput,
      modality: input.modality ?? "unknown",
      bodyRegion: input.bodyRegion ?? "systemic",
      model: input.validatorModel,
    });
    allViolations.push(...validatorRes.violations);
    findings = validatorRes.sanitizedFindings;
    multiAgentVerdict = validatorRes.verdict;
    log(
      "multi_agent_validation",
      validatorRes.verdict.verdict === "REJECTED" ? "BLOCK" : "INFO",
      `verdict=${validatorRes.verdict.verdict}, rejected=${validatorRes.verdict.rejectedFindingIds.length}`,
      tL3,
    );
  }

  // ── Layer 6 cluster result for the report ──────────────────────────────
  const clusterReport = findings.length
    ? runSyndromeClusterGuard(findings).syndromeClusterResult
    : {
        syndromesClaimed: [],
        validated: [],
        blocked: [],
        blockedReasons: {},
        spuriousPairsFound: [],
      };

  const approvedFindings = findings.filter((f) => !f.guardRejected);
  const rejectedFindings = findings.filter((f) => f.guardRejected);

  const { sentinel, blockedByLayer } = decideSentinel(
    allViolations,
    approvedFindings.length,
    schemaResult.declaredInsufficientData,
  );

  log("final_decision", sentinel === "BLOCKED" ? "BLOCK" : "PASS", sentinel, t0);

  const report: UltraGuardReport = {
    sentinel,
    blockedByLayer,
    violations: allViolations,
    downgrades: allDowngrades,
    approvedFindings,
    rejectedFindings,
    multiAgent: multiAgentVerdict,
    syndromeCluster: clusterReport,
    auditTrail: audit,
    totalProcessingMs: Date.now() - t0,
    pipelineVersion: ULTRAGUARD_VERSION,
  };

  if (!input.skipAudit) {
    try {
      const { persistAuditTrail } = await import("./auditLogger.server");
      await persistAuditTrail({
        surface: input.surface ?? "scan",
        userId: input.userId ?? null,
        ipHash: input.ipHash ?? null,
        report,
        contextSummary: input.contextSummary,
      });
    } catch (err) {
      // Audit failure must not affect the response.
      console.error("[UltraGuard] audit persistence skipped:", err);
    }
  }

  return report;
}
