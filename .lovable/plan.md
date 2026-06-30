
## Goals

1. Signed-in users get unlimited access (reports, scans, Zeno) — remove all quota gates.
2. Anonymous lab-report flow keeps the existing 3-try cap (already in place).
3. Nothing gets stored in history anymore — neither localStorage nor cloud — for any user, signed-in or not. The dashboard/results screen still renders the output; the history tab just stays empty for new analyses.
4. Mobile light/dark toggle becomes reliably functional.

## Changes

### A. Remove signed-in quota gates

- `src/lib/analyze.functions.ts`: when `authUserId` is present, skip the `readEntitlements` check and the `recordDecode` call. Keep the anonymous IP-hash 3-report ceiling unchanged.
- `src/lib/scanAnalysis.functions.ts`: drop the `readEntitlements` block and the `recordDecode` call entirely (scan is auth-only, so signed-in = unlimited).
- `src/hooks/useEntitlements.ts` → `canDecode`: return `{ allowed: true, reason: "ok" }` whenever an entitlements row exists (any signed-in user). Anonymous (`null`) still returns `no-auth`.
- `src/routes/results.tsx` / `src/routes/scan.tsx`: leave the existing `QUOTA_EXCEEDED` UI for the anon path; signed-in users will simply never hit it.

### B. Stop writing anything to history

Lab reports:
- `src/lib/uploadStore.ts` → `setLastResult`: keep the in-memory `state.lastResult` update so the results page still renders, but remove the `localStorage.setItem(STORAGE_KEY, …)` write. Same for `setHistoryView` paths. `getHistory()` will return `[]` for new sessions; we leave the legacy reader so any pre-existing entries still appear if the user previously had any.
- `src/hooks/useReportAnalysis.ts`: remove the `saveFn({ data: { result: payload } })` cloud-sync call and the "Saved to history" toast. Replace with a neutral success toast ("Analysis ready").

Scans:
- `src/routes/scan.tsx` → `handleSubmit`: stop calling `save({ data: { result } })`. Set the result in `scanStore` and navigate to `/scan-results` without an `id` search param.
- `src/routes/scan-results.tsx`: when no `id` is present and `scanStore.getLastResult()` exists, render from the in-memory store. Drop the "View history" link from the footer of this page.
- Leave `saveScan`/`saveReport` server functions in place (unused, but kept for future re-enable) — just unwired from the UI.

History page:
- `src/routes/history.tsx`: keep the page (legacy entries remain viewable), but add a clarifying note at top: "History saving is paused — new analyses won't be stored here." No deletion of existing rows.

### C. Mobile theme toggle fix

Root cause we are addressing: on mobile the toggle button sits inside the animated mobile drawer; clicks are sometimes swallowed when the drawer re-renders, and the `body` background uses `var(--color-brand-surface)` which only swaps when `.dark` is on `<html>`. We will:

- `src/components/theme/ThemeToggle.tsx`: on click, in addition to calling `toggle()`, synchronously toggle `document.documentElement.classList` and set `colorScheme` so the paint flips immediately (no waiting on React effect on slower mobile devices). Also add `onPointerDown`/`onTouchEnd` stop-propagation so the drawer's outside-click handler can't intercept.
- `src/components/layout/Navbar.tsx`: in the mobile drawer, wrap the `ThemeToggle` in a div with `onClick={(e)=>e.stopPropagation()}` and ensure the drawer is not unmounted by the toggle (it isn't — confirmed). Keep theme toggle visible in the drawer header.
- `src/components/theme/ThemeProvider.tsx`: also write a `meta[name=theme-color]` value on resolve so the mobile browser chrome (status bar) matches; this is the visible cue users keep saying is "still light/dark".
- `src/styles.css`: verify `body { background-color: var(--color-brand-surface); }` is correct (it is — the `.dark` block already overrides `--color-brand-surface`). No CSS edit unless verification fails after wiring.

## Verification

1. Build passes (`tsgo`).
2. Anonymous: 3 lab analyses succeed; 4th returns the existing `QUOTA_EXCEEDED` error. No localStorage `reportrx_history` entries written.
3. Signed-in: run >3 lab analyses and >3 scans in a row — all succeed, no quota error. No new rows appear in `/history`.
4. Toggle theme on a 752px viewport (current preview) — `<html>` gains/loses `.dark`, `body` repaints, mobile browser status bar color updates.

## Out of scope (explicit)

- Not deleting existing history rows or localStorage entries (non-destructive).
- Not touching pricing, Zeno prompts, or splash intro.
- Not unenrolling `requireSupabaseAuth` from scan — auth is still required to run a scan.
