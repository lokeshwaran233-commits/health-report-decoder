# Clinical Intelligence Expansion — Sprints 1–4

Deepen pattern recognition across Tiers S, A, and B. Every change flows through one pipeline: **AI prompt → JSON contract → `normalizeAnalysisResult` → typed `AnalysisResult` → results UI**. No new server functions; the existing `analyzeReport` does all the reasoning, the client renders the result.

## What ships

### 1. Expanded JSON contract from the AI
The model is asked to return three new arrays alongside the existing fields:
- `detectedPatterns` — multi-marker patterns the AI recognised (e.g. iron-deficiency triad, hypothyroid confirmed, anion-gap acidosis), each with the biomarker names involved, plain-English explanation, and severity.
- `followUpTests` — concrete next tests the user should ask their doctor about, with reason and urgency (`urgent`/`soon`/`routine`).
- `criticalFlag` on individual biomarkers — for the non-negotiable critical values list (troponin elevated, pH <7.2/>7.6, K+ <2.5/>6.5, Na+ <120/>155, glucose <50/>500, lactate >4, PaO2 <60).

### 2. New biomarker coverage (categories and rule sets)
- **Tier S deepening** — cross-panel rules already implicit in the prompt are made explicit: iron-deficiency vs B12 anaemia, AST/ALT ratio, kidney triad, diabetic pattern, hypothyroid baseline, severe Vit D reclassification.
- **A1 inflammation** — CRP, hsCRP, ESR with bacterial-vs-chronic-vs-cardiovascular bands.
- **A2 iron studies** — Ferritin, Serum Iron, TIBC, Transferrin Sat — IDA / ACD / overload patterns + the ferritin-as-acute-phase caveat when CRP is high.
- **A3 thyroid full panel** — FT4, FT3, Total T3/T4, anti-TPO, anti-TG — overt vs subclinical hypo, hyper, Hashimoto's, T3 toxicosis.
- **A4 coagulation** — PT, INR, aPTT, D-dimer, Fibrinogen — INR severity, liver-linked coagulopathy, DIC critical pattern.
- **A5 urine protein** — Urine Protein, UACR/Microalbumin, Urine Creatinine, 24-hr protein — microalbuminuria, diabetic-nephropathy combo, nephrotic-range flag.
- **B1 lipids + metabolic** — Total/LDL/HDL/Trig/VLDL/Non-HDL + ratios, Fasting Insulin, **HOMA-IR computed client-side** from fasting glucose × insulin / 405; atherogenic-dyslipidaemia and metabolic-syndrome (3-of-5) patterns.
- **B2 ABG** — pH, PaO2, PaCO2, HCO3, Base Excess, SaO2, Lactate — primary disorder + respiratory vs metabolic + hypoxaemia + sepsis combo.
- **B3 extended electrolytes** — Magnesium, Phosphate, Osmolality, **Anion Gap computed client-side** from `Na − (Cl + HCO3)`; high-AG acidosis, hypomagnesaemia-driven hypoK/hypoCa, gout, refeeding.

Two new categories are introduced in `BiomarkerCategory`: `"cardio"` (lipids, cardiac when reached) and `"coagulation"`. `"electrolyte"` is split out from `"kidney"` so anion-gap and Mg/Phos render in their own filter. The existing `"other"` fallback continues to absorb anything unmapped.

### 3. UI additions on the Results page
Three new sections render below `InsightsSection`, in this order:

1. **Critical values banner** — only when any biomarker has `criticalFlag: true`. Red-bordered card at the very top of the page (above `HealthScoreCard`) with text *"One or more of your results requires prompt medical attention. Please contact your doctor today."* and a list of the offending markers.
2. **Detected patterns** — `PatternsSection` showing one card per `detectedPattern` with severity-coloured left border (informational/watch/flagged/critical), the plain-English read, and the biomarker chips involved.
3. **Recommended follow-up tests** — `FollowUpTestsSection` rendering each test as a card with an urgency badge (`coral`/`amber`/`teal` for urgent/soon/routine), the reason, and a "Copy for doctor" button that copies a one-line message to the clipboard.

