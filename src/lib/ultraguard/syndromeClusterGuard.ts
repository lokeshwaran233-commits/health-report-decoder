// ═══════════════════════════════════════════════════════════════════════════
// UltraGuard — Layer 6: Syndrome Co-Occurrence Guard
//
// This guard addresses the most dangerous category of medical imaging
// hallucination: KNOWLEDGE-INJECTION through syndrome extrapolation.
//
// Problem: LLMs learn that Condition A and Condition B co-occur in
// medical literature. When they see Condition A in an image, they
// "helpfully" also mention Condition B — even when it's NOT VISIBLE.
//
// Classic example: Omphalocele + Spina Bifida
//   These two conditions share dataset co-occurrence in antenatal
//   ultrasound literature. A model seeing an omphalocele might
//   hallucinate spina bifida findings because it "knows" they
//   frequently co-occur — without ANY spina bifida evidence in the image.
//
// The guard maintains:
// 1. A dictionary of named syndromes with REQUIRED markers
//    → If claiming a syndrome, ALL markers must have image evidence
// 2. A list of spurious association pairs
//    → If claiming Condition B alongside Condition A, Condition B
//      must have its OWN independent evidence, not merely co-occurrence
// ═══════════════════════════════════════════════════════════════════════════

import type {
  UltraGuardedFinding,
  GuardViolation,
  SyndromeClusterResult,
  SyndromeClusterDefinition,
  ConfidenceDowngrade,
} from "./types";

// ── Syndrome Dictionary ────────────────────────────────────────────────────
// Each entry defines what MUST be evidenced before claiming a syndrome.
// These are the minimum required markers in the literature.

const SYNDROME_DICTIONARY: SyndromeClusterDefinition[] = [
  {
    name: "VACTERL",
    aliases: ["VATER", "VACTERL association"],
    description: "Vertebral, Anorectal, Cardiac, Tracheoesophageal, Renal, Limb anomalies",
    requiredMarkers: [],
    supportingMarkers: [
      "vertebral anomaly",
      "vertebral defect",
      "anorectal malformation",
      "anal atresia",
      "cardiac defect",
      "ventricular septal defect",
      "tracheoesophageal fistula",
      "oesophageal atresia",
      "renal anomaly",
      "limb defect",
      "radial aplasia",
    ],
    minimumSupportingCount: 3, // Must see ≥3 component anomalies
    spuriousAssociationPairs: [],
  },
  {
    name: "CHARGE syndrome",
    aliases: ["CHARGE", "Hall-Hittner syndrome"],
    description: "Coloboma, Heart defect, Atresia choanae, Retardation, Genital abnormalities, Ear anomalies",
    requiredMarkers: [],
    supportingMarkers: [
      "coloboma",
      "cardiac defect",
      "choanal atresia",
      "developmental delay",
      "genital abnormality",
      "ear anomaly",
      "semicircular canal aplasia",
    ],
    minimumSupportingCount: 3,
    spuriousAssociationPairs: [],
  },
  {
    name: "Beckwith-Wiedemann syndrome",
    aliases: ["BWS", "Beckwith Wiedemann"],
    description: "Macroglossia, omphalocele, gigantism, neonatal hypoglycaemia",
    requiredMarkers: ["macroglossia", "omphalocele"],
    supportingMarkers: [
      "visceromegaly",
      "macrosomia",
      "hemihypertrophy",
      "macroglossia",
      "omphalocele",
      "enlarged tongue",
    ],
    minimumSupportingCount: 2,
    spuriousAssociationPairs: [
      ["omphalocele", "Wilms tumour"],  // BWS has predisposition, but you can't IMAGE that association
    ],
  },
  {
    name: "Pentalogy of Cantrell",
    aliases: ["Cantrell pentalogy"],
    description: "Omphalocele, cardiac ectopia, diaphragmatic hernia, sternal defect, pericardial defect",
    requiredMarkers: [
      "omphalocele",
      "ectopia cordis",
    ],
    supportingMarkers: [
      "diaphragmatic defect",
      "sternal defect",
      "pericardial defect",
      "cardiac ectopia",
      "ectopia cordis",
    ],
    minimumSupportingCount: 3,
    spuriousAssociationPairs: [],
  },
  {
    name: "Turner syndrome",
    aliases: ["45,X", "45X", "monosomy X", "Turner's"],
    description: "45,X karyotype — cystic hygroma, cardiac defects, renal anomalies on antenatal imaging",
    requiredMarkers: [],
    supportingMarkers: [
      "cystic hygroma",
      "coarctation of aorta",
      "horseshoe kidney",
      "nuchal translucency",
      "webbed neck",
      "lymphoedema",
    ],
    minimumSupportingCount: 2,
    spuriousAssociationPairs: [
      ["cystic hygroma", "Down syndrome"], // Cystic hygroma ≠ automatic Trisomy 21
    ],
  },
  {
    name: "Down syndrome",
    aliases: ["Trisomy 21", "trisomy 21", "Down's syndrome"],
    description: "Trisomy 21 — imaging markers include nuchal thickening, echogenic bowel, short femur",
    requiredMarkers: [],
    supportingMarkers: [
      "nuchal fold thickening",
      "echogenic bowel",
      "short femur",
      "echogenic intracardiac focus",
      "renal pelvis dilatation",
      "sandal gap",
      "hypoplastic nasal bone",
    ],
    minimumSupportingCount: 3,
    spuriousAssociationPairs: [
      ["echogenic intracardiac focus", "Down syndrome"], // EIF alone ≠ Trisomy 21
      ["short femur", "Down syndrome"], // Isolated short femur ≠ Trisomy 21
    ],
  },
  {
    name: "Patau syndrome",
    aliases: ["Trisomy 13", "trisomy 13"],
    description: "Trisomy 13 — holoprosencephaly, cyclopia, cleft lip, polydactyly on imaging",
    requiredMarkers: [],
    supportingMarkers: [
      "holoprosencephaly",
      "cyclopia",
      "proboscis",
      "polydactyly",
      "cardiac defect",
      "cleft lip",
      "cleft palate",
    ],
    minimumSupportingCount: 3,
    spuriousAssociationPairs: [],
  },
  {
    name: "Edwards syndrome",
    aliases: ["Trisomy 18", "trisomy 18"],
    description: "Trisomy 18 — strawberry head, choroid plexus cysts, AVSD, overlapping fingers",
    requiredMarkers: [],
    supportingMarkers: [
      "choroid plexus cysts",
      "strawberry shaped skull",
      "atrioventricular septal defect",
      "overlapping fingers",
      "rockerbottom feet",
      "strawberry skull",
    ],
    minimumSupportingCount: 2,
    spuriousAssociationPairs: [
      ["choroid plexus cyst", "Trisomy 18"], // Isolated CPC ≠ Trisomy 18
    ],
  },
];

