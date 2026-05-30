# Phase D1 v2 — Plan

Scope: §8 hero panel, §9 share fix, §10 report history removal, §11 scan history removal. §0–§7 assumed already shipped or out of scope for this pass — flag below.

## Assumptions / clarifications baked in
- No dedicated `/auth` route exists today; sign-in lives in `AuthModal`. I'll create `src/routes/auth.tsx` with the Claude-style split layout and keep `AuthModal` working for inline triggers.
- Share links already use a short-lived `share_tokens` row at `/s/:token` (see `ShareModal` + `createShareToken`). The "WhatsApp opens homepage" bug is from the `wa.me` text being misformatted or the snapshot link not resolving; we'll fix the URL construction + ensure OG meta on `/s/$token`. No new `/report/:id` route — `/s/:token` already is the public read-only view.
- Reports table = `public.reports`, scans table = `public.scan_results` (RLS + delete policies already in place). Hard delete, no schema migration needed.
- Apple Sign-In / QR login from §0–§7 are NOT in this pass.

## 1. Auth page hero (§8)
New file `src/routes/auth.tsx`:
- Two-column flex, 55/45 desktop, stacked on mobile (`lg:` breakpoint).
- Left panel: `#0A0E1A` bg, mesh radial gradients, 3 drifting blob divs (CSS `@keyframes blob-drift`, 20s).
- Top-left ReportRx logo pill.
- Centered headline ("Understand your lab results, instantly.") + subtext.
- Floating demo card (`ReportDemoCard` component) with 4 staggered biomarker rows + footer banner, 8s loop via pure CSS keyframes.
- Bottom-left: 3 trust micro-badges.
- Right panel: extract the form body from `AuthModal` into a shared `<AuthForm />` component so both modal and `/auth` use the same logic (Google via `lovable.auth`, email/password via `supabase.auth`).

New files:
- `src/routes/auth.tsx`
- `src/components/auth/AuthHeroPanel.tsx`
- `src/components/auth/ReportDemoCard.tsx`
- `src/components/auth/AuthForm.tsx` (extracted)
- Refactor `AuthModal.tsx` to render `<AuthForm />`.

Tokens: add demo-card colors (`--demo-bg`, status pills) to `src/styles.css` rather than hardcoded hex.

## 2. WhatsApp share fix (§9)
In `src/components/results/ShareModal.tsx`:
- `openWhatsApp` already builds `${origin}/s/${token}` — verify it's not falling back to origin-only when token mint fails. Add explicit guard + toast on failure.
- Fix the message text: drop the URL-encode-the-origin pattern if present anywhere else; use `encodeURIComponent(fullText)` once.
- Add `og:title`, `og:description`, `og:image` meta in `src/routes/s.$token.tsx` `head()` so WhatsApp link preview renders.
- Audit `SharedSummaryView` and any other share entrypoint for the same bug.

## 3. Report history removal (§10)
Replace current `HistoryCard` delete (local-only) with full flow against Supabase `reports`.

New server fns in `src/lib/cloudSync.functions.ts`:
- `deleteReport({ id })` — `requireSupabaseAuth`, deletes one row.
- `deleteReports({ ids })` — bulk delete, `.in('id', ids)`.
- `clearAllReports()` — delete all rows for `auth.uid()`.

New components:
- `src/components/history/ReportHistoryList.tsx` — owns selection state.
- `src/components/history/ReportHistoryItem.tsx` — checkbox + kebab + inline confirm popover.
- `src/components/history/SelectionActionBar.tsx` — sticky bottom pill bar.
- `src/components/history/ClearAllModal.tsx` — type-CLEAR-to-confirm modal.
- `src/hooks/useReportHistory.ts` — selection state + mutations, invalidates `['cloud-reports']`.

Wire into `src/routes/history.tsx` reports tab. Replace the existing "Clear local history" button with the new "Clear all" flow (which also clears `uploadStore`).

## 4. Scan history removal (§11)
Mirror of §3 but for `scan_results`.

New server fns in `src/lib/scanCloudSync.functions.ts`:
- `deleteScan({ id })`, `deleteScans({ ids })`, `clearAllScans()`.

New components (kept separate per spec):
- `src/components/history/ScanHistoryList.tsx`
- `src/components/history/ScanHistoryItem.tsx` (extra warning copy about AI findings)
- `src/components/history/ScanSelectionActionBar.tsx`
- `src/components/history/ClearAllScansModal.tsx`
- `src/hooks/useScanHistory.ts`

Wire into the scans tab in `history.tsx`, replacing the current `ScanRow`.

## 5. Shared bits
- Add a generic `ConfirmPopover` primitive only if both flows need it; otherwise inline.
- All new colors / shadows go through CSS tokens (`src/styles.css`).
- All copy uses existing toast (`sonner`).

## Technical notes
- TanStack: new `/auth` route file = `createFileRoute('/auth')` with `head()` meta (`noindex`). No loader needed.
- Auth flows stay client-side; no new middleware.
- Bulk delete uses RLS-scoped client from `requireSupabaseAuth`; no admin client.
- After each mutation: `queryClient.invalidateQueries({ queryKey: ['cloud-reports' | 'cloud-scans'] })`.
- Animations use Tailwind + framer-motion already in project; no new deps.

## Out of scope (flag)
- §0–§7 (Apple sign-in, QR login, full auth system overhaul backend) — assumed shipped in v1.
- Soft-delete migration (§12) — sticking with hard delete per spec recommendation; no migration needed.

Reply "approve" to build, or tell me what to adjust (e.g. skip the new `/auth` route and only redesign the modal, or include Apple/QR work).
