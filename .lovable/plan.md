
# ReportRx — Mega Plan (Day 1 polish + Day 2 + all gap fixes)

This is a large single-shot build. Scope is locked to what's listed below.
The sample-report button will load a **pre-baked AnalysisResult** (no AI call,
no credits), as you confirmed.

## 1. Title + head metadata fixes

- `src/routes/__root.tsx`: title → `ReportRx — Your lab report, finally explained`.
- `src/routes/index.tsx`: leaf head with route-specific title/description, og:title, og:description, og:image (placeholder `/og-default.png`), `twitter:card=summary_large_image`, `canonical=/`.
- `src/routes/results.tsx`: head with `Your Results — ReportRx`, description, `<meta name="robots" content="noindex">`.
- `src/routes/history.tsx`: head with title + `noindex`.
- Add favicon: `public/favicon.svg` (teal circle + crosshair/pulse mark), link in root head.

## 2. Landing page polish (Day 1 items 1–8)

Files: `src/pages/LandingPage.tsx`, `src/components/layout/Navbar.tsx`,
`src/components/upload/DropZone.tsx`, `src/components/upload/UploadCard.tsx`,
new `src/components/landing/HeroPreviewCard.tsx`,
new `src/components/landing/HowItWorks.tsx` (icon-forward cards: Upload, Cpu, Activity, Stethoscope; dashed connectors),
new `src/components/landing/ResultsTeaser.tsx` (renders the real `BiomarkerCard` with `isTeaser` prop on 3 mock biomarkers, scaled 90%, pointer-events:none),
new `src/components/landing/ScrollReveal.tsx` wrapper (Framer Motion `whileInView`, 400ms, 20px slide-up, 80ms stagger, `viewport={{ once: true }}`, respects `prefers-reduced-motion`).

Hero: 2-column on ≥lg; right column = floating preview card with translateY ±8px / 3s ease loop.
DropZone: light teal tint `rgba(15,110,86,0.06)`, dashed `#1D9E75` 1.5px, upload icon pulse 1.0→1.08→1.0 2s, hover transitions border→solid + tint deepens (200ms).
Navbar: `backdrop-blur-md` + semi-transparent white, 1px bottom border applied only after scroll>50px via `useEffect` scroll listener and `scrolled` class.
Below upload card: muted hint `"Your data never leaves your device during extraction — we only send text to our AI."`.

## 3. File upload pipeline (typed image + text)

Update `src/types/report.ts` to add:
```ts
export type AnalyzeInput =
  | { type: 'text'; content: string }
  | { type: 'image'; content: string; mimeType: string };
```
- `src/lib/pdfExtract.ts`: convert `pdfjs-dist` import to dynamic `await import('pdfjs-dist')` inside the function; worker URL pinned `//unpkg.com/pdfjs-dist@5.4.149/build/pdf.worker.min.mjs` (exact installed version).
- `extractImageBase64(file)` helper returns `{ base64, mimeType }` (strip `data:...;base64,` prefix).
- `src/lib/uploadStore.ts`: replace payload with `{ input: AnalyzeInput, fileMeta, receivedAt }` + `setInput`, `setFileMeta`, `clear`, plus `setLastResult`, `getLastResult`, `getHistory`, `clearHistory`, `deleteHistoryItem`. All localStorage ops wrapped in try/catch under key `reportrx_history` (max 20, newest first).
- `src/hooks/useFileUpload.ts`: PDF → text input; image → base64 image input; paste → text input; sample → loads pre-baked result directly via `setLastResult` + a `sampleMode` flag in uploadStore so `/results` short-circuits straight to success. Paste button disabled when `<50` chars with live counter (already present — verify). `handlePasteText` navigates to `/results`.

## 4. Server function — real Gemini call

`src/lib/analyze.functions.ts`:
- Input zod: discriminated union `{ type:'text', content:string(20..50000) }` | `{ type:'image', content:string, mimeType:string }`.
- POST `https://ai.gateway.lovable.dev/v1/chat/completions`, model `google/gemini-2.5-flash`, temp 0.1, max_tokens 4000, `Authorization: Bearer ${process.env.LOVABLE_API_KEY}`.
- System prompt as specified.
- For image input: user message uses content-parts array with `image_url` + text.
- Parse: try `JSON.parse`, fall back to `/{[\s\S]*}/` regex extraction.
- Typed errors: `PARSE_ERROR`, `NO_DATA_FOUND`, `API_ERROR`, plus surface 429/402 with friendly messages.
- `normalizeAnalysisResult(raw)` in `src/lib/normalizeAnalysis.ts`: adds `id` (timestamp+random), `uploadedAt` ISO, clamps numbers to 4 decimals, clamps status enum, returns typed `AnalysisResult`.

Ensure `LOVABLE_API_KEY` exists (will run `ai_gateway--create` in build mode).

## 5. Pre-baked sample

`src/lib/sampleResult.ts` — full `AnalysisResult` for Priya Sharma CBC+LFT (Hb flagged, MCV low, TSH watch, Vit D flagged, ALT/AST normal, etc.), realistic metadata, 3-paragraph summary, 5 doctor questions. Used by sample button (instant) and consumable in shared-link fallback testing.

## 6. `useReportAnalysis` hook

