// ═══════════════════════════════════════════════════════════════════════════
// UltraGuard — Layer 5: Evidence-Link Validator
//
// Every clinical claim MUST be traceable to a specific, non-vague
// locator in the image. This layer enforces that chain.
//
// Key principle: If a finding cannot name WHERE in the image it was seen,
// it cannot be trusted. This is the radiologist's prime directive: 
// every report observation must reference anatomy, not inference.
//
// Also enforces: temporal claim detection, bilateral assumption detection,
// and forbidden language pattern checking.
// ═══════════════════════════════════════════════════════════════════════════

import type {
  UltraGuardedFinding,
  GuardViolation,
  ConfidenceDowngrade,
} from "./types";

// ── Vague locator patterns ─────────────────────────────────────────────────
// These are patterns that indicate the model is NOT grounding its evidence
// in the image but rather using generic placeholder language.

const VAGUE_LOCATOR_PATTERNS: RegExp[] = [
  /^the image$/i,
  /^seen$/i,
  /^visible$/i,
  /^present$/i,
  /^noted$/i,
  /^found$/i,
  /^(in|within|on|throughout)\s+the\s+image$/i,
  /^(in|within|on)\s+the\s+scan$/i,
  /^(general|overall|diffuse)\s*region?$/i,
  /^area$/i,
];

// ── Forbidden language in finding text ────────────────────────────────────

const FORBIDDEN_LANGUAGE_PATTERNS: Array<{
  re: RegExp;
  code: string;
  message: string;
  severity: "BLOCK" | "WARN";
  replacement?: string;
}> = [
  // Definitive diagnosis verbs
  {
    re: /\b(confirms?|confirmed|confirmation)\s+(?:the\s+)?(?:presence\s+of|diagnosis\s+of|finding\s+of)/gi,
    code: "FORBIDDEN_CONFIRMS_VERB",
    message: 'Forbidden phrase "confirms [presence/diagnosis] of" — implies definitive diagnosis.',
    severity: "BLOCK",
    replacement: "findings are consistent with",
  },
  {
    re: /\b(definitively|definitely|certainly|conclusively)\s+(?:shows?|demonstrates?|indicates?|proves?)/gi,
    code: "FORBIDDEN_CERTAINTY_ADVERB",
    message: "Forbidden certainty adverb with diagnostic verb.",
    severity: "BLOCK",
    replacement: "may suggest",
  },
  {
    re: /\b(you\s+have|the\s+patient\s+has|patient\s+is\s+diagnosed\s+with|this\s+(?:is\s+)?diagnostic\s+of)\b/gi,
    code: "FORBIDDEN_DIAGNOSIS_DECLARATION",
    message: "Direct diagnosis declaration. AI systems cannot diagnose.",
    severity: "BLOCK",
    replacement: "appearances may be consistent with",
  },
  {
    re: /\b(rules?\s+out|excludes?)\s+(?:the\s+)?(?:possibility\s+of|diagnosis\s+of|presence\s+of)/gi,
    code: "FORBIDDEN_EXCLUSION_CLAIM",
    message: 'Exclusion claim "rules out" requires full clinical workup — cannot be made from imaging alone.',
    severity: "BLOCK",
    replacement: "does not conclusively confirm",
  },
  // Specific medication names/doses
  {
    re: /\b(metformin|aspirin|warfarin|heparin|lisinopril|atorvastatin|paracetamol|ibuprofen|amoxicillin|prednisolone|levothyroxine|amlodipine|omeprazole|diazepam|lorazepam|gabapentin|sertraline|fluoxetine|furosemide|spironolactone)\b/gi,
    code: "FORBIDDEN_DRUG_NAME",
    message: "Specific medication name in imaging report. AI imaging systems NEVER prescribe.",
    severity: "BLOCK",
    replacement: "[medication — discuss with prescriber]",
  },
  {
    re: /\b\d+\.?\d*\s*(mg|mcg|µg|g|ml|iu|units?)\s*(per|\/)\s*(day|dose|hour|kg)/gi,
    code: "FORBIDDEN_DOSAGE",
    message: "Medication dosage in imaging report. AI imaging systems NEVER prescribe dosages.",
    severity: "BLOCK",
  },
  // Temporal claims without prior imaging
  {
    re: /\b(new|newly|acute|recent|recently|interval\s+(?:change|increase|decrease|worsening|improvement))\b/gi,
    code: "TEMPORAL_CLAIM_WITHOUT_PRIOR",
    message:
      'Temporal claim ("new", "acute", "interval change") requires prior imaging for comparison. ' +
      "Cannot be claimed from a single study unless clinical context explicitly states it.",
    severity: "WARN",
    replacement: "possible",
  },
  // Bilateral claims
  {
    re: /\bbilateral(?:ly)?\s+(?:[\w\s]+)\s+(?:are|is|appear(?:s)?|show(?:s)?|demonstrate(?:s)?)/gi,
    code: "BILATERAL_ASSUMPTION",
    message:
      'Bilateral claim requires BOTH sides to be clearly visible and assessed. ' +
      "If only one side is imaged, this is a hallucination.",
    severity: "WARN",
  },
];

// ── Evidence link validation result ──────────────────────────────────────

export interface EvidenceLinkResult {
  violations: GuardViolation[];
  downgrades: ConfidenceDowngrade[];
  sanitizedFindings: UltraGuardedFinding[];
}

// ── Main validator ────────────────────────────────────────────────────────

