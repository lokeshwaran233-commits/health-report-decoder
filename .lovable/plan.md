## Goal
Eliminate the flash of the real landing page before the splash overlay appears on first load, and keep the press-to-enter transition smooth.

## Root cause
`SplashIntro` is a child of `LandingPage`, and `visible` starts as `false`. The landing page renders first, then a `useEffect` reads `sessionStorage` and flips `visible` to `true` — so users see a one-frame flicker of the real product before the overlay mounts.

## Fix

**1. Pre-paint gate (no flicker on link open)**
- In `src/routes/__root.tsx`, add a tiny inline script (runs before hydration, alongside the existing theme pre-paint) that checks `sessionStorage["rrx-splash-seen"]` on path `/` and, if unseen, sets `document.documentElement.dataset.splash = "pending"` and injects a style rule hiding `#app-root` (or `body > #root main`) until splash mounts. This guarantees the real UI never paints first.
- Add a matching CSS rule in `src/styles.css`: `html[data-splash="pending"] #root > *:not(.rrx-splash-bg) { visibility: hidden; }` (scoped so only the landing content is hidden, splash itself remains visible).

**2. Synchronous splash decision**
- In `SplashIntro.tsx`, initialize `visible` synchronously via a lazy `useState` initializer that reads `sessionStorage` (guarded for SSR with `typeof window`). Drop the `useEffect` that sets it.
- On mount, once splash is rendered, clear `document.documentElement.dataset.splash` so the underlying page becomes visible behind the overlay (it's already covered by the fixed `z-100` layer, so revealing it is safe and lets the exit transition cross-fade naturally).

**3. Smoother exit (keeps existing flying-logo animation)**
- Bump the background fade-out to `duration: 0.9` and the logo flight easing stays `[0.22, 1, 0.36, 1]`.
- Add a subtle `backdrop-filter: blur()` that eases from `12px → 0` during exit so the real page resolves into focus instead of popping in.
- Delay clearing `body.overflow` until after the exit timer fires (already in place — keep).

**4. SSR safety**
- The pre-paint script must be wrapped so it no-ops when `sessionStorage` is unavailable.
- `SplashIntro` lazy initializer falls back to `true` when `window` is undefined so SSR HTML matches the "splash visible" state, preventing a hydration mismatch.

## Files touched
- `src/routes/__root.tsx` — add pre-paint splash gate script
- `src/styles.css` — add `html[data-splash="pending"]` rule + blur transition class
- `src/components/landing/SplashIntro.tsx` — synchronous initial state, clear gate on mount, smoother exit blur

## Out of scope
No change to the flying-logo trajectory, wordmark, or copy. Sign-up/log-in subtle link stays.
