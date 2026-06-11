// Orchestrates the 12-phase Medical Imaging Safety pipeline.
// Pure logic — no network calls. Server function wraps this with an LLM call.
//
// CHANGELOG (2026-06-11):
//   Fix 3 — STEMI upgraded from warn → block (was a critical miss).
//   Fix 3b — Added hard blocks: VT/VF, complete heart block, severe bradycardia.
//   Fix 3c — Added CT/MRI hard blocks: aortic dissection, tension pneumothorax, cord compression.
//   Fix 4 — ADC dependency rule: brain MRI stroke/infarct findings require DWI evidence.
//   Fix 4b — PE hard block: CT PE finding without contrast note → block with caveat.

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
import type { BodyRegion } from "@/types/scan";

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
    reasons.push("Single still frame — cine clips give more reliable interpretation.");
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

// ── Phase 5: Confidence calibration ───────────────────────────────────────
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

// ── Phase 4 + 6: Build calibrated findings with evidence requirement ───────
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
    // Phase 6: drop ungrounded non-critical findings completely.
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

const ECG_BLOCK_PATTERNS: Array<{ re: RegExp; rule: string; message: string }> = [
  {
    re: /stemi|st[- ]?elevation\s+(myocardial\s+)?infarct/i,
    rule: "ecg_stemi_block",
    message:
      "STEMI pattern detected — this is a potential cardiac emergency. AI output blocked: a 12-lead ECG and immediate cardiology review is required. Call emergency services if the patient has symptoms.",
  },
  {
    re: /ventricular\s+(tachycardia|fibrillation)|vt|vf\b/i,
    rule: "ecg_vt_vf_block",
    message:
      "VT/VF morphology detected — potentially life-threatening arrhythmia. AI output blocked: immediate cardiology review required.",
  },
  {
    re: /complete\s+heart\s+block|third[- ]degree\s+(av\s+)?block|av\s+dissociation/i,
    rule: "ecg_chb_block",
    message:
      "Complete heart block / AV dissociation pattern — potentially life-threatening. AI output blocked: urgent cardiology evaluation required.",
  },
  {
    re: /severe\s+bradycardia|rate\s+[<＜]\s*3[05]\s*(bpm)?/i,
    rule: "ecg_bradycardia_block",
    message:
      "Severe bradycardia pattern (< 30–35 bpm) — potentially haemodynamically significant. AI output blocked: urgent clinical review required.",
  },
  {
    re: /qtc\s*(>|greater\s+than|>|≥|>)\s*5[0-9]{2}|prolonged\s+qt/i,
    rule: "ecg_qtc_block",
    message:
      "QTc ≥ 500 ms detected — high risk of Torsades de Pointes. AI output blocked: medication review and cardiology input required.",
  },
];

const CT_MRI_BLOCK_PATTERNS: Array<{ re: RegExp; rule: string; message: string }> = [
  {
    re: /aortic\s+dissection|intimal\s+flap|double\s+lumen/i,
    rule: "ct_aortic_dissection_block",
    message:
      "Aortic dissection pattern detected — surgical emergency. AI output blocked: immediate vascular surgery and CT angiography review required.",
  },
  {
    re: /tension\s+pneumothorax|mediastinal\s+shift.*pneumothorax|pneumothorax.*mediastinal\s+shift/i,
    rule: "ct_tension_ptx_block",
    message:
      "Tension pneumothorax pattern detected — life-threatening emergency. AI output blocked: immediate emergency intervention required.",
  },
];

const MRI_CORD_BLOCK_PATTERNS: Array<{ re: RegExp; rule: string; message: string }> = [
  {
    re: /cord\s+compression|cauda\s+equina|myelopathy.*signal|cord\s+signal\s+change/i,
    rule: "mri_cord_compression_block",
    message:
      "Spinal cord compression or myelopathy signal detected — potential neurological emergency. AI output blocked: urgent neurosurgical review required.",
  },
];

