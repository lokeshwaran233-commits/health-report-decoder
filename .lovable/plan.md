# Implementation Plan

Sensible defaults are noted where you didn't specify — flag any you want changed before I build.

## 1. Remove Live Tracking entirely
- Delete `src/routes/activity.tsx`, `src/lib/activity.functions.ts`, `src/components/profile/HealthSnapshotCard.tsx` references that depend on activity, and the "Activity" nav link in `Navbar.tsx`.
- Strip activity-event logging calls from `analyze.functions.ts`, `scanAnalysis.functions.ts`, `zeno.functions.ts`.
- Migration: drop `activity_events` table + its RLS/realtime policies. Keep `anonymous_report_usage` (still used for the 3-report quota).
- HealthSnapshotCard stays, but recomputes totals from `reports` / `scan_results` / `zeno_conversations` directly (no activity feed).

## 2. Mobile dark/light theme fix
- `ThemeToggle` likely hidden inside desktop-only nav. Audit `Navbar.tsx` mobile menu and ensure the toggle renders in the mobile drawer with the same `useTheme()` hook. Verify `applyClass` runs on mobile (matchMedia listener works the same — the bug is almost certainly missing UI surface, not the hook).

## 3. Sample reports must never persist
- In `UploadCard` / `analyze.functions.ts`: add an `isSample: true` flag on the "Try a sample" path.
- Skip `uploadStore.saveToHistory()` and skip cloud insert (`cloudSync`) when `isSample === true`, for both anonymous AND signed-in users.
- Same treatment for any sample scan path.
- Result page renders normally but the report is ephemeral (cleared on navigation away).

## 4. Landing "What you'll see" teaser — add a green/normal reading
- In `ResultsTeaser.tsx`, replace one of the two flagged biomarkers (keep Vitamin D flagged, keep TSH watch) with a normal green one, e.g. **HDL Cholesterol 58 mg/dL** (range 40–60), status `normal`.

## 5. Auth modal alignment fix
- `AuthModal.tsx` currently uses `fixed inset-0 flex items-center justify-center` — should center, but on mobile the inner card likely overflows viewport because `AuthForm` is tall. Fix:
  - Wrap modal content in a scrollable container: `max-h-[90vh] overflow-y-auto`.
  - Ensure backdrop uses `items-center` on all breakpoints (no `items-start` override).
  - Add safe-area padding and ensure close button stays sticky/visible.
  - On `/auth` route (full-page), keep current layout — only fix the modal that pops from the upload card / nav.

## 6. Pricing: suspend, convert ₹→$, raise prices, keep payment-ready
- `pricing.tsx`: render a "Coming soon — payments paused" state with the new USD price cards visible but CTAs disabled (tooltip: "Available soon").
- Convert all plan amounts to USD and bump ~15% (I'll propose: Starter $9, Pro $19, Family $29 — confirm or adjust).
- Keep `subscription_plans` and `credit_packs` tables intact; add `currency: 'USD'` and `is_active: false` flags so wiring Stripe/Razorpay later is a single switch.
- Keep `billing.functions.ts` and `razorpay-webhook.ts` files but gate them behind an `PAYMENTS_ENABLED=false` constant — no behavior change, ready to flip.
- Remove pricing link from primary nav (optional — keep in footer only). **Confirm.**

## 7. Footer duplicate "© 2026 ReportRx"
- Audit `__root.tsx` and `LandingPage.tsx` — Footer is likely mounted in both. Keep it only in `__root.tsx`.

## 8. "How it works" — Guide button + flow map
- New floating button on `/` only (landing): a circular **G** chip fixed bottom-left (or left-center), subtle pulse, with a small tooltip popup on first visit ("New here? Tap G for a guided tour").
- Click behavior: smooth-scroll to a new section `#how-it-works-flow` at the bottom of the landing page.
- New component `HowItWorksFlow.tsx` replaces / augments current `HowItWorks.tsx`:
  - Top: existing 4-step linear flow (Upload → Decode → Visualize → Doctor guide).
  - Below: a **mind-map / branching diagram** showing the three pillars:
    - **Lab Reports** (core analyzer)
    - **Scans** (imaging safety)
    - **Zeno** (AI companion that connects both)
  - Each node expands on hover/tap to show what it does and how Zeno bridges lab + scan context.
  - Rendered with SVG + framer-motion (no heavy lib).
- Floating Guide button only renders on `/` (route check), never on other pages.
- First-visit popup state stored in `localStorage` (`reportrx-guide-seen`).

## 9. QA pass after each step
- Verify in preview at mobile (375px) and desktop (1280px) after each change.
- Check console for errors after every edit.
- Confirm: anonymous sample → no history; signed-in sample → no history; real anonymous report (≤3) → no history but result visible; real signed-in report → saved.

## Technical notes
- Files touched: `Navbar.tsx`, `Footer.tsx`, `LandingPage.tsx`, `ResultsTeaser.tsx`, `AuthModal.tsx`, `UploadCard.tsx`, `analyze.functions.ts`, `scanAnalysis.functions.ts`, `zeno.functions.ts`, `profile.tsx`, `HealthSnapshotCard.tsx`, `pricing.tsx`, `billing.functions.ts`, `__root.tsx`.
- New files: `HowItWorksFlow.tsx`, `GuideButton.tsx`.
- Deleted: `activity.tsx`, `activity.functions.ts`.
- One migration: drop `activity_events`, add `currency` + `is_active` to plan tables.

## Confirm before I build
1. USD pricing tiers OK at $9 / $19 / $29, or different?
2. Keep "Pricing" link in nav (greyed) or move to footer only?
3. Guide button: bottom-left floating bubble OK, or different position?