export function validateEvidenceLinks(
  findings: UltraGuardedFinding[]
): EvidenceLinkResult {
  const violations: GuardViolation[] = [];
  const downgrades: ConfidenceDowngrade[] = [];
  const sanitizedFindings: UltraGuardedFinding[] = [];

  for (const finding of findings) {
    const newCaveats = [...finding.caveats];
    const rejectionReasons = [...finding.rejectionReasons];
    let confidence = finding.confidence;
    let guardRejected = false;

    // ── Check 1: Evidence must exist ────────────────────────────────────
    if (finding.evidence.length === 0) {
      violations.push({
        layer: "evidence_link_validation",
        severity: "BLOCK",
        code: "NO_EVIDENCE",
        message: `Finding "${finding.label}" (${finding.id}) has NO evidence entries. Cannot release.`,
        findingId: finding.id,
      });
      guardRejected = true;
      rejectionReasons.push("No evidence entries — finding is ungrounded.");
    }

    // ── Check 2: Vague locators ──────────────────────────────────────────
    const vagueLocators = finding.evidence.filter((e) =>
      VAGUE_LOCATOR_PATTERNS.some((p) => p.test(e.locator.trim()))
    );
    if (vagueLocators.length > 0 && vagueLocators.length === finding.evidence.length) {
      // ALL locators are vague — entire finding is ungrounded
      violations.push({
        layer: "evidence_link_validation",
        severity: "BLOCK",
        code: "ALL_LOCATORS_VAGUE",
        message:
          `Finding "${finding.label}" (${finding.id}): ALL ${vagueLocators.length} evidence locators are vague/generic. ` +
          `None reference a specific anatomical location.`,
        findingId: finding.id,
        affectedClaim: vagueLocators.map((e) => e.locator).join(" | "),
      });
      guardRejected = true;
      rejectionReasons.push("All evidence locators are vague — finding is ungrounded.");
    } else if (vagueLocators.length > 0) {
      // Some vague — downgrade
      violations.push({
        layer: "evidence_link_validation",
        severity: "DOWNGRADE",
        code: "SOME_LOCATORS_VAGUE",
        message: `Finding "${finding.label}" (${finding.id}): ${vagueLocators.length} of ${finding.evidence.length} locators are vague.`,
        findingId: finding.id,
      });
      if (confidence === "HIGH") {
        downgrades.push({
          findingId: finding.id,
          from: "HIGH",
          to: "MODERATE",
          reason: "Vague evidence locators prevent HIGH confidence assignment.",
          triggeredByLayer: "evidence_link_validation",
        });
        confidence = "MODERATE";
      }
      newCaveats.push(
        "Some evidence locators lack anatomical specificity — confidence reduced."
      );
    }

    // ── Check 3: Forbidden language in label + description ───────────────
    const combinedText = `${finding.label} ${finding.description}`;
    let sanitizedLabel = finding.label;
    let sanitizedDescription = finding.description;

    for (const { re, code, message, severity, replacement } of FORBIDDEN_LANGUAGE_PATTERNS) {
      const labelMatches = [...finding.label.matchAll(new RegExp(re.source, re.flags))];
      const descMatches = [
        ...finding.description.matchAll(new RegExp(re.source, re.flags)),
      ];

      if (labelMatches.length > 0 || descMatches.length > 0) {
        violations.push({
          layer: "evidence_link_validation",
          severity,
          code,
          message,
          findingId: finding.id,
          affectedClaim: combinedText.slice(0, 200),
          suggestedFix: replacement,
        });

        if (severity === "BLOCK") {
          if (replacement) {
            // Sanitize rather than block if we have a safe replacement
            sanitizedLabel = sanitizedLabel.replace(
              new RegExp(re.source, re.flags),
              replacement
            );
            sanitizedDescription = sanitizedDescription.replace(
              new RegExp(re.source, re.flags),
              replacement
            );
            newCaveats.push(
              `Language sanitized: "${code}" pattern replaced with safer phrasing.`
            );
          } else {
            guardRejected = true;
            rejectionReasons.push(`Forbidden language (${code}) with no safe replacement.`);
          }
        } else {
          // WARN — add caveat
          if (replacement) {
            sanitizedLabel = sanitizedLabel.replace(
              new RegExp(re.source, re.flags),
              replacement
            );
            sanitizedDescription = sanitizedDescription.replace(
              new RegExp(re.source, re.flags),
              replacement
            );
          }
          newCaveats.push(
            `Temporal/bilateral claim flagged (${code}): requires clinical correlation.`
          );
        }
      }
    }

    // ── Check 4: Significance-evidence consistency ───────────────────────
    if (
      finding.significance === "critical" &&
      finding.confidence === "LOW" &&
      !guardRejected
    ) {
      // Critical finding with LOW confidence is dangerous — must add strong caveat
      newCaveats.push(
        "CRITICAL finding with LOW confidence: Requires urgent clinical evaluation. " +
          "AI confidence in this finding is limited — do NOT delay clinical assessment."
      );
      violations.push({
        layer: "evidence_link_validation",
        severity: "WARN",
        code: "CRITICAL_FINDING_LOW_CONFIDENCE",
        message: `Critical finding "${finding.label}" has LOW confidence. Mandatory clinical review required.`,
        findingId: finding.id,
      });
    }

    sanitizedFindings.push({
      ...finding,
      label: sanitizedLabel,
      description: sanitizedDescription,
      confidence,
      caveats: newCaveats,
      guardRejected,
      guardApproved: !guardRejected,
      rejectionReasons,
    });
  }

  return { violations, downgrades, sanitizedFindings };
}

