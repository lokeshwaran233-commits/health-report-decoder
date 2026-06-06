import type { ClinicalPattern } from "./types";

export const CLINICAL_PATTERNS: ClinicalPattern[] = [
  {
    id: "microcytic_hypochromic_anemia",
    displayName: "Possible Microcytic Hypochromic Anemia Pattern",
    requiredCount: 3,
    requiredCriteria: [
      {
        biomarkerPattern: "hemoglobin",
        requiredStatus: ["low", "critical_low"],
        explanation:
          "Hb low — indicates reduced oxygen-carrying capacity",
      },
      {
        biomarkerPattern: "mcv",
        requiredStatus: ["low", "critical_low"],
        explanation:
          "MCV low — red cells are smaller than normal (microcytic)",
      },
      {
        biomarkerPattern: "mchc",
        requiredStatus: ["low", "critical_low"],
        explanation:
          "MCHC low — red cells have less hemoglobin concentration (hypochromic)",
      },
    ],
    supportingCriteria: [
      {
        biomarkerPattern: "mch",
        requiredStatus: ["low", "critical_low"],
        explanation: "MCH low — further supports reduced hemoglobin per cell",
      },
      {
        biomarkerPattern: "rdw",
        requiredStatus: ["high", "critical_high"],
        explanation: "RDW elevated — suggests variation in red cell sizes",
      },
    ],
    conflictingCriteria: [
      {
        biomarkerPattern: "mcv",
        requiredStatus: ["normal", "high", "critical_high"],
        explanation:
          "MCV normal or high — CONFLICTS with microcytic classification",
      },
    ],
    confirmationTests: [
      "Serum Ferritin",
      "Serum Iron",
      "TIBC / Transferrin Saturation",
      "Peripheral Blood Smear",
    ],
    clinicalUrgency: 3,
    patientNote:
      "Your red blood cells appear smaller and paler than normal. This pattern can happen for several reasons, most commonly low iron. Your doctor will likely recommend an iron study panel to confirm the cause.",
    canConcludeAt: "MODERATE",
  },
  {
    id: "normocytic_anemia",
    displayName: "Possible Normocytic Anemia Pattern",
    requiredCount: 2,
    requiredCriteria: [
      {
        biomarkerPattern: "hemoglobin",
        requiredStatus: ["low", "critical_low"],
        explanation: "Hb low — reduced oxygen-carrying capacity",
      },
      {
        biomarkerPattern: "mcv",
        requiredStatus: ["normal"],
        explanation: "MCV normal — red cell size is preserved (normocytic)",
      },
    ],
    supportingCriteria: [
      {
        biomarkerPattern: "hematocrit",
        requiredStatus: ["low", "critical_low"],
        explanation: "Hematocrit reduced — consistent with anemia",
      },
    ],
    conflictingCriteria: [
      {
        biomarkerPattern: "mcv",
        requiredStatus: ["low", "critical_low"],
        explanation:
          "MCV low — if present, microcytic pattern applies instead",
      },
    ],
    confirmationTests: [
      "Reticulocyte Count",
      "Serum Ferritin",
      "Vitamin B12",
      "Folate",
      "Kidney Function Tests",
    ],
    clinicalUrgency: 3,
    patientNote:
      "Hemoglobin is reduced but red cell size appears normal. This type of anemia has several causes — your doctor will likely run additional tests to determine the cause.",
    canConcludeAt: "MODERATE",
  },
  {
    id: "macrocytic_anemia",
    displayName: "Possible Macrocytic Anemia Pattern",
    requiredCount: 2,
    requiredCriteria: [
      {
        biomarkerPattern: "hemoglobin",
        requiredStatus: ["low", "critical_low"],
        explanation: "Hb low — reduced oxygen-carrying capacity",
      },
      {
        biomarkerPattern: "mcv",
        requiredStatus: ["high", "critical_high"],
        explanation:
          "MCV high — red cells are larger than normal (macrocytic)",
      },
    ],
    supportingCriteria: [
      {
        biomarkerPattern: "rdw",
        requiredStatus: ["high"],
        explanation: "RDW elevated — variable cell sizes",
      },
    ],
    conflictingCriteria: [],
    confirmationTests: [
      "Vitamin B12 level",
      "Folate level",
      "Reticulocyte Count",
      "Peripheral Blood Smear",
      "Thyroid Function Tests",
    ],
    clinicalUrgency: 3,
    patientNote:
      "Hemoglobin is low and red blood cells appear larger than usual. This often points to a vitamin B12 or folate deficiency.",
    canConcludeAt: "MODERATE",
  },
  {
    id: "leukocytosis_neutrophilia",
    displayName: "Elevated White Blood Cell Count Pattern",
    requiredCount: 2,
    requiredCriteria: [
      {
        biomarkerPattern: "wbc",
        requiredStatus: ["high", "critical_high"],
        explanation: "WBC elevated — total white cell count above normal",
      },
      {
        biomarkerPattern: /neutrophils/,
        requiredStatus: ["high", "critical_high"],
        explanation:
          "Neutrophils elevated — the most common WBC type is raised",
      },
    ],
    supportingCriteria: [],
    conflictingCriteria: [
      {
        biomarkerPattern: "wbc",
        requiredStatus: ["normal", "low"],
        explanation: "WBC normal or low — does not support leukocytosis",
      },
    ],
    confirmationTests: [
      "CRP (C-Reactive Protein)",
      "ESR",
      "Peripheral Blood Smear",
      "Blood Culture if fever present",
    ],
    clinicalUrgency: 4,
    patientNote:
      "Your white blood cell count is elevated, with neutrophils being the primary driver. This is most often seen with bacterial infections or inflammation.",
    canConcludeAt: "MODERATE",
  },
  {
    id: "thrombocytosis",
    displayName: "Elevated Platelet Count Pattern",
    requiredCount: 1,
    requiredCriteria: [
      {
        biomarkerPattern: "platelets",
        requiredStatus: ["high", "critical_high"],
        explanation: "Platelets elevated above the reference range",
      },
    ],
    supportingCriteria: [
      {
        biomarkerPattern: "wbc",
        requiredStatus: ["high"],
        explanation:
          "WBC also elevated — may suggest reactive thrombocytosis",
      },
    ],
    conflictingCriteria: [],
    confirmationTests: [
      "CRP",
      "ESR",
      "Peripheral Blood Smear",
      "Repeat CBC in 4-6 weeks",
    ],
    clinicalUrgency: 2,
    patientNote:
      "Your platelet count is higher than normal. This is often a reactive response to infection or inflammation.",
    canConcludeAt: "HIGH",
  },
  {
    id: "eosinophilia",
    displayName: "Elevated Eosinophil Pattern",
    requiredCount: 1,
    requiredCriteria: [
      {
        biomarkerPattern: /eosinophil/,
        requiredStatus: ["high", "critical_high"],
        explanation: "Eosinophils elevated above reference range",
      },
    ],
    supportingCriteria: [],
    conflictingCriteria: [],
    confirmationTests: [
      "Stool examination (ova and parasites)",
      "IgE levels",
      "Allergy panel if clinically indicated",
    ],
    clinicalUrgency: 2,
    patientNote:
      "Eosinophils are slightly elevated. This can occur with allergic conditions, certain medications, or parasitic infections.",
    canConcludeAt: "HIGH",
  },
  {
    id: "hyperglycemia_pattern",
    displayName: "Elevated Blood Glucose Pattern",
    requiredCount: 1,
    requiredCriteria: [
      {
        biomarkerPattern: "glucose",
        requiredStatus: ["high", "critical_high"],
        explanation: "Blood glucose elevated above reference range",
      },
    ],
    supportingCriteria: [
      {
        biomarkerPattern: "hba1c",
        requiredStatus: ["high"],
        explanation:
          "HbA1c elevated — suggests sustained glucose elevation over 2-3 months",
      },
    ],
    conflictingCriteria: [],
    confirmationTests: [
      "Fasting glucose repeat",
      "HbA1c",
      "Post-meal glucose (2-hour OGTT)",
    ],
    clinicalUrgency: 4,
    patientNote:
      "Blood glucose is above the normal range. A single elevated reading requires confirmation before any conclusions can be drawn.",
    canConcludeAt: "MODERATE",
  },
  {
    id: "dyslipidemia_pattern",
    displayName: "Lipid Abnormality Pattern",
    requiredCount: 1,
    requiredCriteria: [
      {
        biomarkerPattern: "cholesterol_total",
        requiredStatus: ["high", "critical_high"],
        explanation: "Total cholesterol elevated",
      },
    ],
    supportingCriteria: [
      {
        biomarkerPattern: "ldl",
        requiredStatus: ["high"],
        explanation:
          "LDL cholesterol elevated — major cardiovascular risk factor",
      },
      {
        biomarkerPattern: "hdl",
        requiredStatus: ["low"],
        explanation:
          "HDL cholesterol low — increases cardiovascular risk",
      },
      {
        biomarkerPattern: "triglycerides",
        requiredStatus: ["high"],
        explanation:
          "Triglycerides elevated — associated with cardiovascular risk",
      },
    ],
    conflictingCriteria: [],
    confirmationTests: [
      "Fasting lipid panel repeat",
      "Cardiovascular risk assessment",
    ],
    clinicalUrgency: 3,
    patientNote:
      "One or more cholesterol values are outside the recommended range. Your doctor will assess these in the context of your overall cardiovascular risk profile.",
    canConcludeAt: "MODERATE",
  },
];
