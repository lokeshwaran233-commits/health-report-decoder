# Fix: Production scans bypass the 12-phase safety pipeline

## Problem

`/scan` (production) calls `analyzeScan` in `src/lib/scanAnalysis.functions.ts`. It runs the vision model, normalizes the JSON, then only applies `runHallucinationGuard` from `src/lib/clinicalEngine/hallucinationGuard.ts` — a regex/keyword scrub. The full 12-phase pipeline in `src/lib/imagingSafety/pipeline.ts` (`runImagingSafetyPipeline`) exists but is only wired into `analyzeScanSafe` used by `/scan-v2`. Result: hard safety rules (STEMI block, PE-without-contrast block, ADC-dependency, anatomy mismatch, critic overreach removal, quality deferral, evidence grounding) never run in production.

## Fix

Make `analyzeScan` invoke `runImagingSafetyPipeline` on every scan and let its `decision` / calibrated findings drive what the user sees. Keep the existing UI contract (`ScanInterpretationResult`) so `/scan` and `scan-results` keep working — no client changes required.

## Steps

1. **`src/lib/scanAnalysis.functions.ts`** — after `normaliseScanResult`, before the hallucination guard:
   - Build `SafetyPipelineInput` from the parsed result: map `professional.findings` → `rawObservations.findings` (location → locator, description, significance, confidence from `aiConfidenceNote` band or default `MODERATE`); include `qualityHints` derived from `imageQualityNote` + `cannotAssess`; pass `modality`, `bodyRegion`, `imageBase64`, `mimeType`, `language`.
   - Call `runImagingSafetyPipeline(input, { modelChain: [model], promptText: systemPrompt })`.
   - Apply the verdict:
     - `decision === "defer"` with code `image_quality` / `input_rejected` → `fail("INADEQUATE_IMAGE", deferral.message)`.
     - `decision === "defer"` with `no_grounded_findings` / `critic_blocked` / `safety_block` → `fail("NO_DATA_FOUND", deferral.message)`.
     - `decision === "release_with_caveat"` → keep result, prepend caveat to `aiConfidenceNote`, merge `phases.safety` block/warn messages into `professional.limitations`, and add `phases.critic.removedFindingIds` removals by dropping matching items from `professional.findings` and `layman.keyFindings`.
   - Replace `layman.summary` / `layman.whatThisMeans` with `patientSummary` when the pipeline produced one; append `clinicianBrief` to `professional.impression` if non-empty.
   - Upgrade `result.criticalAlerts` with any `phases.safety` hits whose severity is `block`.

2. **Confidence mapping helper (inline)** — convert `professional` findings' confidence text to `HIGH|MODERATE|LOW|INSUFFICIENT` so the pipeline's evidence grounding + critic phases work; treat findings with no `location` as evidence-less (forces critic to flag).

3. **Keep `runHallucinationGuard`** as the final string-level scrub after the pipeline (defense in depth).

4. **Audit** — pass the existing `guardAndAudit` call unchanged. Additionally, persist the pipeline's `audit` entry to `guard_violations_log` with severity `block` when decision is `defer` or any `safety` hit is `block` (mirrors what `analyzeScanSafe` already does).

5. **No schema / UI changes** — `ScanInterpretationResult` shape is preserved; existing `scan-results.tsx` continues to render. `/scan-v2` and `analyzeScanSafe` stay as-is.

## Verification

- Build passes (route compiles, no new deps).
- Re-run `/scan` with a small/blurry test image → expect `INADEQUATE_IMAGE` from phase 2.
- Re-run with a CT PE prompt without contrast in `extra` → expect `release_with_caveat` and PE caveat surfaced in `aiConfidenceNote` / `limitations`.
- Existing happy-path scan still returns a normalised result with the same fields the UI reads.

## Out of scope

- UI work to render the full 12-phase report on `/scan` (already available on `/scan-v2`).
- Changing `analyzeScanSafe` or `/scan-v2`.
- Lab report pipeline.
