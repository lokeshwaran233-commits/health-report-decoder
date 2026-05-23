# ReportRx — Day 1 (Approved with 4 additions)

Adapt to existing TanStack Start + Tailwind v4 + Cloudflare Workers stack. Functionally identical to the brief; routing and AI call path differ.

## Pre-flight (done)
- `framer-motion` and `pdfjs-dist` installed.
- `lucide-react@0.575.0` confirmed in `package.json`.
- `LOVABLE_API_KEY` confirmed provisioned (Day 2 AI Gateway).

## Stack mapping

| Spec | Implementation | Reason |
|---|---|---|
| Vite + React Router v6 | TanStack Start file routes (`src/routes/index.tsx`, `results.tsx`, `history.tsx`) | Already scaffolded |
| Tailwind v3 config | Tailwind v4 `@theme` tokens in `src/styles.css` | v4 installed; same class names |
| Netlify/Vercel `/api/analyze` + Anthropic SDK | TanStack server fn → Lovable AI Gateway (Gemini) | No key needed; Workers-safe |
| `react-router-dom` location.state | `@tanstack/react-router` `useNavigate` + `src/lib/uploadStore.ts` module store | Same UX |
| framer-motion | Direct equivalent | — |

## Addition 1 — Browser-only PDF extraction
`src/lib/pdfExtract.ts` carries a header comment: **BROWSER-ONLY. Never import from a server function, server route, or Cloudflare Worker context.** Both `extractTextFromPDF` and `extractTextFromImage` guard with `typeof window === "undefined"` and throw early. Consumed only by `useFileUpload` (client hook).

## Addition 2 — lucide-react confirmed
Already at `^0.575.0` in `package.json`. No install needed.

## Addition 3 — Day 2 Gemini normalization layer (noted)
`src/lib/analyze.functions.ts` ships today as a typed stub returning `{ status: 'not_implemented' }`. Day 2 will:
1. POST to `https://ai.gateway.lovable.dev/v1/chat/completions` with `google/gemini-3-flash-preview` (default) using `LOVABLE_API_KEY`.
2. Use tool-calling (`tool_choice` forced) with a JSON-schema mirroring `AnalysisResult`.
3. Add `src/lib/normalizeAnalysis.ts` — a normalization layer mapping Gemini's tool-call arguments (string `status` values, partial fields, missing categories) into the strict `AnalysisResult` / `Biomarker` interfaces, with safe defaults for any field the model omits or mis-types.

## Addition 4 — ErrorBoundary in __root.tsx
Replace the current `errorComponent` with a branded `<ErrorBoundary />` component that wraps the routed `<Outlet />`. Fallback UI shows:
- The ReportRx logo (teal pulse mark + wordmark)
- Heading: "Something went wrong"
- The error message (truncated, monospace)
- Primary "Return to home" button (`<Link to="/">`) using the brand-teal `Button` primitive
- Secondary "Try again" ghost button that calls `router.invalidate()` + `reset()`
Lives at `src/components/layout/ErrorBoundary.tsx`. Wired into `__root.tsx` as `errorComponent: ErrorBoundary` (route-level boundary already wraps `<Outlet/>` by design in TanStack Router).

## Design tokens (`src/styles.css`)

`@theme inline` block adds:
```
--color-brand-teal #0F6E56   --color-brand-teal-light #E1F5EE   --color-brand-teal-mid #1D9E75
--color-brand-amber #EF9F27  --color-brand-amber-light #FAEEDA
--color-brand-coral #D85A30  --color-brand-coral-light #FAECE7
--color-brand-dark #1a1a18   --color-brand-muted #73726c        --color-brand-hint #B4B2A9
--color-brand-border #E5E5E3 --color-brand-surface #FAFAF8      --color-brand-card #FFFFFF
--font-sans 'Inter', system-ui, sans-serif
--radius-card 12px  --radius-btn 8px  --radius-pill 999px
--shadow-card 0 1px 3px rgba(0,0,0,.06)  --shadow-focus 0 0 0 3px rgba(15,110,86,.2)
```
Inter loaded via Google Fonts `@import` at top. Global `*:focus-visible` uses `--shadow-focus`.

