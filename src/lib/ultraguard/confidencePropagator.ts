// ═══════════════════════════════════════════════════════════════════════════
// UltraGuard — Layer 8: Evidence-Based Confidence Propagation
//
// Enforces the rule that confidence bands must be EARNED by the quality and
// quantity of evidence. The model cannot self-assign HIGH confidence.
//
// Rules:
//   HIGH    → requires ≥2 evidence entries + specific locators + no quality warnings
//   MODERATE → requires ≥1 evidence entry + specific locator
//   LOW     → ≥1 evidence entry (even vague) OR quality limitation noted
//   INSUFFICIENT → no evidence OR image quality precludes assessment
//
// Also handles significance-confidence pairing:
//   CRITICAL findings with INSUFFICIENT evidence → must add urgent clinical caveat
//   Non-critical findings with INSUFFICIENT confidence → may be dropped
// ═══════════════════════════════════════════════════════════════════════════

import type {
  UltraGuardedFinding,
  ConfidenceDowngrade,
  GuardViolation,
} from "./types";

// ── Quality hints that force downgrade ───────────────────────────────────

const IMAGE_QUALITY_DOWNGRADE_TRIGGERS: RegExp[] = [
  /low\s+(?:image\s+)?(?:quality|resolution)/i,
  /(?:motion|respiratory|patient)\s+(?:artefact|artifact|blur)/i,
  /inadequate/i,
  /suboptimal/i,
  /limited\s+(?:visualisation|visualization|view)/i,
  /(?:partially\s+)?obscured/i,
  /(?:over|under)\s*exposed/i,
  /single\s+(?:plane|view|projection)/i,
  /screenshot/i,
  /re[-\s]?encoded/i,
];

// ── Overconfident language in evidence descriptions ───────────────────────

const OVERCONFIDENT_EVIDENCE_LANGUAGE: RegExp[] = [
  /\b(clear|clearly)\s+(?:visible|seen|demonstrated|shows?)/i,
  /\b(obvious|obviously)\b/i,
  /\b(undoubtedly|unquestionably)\b/i,
  /\bno\s+doubt\b/i,
];

// ── Confidence propagation result ─────────────────────────────────────────

export interface ConfidencePropagationResult {
  violations: GuardViolation[];
  downgrades: ConfidenceDowngrade[];
  sanitizedFindings: UltraGuardedFinding[];
}

// ── Main function ─────────────────────────────────────────────────────────

