## Goal
Replace `src/lib/imagingSafety/pipeline.ts` with the upgraded version you pasted, which closes critical safety gaps in the modality-specific rules engine.

## What changes

Single file edit: `src/lib/imagingSafety/pipeline.ts`

### Safety upgrades (Phase 8)
- **Fix 3 — ECG hard blocks** (previously `warn`, now `block`):
  - STEMI / ST-elevation MI
  - VT / VF
  - Complete heart block / AV dissociation
  - Severe bradycardia (< 30–35 bpm)
  - QTc ≥ 500 ms
- **Fix 3c — CT/MRI hard blocks**:
  - Aortic dissection / intimal flap
  - Tension pneumothorax with mediastinal shift
  - Spinal cord compression / cauda equina / myelopathy signal
- **Fix 4 — ADC dependency**: brain MRI stroke/infarct findings without DWI/ADC evidence in the locator are blocked.
- **Fix 4b — PE contrast dependency**: CT PE findings without CTPA/contrast evidence are blocked.

### Mechanical change
`runSafetyRules` now takes `bodyRegion` as a second argument; orchestrator passes `input.bodyRegion` through. Adds `import type { BodyRegion } from "@/types/scan"`.

### Out of scope
- No changes to `imagingSafety.functions.ts`, `types.ts`, UI, or any other file.
- No new dependencies, no DB changes, no prompt changes.
- Legacy `/scan` flow unaffected (this file is only consumed by `/scan-v2`).

## Verification
- TypeScript build (auto-run by harness) confirms the `BodyRegion` import and new function signature compile.
- Manual `/scan-v2` smoke test still returns `defer` / `release_with_caveat` / `release` correctly for benign inputs (no regression — new rules only fire on matching text).

## Risk
Low. All new rules are additive `block`-severity hits that flow through the existing `decide()` deferral path. Worst case: a finding that would previously have released with a caveat now defers — which is the intended safety posture.