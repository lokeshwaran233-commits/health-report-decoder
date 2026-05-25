# Final polish: toaster, navbar, drop zone, favicon, print, build, visual fixes

## 1. Mount Toaster
- In `src/routes/__root.tsx`, import `Toaster` from `sonner` and render `<Toaster position="top-center" richColors />` inside `RootComponent` (after `<Footer />`, before closing provider).

## 2. Navbar scroll behavior
- In `src/components/layout/Navbar.tsx`:
  - Add `useEffect` listening to `window.scroll`; set `scrolled` state when `window.scrollY > 50`.
  - Base classes: `bg-white/70 backdrop-blur-md transition-all duration-200`.
  - When `scrolled`: `bg-white/85 border-b border-brand-border shadow-[0_1px_0_rgba(0,0,0,0.04)]`; when not scrolled: no border (`border-b-0`).
  - Cleanup listener on unmount; use `{ passive: true }`.

## 3. DropZone polish (covers visual fix #1)
- In `src/components/upload/DropZone.tsx`:
  - Replace idle background with `style={{ backgroundColor: "rgba(15,110,86,0.06)" }}` and inline `borderColor: "#1D9E75"`, `borderStyle: "dashed"`, `borderWidth: "1.5px"`.
  - On hover: deepen bg to `rgba(15,110,86,0.10)` and switch to solid teal border via a `hover:` state (use a `group` + CSS var trick, or `onMouseEnter/Leave` state — simplest: keep two style objects + small `hovered` state).
  - 200ms transition (`transition-colors transition-[background-color,border-color] duration-200`).
  - Upload icon wrapper: add `animate-[rxpulse_2s_ease-in-out_infinite]`.
- In `src/styles.css`, add keyframes `@keyframes rxpulse { 0%,100% { transform: scale(1) } 50% { transform: scale(1.08) } }`.
- Also update `UploadCard.tsx` outer wrapper border color from `#9FE1CB` to keep consistent (leave as-is — outer is the card frame, not the drop zone).

## 4. Favicon
- Create `public/favicon.svg`: 32×32 teal (#0F6E56) filled circle with a white center crosshair / small pulse dot.
- In `__root.tsx` `head().links`, add `{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }`.

## 5. Global print CSS
- Append to bottom of `src/styles.css`:
  ```css
  @media print {
    body * { visibility: hidden !important; }
    #print-target, #print-target * { visibility: visible !important; }
    #print-target { position: absolute; left: 0; top: 0; width: 100%; }
    header, nav, footer, [data-no-print] { display: none !important; }
  }
  ```

## 6. Visual fix #2 — Hero card floating animation
- `HeroPreviewCard.tsx` already has a floating animation, but it cycles `[0,-8,0,8,0]` (drift both ways). Tighten to spec: `y: [0, -8, 0]`, `duration: 3`, `ease: "easeInOut"`, `repeat: Infinity`. Keep reduced-motion guard.

## 7. Visual fix #3 — Results teaser section background
- `ResultsTeaser.tsx`: wrap content in a panel `<div>` with `style={{ backgroundColor: "rgba(15,110,86,0.04)" }}` (the page is light, not dark — use very faint teal tint instead of white-on-white) and `className="rounded-2xl px-8 py-16"`. Keep the existing subheading ("A preview of how every biomarker is broken down for you.") which is already present.
- Outer `<section>` padding stays for spacing.

> Note: page background is `--color-brand-surface` (#FAFAF8, light). The user's `rgba(255,255,255,0.04)` was written assuming a dark theme and would be invisible here. Using a faint teal tint instead — confirms visual separation against the cream surface. If you want literal white, say so.

## 8. Build + export verification
- Run `bunx tsc --noEmit` and fix any reported errors.
- Grep all components under `src/components/**` and pages — ensure each file has both a named export and `export default`. Add `export default X` where missing.
- Verify `loadSampleReport` in `useFileUpload.ts` / `useReportAnalysis.ts` sets the pre-baked `sampleResult` directly and never calls `analyze.functions.ts`.

## Out of scope
- No new routes, no backend changes, no schema changes.
- Real AI wiring already done in previous turn; not touched here.

## Risk
- Navbar transparency may clash on routes with white hero backgrounds — acceptable since landing has cream surface.
- Print CSS is global; any future route needing full-page print must opt out via `#print-target` wrapper.
