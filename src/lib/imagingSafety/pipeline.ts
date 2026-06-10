// Orchestrates the 12-phase Medical Imaging Safety pipeline.
// Pure logic — no network calls. Server function wraps this with an LLM call.

import type {
  CalibratedFinding,
  CriticReport,
  DeferralReason,
  Evidence,
  FinalSafetyReport,
  PhaseAnatomyReport,
  PhaseInputReport,
  PhaseQualityReport,
  SafetyDecision,
  SafetyModality,
  SafetyPipelineInput,
  SafetyRuleHit,
} from "./types";
import { PIPELINE_VERSION } from "./types";

// ── Phase 1: Input validation ─────────────────────────────────────────────
export function phase1Input(input: SafetyPipelineInput): PhaseInputReport {
  const mime = input.mimeType ?? "";
  const allowed = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/dicom",
    "application/pdf",
  ];
  if (input.imageBase64 && !allowed.includes(mime)) {
    return {
      ok: false,
      detectedMime: mime,
      isLikelyOriginal: false,
      rejectReason: `Unsupported file type: ${mime || "unknown"}`,
    };
  }
  // Heuristic: small base64 payloads from PNG often = screenshots.
  const sizeBytes = input.imageBase64
    ? Math.floor((input.imageBase64.length * 3) / 4)
    : 0;
  const isLikelyOriginal =
    mime === "application/dicom" ||
    sizeBytes > 250_000 ||
    mime === "image/jpeg";
  return {
    ok: true,
    detectedMime: mime || "text/plain",
    isLikelyOriginal,
  };
}

// ── Phase 2: Quality assessment ───────────────────────────────────────────
export function phase2Quality(
  input: SafetyPipelineInput,
  inputReport: PhaseInputReport,
): PhaseQualityReport {
  const reasons: string[] = [];
  let score = 80;
  if (!inputReport.isLikelyOriginal) {
    reasons.push("Looks like a screenshot or re-encoded image (loses fidelity).");
    score -= 25;
  }
  const sizeBytes = input.imageBase64
    ? Math.floor((input.imageBase64.length * 3) / 4)
    : 0;
  if (input.imageBase64 && sizeBytes < 80_000) {
    reasons.push("Image payload is very small — likely low resolution.");
    score -= 30;
  }
  const hints = input.rawObservations?.qualityHints ?? [];
  if (hints.length) {
    reasons.push(...hints);
    score -= Math.min(40, hints.length * 10);
  }
  // Modality-specific heuristics
  const mSpec: Record<string, string | number | boolean> = {};
  if (input.modality === "ecg") {
    mSpec.expectedLeads = 12;
    if (sizeBytes < 120_000) {
      reasons.push("ECG image looks too small to assess all 12 leads.");
      score -= 15;
    }
  }
  if (input.modality === "dexa") {
    mSpec.positioningSensitive = true;
  }
  if (input.modality === "ultrasound" || input.modality === "echo") {
    mSpec.cineExpected = true;
    reasons.push(
      "Single still frame — cine clips give more reliable interpretation.",
    );
    score -= 5;
  }
  const clamped = Math.max(0, Math.min(100, score));
  const verdict =
    clamped >= 70 ? "adequate" : clamped >= 45 ? "suboptimal" : "inadequate";
  return { verdict, score: clamped, reasons, modalitySpecific: mSpec };
}

// ── Phase 3: Anatomy verification ─────────────────────────────────────────
export function phase3Anatomy(input: SafetyPipelineInput): PhaseAnatomyReport {
  const obs = input.rawObservations;
  const detected = (obs?.detectedRegion as PhaseAnatomyReport["detectedRegion"]) ?? "unknown";
  const matches =
    detected === "unknown" ||
    input.bodyRegion === "unknown" ||
    detected === input.bodyRegion;
  return {
    matchesExpected: matches,
    detectedRegion: detected,
    detectedView: obs?.detectedView ?? null,
    laterality:
      (obs?.laterality as PhaseAnatomyReport["laterality"]) ?? "unknown",
    confidence: matches ? "MODERATE" : "LOW",
    notes: matches
      ? []
      : [
          `User selected ${input.bodyRegion} but model detected ${detected}. Possible mis-categorisation.`,
        ],
  };
}

// ── Phase 5: Confidence calibration (uses quality + anatomy) ──────────────
function calibrateConfidence(
  raw: string | undefined,
  quality: PhaseQualityReport,
  anatomy: PhaseAnatomyReport,
  evidenceCount: number,
): CalibratedFinding["confidence"] {
  const upper = (raw ?? "").toUpperCase();
  let band: CalibratedFinding["confidence"] =
    upper === "HIGH"
      ? "HIGH"
      : upper === "MODERATE" || upper === "MEDIUM"
        ? "MODERATE"
        : upper === "LOW"
          ? "LOW"
          : "INSUFFICIENT";
  if (quality.verdict === "inadequate") band = "INSUFFICIENT";
  else if (quality.verdict === "suboptimal" && band === "HIGH") band = "MODERATE";
  if (!anatomy.matchesExpected && band === "HIGH") band = "MODERATE";
  if (evidenceCount === 0) band = "INSUFFICIENT";
  return band;
}