function checkAdcDependency(
  findings: CalibratedFinding[],
  modality: SafetyModality,
  bodyRegion: BodyRegion,
): SafetyRuleHit[] {
  if (modality !== "mri" || bodyRegion !== "head_brain") return [];
  const hits: SafetyRuleHit[] = [];

  const strokeFindings = findings.filter((f) =>
    /stroke|infarct|ischaemi[ac]|ischemi[ac]|diffusion|dwi|adc/i.test(
      f.label + " " + f.plain,
    ),
  );

  for (const f of strokeFindings) {
    const hasDwiEvidence = f.evidence.some((e) =>
      /dwi|adc|diffusion|b[- ]?1000|restricted/i.test(e.locator + " " + e.description),
    );
    if (!hasDwiEvidence) {
      hits.push({
        rule: "mri_stroke_no_adc_evidence",
        severity: "block",
        message: `Finding "${f.label}" suggests stroke/infarction but contains no DWI/ADC evidence. This diagnosis REQUIRES diffusion-weighted imaging confirmation. AI output blocked until DWI sequences are provided or a radiologist confirms.`,
      });
    }
  }
  return hits;
}

function checkPeContrastDependency(
  findings: CalibratedFinding[],
  modality: SafetyModality,
): SafetyRuleHit[] {
  if (modality !== "ct") return [];
  const hits: SafetyRuleHit[] = [];

  const peFindings = findings.filter((f) =>
    /pulmonary\s+embolism|filling\s+defect.*pulmonary|pe\b/i.test(f.label + " " + f.plain),
  );

  for (const f of peFindings) {
    const hasContrastEvidence = f.evidence.some((e) =>
      /contrast|ctpa|ct\s+pulmonary\s+angiogram|filling\s+defect/i.test(
        e.locator + " " + e.description,
      ),
    );
    if (!hasContrastEvidence) {
      hits.push({
        rule: "ct_pe_no_contrast_evidence",
        severity: "block",
        message: `PE claim in finding "${f.label}" lacks contrast-enhanced protocol evidence. CTPA is required to diagnose pulmonary embolism — non-contrast CT cannot exclude or confirm PE. AI output blocked.`,
      });
    }
  }
  return hits;
}

function runSafetyRules(
  modality: SafetyModality,
  bodyRegion: BodyRegion,
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

  if (modality === "ecg") {
    const combinedText = updated.map((f) => f.label + " " + f.plain).join(" ");
    for (const { re, rule, message } of ECG_BLOCK_PATTERNS) {
      if (re.test(combinedText)) {
        hits.push({ rule, severity: "block", message });
      }
    }
  }

  if (modality === "ct" || modality === "mri") {
    const combinedText = updated.map((f) => f.label + " " + f.plain).join(" ");
    for (const { re, rule, message } of CT_MRI_BLOCK_PATTERNS) {
      if (re.test(combinedText)) {
        hits.push({ rule, severity: "block", message });
      }
    }
  }

  if (modality === "mri") {
    const combinedText = updated.map((f) => f.label + " " + f.plain).join(" ");
    for (const { re, rule, message } of MRI_CORD_BLOCK_PATTERNS) {
      if (re.test(combinedText)) {
        hits.push({ rule, severity: "block", message });
      }
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

  const adcHits = checkAdcDependency(updated, modality, bodyRegion);
  hits.push(...adcHits);

  const peHits = checkPeContrastDependency(updated, modality);
  hits.push(...peHits);

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

// ── Phase 10: Decision ────────────────────────────────────────────────────
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
    deferrals.push({
      code: "safety_block",
      message: safetyHits
        .filter((h) => h.severity === "block")
        .map((h) => h.message)
        .join(" "),
    });
  }
  if (deferrals.length) return { decision: "defer", deferrals };
  const anyCritical = findings.some((f) => f.significance === "critical");
  const anyWarn = safetyHits.some((h) => h.severity === "warn");
  if (anyCritical || anyWarn || quality.verdict === "suboptimal") {
    return { decision: "release_with_caveat", deferrals: [] };
  }
  return { decision: "release", deferrals: [] };
}

// ── Phase 11: Self-check ──────────────────────────────────────────────────
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

// ── Phase 12: Audit ───────────────────────────────────────────────────────
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
  const { hits: safetyHits, updated: postSafety } = runSafetyRules(
    input.modality,
    input.bodyRegion,
    postCritic,
  );
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
