import type { BiomarkerPolarity } from "./types";

export const BIOMARKER_POLARITY: Record<string, BiomarkerPolarity> = {
  hdl_cholesterol: "higher_better",
  hdl: "higher_better",
  hemoglobin: "higher_better",
  vitamin_d: "higher_better",
  vitamin_b12: "higher_better",
  ferritin: "higher_better",
  rbc: "higher_better",

  ldl_cholesterol: "lower_better",
  ldl: "lower_better",
  total_cholesterol: "lower_better",
  cholesterol_total: "lower_better",
  hba1c: "lower_better",
  fasting_glucose: "lower_better",
  glucose: "lower_better",
  crp: "lower_better",
  uric_acid: "lower_better",
  triglycerides: "lower_better",

  tsh: "in_range",
  creatinine: "in_range",
  sodium: "in_range",
  potassium: "in_range",
  bilirubin: "in_range",
  alt: "in_range",
  ast: "in_range",
};

export function polarityFor(normalizedName: string): BiomarkerPolarity {
  return BIOMARKER_POLARITY[normalizedName] ?? "in_range";
}