// ── Phase 4 + 6: Build calibrated findings with evidence requirement ──────
function buildFindings(
  input: SafetyPipelineInput,
  quality: PhaseQualityReport,
  anatomy: PhaseAnatomyReport,
): CalibratedFinding[] {
  const raw = input.rawObservations?.findings ?? [];
  return raw
    .map((f, i): CalibratedFinding => {
      const evidence: Evidence[] = (f.evidence ?? [])
        .filter((e) => (e.locator ?? "").trim().length > 0)
        .map((e) => ({
          locator: e.locator!.trim(),
          description: (e.description ?? "").trim(),
        }));
      const sig = (f.significance ?? "abnormal") as CalibratedFinding["significance"];
      return {
        id: `f${i + 1}`,
        label: (f.label ?? "Unlabelled finding").slice(0, 120),
        plain: (f.description ?? "").slice(0, 600),
        significance: ["normal_variant", "incidental", "abnormal", "critical"].includes(sig)
          ? sig
          : "abnormal",
        confidence: calibrateConfidence(f.confidence, quality, anatomy, evidence.length),
        evidence,
        caveats: [],
      };
    })
    // Phase 6: drop ungrounded findings completely.
    .filter((f) => f.evidence.length > 0 || f.significance === "critical");
}

// ── Phase 7: Critic AI (heuristic implementation) ─────────────────────────
const OVERREACH_RE = [
  /\bdefinitely\b/i,
  /\bconfirms?\b/i,
  /\bdiagnosed?\s+with\b/i,
  /\brules?\s+out\b/i,
];
function runCritic(findings: CalibratedFinding[]): {
  critic: CriticReport;
  updated: CalibratedFinding[];
} {
  const overreach: string[] = [];
  const removed: string[] = [];
  const added: Record<string, string[]> = {};
  const updated = findings.map((f) => {
    const caveats = [...f.caveats];
    for (const re of OVERREACH_RE) {
      if (re.test(f.plain) || re.test(f.label)) {
        overreach.push(`${f.id}: "${re.source}" language softened.`);
        caveats.push("Wording softened by critic — original phrasing was over-confident.");
        f.plain = f.plain.replace(re, "may suggest");
      }
    }
    if (f.confidence === "INSUFFICIENT" && f.significance !== "critical") {
      removed.push(f.id);
    }
    if (caveats.length) added[f.id] = caveats;
    return { ...f, caveats };
  });
  return {
    critic: { overreach, removedFindingIds: removed, addedCaveats: added },
    updated: updated.filter((f) => !removed.includes(f.id)),
  };
}

// ── Phase 8: Safety Rules Engine ──────────────────────────────────────────
const FORBIDDEN_PATTERNS: Array<{ re: RegExp; replace?: string; rule: string }> = [
  { re: /\b\d+\s?(mg|mcg|µg|g|ml|iu)\b/gi, replace: "[dose redacted — ask doctor]", rule: "no_specific_doses" },
  { re: /\bprescribe[ds]?\b/gi, replace: "discuss medication with doctor", rule: "no_prescriptions" },
  { re: /\bI\s+diagnose\b/gi, replace: "this may suggest", rule: "no_diagnosis_verbs" },
];
function runSafetyRules(
  modality: SafetyModality,
  findings: CalibratedFinding[],
): { hits: SafetyRuleHit[]; updated: CalibratedFinding[] } {
  const hits: SafetyRuleHit[] = [];
  const updated = findings.map((f) => {
    let plain = f.plain;
    for (const p of FORBIDDEN_PATTERNS) {
      if (p.re.test(plain)) {
        hits.push({ rule: p.rule, severity: "warn", message: `Cleaned in ${f.id}` });
        plain = p.replace ? plain.replace(p.re, p.replace) : plain;
      }
    }
    return { ...f, plain };
  });
  // Modality-specific guards
  if (modality === "ecg") {
    const hasSTEMI = updated.some((f) => /stemi|st[- ]?elevation/i.test(f.label));
    if (hasSTEMI) {
      hits.push({
        rule: "ecg_stemi_artefact_guard",
        severity: "warn",
        message: "STEMI claim flagged — verify lead placement and rule out lead-reversal artefact.",
      });
    }
  }
  if (modality === "mammogram") {
    const overreach = updated.some((f) => /\bbi-rads\s*[45]\b/i.test(f.label));
    if (overreach) {
      hits.push({
        rule: "mammo_birads_overreach",
        severity: "block",
        message: "BI-RADS 4/5 classification requires radiologist review — model output blocked.",
      });
    }
  }
  if (modality === "echo") {
    const efPoint = updated.some((f) => /\bEF\s*=?\s*\d{1,2}\s*%/.test(f.label + " " + f.plain));
    if (efPoint) {
      hits.push({
        rule: "echo_ef_point_estimate",
        severity: "warn",
        message: "Point EF from a single view is unreliable — express as a range.",
      });
    }
  }
  return { hits, updated };
}

