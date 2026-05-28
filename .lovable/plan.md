# Phase 4A/4B Stabilization Plan

I can't see any console errors or network requests from your session right now (the replay only shows scrolling), and the published server logs are empty for the last hour — so I can't yet point to one exact line that breaks "Decode my report". I'll instrument first, then fix what we find, plus do the visible items you called out (Sign Up clarity + a graphical flow on the results page).

## 1. Reproduce + diagnose the "won't show result" bug

Likely suspects (most → least probable based on recent edits):

a. **`analyzeReport` server fn rejects new `language` field for older callers.** `inputSchema` now requires the discriminated union to optionally include `language`. If anything (history "view past report", sample mode replay, retry) calls without going through `useReportAnalysis`, fine — but the retry path uses `lastInput` which already has `language`, so safe. Still verify.

b. **`LOVABLE_API_KEY` missing at runtime.** Server fn throws `API_ERROR` → the catch in `useReportAnalysis` sets state to "error" but the error UI shows "Something went wrong" with no detail. Symptom matches "glitches and won't show the result".

c. **Gemini returning non-JSON with the new LANGUAGE_INSTRUCTION block.** Adding multi-language instructions can push the model to wrap in markdown fences. `tryParseJson` already handles this, but worth confirming.

d. **`uploadStore.getInput()` is null on results mount** because of a stale toast.info("Please upload a report first") loop when navigation is too fast — verify.

Steps:
- Call `invoke-server-function` against `/_serverFn/...analyzeReport` with the sample text payload to capture the real failure mode.
- Pull `server-function-logs` (preview + published) filtered on `analyze`, `LOVABLE`, `PARSE`, `429`, `402`.
- Add a single `console.error("[analyzeReport]", code, message)` in `useReportAnalysis` catch so the next user session surfaces a real error string in console logs.

## 2. Fix what the diagnostics reveal

Most-likely fix targets (apply only what the logs prove):

- **`useReportAnalysis`**: Surface real `error.message` to the user via the existing error screen (already does this) and ensure `lastInput` is set BEFORE `setState("loading")` so retry works even when the fn rejects synchronously.
- **`analyze.functions.ts`**: If `LOVABLE_API_KEY` is missing on the worker, fall back to a clearer error and log it. Also: tighten the system-prompt suffix so the language instruction stays inside the JSON-only guardrail (append "Return ONLY valid JSON, no markdown." once, after the language block).
- **`results.tsx` mount effect**: Add a tiny guard so the "Please upload a report first" toast only fires when `analysisState === "idle"` AND there's no input AND we're not in shared mode AND we're not mid-navigation (one-shot ref).
- If the failure is `NO_DATA_FOUND` on real PDFs, also confirm `pdfExtract` is producing text (cross-verify task — see §3).

## 3. Cross-verify with a real uploaded document

- Use the browser tool against the preview, upload a sample PDF, watch network + console.
- If extraction returns empty text, the PDF is image-only → push the user toward the image path (already supported) and show a hint in the error screen: "This PDF looks scanned — try the image upload tab or paste the text."
- Confirm successful image upload path end-to-end too.

No code change unless cross-verification surfaces a bug.

## 4. Make "Sign Up" obviously visible

Current Navbar uses `variant="secondary"` for Sign Up, which on white reads as a thin outline next to the bright teal "Decode my report" CTA — easy to miss.

Changes in `src/components/layout/Navbar.tsx`:
- Desktop: render Sign In as plain text link, Sign Up as a **solid teal pill** with white text (`variant="primary"` size sm), and keep "Decode my report" as a separate primary CTA — but visually differentiate them by making Sign Up *outlined teal* (`border-brand-teal text-brand-teal`) so two filled buttons don't fight. Add `aria-label="Create a free account"`.
- Mobile menu: promote Sign Up to a full-width filled button at the top of the menu, Sign In below it as a text link.
- Add a subtle "New here?" microcopy above the Sign Up button in the mobile menu.
- No new routes — modal pattern stays.

## 5. Graphical flow tracker on the results page

You asked for "graphical flow at below … tracking, graph below too start state". I'll add **two** small visuals at the bottom of `/results` (above the "Analyse another report" CTA):

### 5a. Journey flow ribbon (horizontal stepper)

```text
[ Uploaded ] ──▶ [ Extracted ] ──▶ [ Analysed ] ──▶ [ Insights ready ]
   ✓ filename       ✓ N markers       ✓ AI done         ✓ now
```

- Pure SVG/divs, theme tokens only (`brand-teal`, `brand-teal-light`, `brand-border`).
- Each node: circle + check + label + small timestamp; connectors are 1px dashed lines that animate fill on first paint (Motion, respects `prefers-reduced-motion`).
- "Start state" = the leftmost "Uploaded" node, always lit teal once results render.
- Pulls data from `uploadStore.getFileMeta()` + `analysisResult.metadata.uploadedAt` + `biomarkers.length`.

### 5b. Status distribution mini-chart

- A compact horizontal stacked bar (Normal / Watch / Flagged) using `statusCounts`, with numeric labels and the three brand status colors.
- Below the bar: a 7-segment category strip showing biomarker counts per category (blood, liver, kidney, …), each cell sized proportionally — gives an at-a-glance "where the issues live".

Both visuals live in a new component `src/components/results/ResultsFlowGraphic.tsx`, imported into `results.tsx` just above the disclaimer card. No new dependencies — plain SVG + Tailwind + Motion (already installed).

## 6. Out of scope this turn

- Phase 4C audio summaries
- Per-biomarker historical trend lines (already separately handled in `TrendChart` on `/history`)
- Re-translating already-cached history items into a newly selected language
- Any DB migration

---

## Technical notes (for the engineer)

- Files touched (expected):
  - `src/hooks/useReportAnalysis.ts` — log + ordering tweak
  - `src/lib/analyze.functions.ts` — clearer missing-key error + prompt suffix
  - `src/routes/results.tsx` — guard toast, mount `ResultsFlowGraphic`
  - `src/components/layout/Navbar.tsx` — Sign Up visibility
  - `src/components/results/ResultsFlowGraphic.tsx` — NEW
- No schema changes, no new packages.
- All colors via existing `brand-*` tokens in `src/styles.css`.
- Diagnostics (`invoke-server-function`, `server-function-logs`) run first; code edits scoped to whatever the logs implicate, plus the always-on items (§4, §5).

Approve and I'll execute steps 1 → 5 in that order in build mode.