`CategoryFilterBar` gets the two new categories. `BiomarkerCard` gets a red ring + small pulsing dot when `criticalFlag` is true.

### 4. Backwards compatibility
Old reports already saved (cloud + localStorage) don't have the new fields. `normalizeAnalysisResult` defaults `detectedPatterns: []`, `followUpTests: []`, `criticalFlag: false`. The new sections render nothing when arrays are empty — so historical reports keep working unchanged.

## Files

**New**
- `src/components/results/CriticalValuesBanner.tsx`
- `src/components/results/PatternsSection.tsx`
- `src/components/results/FollowUpTestsSection.tsx`
- `src/lib/clinicalDerivations.ts` — pure functions: `computeHomaIR`, `computeAnionGap`, helpers to inject derived biomarkers into `AnalysisResult`.

**Edited**
- `src/types/report.ts` — add `DetectedPattern`, `FollowUpTest`, `criticalFlag?`, extend `BiomarkerCategory` with `"cardio" | "coagulation" | "electrolyte"`, extend `AnalysisResult` with `detectedPatterns` and `followUpTests`.
- `src/lib/normalizeAnalysis.ts` — parse + default the new fields, accept the new categories, coerce `criticalFlag` to boolean.
- `src/lib/analyze.functions.ts` — expand `SYSTEM_PROMPT` with the Tier S/A/B pattern catalogue, the critical-values rule, the new JSON contract, and the tumour-marker guardrails (kept now so they're not violated later); bump `max_tokens` to 6000 to fit the larger payload; call `clinicalDerivations` to add HOMA-IR and Anion Gap derived biomarkers after normalisation.
- `src/components/results/CategoryFilterBar.tsx` — labels for the new categories.
- `src/components/results/BiomarkerCard.tsx` — `criticalFlag` styling.
- `src/routes/results.tsx` — mount `CriticalValuesBanner` (top), `PatternsSection`, `FollowUpTestsSection` (below `InsightsSection`).
- `src/i18n/locales/{en,ta,hi,te}.json` — strings for the three new sections, urgency labels, critical banner copy.

## Technical details

```text
AI JSON contract (additions)

{
  "biomarkers": [
    { ...existing, "criticalFlag": boolean }
  ],
  "detectedPatterns": [
    {
      "name": "iron_deficiency_anaemia",
      "biomarkersInvolved": ["Haemoglobin", "MCV", "MCH"],
      "plainEnglish": "Low Hb together with low MCV and MCH...",
      "severity": "flagged"
    }
  ],
  "followUpTests": [
    {
      "test": "Ferritin, Serum Iron, TIBC",
      "reason": "To confirm iron deficiency suggested by your Hb/MCV/MCH pattern",
      "urgency": "soon"
    }
  ]
}
```

Communication guardrails baked into the prompt: never use the word "cancer" (kept for when C6 ships), never diagnose, always end abnormal summaries with an action, critical values get `criticalFlag: true` regardless of the lab's reference range.

Token budget: 6000 max_tokens on `google/gemini-2.5-flash` is enough for ~25 biomarkers plus patterns/follow-ups based on current payload sizes; if real-world reports overrun we'll switch to `google/gemini-2.5-pro` for the analysis call only.

Derived biomarkers (HOMA-IR, Anion Gap) are computed client-side after the AI returns, so the model isn't asked to do arithmetic. They're inserted into the `biomarkers` array with `category: "metabolic"` / `"electrolyte"`, a fixed reference range, and a short `plainEnglish` line, then they participate in pattern rendering like any other marker.

## Out of scope (deferred to Sprint 5+)

Tier C (cardiac, pancreatic, hormones, nutritional, autoimmune, tumour markers) and Tier D (risk-scoring engine, trend deterioration, clinician-assist mode). Those need their own planning round once the Tier A/B foundation is shipped and we've seen real reports flow through the new pattern pipeline.
