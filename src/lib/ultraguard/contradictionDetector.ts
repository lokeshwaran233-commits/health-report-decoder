// ═══════════════════════════════════════════════════════════════════════════
// UltraGuard — Layer 7: Cross-Finding Contradiction Detector
//
// Detects logical contradictions between findings in the same report.
// Example contradictions:
//   • Finding A says "no pleural effusion" and Finding B says "pleural effusion present"
//   • Finding A says "normal cardiac size" and Finding B says "cardiomegaly"
//   • Finding A says "normal brain parenchyma" and Finding B says "infarct"
//   • Finding A says "no pneumothorax" and Finding B says "right pneumothorax"
//
// These contradictions are a sign that the model generated findings
// without internal consistency — often because it hallucinated some
// findings to make the report "complete".
// ═══════════════════════════════════════════════════════════════════════════

import type { UltraGuardedFinding, GuardViolation } from "./types";

// ── Contradiction pair definitions ────────────────────────────────────────

interface ContradictionPair {
  category: string;
  normalPattern: RegExp;    // Pattern for "normal" state
  abnormalPattern: RegExp;  // Pattern for "abnormal" state
  message: string;
}

const CONTRADICTION_PAIRS: ContradictionPair[] = [
  // Pleural
  {
    category: "pleural_effusion",
    normalPattern: /no\s+(pleural\s+)?effusion|pleural\s+(?:spaces\s+)?(?:are\s+)?clear|no\s+free\s+(?:pleural\s+)?fluid/i,
    abnormalPattern: /pleural\s+effusion|pleural\s+fluid|blunting\s+of\s+(?:the\s+)?(?:costo|cost)phrenic/i,
    message: "Contradiction: One finding states no pleural effusion while another reports pleural effusion.",
  },
  // Pneumothorax
  {
    category: "pneumothorax",
    normalPattern: /no\s+pneumothorax|no\s+ptx|lungs?\s+(?:are\s+)?fully\s+(?:expanded|inflated)|no\s+free\s+air/i,
    abnormalPattern: /pneumothorax|visceral\s+pleural\s+line|collapsed\s+lung|absent\s+lung\s+markings/i,
    message: "Contradiction: One finding denies pneumothorax while another reports it.",
  },
  // Cardiac size
  {
    category: "cardiac_size",
    normalPattern: /normal\s+cardiac\s+size|(?:heart\s+)?(?:size\s+)?(?:is\s+)?(?:within\s+)?normal\s+limits|ctr\s*<?0\.\s*[45]/i,
    abnormalPattern: /cardiomegaly|enlarged\s+(?:heart|cardiac\s+silhouette)|increased\s+(?:cardiac\s+)?size|ctr\s*[>≥]\s*0\.\s*5/i,
    message: "Contradiction: One finding states normal cardiac size while another reports cardiomegaly.",
  },
  // Pulmonary vasculature
  {
    category: "pulmonary_vasculature",
    normalPattern: /normal\s+(?:pulmonary\s+)?vasculature|no\s+(?:pulmonary\s+)?vascular\s+congestion/i,
    abnormalPattern: /(?:pulmonary\s+)?(?:vascular\s+)?congestion|(?:hilar\s+)?engorgement|pulmonary\s+oedema|pulmonary\s+edema/i,
    message: "Contradiction: One finding states normal pulmonary vasculature while another reports congestion/oedema.",
  },
  // Airspace consolidation
  {
    category: "consolidation",
    normalPattern: /(?:lung\s+)?fields?\s+(?:are\s+)?(?:clear|normal|unremarkable)|no\s+(?:focal\s+)?(?:consolidation|opacification)/i,
    abnormalPattern: /consolidation|opacification|airspace\s+(?:disease|opacity)|pneumonia\s+(?:pattern|appearances)/i,
    message: "Contradiction: One finding states clear lung fields while another reports consolidation.",
  },
  // Free air / perforation
  {
    category: "free_air",
    normalPattern: /no\s+free\s+air|no\s+(?:sub\s*)?diaphragmatic\s+air|no\s+pneumoperitoneum/i,
    abnormalPattern: /free\s+(?:intra\s*(?:abdominal|peritoneal))?\s*air|pneumoperitoneum|air\s+under\s+(?:the\s+)?diaphragm/i,
    message: "Contradiction: One finding states no free air while another reports pneumoperitoneum.",
  },
  // Fracture
  {
    category: "fracture",
    normalPattern: /no\s+(?:visible\s+)?fracture|(?:bones?\s+)?(?:are\s+)?intact|no\s+bony\s+(?:injury|abnormality)/i,
    abnormalPattern: /fracture|cortical\s+breach|discontinuity|break/i,
    message: "Contradiction: One finding states no fracture while another reports a fracture.",
  },
  // Midline shift
  {
    category: "midline_shift",
    normalPattern: /no\s+midline\s+shift|midline\s+(?:is\s+)?(?:in\s+)?(?:the\s+)?midline|midline\s+maintained/i,
    abnormalPattern: /midline\s+shift|(?:left|right)ward\s+displacement|mass\s+effect/i,
    message: "Contradiction: One finding states no midline shift while another reports midline displacement.",
  },
  // Cord compression / spinal canal
  {
    category: "spinal_cord",
    normalPattern: /no\s+cord\s+compression|spinal\s+cord\s+(?:appears\s+)?normal|cord\s+signal\s+(?:is\s+)?(?:within\s+)?normal/i,
    abnormalPattern: /cord\s+compression|cord\s+signal\s+(?:change|abnormality)|myelopathy/i,
    message: "Contradiction: One finding states normal cord while another reports cord signal change/compression.",
  },
  // Aortic calibre
  {
    category: "aorta",
    normalPattern: /normal\s+aortic\s+calibre|aorta\s+(?:is\s+)?(?:within\s+)?normal\s+limits/i,
    abnormalPattern: /aortic\s+(?:aneurysm|dilatation|ectasia|dissection)|dilated\s+aorta|aorta\s+measures\s+[>≥]\s*3\s*cm/i,
    message: "Contradiction: One finding describes normal aorta while another reports aneurysm/dilatation.",
  },
  // Lymphadenopathy
  {
    category: "lymphadenopathy",
    normalPattern: /no\s+(?:significant\s+)?lymphadenopathy|lymph\s+nodes?\s+(?:are\s+)?(?:not\s+enlarged|normal|unremarkable)/i,
    abnormalPattern: /lymphadenopathy|enlarged\s+lymph\s+nodes?|lymph\s+node\s+(?:mass|conglomerate)/i,
    message: "Contradiction: One finding states no lymphadenopathy while another reports enlarged nodes.",
  },
  // Joint effusion
  {
    category: "joint_effusion",
    normalPattern: /no\s+joint\s+effusion|joint\s+(?:space\s+)?(?:is\s+)?(?:within\s+)?normal|no\s+(?:intra\s*)?articular\s+fluid/i,
    abnormalPattern: /joint\s+effusion|intra\s*articular\s+fluid|(?:knee|hip|shoulder|elbow|ankle)\s+effusion/i,
    message: "Contradiction: One finding states no joint effusion while another reports an effusion.",
  },
];

