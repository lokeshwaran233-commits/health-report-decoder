# ReportRx — final polish, History page, trends, publish

Most of Day 1/2 polish is already in place (Toaster mounted, Navbar scroll, DropZone pulse, favicon, print CSS, root head title). Plan focuses on what's actually missing.

## 1. Fix sample report flow (sanity pass)
- `useFileUpload.loadSampleReport`: keep current shape — `uploadStore.setSampleMode(buildSampleResult())` then navigate. Already correct.
- `useReportAnalysis`: add a mount effect that, before anything else, calls `uploadStore.consumeSampleResult()`; if present, `loadResult(result)` and bail. Currently this logic lives in `results.tsx` — works, but move/duplicate the short-circuit into the hook so it's the very first thing on mount (per spec). Keep results.tsx fallback for safety.

## 2. History page (`src/routes/history.tsx`)
Replace placeholder with full `HistoryPage`:
- Reads `uploadStore.getHistory()` into local state on mount.
- Empty state: centered Lucide `ClipboardList` (48px, teal-light bg, rounded-xl), heading "No reports yet", subtext, CTA button → `/`.
- Populated: heading "Your report history" + Lock-icon subheading "All reports are stored locally on your device only". Top-right "Clear all history" ghost coral button with inline 2-step confirm (button text swaps to "Are you sure? Click to confirm" for 3s).
- Vertical stack of `HistoryCard` (new file `src/components/history/HistoryCard.tsx`), gap 12px.
- Framer Motion page fade + stagger 60ms; respects `useReducedMotion`.
- `head()` includes `noindex`.

### HistoryCard
- Left 3px status border: coral if any flagged, amber if any watch, else teal.
- Top row: patient name or "Lab Report" (left), report date (right).
- Second row: lab name (left), `Uploaded {relative}` (right) — small `relativeTime(ts)` helper in `src/lib/relativeTime.ts`.
- Status pills row reusing existing pill styles.
- Bottom row: "View results →" ghost teal button + Trash2 icon button.
- Hover: lift 2px + shadow, 200ms.
- Delete: Framer Motion exit (slide left + fade 300ms), `uploadStore.deleteHistoryItem(id)`, `toast.success("Report removed from history")`. Empty-state appears if list empties.
- View results: `uploadStore.setSampleMode(result)` (reuses short-circuit) + navigate `/results`.

## 3. Trend chart (`src/components/history/TrendChart.tsx`)
- Render only if `history.length >= 2`.
- Heading "Your health trends over time" + Lucide `TrendingUp`.
- Biomarker selector: horizontal pill scroller of biomarkers appearing in ≥2 reports (case-insensitive match by `name`). Default: first flagged → watch → alphabetical.
- Recharts `LineChart`, height 240/180:
  - X `date` formatted `DD MMM` (use Intl, no new dep).
  - Y auto domain with 20% padding.
  - Line stroke `#0F6E56` width 2, dot 5, activeDot 7.
  - `ReferenceArea y1=low y2=high` fill `rgba(15,110,86,0.08)` (uses first occurrence's reference range).
  - `ReferenceLine` low/high dashed `#1D9E75` with right-side "Low"/"High" labels.
  - Custom tooltip: white card, date + value + unit + status badge.
  - `isAnimationActive` honors reduced motion.
- 1-point fallback message.

## 4. Results page banner for history view
- Detect `uploadStore.isSampleMode()` AND result has a real `metadata.reportDate` (sample mode flag covers both sample + history view). Cleanest: add `uploadStore.setHistoryView(result)` boolean separate from sample. Add `isHistoryView()` getter. Use in `results.tsx` to render a teal banner with Lucide `History`, text `Viewing a past report from {reportDate}`, right-side `← Back to history` link. Suppress `<SavedBanner />` in this mode.
- HistoryCard "View results" calls `setHistoryView` instead of `setSampleMode`.

## 5. Navbar History link
- Add `{ id: "history", label: "History", href: "/history" }` between How it works and Privacy. Render via `<Link to="/history">` (extend `navLinks` typing).
- Mobile menu: include all four items, slide-down (Framer Motion `AnimatePresence` height/opacity), close on link click or outside click (existing toggle already closes on click; add `useEffect` outside-click listener).

## 6. Results page additions
- Below "Analyse another report" CTA: `<Link to="/history">← View all your past reports</Link>` 13px muted, teal on hover.
- `useReportAnalysis.runAnalysis` success path: `toast.success("Report saved to your history")` — only when not sample mode and not history view.

## 7. Performance + QA
- Confirm `pdfjs-dist` is dynamic-imported in `pdfExtract.ts` (verify, no change if already).
- Audit Framer Motion usages → wrap with `useReducedMotion()` guard helper.
- Wrap any remaining localStorage in try/catch (uploadStore already does).
- Verify share decoder banner already present in `results.tsx` (it is).
- `handleAnalyseAnother` already clears store + resets title.
- Strip any `console.log` (grep).
- Grep for `: any` and replace.
- `bunx tsc --noEmit` clean.
- Ensure every new component has named + default export.

## 8. README (`public/README.md`)
- Write the provided markdown verbatim, leave `{YOUR_PUBLISHED_URL}` placeholder for now (update after publish step).

## 9. Publish
- After build passes, prompt user with `<presentation-open-publish>` action. Once URL is known, update README.

## Out of scope
- No backend/schema changes.
- No new AI calls.
- No redesign of existing landing or results sections beyond items listed.

## Files created
- `src/components/history/HistoryCard.tsx`
- `src/components/history/TrendChart.tsx`
- `src/lib/relativeTime.ts`
- `public/README.md`

## Files edited
- `src/routes/history.tsx` (full page)
- `src/routes/results.tsx` (history-view banner + history link)
- `src/components/layout/Navbar.tsx` (History link + mobile animation + outside click)
- `src/hooks/useReportAnalysis.ts` (sample short-circuit + save toast)
- `src/lib/uploadStore.ts` (`setHistoryView` / `isHistoryView` / `consumeHistoryView`)

## Risk
- `setHistoryView` reuses module-scope state — fine since results page consumes immediately on mount.
- Trend chart reference range uses first occurrence; values across labs may use different units. Acceptable for v1; tooltip shows unit.
