# Splash Intro Overlay

A full-screen "enter the experience" cover that appears on first visit to the landing page (`/`), with a giant "ReportRx" wordmark, the logo below it pulsing with a radium glow, and a press-to-enter interaction.

## Behavior

- Shows only on route `/` (landing). Does not appear on `/auth`, `/results`, `/scan`, etc.
- Appears on direct link entry (first paint). Dismissed by clicking the logo (or pressing Enter / Space / anywhere on the cover).
- After dismissal, persists in `sessionStorage` (`rrx-splash-seen`) so navigating away and back in the same session won't re-trigger it. Fresh tab / new session shows it again.
- Honors `prefers-reduced-motion`: glow becomes a static soft halo, no pulsing.
- Locks body scroll while visible; fully accessible (focus trap on the enter button, ESC also dismisses, `aria-label="Enter ReportRx"`).
- Fades out (~600ms) with a subtle scale, then unmounts so it never affects interaction afterward.

## Visual Direction ("meta-level patient care")

- Deep medical-night background: layered radial gradients (teal #0f6e56 → midnight #05080d) with slow-drifting blurred blobs (reuse `rrx-blob` keyframes already in `styles.css`).
- Ambient particle/constellation layer: ~40 faint dots, slow parallax drift — evokes a calm monitoring room.
- Faint animated ECG line crossing horizontally behind the wordmark (SVG stroke-dashoffset loop, very low opacity) — signature "patient care" motif without being literal.
- Wordmark "ReportRx": Fraunces serif, ~clamp(64px, 14vw, 200px), letter-spaced, white with a soft teal text-shadow, staggered letter fade-in.
- Logo below: large (~clamp(120px, 20vw, 220px)) ReportRx mark inside a circular emblem, with a **radium glow** — layered box-shadows in brand teal (#2dd4a8) pulsing opacity + spread from 20px → 60px on a 2.2s ease-in-out loop. A second outer halo ring expands and fades (ripple) every cycle.
- Below the logo: small tagline "Your lab report, finally explained." and a glowing "Press to enter" pill button that breathes in sync with the logo.
- Bottom edge: micro-strip with "Private · Secure · Doctor-ready" trust line in muted text.

## Files

**New**
- `src/components/landing/SplashIntro.tsx` — the overlay component. Self-contained: portal-free fixed overlay, framer-motion fade, click/key handlers, sessionStorage gate, reduced-motion guard.

**Edited**
- `src/pages/LandingPage.tsx` — mount `<SplashIntro />` at the top of the landing page only.
- `src/styles.css` — add `@keyframes rrx-radium-pulse`, `rrx-radium-ripple`, `rrx-ecg-sweep`, and `.rrx-splash-*` helper classes (background gradient, glow shadow stack). Keep all keyframes alongside existing `rrx-blob` / `rrx-pulse` rules; respect existing `prefers-reduced-motion` block by extending it.

## Technical notes

- Use existing `framer-motion` (already a dep) for the exit fade.
- Glow uses stacked `box-shadow` + `filter: drop-shadow` on the logo `<img>` for true "radium" bloom; pure CSS, no JS animation loop.
- Z-index: `z-[100]` so it sits above Navbar (which is `z-50`).
- No backend, no new dependencies, no routing changes. Strictly presentational on `/`.
- Does not affect SEO: rendered client-side after hydration; SSR HTML still contains full landing markup underneath.

## Out of scope

- Not added to other routes.
- No audio/sound.
- No "skip intro" preference UI in Settings (sessionStorage gate is enough for now).