// ── Self-contradiction within a single finding ────────────────────────────

interface InternalContradiction {
  pattern1: RegExp;
  pattern2: RegExp;
  message: string;
}

const INTERNAL_CONTRADICTION_PATTERNS: InternalContradiction[] = [
  {
    pattern1: /normal/i,
    pattern2: /abnormal|pathological|suspicious|concerning/i,
    message: "Finding contains both 'normal' and 'abnormal' descriptors in the same sentence — internally contradictory.",
  },
  {
    pattern1: /no\s+evidence\s+of/i,
    pattern2: /evidence\s+of(?!\s+no)/i,
    message: "Finding contains both 'no evidence of' and 'evidence of' — internally contradictory.",
  },
];

// ── Contradiction check result ────────────────────────────────────────────

export interface ContradictionResult {
  violations: GuardViolation[];
  sanitizedFindings: UltraGuardedFinding[];
  contradictionsFound: number;
}

// ── Main function ─────────────────────────────────────────────────────────

export function detectContradictions(
  findings: UltraGuardedFinding[]
): ContradictionResult {
  const violations: GuardViolation[] = [];
  let sanitizedFindings = [...findings];
  let contradictionsFound = 0;

  // ── 1. Cross-finding contradictions ──────────────────────────────────

  for (const pair of CONTRADICTION_PAIRS) {
    const normalFindings = findings.filter((f) =>
      pair.normalPattern.test(`${f.label} ${f.description}`)
    );
    const abnormalFindings = findings.filter((f) =>
      pair.abnormalPattern.test(`${f.label} ${f.description}`)
    );

    if (normalFindings.length > 0 && abnormalFindings.length > 0) {
      contradictionsFound++;

      violations.push({
        layer: "contradiction_detection",
        severity: "WARN",
        code: `CONTRADICTION_${pair.category.toUpperCase()}`,
        message: pair.message,
        affectedClaim:
          `Normal: "${normalFindings[0].label}" | ` +
          `Abnormal: "${abnormalFindings[0].label}"`,
        suggestedFix:
          "Review both findings. The report should be internally consistent. " +
          "If both are present, the normal-state finding should be removed or reconciled.",
      });

      // Add caveats to both involved findings
      sanitizedFindings = sanitizedFindings.map((f) => {
        const isInvolved =
          normalFindings.some((nf) => nf.id === f.id) ||
          abnormalFindings.some((af) => af.id === f.id);
        if (!isInvolved) return f;
        return {
          ...f,
          caveats: [
            ...f.caveats,
            `INTERNAL CONSISTENCY WARNING: This finding is in logical tension with another finding ` +
              `in the same report (${pair.category} category). Review required.`,
          ],
        };
      });
    }
  }

  // ── 2. Internal contradictions within each finding ────────────────────

  for (const finding of sanitizedFindings) {
    const text = `${finding.label} ${finding.description}`;
    for (const { pattern1, pattern2, message } of INTERNAL_CONTRADICTION_PATTERNS) {
      if (pattern1.test(text) && pattern2.test(text)) {
        contradictionsFound++;
        violations.push({
          layer: "contradiction_detection",
          severity: "WARN",
          code: "INTERNAL_CONTRADICTION",
          message: `Finding "${finding.label}" (${finding.id}): ${message}`,
          findingId: finding.id,
          affectedClaim: text.slice(0, 200),
          suggestedFix: "Restate the finding with a single, consistent conclusion.",
        });
      }
    }
  }

  // ── 3. Laterality contradiction ───────────────────────────────────────
  // If finding A says "right" and finding B says "left" for the same structure
  
  const ANATOMY_STRUCTURES = [
    "lung", "pleural", "kidney", "adrenal", "ovary", "testicle",
    "femur", "humerus", "tibia", "fibula", "hip", "knee", "shoulder",
    "coronary", "carotid", "subclavian",
  ];

  for (const structure of ANATOMY_STRUCTURES) {
    const leftFindings = findings.filter((f) =>
      new RegExp(`left\\s+${structure}`, "i").test(`${f.label} ${f.description}`)
    );
    const rightFindings = findings.filter((f) =>
      new RegExp(`right\\s+${structure}`, "i").test(`${f.label} ${f.description}`)
    );
    const bilateralFindings = findings.filter((f) =>
      new RegExp(`bilateral\\s+${structure}`, "i").test(`${f.label} ${f.description}`)
    );

    // If bilateral is claimed AND individual side-specific findings claim opposite states, flag it
    if (
      bilateralFindings.length > 0 &&
      (leftFindings.length > 0 || rightFindings.length > 0)
    ) {
      const leftOrRight = [...leftFindings, ...rightFindings];
      const someNormal = leftOrRight.some((f) =>
        /normal|unremarkable|intact|clear/i.test(f.description)
      );
      const someAbnormal = leftOrRight.some((f) =>
        /abnormal|effusion|consolidation|fracture|mass|lesion/i.test(f.description)
      );

      if (someNormal && someAbnormal) {
        contradictionsFound++;
        violations.push({
          layer: "contradiction_detection",
          severity: "WARN",
          code: `LATERALITY_CONTRADICTION_${structure.toUpperCase()}`,
          message:
            `Laterality contradiction for "${structure}": bilateral claim exists alongside ` +
            `side-specific findings that disagree on normal/abnormal state.`,
        });
      }
    }
  }

  return { violations, sanitizedFindings, contradictionsFound };
}

