import type { Biomarker } from "@/types/report";
import type { ZenoEmergencyAlert } from "./types";

/**
 * Lightweight emergency threshold table. Conservative — flags only universally
 * accepted critical values. Always advises seeking immediate medical attention.
 */
const RULES: Record<
  string,
  { critical: (v: number) => boolean; label: string; advice: string }
> = {
  hemoglobin: {
    critical: (v) => v < 7,
    label: "Hb < 7 g/dL (severe anemia)",
    advice: "Severe anemia — contact a doctor or visit emergency care today.",
  },
  haemoglobin: {
    critical: (v) => v < 7,
    label: "Hb < 7 g/dL (severe anemia)",
    advice: "Severe anemia — contact a doctor or visit emergency care today.",
  },
  glucose: {
    critical: (v) => v > 400 || v < 50,
    label: "Glucose out of safe range",
    advice:
      "Glucose is at a dangerous level — seek urgent medical care immediately.",
  },
  potassium: {
    critical: (v) => v > 6.5 || v < 2.8,
    label: "Potassium critical",
    advice:
      "Critical potassium level can affect heart rhythm — go to the emergency room now.",
  },
  sodium: {
    critical: (v) => v < 120 || v > 160,
    label: "Sodium critical",
    advice: "Sodium level is critically abnormal — seek emergency care now.",
  },
  creatinine: {
    critical: (v) => v > 4,
    label: "Creatinine very high",
    advice:
      "Severely elevated creatinine suggests acute kidney issues — see a doctor today.",
  },
  troponin: {
    critical: (v) => v > 0.04,
    label: "Troponin elevated",
    advice:
      "Elevated troponin can indicate cardiac injury — call emergency services immediately.",
  },
};

export function detectEmergencies(biomarkers: Biomarker[]): ZenoEmergencyAlert[] {
  const out: ZenoEmergencyAlert[] = [];
  for (const b of biomarkers) {
    const key = b.name.toLowerCase().replace(/[^a-z]/g, "");
    for (const ruleKey of Object.keys(RULES)) {
      if (key.includes(ruleKey)) {
        const rule = RULES[ruleKey];
        if (rule.critical(b.value)) {
          out.push({
            biomarker: b.name,
            value: b.value,
            threshold: rule.label,
            severity: "critical",
            advice: rule.advice,
          });
        }
        break;
      }
    }
  }
  return out;
}
