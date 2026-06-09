import type { HealthIntent, IntentConfig } from "./types";

export const INTENT_CONFIG: Record<HealthIntent, IntentConfig> = {
  cholesterol_heart: {
    id: "cholesterol_heart",
    label: "Cholesterol & heart health",
    sublabel: "LDL, HDL, triglycerides, cardiac markers",
    icon: "♥",
    primaryBiomarkers: ["ldl", "hdl", "cholesterol_total", "triglycerides"],
    outputMode: "action_focused",
    systemPromptHint:
      "User is specifically interested in cardiovascular health. Emphasize lipid panel findings and cardiac risk context first.",
  },
  blood_sugar_diabetes: {
    id: "blood_sugar_diabetes",
    label: "Blood sugar & diabetes risk",
    sublabel: "Glucose, HbA1c, insulin markers",
    icon: "◈",
    primaryBiomarkers: ["glucose", "hba1c"],
    outputMode: "action_focused",
    systemPromptHint:
      "User is specifically interested in metabolic/blood sugar health. Lead with glucose and HbA1c findings.",
  },
  thyroid: {
    id: "thyroid",
    label: "Thyroid levels",
    sublabel: "TSH, T3, T4 — thyroid function",
    icon: "⊕",
    primaryBiomarkers: ["tsh", "t3", "t4", "ft4"],
    outputMode: "standard",
    systemPromptHint:
      "User is specifically asking about thyroid function. Emphasize thyroid panel above all other findings.",
  },
  full_blood_count: {
    id: "full_blood_count",
    label: "Full blood count",
    sublabel: "Haemoglobin, WBC, platelets, anaemia",
    icon: "⊞",
    primaryBiomarkers: ["hemoglobin", "wbc", "platelets", "rbc"],
    outputMode: "standard",
    systemPromptHint:
      "User wants to understand their CBC/FBC. Lead with haemoglobin, WBC, and platelet findings.",
  },
  liver_kidney: {
    id: "liver_kidney",
    label: "Liver or kidney function",
    sublabel: "ALT, AST, creatinine, urea",
    icon: "◉",
    primaryBiomarkers: ["alt", "ast", "creatinine", "urea"],
    outputMode: "standard",
    systemPromptHint:
      "User wants to understand liver and kidney function markers. Prioritize liver enzymes and kidney function indicators.",
  },
  everything: {
    id: "everything",
    label: "Everything — full analysis",
    sublabel: "Complete report breakdown",
    icon: "✦",
    primaryBiomarkers: [],
    outputMode: "standard",
    systemPromptHint:
      "User wants a comprehensive analysis of all markers. Provide a balanced overview prioritized by clinical urgency.",
  },
  worried_about_results: {
    id: "worried_about_results",
    label: "I have unusual results and I'm worried",
    sublabel: "Focused on your specific concerns",
    icon: "!",
    primaryBiomarkers: [],
    outputMode: "action_focused",
    systemPromptHint:
      "User is anxious about their results. Be calm, clear, and honest. Acknowledge concerns without catastrophising. Lead with what is normal before addressing what is not.",
  },
  already_managing: {
    id: "already_managing",
    label: "Checking in on something I'm managing",
    sublabel: "Monitoring progress over time",
    icon: "↻",
    primaryBiomarkers: [],
    outputMode: "monitoring",
    systemPromptHint:
      "User is monitoring an ongoing condition. Focus on change from previous values and progress tracking. Compare with any prior context available.",
  },
  doctor_appointment: {
    id: "doctor_appointment",
    label: "Preparing for a doctor appointment",
    sublabel: "Get your questions ready",
    icon: "⚕",
    primaryBiomarkers: [],
    outputMode: "doctor_brief",
    systemPromptHint:
      "User is preparing for a medical consultation. Generate a clear Doctor Appointment Brief: 3 key discussion points, pre-prepared questions, abnormal findings summary for the doctor.",
  },
};
