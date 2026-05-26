Mixed-content PDF detection + smart entity separation

Update the AI analyzer to detect and ignore non-medical content in mixed PDFs, surface a warning to the user, and still successfully extract lab data.

---

### Files to edit

1. **src/lib/analyze.functions.ts**
   - Replace the SYSTEM_PROMPT opening with mixed-content detection instructions.
   - Add `contentWarning` field to the JSON structure in the prompt.
   - Keep all existing extraction rules (status logic, plainEnglish, deepExplanation, summary, doctorQuestions).

2. **src/types/report.ts**
   - Add `contentWarning: string | null;` to the `AnalysisResult` interface.

3. **src/lib/normalizeAnalysis.ts**
   - Read `raw.contentWarning` into the normalized result, defaulting to `null` if missing or not a string.
   - Update `RawAnalysis` interface to include `contentWarning?: unknown`.

4. **src/routes/results.tsx**
   - Import `MixedContentBanner`.
   - After the `SavedBanner` / history-view banner block and before `HealthScoreCard`, conditionally render `<MixedContentBanner message={analysisResult.contentWarning} />` when `analysisResult.contentWarning` is non-null.

5. **src/components/results/MixedContentBanner.tsx** (new)
   - Dismissible amber banner using `brand-amber-light` bg, `brand-amber` text, 1px amber border.
   - Left: `AlertTriangle` icon (18px, amber).
   - Text: "Mixed content detected" (Inter 600, 14px) + description (Inter 400, 13px, muted).
   - Right: green pill badge "Lab report extracted successfully".
   - Dismiss `X` button with Lucide `X` icon.
   - Framer Motion `AnimatePresence`: slide-down on mount, slide-up on dismiss.

### Verification
- `bunx tsc --noEmit` passes clean.
- `contentWarning` flows from AI response → normalization → type safety → UI banner.
- Banner only appears when `contentWarning` is truthy; dismiss hides it for the session.