# Scan Decoder — Full Sprint Completion + All Modalities + Bug Sweep

## Goal

Make the Scan Decoder feature production-ready end-to-end:
1. Verify Sprints 1–3 (scaffold, text reports, X-Ray vision) actually run.
2. Activate the remaining 10 modalities (CT, MRI, Ultrasound, Echo, ECG, EEG, PET, Mammogram, DEXA, Nuclear) with modality-specific prompts and image vision.
3. Wire scans into History (separate tab).
4. Sweep for hidden bugs across the whole `/scan` flow.

## What ships

### 1. Modality-specific prompts (`src/lib/scanPrompts.ts` — new)
Extract the existing `HONESTY_HEADER`, `XRAY_BODY`, `REPORT_TEXT_BODY` plus add `CT_BODY`, `MRI_BODY`, `ULTRASOUND_BODY`, `ECG_BODY`, `ECHO_BODY`, `MAMMOGRAM_BODY`, `DEXA_BODY`, `NUCLEAR_BODY`, `PET_BODY`, `EEG_BODY` using the spec the user provided (ABCDE for CXR, T1/T2 signal rules for MRI, TI-RADS for thyroid US, ST-segment review for ECG, EF grading for Echo, BI-RADS for mammogram, T-score for DEXA, etc.). Each adds its own "CRITICAL FINDINGS" list that the model must populate into `criticalAlerts`.

### 2. Unified image-capable server fn (`src/lib/scanAnalysis.functions.ts`)
- Replace the `xray_image | report_text` discriminated union with `scan_image | report_text`, where `scan_image` carries `modality` (xray/ct/mri/us/mammogram/dexa/pet/nuclear/echo/ecg/eeg).
- Route to the right prompt body based on `modality`.
- Vision models: keep `google/gemini-2.5-pro` for all image modalities; flash for text-only reports. Add a one-line note on cost in plan only.
- Pass `bodyRegion`, `clinicalContext`, plus optional `contrastUsed`, `sequences`, `ultrasoundType`, `echoType`, `isPregnant` (all optional, surfaced into the prompt only when set).

### 3. Activate all tiles (`src/components/scan/ModalityPicker.tsx`)
Flip every tile to `enabled: true`. Remove "Soon" badge. Keep `report_text` and `xray` first.

### 4. Scan page additions (`src/routes/scan.tsx`)
- For image modalities other than X-Ray, accept JPG/PNG/PDF (PDF for printed films / report scans the user photographed). PDF path reuses existing `pdfExtract.ts` → if PDF has extractable text, send as `report_text`; else convert first page to image and send as `scan_image`.
- Add a small "extra context" disclosure with modality-specific optional inputs (contrast yes/no for CT/MRI, sequences hint for MRI, pregnancy for US, echo type select).
- Bump image size cap to 12 MB for higher-resolution scans.
- Show modality-specific safety note (e.g. "ECG strips must be a clear, well-lit photo of the full 12-lead printout").

### 5. History integration
- Add a "Scans" tab on `src/routes/history.tsx`. Fetch via `listScans` (already exists). Render a card per scan: modality, body region, urgency badge, date, click → opens the result by rehydrating into `scanStore` and navigating to `/scan-results`.
- Add a `getScan(id)` server fn so a refresh on `/scan-results?id=...` can re-fetch. Update `/scan-results` to accept `?id=` via search params and load from DB when the in-memory store is empty.

### 6. Critical-alert banner + indeterminate panel
Already implemented in `ScanResultView`. Verify they render correctly when arrays are populated; add an `AlertOctagon` icon and pulsing dot to match the spec.

### 7. Bug sweep (audit + fix)
After the build, walk every code path and fix anything found. Known suspects to verify or fix:
- `scan-results.tsx` flashes "null" then redirects when store is empty (no loading state) → render a small skeleton instead, and gate the redirect on the mount tick.
- `scanCloudSync.functions.ts` `select("*")` returns DB column names (`body_region`, etc.) but `ScanResultView` expects the camelCased `ScanInterpretationResult` shape → add a row-to-result mapper in `scanCloudSync.functions.ts` and use it in History click-through.
- `useAuth` may not be hydrated on first render; `save()` after `analyze()` should not block navigation on auth failure (already wrapped in try/catch — verify toast text).
- `analyzeScan` `fetch` failure currently calls `fail()` from inside `try` then `response` is `never` after — TS-safe but runtime should `return` instead; verify no "response used before assigned" path.
- `normalizeScan.ts` BANNED_WORDS regex replaces "rules out" with "may suggest" mid-sentence — leaves awkward grammar; add a small post-pass to lowercase the join.
- Navbar link to `/scan` exists but verify on mobile drawer.
- `image/jpg` is not a real MIME type — accept attribute is fine but `file.type` will be `image/jpeg`; no fix needed, just confirmed.
- PDF upload path for `report_text` doesn't exist yet on `/scan` — currently users must paste text. Add the PDF→text reuse from `pdfExtract.ts`.
- Confirm `scan_results` RLS + GRANTs (already in DB per context) and that `language` default `'en'` doesn't break inserts when undefined.

### 8. Sanity check
- Hit `/scan`, run one text-report flow and one X-Ray flow against the live preview via `stack_modern--invoke-server-function` is not feasible (image upload). Instead, smoke-test in the preview manually after build by submitting a tiny sample report (sample text already in `sampleReport.ts`) and checking server-function logs.
- Run `supabase--linter` for any new RLS issues (none expected — no new tables).

## Out of scope
- Comparison with prior scans (Sprint 9).
- Professional PDF export (Sprint 10).
- Per-image annotations / heatmaps.
- WhatsApp / share-link for scans (extend existing share infra later).
- i18n strings for the new modality labels (English only this pass; hi/ta/te can be added in a follow-up).

## Technical notes (collapsible details for engineers)

- New file `src/lib/scanPrompts.ts` exports `buildPrompt(modality, mode, opts)` so `scanAnalysis.functions.ts` stays thin.
- Add `getScan` server fn + DB-row mapper `rowToScanResult(row)` in `scanCloudSync.functions.ts`.
- Update `ScanInput` union in `src/types/scan.ts` to add `modality` to the image variant and the optional context fields.
- The `analyzeScan` server fn passes `modality` straight through to `normaliseScanResult` so saved rows carry the right value (today X-Ray hard-codes `"xray"`).

Reply "approve" and I'll implement everything in one pass, then sweep for bugs and confirm the flow works end-to-end.