// ── Spurious Association Pairs ─────────────────────────────────────────────
// These pairs are known to co-occur in training data. Finding one should
// NOT automatically trigger mentioning the other without independent evidence.
// Format: [condition_A, condition_B] — seeing A must NOT automatically imply B.

const SPURIOUS_CO_OCCURRENCE_PAIRS: Array<{
  conditionA: RegExp;
  conditionB: RegExp;
  reason: string;
}> = [
  {
    conditionA: /omphalocele/i,
    conditionB: /spina\s*bifida|neural\s+tube\s+defect|myelomeningocele/i,
    reason:
      "Omphalocele and spina bifida co-occur in antenatal datasets but are independent malformations. " +
      "Spina bifida requires independent imaging evidence (posterior element defect, cord signal change, " +
      "banana sign, lemon sign) — it CANNOT be inferred from omphalocele alone.",
  },
  {
    conditionA: /choroid\s+plexus\s+cyst|cpc/i,
    conditionB: /trisomy\s*18|edwards/i,
    reason:
      "Isolated choroid plexus cysts are present in ~1-2% of chromosomally normal pregnancies. " +
      "Trisomy 18 requires additional structural anomalies. CPC alone cannot imply Trisomy 18.",
  },
  {
    conditionA: /echogenic\s+(intra\s*cardiac\s*)?focus|eif/i,
    conditionB: /trisomy\s*21|down|aneuploidy/i,
    reason:
      "Isolated echogenic intracardiac focus (EIF) is a soft marker with low positive predictive " +
      "value in isolation. It cannot be cited as evidence of Down syndrome without other markers.",
  },
  {
    conditionA: /short\s+femur|femur.*shortened/i,
    conditionB: /trisomy\s*21|down\s+syndrome/i,
    reason:
      "Isolated short femur has many benign explanations. It is only significant for Trisomy 21 " +
      "in combination with other markers. Short femur alone cannot imply chromosomal anomaly.",
  },
  {
    conditionA: /cystic\s+hygroma/i,
    conditionB: /trisomy\s*21|down\s+syndrome|turner/i,
    reason:
      "Cystic hygroma is associated with multiple chromosomal and structural conditions. " +
      "It cannot independently imply a specific chromosomal diagnosis without karyotype or other markers.",
  },
  {
    conditionA: /aortic\s+stenosis|bicuspid\s+aortic\s+valve/i,
    conditionB: /turner\s+syndrome/i,
    reason:
      "Bicuspid aortic valve has high prevalence in the general population. " +
      "Turner syndrome requires other clinical features. BAV alone cannot imply Turner syndrome.",
  },
  {
    conditionA: /pancreatic\s+(mass|lesion|tumour|cyst)/i,
    conditionB: /multiple\s+endocrine\s+neoplasia|men\s*[12]/i,
    reason:
      "A single pancreatic lesion on imaging cannot imply MEN syndrome, which requires " +
      "multi-glandular involvement. MEN requires clinical and biochemical confirmation.",
  },
  {
    conditionA: /liver\s+(mass|lesion|haemangioma|lesions)/i,
    conditionB: /metastasis|metastatic|malignancy/i,
    reason:
      "A liver lesion cannot automatically be labelled metastatic without primary tumour context " +
      "and contrast-enhancement pattern assessment. Isolated lesion ≠ metastasis.",
  },
  {
    conditionA: /ventricular\s+septal\s+defect|vsd/i,
    conditionB: /coarctation\s+of\s+(?:the\s+)?aorta/i,
    reason:
      "VSD and coarctation co-occur in some datasets but are distinct lesions requiring " +
      "independent evidence. VSD alone cannot imply coarctation without direct aortic arch assessment.",
  },
];

