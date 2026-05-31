# Plan: Make /auth match the visual spec

The `/auth` route, `AuthHeroPanel`, and `ReportDemoCard` already exist from the previous pass, but the right-panel form styling is generic (white card, no dark treatment) and the hero panel uses small tweaks that don't quite match the spec (logo size, headline scale, blob opacity, badge content). This plan finishes the visual build only — no auth logic, no new server work.

## Files to touch

1. **`src/routes/auth.tsx`** — make right panel dark (`#0A0E1A`), center the form, wrap `AuthForm` in a dark card (`#111827`, border `#1E2D42`, radius 20, padding 40, max-w 420). Keep mobile strip as-is.
2. **`src/components/auth/AuthHeroPanel.tsx`** — match spec exactly:
   - Logo pill top-left at 32/32 (already close)
   - Headline sizing → `text-5xl lg:text-6xl`, "lab results," in `#00D9A3`
   - Demo card centered with subtext above
   - Trust badges bottom-left, keep icons but ensure dark pill style
3. **`src/components/auth/ReportDemoCard.tsx`** — already matches; just verify timing (rows 0.8/1.1/1.4/1.7s, footer 2.0s) and remove the outer `rrx-card-loop` opacity flicker (spec doesn't ask for it; keep card steady after fade-in).
4. **`src/components/auth/AuthForm.tsx`** — add a `dark` variant prop so when rendered inside the dark auth page card it uses:
   - Inputs: bg `#0A0E1A`, border `#1E2D42`, text white, height 52, radius 12, focus ring `#00D9A3`
   - Tabs pill: bg `#0A0E1A`, active tab `#1A2235` with white text
   - Primary button: gradient `linear-gradient(135deg,#00D9A3,#0F6E56)`, text `#0A0E1A`, h-52, radius 12
   - Google button: bg `#1A2235`, border `#1E2D42`, white text
   - Headings/labels in light tones (`#F0F4F8` / `#8B9BAE`)
   - Default (modal) stays unchanged
5. **`src/styles.css`** — already has `rrx-blob-drift`, `rrx-pulse-dot`, `rrx-row-in`. Add DM Sans to the Google Fonts `@import` line (Inter already loaded). Drop `.rrx-demo-card` loop opacity so the card stays visible after first stagger.

## What stays untouched

- `AuthModal.tsx`, all hooks, Supabase client, server functions, routes other than `/auth`.
- `AuthForm` business logic (Google OAuth, email/password handlers, i18n keys).

## Success check

Open `/auth` at desktop ≥1024px → dark page, left hero (logo, headline with teal accent, animated demo card with 4 staggered rows + "3 actionable insights ready" footer, 3 drifting blobs, 3 trust badges bottom-left), right side dark card with tabs + email + password + gradient CTA. At <1024px → top dark strip with logo + tagline, full-width dark form card below.
