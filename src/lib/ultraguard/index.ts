// UltraGuard — public API.
// Browser-safe re-exports only. Server-only modules (auditLogger.server) must
// be imported directly from the consuming server function.

export * from "./types";
export {
  ZERO_HALLUCINATION_PARAMS,
  assertZeroHallucinationParams,
  buildConstrainedPayload,
} from "./tokenConstraints";
export {
  buildGeneratorSystemPrompt,
  buildValidatorSystemPrompt,
  buildValidatorUserMessage,
} from "./closedBookPrompts";
export {
  enforceStructuredOutput,
  normalizeToUltraGuardedFindings,
} from "./structuredOutputEnforcer";
export { validateEvidenceLinks } from "./evidenceLinkValidator";
export { runSyndromeClusterGuard } from "./syndromeClusterGuard";
export { detectContradictions } from "./contradictionDetector";
export { propagateConfidence } from "./confidencePropagator";
export { runMultiAgentValidator } from "./multiAgentValidator";
export { runUltraGuard, ULTRAGUARD_VERSION } from "./orchestrator";
