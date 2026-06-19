// ═══════════════════════════════════════════════════════════════════════════
// UltraGuard — Shared Type System
// Zero-hallucination pipeline for medical imaging AI.
//
// Architecture:
//   Layer 1 — Deterministic Parameter Enforcement  (tokenConstraints.ts)
//   Layer 2 — Closed-Book Prompt Architecture      (closedBookPrompts.ts)
//   Layer 3 — Multi-Agent Validator               (multiAgentValidator.ts)
//   Layer 4 — Structural Output Constraints       (structuredOutputEnforcer.ts)
//   Layer 5 — Semantic Evidence-Link Validation   (evidenceLinkValidator.ts)
//   Layer 6 — Syndrome Co-Occurrence Guard        (syndromeClusterGuard.ts)
//   Layer 7 — Cross-Finding Contradiction Detect  (contradictionDetector.ts)
//   Layer 8 — Evidence-Based Confidence Propagation (confidencePropagator.ts)
//   Layer 9 — Comprehensive Audit Trail           (auditLogger.ts)
// ═══════════════════════════════════════════════════════════════════════════

export type GuardLayer =
  | "token_constraints"
  | "closed_book_prompt"
  | "structured_output_enforcement"
  | "evidence_link_validation"
  | "syndrome_cluster_guard"
  | "semantic_entailment"
  | "contradiction_detection"
  | "confidence_propagation"
  | "multi_agent_validation"
  | "final_decision";

export type GuardSeverity = "BLOCK" | "DOWNGRADE" | "WARN" | "INFO";

export type GuardSentinel =
  | "RELEASE"              // All guards passed, findings approved
  | "RELEASE_WITH_CAVEAT"  // Findings approved with mandatory warnings
  | "INSUFFICIENT_DATA"    // Image/text lacks enough evidence to report anything safely
  | "BLOCKED";             // One or more layers issued a hard block

export type ConfidenceBand = "HIGH" | "MODERATE" | "LOW" | "INSUFFICIENT";

// ── Violations ────────────────────────────────────────────────────────────

export interface GuardViolation {
  layer: GuardLayer;
  severity: GuardSeverity;
  code: string;             // Machine-readable violation code
  message: string;          // Human-readable description
  affectedClaim?: string;   // The specific text that violated the rule
  findingId?: string;       // Which finding triggered this
  suggestedFix?: string;    // What the model should have said instead
}

// ── Findings ──────────────────────────────────────────────────────────────

export interface UltraGuardedFinding {
  id: string;
  label: string;
  description: string;
  significance: "normal_variant" | "incidental" | "abnormal" | "critical";
  confidence: ConfidenceBand;
  evidence: Array<{ locator: string; description: string }>;
  caveats: string[];
  guardApproved: boolean;
  guardRejected: boolean;
  rejectionReasons: string[];
}

export interface ConfidenceDowngrade {
  findingId: string;
  from: ConfidenceBand;
  to: ConfidenceBand;
  reason: string;
  triggeredByLayer: GuardLayer;
}

// ── Raw LLM output (Generator) ────────────────────────────────────────────

export interface RawLLMEvidence {
  locator?: string;
  description?: string;
}

export interface RawLLMFinding {
  id?: string;
  label?: string;
  description?: string;
  significance?: string;
  confidence?: string;
  evidence?: RawLLMEvidence[];
  visual_evidence_in_source?: string; // Layer 2 mandatory field
}

export interface RawLLMObservations {
  detectedRegion?: string;
  detectedView?: string;
  laterality?: string;
  qualityHints?: string[];
  insufficientData?: boolean;
  insufficientDataReason?: string;
  findings?: RawLLMFinding[];
}

// ── Validator LLM output ──────────────────────────────────────────────────

export interface ValidatorLLMOutput {
  verdict: "APPROVED" | "REJECTED" | "MODIFIED";
  approvedFindingIds: string[];
  rejectedFindingIds: string[];
  rejectionReasons: Record<string, string>;
  requiredCaveats: Record<string, string[]>;
  overallAssessment: string;
}

export interface MultiAgentVerdict {
  enabled: boolean;
  roundTrips: number;
  verdict: "APPROVED" | "REJECTED" | "MODIFIED" | "SKIPPED";
  rejectedFindingIds: string[];
  addedCaveats: Record<string, string[]>;
  validatorAssessment: string;
}

// ── Syndrome Cluster ──────────────────────────────────────────────────────

export interface SyndromeClusterDefinition {
  name: string;
  aliases: string[];
  description: string;
  // ALL of these must be evidenced to claim the syndrome
  requiredMarkers: string[];
  // At least minimumSupportingCount of these should be present
  supportingMarkers: string[];
  minimumSupportingCount: number;
  // Finding ANY of these without all required markers = spurious co-occurrence
  spuriousAssociationPairs: Array<[string, string]>;
}

export interface SyndromeClusterResult {
  syndromesClaimed: string[];
  validated: string[];
  blocked: string[];
  blockedReasons: Record<string, string>;
  spuriousPairsFound: Array<{ pair: [string, string]; reason: string }>;
}

// ── Audit ─────────────────────────────────────────────────────────────────

export interface AuditEntry {
  seq: number;
  timestamp: string;
  layer: GuardLayer;
  action: "PASS" | "BLOCK" | "DOWNGRADE" | "WARN" | "REMOVE" | "INFO";
  findingId?: string;
  detail: string;
  durationMs: number;
}

// ── Final Report ──────────────────────────────────────────────────────────

export interface UltraGuardReport {
  sentinel: GuardSentinel;
  blockedByLayer: GuardLayer | null;
  violations: GuardViolation[];
  downgrades: ConfidenceDowngrade[];
  approvedFindings: UltraGuardedFinding[];
  rejectedFindings: UltraGuardedFinding[];
  multiAgent: MultiAgentVerdict;
  syndromeCluster: SyndromeClusterResult;
  auditTrail: AuditEntry[];
  totalProcessingMs: number;
  pipelineVersion: string;
}

// ── API call helpers ──────────────────────────────────────────────────────

export interface ApiContentPart {
  type: "text" | "image_url";
  text?: string;
  image_url?: { url: string };
}

export interface ApiMessage {
  role: "system" | "user" | "assistant";
  content: string | ApiContentPart[];
}

