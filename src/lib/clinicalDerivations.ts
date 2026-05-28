import type { AnalysisResult, Biomarker } from "@/types/report";

/**
 * Pure client-side derivations layered on top of the AI output.
 * The model isn't asked to do arithmetic — we compute and inject
 * derived biomarkers (HOMA-IR, Anion Gap) so they render and
 * participate in pattern recognition like any other marker.
 */

const NAME_ALIASES: Record<string, string[]> = {
  glucose: ["fasting glucose", "glucose fasting", "fpg", "glucose"],
  insulin: ["fasting insulin", "insulin fasting", "insulin"],
  sodium: ["sodium", "na", "na+"],
  chloride: ["chloride", "cl", "cl-"],
  bicarbonate: ["bicarbonate", "hco3", "hco3-", "co2"],
};

function findBiomarker(
  biomarkers: Biomarker[],
  key: keyof typeof NAME_ALIASES,
): Biomarker | undefined {
  const aliases = NAME_ALIASES[key];
  return biomarkers.find((b) => {
    const n = b.name.toLowerCase().trim();
    return aliases.some((a) => n === a || n.includes(a));
  });
}

function statusFromRange(
  value: number,
  low: number,
  high: number,
): Biomarker["status"] {
  if (value < low * 0.9 || value > high * 1.1) return "flagged";
  if (value < low || value > high) return "watch";
  return "normal";
}

function makeDerivedId(key: string): string {
  return `derived-${key}-${Math.random().toString(36).slice(2, 8)}`;
}

/** HOMA-IR = (Fasting Glucose mg/dL × Fasting Insulin μIU/mL) / 405 */
export function computeHomaIR(biomarkers: Biomarker[]): Biomarker | null {
  const glucose = findBiomarker(biomarkers, "glucose");
  const insulin = findBiomarker(biomarkers, "insulin");
  if (!glucose || !insulin) return null;
  if (!Number.isFinite(glucose.value) || !Number.isFinite(insulin.value))
    return null;

  const value = Math.round(((glucose.value * insulin.value) / 405) * 100) / 100;
  const status: Biomarker["status"] =
    value > 5 ? "flagged" : value > 2.5 ? "watch" : "normal";

  const plain =
    status === "normal"
      ? "Your HOMA-IR is in the healthy range — your cells appear to be responding to insulin normally."
      : status === "watch"
        ? "Your HOMA-IR is mildly elevated, suggesting early insulin resistance. Lifestyle changes can often reverse this."
        : "Your HOMA-IR indicates significant insulin resistance — an important early marker of Type 2 diabetes risk to discuss with your doctor.";

  return {
    id: makeDerivedId("homa-ir"),
    name: "HOMA-IR",
    value,
    unit: "",
    referenceRange: { low: 0, high: 2.5 },
    status,
    category: "metabolic",
    plainEnglish: plain,
    deepExplanation:
      "HOMA-IR is computed from your fasting glucose and fasting insulin (Glucose × Insulin ÷ 405). Values above 2.5 suggest your cells are becoming less responsive to insulin — a key marker for metabolic syndrome and pre-diabetes.",
    criticalFlag: false,
    derived: true,
  };
}

/** Anion Gap = Na − (Cl + HCO3). Normal: 8–12 mEq/L. */
export function computeAnionGap(biomarkers: Biomarker[]): Biomarker | null {
  const na = findBiomarker(biomarkers, "sodium");
  const cl = findBiomarker(biomarkers, "chloride");
  const hco3 = findBiomarker(biomarkers, "bicarbonate");
  if (!na || !cl || !hco3) return null;
  if (
    !Number.isFinite(na.value) ||
    !Number.isFinite(cl.value) ||
    !Number.isFinite(hco3.value)
  )
    return null;

  const value = Math.round((na.value - (cl.value + hco3.value)) * 10) / 10;
  const status = statusFromRange(value, 8, 12);

  const plain =
    value > 12
      ? "Your anion gap is elevated, which can suggest a high anion gap metabolic acidosis. Common causes include diabetic ketoacidosis, kidney issues, or lactic acidosis."
      : value < 8
        ? "Your anion gap is lower than typical — usually not concerning on its own but worth context with the rest of your electrolytes."
        : "Your calculated anion gap is in the normal range, suggesting balanced acid-base chemistry.";

  return {
    id: makeDerivedId("anion-gap"),
    name: "Anion Gap",
    value,
    unit: "mEq/L",
    referenceRange: { low: 8, high: 12 },
    status,
    category: "electrolyte",
    plainEnglish: plain,
    deepExplanation:
      "The anion gap is calculated as sodium minus the sum of chloride and bicarbonate. It helps identify hidden acids in the blood and is a key step in classifying acid-base disorders.",
    criticalFlag: false,
    derived: true,
  };
}

/** Inject all derived biomarkers into the result (idempotent by name). */
export function withDerivedBiomarkers(result: AnalysisResult): AnalysisResult {
  const existing = new Set(
    result.biomarkers.map((b) => b.name.toLowerCase().trim()),
  );
  const candidates = [
    computeHomaIR(result.biomarkers),
    computeAnionGap(result.biomarkers),
  ].filter((b): b is Biomarker => b !== null);

  const additions = candidates.filter(
    (b) => !existing.has(b.name.toLowerCase().trim()),
  );

  if (additions.length === 0) return result;
  return { ...result, biomarkers: [...result.biomarkers, ...additions] };
}
