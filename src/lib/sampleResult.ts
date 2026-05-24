import type { AnalysisResult } from "@/types/report";

export function buildSampleResult(): AnalysisResult {
  return {
    id: `sample-${Date.now()}`,
    metadata: {
      patientName: "Priya Sharma",
      reportDate: new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      labName: "Thyrocare Technologies Ltd.",
      uploadedAt: new Date().toISOString(),
    },
    biomarkers: [
      {
        id: "sample-hb",
        name: "Haemoglobin",
        value: 10.8,
        unit: "g/dL",
        referenceRange: { low: 12, high: 16 },
        status: "flagged",
        category: "blood",
        plainEnglish:
          "Slightly below normal — may indicate mild anaemia and could explain fatigue.",
        deepExplanation:
          "Haemoglobin carries oxygen from your lungs to the rest of your body. Low values combined with a low MCV strongly point toward iron-deficiency anaemia, which is very common and very treatable.",
      },
      {
        id: "sample-mcv",
        name: "MCV",
        value: 74.2,
        unit: "fL",
        referenceRange: { low: 80, high: 100 },
        status: "flagged",
        category: "blood",
        plainEnglish:
          "Below normal — your red blood cells are smaller than expected.",
        deepExplanation:
          "MCV (mean corpuscular volume) tells you the average size of your red blood cells. Low MCV alongside low haemoglobin is a classic pattern for iron deficiency.",
      },
      {
        id: "sample-mch",
        name: "MCH",
        value: 22.1,
        unit: "pg",
        referenceRange: { low: 27, high: 32 },
        status: "flagged",
        category: "blood",
        plainEnglish:
          "Below the normal range — supports the iron-deficiency picture seen elsewhere in your CBC.",
        deepExplanation:
          "MCH measures the average amount of haemoglobin per red blood cell. Combined with low MCV, this strongly suggests iron deficiency anaemia.",
      },
      {
        id: "sample-wbc",
        name: "Total WBC Count",
        value: 7200,
        unit: "cells/uL",
        referenceRange: { low: 4000, high: 11000 },
        status: "normal",
        category: "blood",
        plainEnglish: "Right in the middle of the normal range — no infection signal here.",
        deepExplanation:
          "White blood cells are your immune system's foot soldiers. A normal count rules out most active infections or inflammatory processes.",
      },
      {
        id: "sample-plt",
        name: "Platelet Count",
        value: 245000,
        unit: "/uL",
        referenceRange: { low: 150000, high: 400000 },
        status: "normal",
        category: "blood",
        plainEnglish: "Normal — your blood is clotting as expected.",
        deepExplanation:
          "Platelets are the cells that form clots when you bleed. This value confirms there's no bleeding or clotting concern.",
      },
      {
        id: "sample-ast",
        name: "SGOT / AST",
        value: 52,
        unit: "U/L",
        referenceRange: { low: 10, high: 40 },
        status: "watch",
        category: "liver",
        plainEnglish:
          "Mildly elevated — your liver is showing a small stress signal worth tracking.",
        deepExplanation:
          "AST is an enzyme released when liver cells are stressed or damaged. Small elevations can come from medications, exercise, or early fatty liver and should be rechecked.",
      },
      {
        id: "sample-alt",
        name: "SGPT / ALT",
        value: 38,
        unit: "U/L",
        referenceRange: { low: 7, high: 40 },
        status: "normal",
        category: "liver",
        plainEnglish: "Within the normal range — no significant liver-cell injury.",
        deepExplanation:
          "ALT is the most specific marker for liver inflammation. A normal ALT alongside a slightly raised AST often points to a non-liver source like muscle.",
      },
      {
        id: "sample-bili",
        name: "Total Bilirubin",
        value: 0.9,
        unit: "mg/dL",
        referenceRange: { low: 0.2, high: 1.2 },
        status: "normal",
        category: "liver",
        plainEnglish: "Normal — your liver is clearing bilirubin properly.",
        deepExplanation:
          "Bilirubin is a waste product from broken-down red blood cells, processed by the liver. Normal values rule out jaundice and most bile-duct issues.",
      },
      {
        id: "sample-tsh",
        name: "TSH",
        value: 4.8,
        unit: "uIU/mL",
        referenceRange: { low: 0.4, high: 4.0 },
        status: "watch",
        category: "thyroid",
        plainEnglish:
          "Slightly above the upper limit — your thyroid may be working a bit harder than usual.",
        deepExplanation:
          "TSH signals your thyroid gland to produce hormones. Mildly elevated TSH can indicate early (subclinical) hypothyroidism, especially if you have fatigue, weight gain or cold intolerance.",
      },
      {
        id: "sample-vitd",
        name: "Vitamin D (25-OH)",
        value: 14.2,
        unit: "ng/mL",
        referenceRange: { low: 30, high: 100 },
        status: "flagged",
        category: "vitamin",
        plainEnglish:
          "Significantly below normal — Vitamin D deficiency is very common and very treatable.",
        deepExplanation:
          "Vitamin D is essential for bone health, immune function, and mood. Levels below 20 ng/mL are classified as deficient by most clinical guidelines and usually need supplementation.",
      },
      {
        id: "sample-hba1c",
        name: "HbA1c",
        value: 5.4,
        unit: "%",
        referenceRange: { low: 4.0, high: 5.6 },
        status: "normal",
        category: "metabolic",
        plainEnglish: "Normal — your average blood sugar over the last 3 months is in range.",
        deepExplanation:
          "HbA1c reflects your average blood-glucose level over roughly 3 months. A value under 5.7% is non-diabetic; 5.7–6.4% is pre-diabetes.",
      },
      {
        id: "sample-creat",
        name: "Serum Creatinine",
        value: 0.8,
        unit: "mg/dL",
        referenceRange: { low: 0.6, high: 1.1 },
        status: "normal",
        category: "kidney",
        plainEnglish: "Normal — your kidneys are filtering well.",
        deepExplanation:
          "Creatinine is a waste product filtered by the kidneys. Normal values suggest your kidney function is healthy at this time.",
      },
    ],
    summary:
      "Your results point most strongly toward iron-deficiency anaemia: haemoglobin, MCV, and MCH are all low together, which is a classic pattern and almost certainly explains any tiredness or breathlessness you've been noticing. The good news is this is one of the most treatable findings on a blood test.\n\nYour Vitamin D level is significantly below normal at 14.2 ng/mL, which is in the deficient range — this is very common in India and typically improves quickly with supplementation and a bit more sunlight. Your TSH is mildly above the cutoff at 4.8, which can be early thyroid underactivity and is worth a recheck in 6–8 weeks alongside Free T4.\n\nLiver, kidney, sugar control, white cells, and platelets all look reassuring, so the overall picture is a clear set of correctable nutritional and hormonal issues rather than anything urgent.",
    doctorQuestions: [
      "Given my Hb of 10.8 with low MCV (74.2) and low MCH (22.1), should I check ferritin and iron studies to confirm iron-deficiency anaemia?",
      "My Vitamin D is 14.2 ng/mL — what dose and duration of supplementation do you recommend, and when should I recheck?",
      "TSH is 4.8 with no Free T4 on this panel — can we add Free T4 and anti-TPO antibodies and repeat in 6–8 weeks?",
      "AST is 52 with a normal ALT — could this be from exercise or medication, and do we need to repeat liver function tests?",
      "Are there dietary changes specific to my iron and Vitamin D status you'd recommend before starting supplements?",
    ],
  };
}

export default buildSampleResult;
