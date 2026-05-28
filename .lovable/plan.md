## ReportRx Scan Decoder — Sprints 1–3

Adds a new `/scan` section that interprets medical imaging studies and scan reports with the same honesty-first guardrails used for lab reports. This plan covers scaffold + text/PDF report interpretation + X-Ray image vision. CT, MRI, US, ECG, Echo, and the remaining 10 modalities are explicitly deferred to later sprints.

### What you'll see

- New "Scan Decoder" link in the navbar.
- `/scan` landing page: 12-tile modality picker (CT, MRI, X-Ray, Ultrasound, PET, Echo, EEG, ECG, Mammogram, DEXA, Angio, Nuclear) + a "Paste/Upload a scan report" option.
- Selecting **X-Ray** or **"Scan report (text/PDF)"** opens the working flow: optional clinical context + body region, upload zone, mandatory disclaimer, analyze.
- The other 10 tiles show a "Coming soon" tooltip — they're visible so the roadmap is clear, but disabled until later sprints.
- Results page with a **Professional / Patient Summary** toggle, a **Critical Alert** banner when relevant, an **Indeterminate Findings** card, and a **Limitations / What was not assessed** card. Mandatory AI disclaimer at the top of every view.
- Scan history is stored in a separate `scan_results` table so it doesn't collide with lab reports. A new "Scans" tab appears in the existing History page.

### What's behind it

New route `src/routes/scan.tsx` and (for sprint 2) `src/routes/scan.results.$id.tsx`. New folder `src/components/scan/` with `ScanTypeSelector`, `ScanUpload`, `ScanContextForm`, `ScanLoadingScreen`, `ScanResultsPage`, `ProfessionalReport`, `LaymanReport`, `FindingsCard`, `DifferentialCard`, `CriticalAlert`, `IndeterminateFlag`, `OutputToggle`, `ScanDisclaimer`. Types in `src/types/scan.ts` matching the `ScanInterpretationResult` shape from the doc (findings, differentials with `possible | probable | cannot_exclude` likelihood — no percentages, limitations, indeterminate, critical alerts).

Server function `src/lib/scanAnalysis.functions.ts` calls Lovable AI Gateway with two prompt paths:

1. **Text/PDF report path** (Sprint 2): reuses `pdfExtract.ts`, sends extracted text + universal honesty header to `google/gemini-2.5-flash`.
2. **X-Ray vision path** (Sprint 3): sends image as `image_url` data URL to `google/gemini-2.5-pro` (vision needed; flash is too lossy for image findings), with the X-Ray-specific system prompt from the doc — ABCDE checklist, fracture descriptor format, mandatory limitations block, critical findings list (tension pneumothorax, free air under diaphragm, etc.).

Honesty guardrails are enforced in the prompt and in the response normalizer (`src/lib/normalizeScan.ts`): strip the words `definitely`, `certainly`, `confirms`, `proves`, `rules out`, and the word `cancer` from layman text; require the AI to populate `aiConfidenceNote`; force `imageQuality: "inadequate"` short-circuit when the model says so.

State machine: `src/hooks/useScanAnalysis.ts` (mirrors `useReportAnalysis`).

New Supabase table `scan_results` with RLS scoped to `auth.uid()`. Saved on successful analysis when the user is signed in (same pattern as `cloudSync.functions.ts`). History page gets a "Reports / Scans" tab.

i18n: new `scan.*` keys added to `en/hi/ta/te` locale files for navbar, landing, upload, results, and disclaimer strings.

### Out of scope (later sprints)

- CT, MRI, Ultrasound, ECG, Echo, and all remaining modalities — the 10 disabled tiles.
- Comparison with prior scans / interval-change reasoning.
- Professional PDF export of the scan report.
- Per-image annotations / drawing on the scan.

### Open question

The X-Ray vision path will use `google/gemini-2.5-pro` because flash-class models miss subtle radiographic findings. This costs more per analysis than the lab report flow. Confirm that's acceptable, or I can fall back to `gemini-2.5-flash` for X-Ray as well.