`src/hooks/useReportAnalysis.ts`:
- State: `analysisResult`, `analysisState`, `error`, `activeCategory`, `setActiveCategory`, `filteredBiomarkers` (memo, sort flagged→watch→normal when 'all'), `statusCounts` (memo), `runAnalysis(input)`, `retry()`.
- On mount in ResultsPage: if `?share=` → decode-only render path (no analyze). Else if `sampleMode` → load pre-baked. Else read `input` from store → `runAnalysis`. Else → toast + `navigate('/')`.
- `useEffect` updates `document.title` based on `metadata.patientName`; cleanup resets to brand default.
- On success: `uploadStore.setLastResult(result)` (writes localStorage history).

## 7. Loading screen

`src/components/results/LoadingScreen.tsx`: logo 32px, 3 steps (FileSearch/FlaskConical/Sparkles) lighting up at 0/2/4s, teal spinner active / green check complete / gray pending dot, thin teal progress bar 0→100% linear over 6s, rotating tips cycle 3s with fade. Respects reduced motion.

## 8. Results dashboard components

All under `src/components/results/`:

- `HealthScoreCard.tsx` — Recharts donut (green/amber/coral), center count + label, stat rows, first-sentence italic quote from summary, slide-in + animated donut.
- `ResultsHeader.tsx` — patient/date/lab metadata bar, status pills row (colored dot + count + label), action buttons (Share, Download PDF, Analyse another).
- `CategoryFilterBar.tsx` — horizontal scroll pills, hide empty categories, active=solid teal.
- `BiomarkerCard.tsx` — full spec: status badge top-right, category pill top-left, value+unit, gauge bar with normal-zone highlight, animated marker with `ease: [0.34,1.56,0.64,1]` 800ms, low/value/high labels, plain English, expand → deep explanation with teal-light left border. `isTeaser` prop disables expand/hover/pointer events. Status-colored 3px left border + tint. Hover lift 2px + shadow. `role="img"` aria-label as specified.
- `BiomarkerGrid.tsx` — 2-col desktop / 1-col mobile, staggered fade-in 60ms, `AnimatePresence mode="wait"` on filter change, single-expand state lifted here, empty state with `SearchX`.
- `InsightsSection.tsx` — Summary card (left border teal-light, paragraphs split on `\n\n`, first sentence bolded), Doctor questions list (numbered teal badges, per-row Copy button with toast, "Copy all questions" bottom).
- `ShareModal.tsx` — faux-viewport overlay, scale-in, copy shareable link, WhatsApp share. Encoding uses unicode-safe helpers:
  ```ts
  const encode = d => btoa(unescape(encodeURIComponent(JSON.stringify(d))));
  const decode = s => JSON.parse(decodeURIComponent(escape(atob(s))));
  ```
  WhatsApp text wrapped in `encodeURIComponent`. role=dialog, aria-modal, focus trap, Esc close.
- `SavedBanner.tsx` — green dismissible "saved to history" banner, auto-dismisses 5s, session flag in `sessionStorage`.
- `DisclaimerBanner.tsx`, error state, shared-view banner.

`src/routes/results.tsx` orchestrates loading / error / success / shared-view states and renders in spec order: SavedBanner → HealthScoreCard → ResultsHeader → CategoryFilterBar → BiomarkerGrid → divider → InsightsSection → DisclaimerBanner → "Analyse another report" CTA (calls `uploadStore.clear()` + resets `document.title` before navigating).

## 9. PDF download via window.print

`src/lib/pdfSummary.ts` — builds a hidden `#print-target` DOM tree with logo, metadata, status counts, biomarker rows (text only), summary paragraphs, doctor questions; calls `window.print()`; cleans up after.
Print CSS lives **globally** in `src/styles.css`:
```css
@media print {
  body * { visibility: hidden; }
  #print-target, #print-target * { visibility: visible; }
  #print-target { position: absolute; inset: 0; color: #000; background: #fff; font-family: Inter, sans-serif; }
}
```

## 10. Toast system

- `src/components/ui/Toast.tsx`, `src/hooks/useToast.ts`, `ToastContainer` mounted in `__root.tsx` (fixed bottom-right desktop / bottom-center mobile). Framer Motion slide-up enter, fade exit, 3s auto-dismiss. Replace all inline "Copied!" tooltips with `showToast(...)`.
  Note: project already exports `sonner` per `<shadcn-toast>` knowledge — I'll wrap `sonner` rather than reinvent if `<Toaster />` is already in root; otherwise build the bespoke one as specified. (Spec says build custom — will build custom for full control.)

## 11. ErrorBoundary + a11y + reduced motion

- Verify ErrorBoundary present in `__root.tsx` (it is).
- Helper `useReducedMotion()` (Framer Motion's built-in) gates all animation durations to 0 when set.
- All new components: named + default exports, zero `any`, no `console.log`.

## 12. Technical details summary

- `package.json`: confirm `recharts`, `framer-motion`, `lucide-react`, `pdfjs-dist@5.x` already installed. Add nothing else.
- No new server routes. No DB. Pure client + one server function.
- Cloudflare-safe: `pdfjs-dist` stays browser-only (dynamic import, no SSR usage); server function uses only `fetch` + `process.env.LOVABLE_API_KEY`.
- Strict TS: every new file fully typed against `src/types/report.ts`.

## Out of scope (explicit)

- History page UI (Day 3) — only the persistence layer + read API are built now.
- Real OG image generation — placeholder path only.
- Auth / multi-device sync — none.

## Risks I'm accepting per your "mega-plan" choice

- Single delivery this large will have rough edges; expect a follow-up round to fix any TypeScript errors, missing imports, or layout misses surfaced by the build.
- The pre-baked sample replaces the spec's "real AI call on sample" — sample button will never hit the gateway.