// ── Phase 9: Reporting layer ──────────────────────────────────────────────
function buildPatientSummary(
  findings: CalibratedFinding[],
  decision: SafetyDecision,
): string {
  if (decision === "defer") {
    return "We weren't able to safely interpret this study. A clinician should review it directly.";
  }
  if (findings.length === 0) {
    return "No clear abnormalities were detected, but this does not replace a clinician's review.";
  }
  const top = findings.slice(0, 3).map((f) => `• ${f.label} (${f.confidence.toLowerCase()} confidence)`);
  return `Highlights:\n${top.join("\n")}\n\nThis is an AI-assisted summary, not a diagnosis.`;
}
function buildClinicianBrief(
  findings: CalibratedFinding[],
  quality: PhaseQualityReport,
  anatomy: PhaseAnatomyReport,
): string {
  const lines: string[] = [
    `Quality: ${quality.verdict} (${quality.score}/100).`,
    `Anatomy match: ${anatomy.matchesExpected ? "yes" : "no"} (detected: ${anatomy.detectedRegion}).`,
    "",
    "Findings:",
  ];
  findings.forEach((f) => {
    lines.push(
      `- [${f.confidence}] ${f.label} — ${f.significance}. Evidence: ${
        f.evidence.map((e) => e.locator).join("; ") || "none"
      }`,
    );
  });
  return lines.join("\n");
}

// ── Phase 10: Human review decision ───────────────────────────────────────
function decide(
  input: PhaseInputReport,
  quality: PhaseQualityReport,
  anatomy: PhaseAnatomyReport,
  findings: CalibratedFinding[],
  safetyHits: SafetyRuleHit[],
): { decision: SafetyDecision; deferrals: DeferralReason[] } {
  const deferrals: DeferralReason[] = [];
  if (!input.ok) {
    deferrals.push({ code: "input_rejected", message: input.rejectReason ?? "Input rejected." });
  }
  if (quality.verdict === "inadequate") {
    deferrals.push({ code: "image_quality", message: quality.reasons.join(" ") || "Image quality insufficient." });
  }
  if (!anatomy.matchesExpected) {
    deferrals.push({ code: "anatomy_mismatch", message: anatomy.notes.join(" ") || "Anatomy mismatch." });
  }
  if (findings.length === 0 && quality.verdict !== "adequate") {
    deferrals.push({ code: "no_grounded_findings", message: "No evidence-grounded findings to release." });
  }
  if (safetyHits.some((h) => h.severity === "block")) {
    deferrals.push({ code: "safety_block", message: safetyHits.filter((h) => h.severity === "block").map((h) => h.message).join(" ") });
  }
  if (deferrals.length) return { decision: "defer", deferrals };
  const anyCritical = findings.some((f) => f.significance === "critical");
  const anyWarn = safetyHits.some((h) => h.severity === "warn");
  if (anyCritical || anyWarn || quality.verdict === "suboptimal") {
    return { decision: "release_with_caveat", deferrals: [] };
  }
  return { decision: "release", deferrals: [] };
}

// ── Phase 11: lightweight in-process validation hook ──────────────────────
export function runPipelineSelfCheck(report: FinalSafetyReport): string[] {
  const issues: string[] = [];
  for (const f of report.findings) {
    if (f.confidence === "HIGH" && f.evidence.length === 0) {
      issues.push(`Finding ${f.id} HIGH but ungrounded.`);
    }
  }
  if (report.decision === "release" && report.deferrals.length) {
    issues.push("Released despite deferrals — invariant broken.");
  }
  return issues;
}

// ── Phase 12: audit entry builder (caller persists it) ────────────────────
function hash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

// ── Orchestrator ──────────────────────────────────────────────────────────
export function runImagingSafetyPipeline(
  input: SafetyPipelineInput,
  opts: { modelChain: string[]; promptText: string } = {
    modelChain: ["heuristic-only"],
    promptText: "",
  },
): FinalSafetyReport {
  const inputReport = phase1Input(input);
  const quality = phase2Quality(input, inputReport);
  const anatomy = phase3Anatomy(input);
  const baseFindings = buildFindings(input, quality, anatomy);
  const { critic, updated: postCritic } = runCritic(baseFindings);
  const { hits: safetyHits, updated: postSafety } = runSafetyRules(input.modality, postCritic);
  const { decision, deferrals } = decide(inputReport, quality, anatomy, postSafety, safetyHits);

  const finalFindings = decision === "defer" ? [] : postSafety;

  const audit = {
    pipelineVersion: PIPELINE_VERSION,
    modelChain: opts.modelChain,
    promptHash: hash(opts.promptText),
    inputHash: hash(
      `${input.modality}|${input.bodyRegion}|${(input.imageBase64 ?? "").slice(0, 256)}`,
    ),
    decision,
    createdAt: new Date().toISOString(),
  };

  return {
    decision,
    deferrals,
    modality: input.modality,
    bodyRegion: input.bodyRegion,
    phases: { input: inputReport, quality, anatomy, critic, safety: safetyHits },
    findings: finalFindings,
    patientSummary: buildPatientSummary(finalFindings, decision),
    clinicianBrief: buildClinicianBrief(finalFindings, quality, anatomy),
    audit,
  };
}