// ── Helper: detect syndrome name in finding text ──────────────────────────

function detectSyndromeClaims(findings: UltraGuardedFinding[]): string[] {
  const claimed: string[] = [];
  const allText = findings.map((f) => `${f.label} ${f.description}`).join(" ");

  for (const syndrome of SYNDROME_DICTIONARY) {
    const allAliases = [syndrome.name, ...syndrome.aliases];
    if (allAliases.some((alias) => new RegExp(alias, "i").test(allText))) {
      claimed.push(syndrome.name);
    }
  }
  return claimed;
}

// ── Helper: count supporting markers present in findings ──────────────────

function countPresentMarkers(
  findings: UltraGuardedFinding[],
  markers: string[]
): string[] {
  const allText = findings
    .map((f) => `${f.label} ${f.description} ${f.evidence.map((e) => e.description).join(" ")}`)
    .join(" ")
    .toLowerCase();

  return markers.filter((m) => allText.includes(m.toLowerCase()));
}

// ── Main guard function ────────────────────────────────────────────────────

export interface SyndromeGuardResult {
  syndromeClusterResult: SyndromeClusterResult;
  violations: GuardViolation[];
  downgrades: ConfidenceDowngrade[];
  sanitizedFindings: UltraGuardedFinding[];
}

export function runSyndromeClusterGuard(
  findings: UltraGuardedFinding[]
): SyndromeGuardResult {
  const violations: GuardViolation[] = [];
  const downgrades: ConfidenceDowngrade[] = [];
  let sanitizedFindings = [...findings];

  const validatedSyndromes: string[] = [];
  const blockedSyndromes: string[] = [];
  const blockedReasons: Record<string, string> = {};
  const spuriousPairsFound: SyndromeClusterResult["spuriousPairsFound"] = [];

  // ── 1. Validate named syndrome claims ─────────────────────────────────

  const claimedSyndromes = detectSyndromeClaims(findings);

  for (const syndromeName of claimedSyndromes) {
    const def = SYNDROME_DICTIONARY.find((d) => d.name === syndromeName);
    if (!def) continue;

    const presentRequired = countPresentMarkers(findings, def.requiredMarkers);
    const presentSupporting = countPresentMarkers(findings, def.supportingMarkers);

    const missingRequired = def.requiredMarkers.filter(
      (m) => !presentRequired.includes(m)
    );

    const isBlocked =
      missingRequired.length > 0 ||
      presentSupporting.length < def.minimumSupportingCount;

    if (isBlocked) {
      const reason =
        missingRequired.length > 0
          ? `Required markers missing from evidence: ${missingRequired.join(", ")}. ` +
            `Found only ${presentSupporting.length}/${def.minimumSupportingCount} supporting markers ` +
            `(${presentSupporting.join(", ") || "none"}).`
          : `Only ${presentSupporting.length} of minimum ${def.minimumSupportingCount} supporting markers ` +
            `found (${presentSupporting.join(", ")}). Insufficient evidence to claim ${syndromeName}.`;

      blockedSyndromes.push(syndromeName);
      blockedReasons[syndromeName] = reason;

      violations.push({
        layer: "syndrome_cluster_guard",
        severity: "BLOCK",
        code: `SYNDROME_INSUFFICIENT_MARKERS_${syndromeName.toUpperCase().replace(/\s+/g, "_")}`,
        message:
          `Syndrome claim "${syndromeName}" BLOCKED: ${reason} ` +
          `This syndrome requires all required markers to be independently evidenced in the image. ` +
          `Training data co-occurrence is NOT sufficient evidence.`,
        affectedClaim: syndromeName,
        suggestedFix:
          `Instead of claiming ${syndromeName}, list the individual findings you DO observe ` +
          `and note that clinical genetics/chromosomal assessment is required.`,
      });

      // Remove syndrome claims from findings
      sanitizedFindings = sanitizedFindings.map((f) => {
        const mentionsSyndrome = new RegExp(
          [def.name, ...def.aliases].join("|"),
          "gi"
        ).test(`${f.label} ${f.description}`);

        if (!mentionsSyndrome) return f;

        const newCaveats = [
          ...f.caveats,
          `Syndrome claim "${syndromeName}" removed: insufficient imaging evidence (${reason}). ` +
            `List individual findings only. Refer for specialist assessment.`,
        ];
        const newDesc = f.description
          .replace(new RegExp([def.name, ...def.aliases].join("|"), "gi"), "[syndrome claim removed]");

        return {
          ...f,
          description: newDesc,
          caveats: newCaveats,
        };
      });
    } else {
      validatedSyndromes.push(syndromeName);
      violations.push({
        layer: "syndrome_cluster_guard",
        severity: "INFO",
        code: `SYNDROME_VALIDATED_${syndromeName.toUpperCase().replace(/\s+/g, "_")}`,
        message: `Syndrome claim "${syndromeName}" passed cluster guard (${presentSupporting.length}/${def.minimumSupportingCount} markers found).`,
      });
    }
  }

  // ── 2. Check spurious co-occurrence pairs ─────────────────────────────

  const combinedText = findings
    .map((f) => `${f.label} ${f.description}`)
    .join(" ");

  for (const { conditionA, conditionB, reason } of SPURIOUS_CO_OCCURRENCE_PAIRS) {
    const hasA = conditionA.test(combinedText);
    const hasB = conditionB.test(combinedText);

    if (hasA && hasB) {
      // Both conditions are claimed — verify B has INDEPENDENT evidence
      const conditionBFinding = findings.find((f) =>
        conditionB.test(`${f.label} ${f.description}`)
      );

      // If B's finding has no direct image evidence (only co-occurrence implied)
      const bHasDirectEvidence =
        conditionBFinding &&
        conditionBFinding.evidence.length > 0 &&
        conditionBFinding.evidence.some((e) => {
          // Check if the evidence description specifically mentions something
          // identifiable as evidence for B (not just generic)
          return (
            e.description.trim().length > 20 &&
            !conditionA.test(e.description) // Not just referencing condition A's evidence
          );
        });

      if (!bHasDirectEvidence) {
        spuriousPairsFound.push({
          pair: [conditionA.source, conditionB.source],
          reason,
        });

        violations.push({
          layer: "syndrome_cluster_guard",
          severity: "BLOCK",
          code: "SPURIOUS_CO_OCCURRENCE",
          message:
            `Spurious co-occurrence detected: Found ${conditionA.source} AND ${conditionB.source} ` +
            `but "${conditionB.source}" appears to lack independent image evidence. ` +
            reason,
          affectedClaim: `${conditionA.source} + ${conditionB.source}`,
          suggestedFix:
            `Condition B (${conditionB.source}) requires its own independent anatomical evidence, ` +
            `not inferred from training data co-occurrence with Condition A.`,
        });

        // Downgrade any findings that mention condition B
        sanitizedFindings = sanitizedFindings.map((f) => {
          if (!conditionB.test(`${f.label} ${f.description}`)) return f;
          const newCaveats = [
            ...f.caveats,
            `Spurious co-occurrence warning: This condition was detected alongside ` +
              `${conditionA.source} but lacks independent image evidence. ` +
              `AI models learn associations from literature; this may be a knowledge-injection ` +
              `hallucination. ${reason}`,
          ];
          const prevConf = f.confidence;
          const newConf: UltraGuardedFinding["confidence"] =
            f.confidence === "HIGH" || f.confidence === "MODERATE" ? "LOW" : f.confidence;

          if (prevConf !== newConf) {
            downgrades.push({
              findingId: f.id,
              from: prevConf,
              to: newConf,
              reason: `Spurious co-occurrence: ${reason}`,
              triggeredByLayer: "syndrome_cluster_guard",
            });
          }

          return { ...f, confidence: newConf, caveats: newCaveats };
        });
      }
    }
  }

  const syndromeClusterResult: SyndromeClusterResult = {
    syndromesClaimed: claimedSyndromes,
    validated: validatedSyndromes,
    blocked: blockedSyndromes,
    blockedReasons,
    spuriousPairsFound,
  };

  return {
    syndromeClusterResult,
    violations,
    downgrades,
    sanitizedFindings,
  };
}