## Files

```
src/styles.css                                  (update: tokens + Inter)
src/routes/__root.tsx                           (update: <Navbar/>, <main><Outlet/></main>, ErrorBoundary, head meta)
src/routes/index.tsx                            (replace placeholder → LandingPage)
src/routes/results.tsx                          (scaffold)
src/routes/history.tsx                          (scaffold)

src/types/report.ts                             (Biomarker, AnalysisResult, UploadState …)

src/lib/validators.ts                           (validateFile, ALLOWED_TYPES, MAX_FILE_SIZE_MB, formatFileSize)
src/lib/sampleReport.ts                         (Thyrocare/Priya Sharma SAMPLE_REPORT_TEXT)
src/lib/pdfExtract.ts                           (BROWSER-ONLY; pdfjs-dist + image→dataURL)
src/lib/uploadStore.ts                          (module-level handoff store)
src/lib/analyze.functions.ts                    (typed stub server fn)
src/lib/normalizeAnalysis.ts                    (Day 2 — placeholder file with TODO header)

src/hooks/useFileUpload.ts                      (validate → extract → store → navigate('/results'))
src/hooks/useReportAnalysis.ts                  (typed stub)

src/components/ui/Button.tsx                    (variants: primary/secondary/ghost; sizes sm/md/lg; isLoading)
src/components/ui/Badge.tsx                     (normal/watch/flagged/neutral)
src/components/ui/Card.tsx
src/components/ui/Tabs.tsx                      (controlled pill switcher)

src/components/layout/Navbar.tsx                (fixed top, mobile hamburger, smooth scroll #how-it-works)
src/components/layout/Footer.tsx                (dark, disclaimer)
src/components/layout/PageWrapper.tsx           (AnimatePresence fade-in, pt-[56px])
src/components/layout/ErrorBoundary.tsx         (Addition 4)

src/components/upload/UploadCard.tsx            (two tabs, drag/drop orchestration, errors)
src/components/upload/DropZone.tsx              (role=button, keyboard Enter/Space, drag visual states)
src/components/upload/FilePreview.tsx           (file meta, Analyze CTA, Remove ghost)
src/components/upload/PasteInput.tsx            (textarea + live count + Analyze disabled <50 chars)

src/pages/LandingPage.tsx                       (Hero → UploadCard → TrustBar → HowItWorks → SocialProof)
```

## Landing page sections (exact spec)
A. Hero — animated trust badge, two-line H1 ("explained" in teal), subhead, no CTA  
B. UploadCard — two tabs, drag/drop, FilePreview, sample-report link, inline error states  
C. Trust bar — 3 inline items, teal icons  
D. How it works — 4-step stepper, horizontal desktop / vertical mobile, arrow connectors  
E. Social proof line — "Powered by Claude AI — the same technology trusted by leading healthcare researchers worldwide."  
Footer — dark `#1a1a18`, © + disclaimer + Privacy/Terms.

## Quality bar
- Strict TS, zero `any`, all props interfaces exported.
- Single `<main>` in `__root.tsx`.
- All icons `aria-hidden` or `aria-label`; drop zone `role="button"` + Enter/Space; errors `role="alert"` `aria-live="polite"`.
- 44×44 min tap targets; 3px teal `*:focus-visible` ring.
- Per-route `head()` (title + description + og:title + og:description).
- No `console.log`, no TODO comments, no placeholder boilerplate.
- Mobile-first; tested mentally at 375px (Navbar hamburger, hero 30px, stacked stepper, stacked trust bar).

## Out of scope (Day 1)
- `/results` and `/history` page bodies (scaffolded empty per spec).
- Real Gemini call (stub returns typed shape).
- History persistence (Day 3).

Switch to build mode to execute.