export function propagateConfidence(
  findings: UltraGuardedFinding[],
  qualityHints: string[] = []
): ConfidencePropagationResult {
  const violations: GuardViolation[] = [];
  const downgrades: ConfidenceDowngrade[] = [];
  const sanitizedFindings: UltraGuardedFinding[] = [];

  // Check if there are global quality issues that force all findings to max MODERATE
  const globalQualityWarning = qualityHints.some((hint) =>
    IMAGE_QUALITY_DOWNGRADE_TRIGGERS.some((re) => re.test(hint))
  );

  for (const finding of findings) {
    let confidence = finding.confidence;
    const newCaveats = [...finding.caveats];
    const findingViolations: GuardViolation[] = [];

    const evidenceCount = finding.evidence.length;
    const hasSpecificLocators = finding.evidence.some(
      (e) => e.locator.trim().length >= 10
    );

    // ── Rule 1: HIGH confidence requirements ─────────────────────────────

    if (confidence === "HIGH") {
      const reasons: string[] = [];

      if (evidenceCount < 2) {
        reasons.push(`only ${evidenceCount} evidence entry (HIGH requires ≥2)`);
      }
      if (!hasSpecificLocators) {
        reasons.push("no anatomically specific locator");
      }
      if (globalQualityWarning) {
        reasons.push("global image quality warning present");
      }
      // Check if any evidence uses overconfident language
      const overconfidentEvidence = finding.evidence.some((e) =>
        OVERCONFIDENT_EVIDENCE_LANGUAGE.some((re) => re.test(e.description))
      );
      if (overconfidentEvidence) {
        reasons.push("evidence description uses overconfident language");
        newCaveats.push(
          "Evidence description language softened: absolute certainty cannot be claimed from imaging alone."
        );
      }

      if (reasons.length > 0) {
        const prevConf = confidence;
        confidence = "MODERATE";
        downgrades.push({
          findingId: finding.id,
          from: prevConf,
          to: "MODERATE",
          reason: `HIGH→MODERATE: ${reasons.join("; ")}`,
          triggeredByLayer: "confidence_propagation",
        });
        findingViolations.push({
          layer: "confidence_propagation",
          severity: "DOWNGRADE",
          code: "HIGH_CONFIDENCE_NOT_EARNED",
          message:
            `Finding "${finding.label}" (${finding.id}) cannot claim HIGH confidence: ${reasons.join("; ")}. ` +
            `Downgraded to MODERATE.`,
          findingId: finding.id,
        });
        newCaveats.push(
          `Confidence downgraded HIGH→MODERATE: ${reasons.join("; ")}.`
        );
      }
    }

    // ── Rule 2: MODERATE confidence requirements ──────────────────────────

    if (confidence === "MODERATE") {
      const reasons: string[] = [];

      if (evidenceCount < 1) {
        reasons.push("zero evidence entries");
      }
      if (globalQualityWarning) {
        reasons.push("global image quality issue");
      }

      if (reasons.length > 0) {
        const prevConf = confidence;
        confidence = "LOW";
        downgrades.push({
          findingId: finding.id,
          from: prevConf,
          to: "LOW",
          reason: `MODERATE→LOW: ${reasons.join("; ")}`,
          triggeredByLayer: "confidence_propagation",
        });
        findingViolations.push({
          layer: "confidence_propagation",
          severity: "DOWNGRADE",
          code: "MODERATE_CONFIDENCE_NOT_EARNED",
          message:
            `Finding "${finding.label}" (${finding.id}): MODERATE confidence not supported. ` +
            `${reasons.join("; ")}. Downgraded to LOW.`,
          findingId: finding.id,
        });
        newCaveats.push(
          `Confidence downgraded MODERATE→LOW: ${reasons.join("; ")}.`
        );
      }
    }

    // ── Rule 3: Significance-confidence safety pairing ────────────────────

    if (finding.significance === "critical") {
      // Critical findings with low/insufficient evidence are the most dangerous scenarios
      if (confidence === "LOW" || confidence === "INSUFFICIENT") {
        findingViolations.push({
          layer: "confidence_propagation",
          severity: "WARN",
          code: "CRITICAL_FINDING_LOW_EVIDENCE",
          message:
            `CRITICAL finding "${finding.label}" has ${confidence} confidence. ` +
            `This combination is clinically dangerous — patient may underweight a critical observation. ` +
            `Mandatory: add explicit clinical escalation caveat.`,
          findingId: finding.id,
        });
        newCaveats.push(
          `⚠ URGENT: This is classified as a potentially CRITICAL finding despite ${confidence} AI confidence. ` +
            `Do NOT dismiss this finding due to low AI confidence. ` +
            `Critical findings MUST be evaluated by a clinician regardless of AI certainty.`
        );
      }
    }

    // ── Rule 4: INSUFFICIENT findings (non-critical) ──────────────────────

    if (confidence === "INSUFFICIENT" && finding.significance !== "critical") {
      findingViolations.push({
        layer: "confidence_propagation",
        severity: "WARN",
        code: "INSUFFICIENT_CONFIDENCE_NON_CRITICAL",
        message:
          `Non-critical finding "${finding.label}" has INSUFFICIENT confidence. ` +
          `Consider whether this should be listed as "cannot assess" rather than a finding.`,
        findingId: finding.id,
        suggestedFix: "Move to cannotAssess array rather than findings.",
      });
      newCaveats.push(
        `This observation has INSUFFICIENT image evidence. It is noted only for completeness ` +
          `and requires formal clinical and imaging evaluation before any clinical weight is given.`
      );
    }

    // ── Rule 5: Evidence descriptions must not use overconfident language ──

    const sanitizedEvidence = finding.evidence.map((e) => {
      let desc = e.description;
      for (const re of OVERCONFIDENT_EVIDENCE_LANGUAGE) {
        desc = desc.replace(re, (match) => `[possibly] ${match.replace(re, "").trim()}`);
      }
      return { ...e, description: desc };
    });

    violations.push(...findingViolations);

    sanitizedFindings.push({
      ...finding,
      confidence,
      evidence: sanitizedEvidence,
      caveats: newCaveats,
    });
  }

  return { violations, downgrades, sanitizedFindings };
}
