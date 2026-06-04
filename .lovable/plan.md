## Phase D6 + D7 Implementation Plan

Single combined plan, sequenced so D6 ships first and D7 layers cleanly on top. Each "Credit" maps to a self-contained build step you can stop after.

---

### Pre-flight audit (1 step, no code yet once we enter build mode)

Verify before building:
1. Zeno (D4–D5): open `/results` with a sample report, send a message, toggle Simple/Medical mode, test medication refusal, check console + `zeno_conversations` writes.
2. Confirm `share_tokens` schema already supports `audio` (it does, per `cloudSync.functions.ts`) and `snapshot` jsonb exists.
3. List concrete bugs found; fix only blockers before D6 credit 1.

---

### D6 — Audio Summary + Multi-language TTS

**Credit 1 — Audio engine**
- `src/lib/audioService.ts`: `AudioService` class (speak/pause/resume/stop, voice picker with Indian-language preference, progress estimator, Chrome 14s keep-alive ping, `getAvailableLanguages()` static, `buildScript(result, lang)` static).
- `src/hooks/useAudioPlayer.ts`: stateful wrapper exposing `{ state, progress, language, changeLanguage, play, pause, stop }`. Persists language to `localStorage` key `rx_audio_lang`. Accept either an `AnalysisResult` OR a pre-built script string (needed for share view).

**Credit 2 — Inline player UI**
- `src/components/results/WaveformVisualizer.tsx` — 24 animated bars, sine + noise, teal-on-dark, idle/playing/paused/done/error variants.
- `src/components/results/AudioPlayer.tsx` — pill card with waveform, title, language selector (only available languages enabled; unavailable shown disabled with install-voice tooltip), play/pause/stop, progress bar + %. WCAG: `role="region"`, `aria-label`, `role="progressbar"` with valuenow, `aria-live="polite"` status. No-speech-API fallback card.
- Mount at the top of `InsightsSection.tsx`.

**Credit 3 — Audio share view**
- Extend `src/lib/cloudSync.functions.ts` `createShareToken` to accept `type: "summary" | "audio"` and store an audio snapshot `{ patientName, reportDate, language, summaryText }` (script only — no raw biomarkers). Keep 1-hour expiry.
- `src/components/results/AudioShareView.tsx` — minimal centered layout, big 88px play button, progress bar, live expiry countdown (red when expired), brand CTA. Reads snapshot via the existing public-read path in `share.functions.ts`.
- Extend `src/routes/s.$token.tsx` to branch on `shareType === "audio"` and render `AudioShareView`.

**Credit 4 — Share modal audio option**
- Extend `src/components/results/ShareModal.tsx`: divider + "Share as audio" section with Mic icon, copy-link button, WhatsApp button. Reuses the existing token-mint flow with `type: "audio"`. Stores the script built via `AudioService.buildScript(result, currentUiLanguage)`.

**Credit 5 — Polish + QA**
- Wire `getAvailableLanguages()` into the selector. Verify Chrome 14s keep-alive. Mobile viewport check. Tamil/Hindi voice-missing tooltip with OS-settings hint. Accessibility audit pass.
- Post-phase manual checklist run.

---

### D7 — Family Profiles

**Credit 1 — Schema + types (migration)**
- Migration creates `public.family_profiles` (with GRANTs to authenticated + service_role, RLS, updated_at trigger).
- Adds `profile_id uuid references family_profiles(id) on delete set null` to `public.reports` + index.
- Adds `profile_id` to `public.scan_results` similarly (for parity).
- **App-side fallback** instead of `auth.users` trigger: on first authenticated load, if user has zero profiles, create a primary "Self" profile via a `createServerFn` (`requireSupabaseAuth`).
- `src/types/profile.ts`: `FamilyProfile`, `AVATAR_COLORS` const tuple (6 named colors), `ProfileContextType`.

**Credit 2 — Profile context + scoping**
- `src/contexts/ProfileContext.tsx` with `ProfileProvider` + `useProfiles` hook (fetch, set active, create, update, delete; activeProfile persisted per-user in localStorage; auto-create Self on first load if empty).
- Mount `<ProfileProvider>` inside `src/routes/__root.tsx` (after auth wiring, before `<Outlet />`).
- Scope reads: update `useReportHistory` and `useScanHistory` to accept/filter by `activeProfile.id` (fall back to all when null = legacy data).
- Scope writes: `analyze.functions.ts` + `scanAnalysis.functions.ts` / cloud-sync inserts include `profile_id` from active profile (passed from client at save time).

**Credit 3 — ProfileSwitcher in Navbar**
- `src/components/profile/ProfileAvatar.tsx` — colored circle with initial, sm/md/lg, active ring.
- `src/components/profile/ProfileSwitcher.tsx` — pill trigger + dropdown listing profiles with active checkmark + "Add family member" row. Replaces the existing initial avatar in `Navbar.tsx` `UserMenu`. Single-profile users see avatar that opens `CreateProfileModal` directly.

**Credit 4 — CreateProfileModal**
- `src/components/profile/CreateProfileModal.tsx` — name (≤30), relationship pill grid, age stepper, gender pills, avatar color swatches, live preview, success animation. Reused for edit mode in D7 credit 5.

**Credit 5 — History scoping UI + /settings + RLS audit**
- History page: header chip "Showing reports for [avatar] [name]" + switcher; auto-refetch on profile change.
- New `src/routes/settings.tsx` under `_authenticated` (creating that layout if not already present). Sections:
  - Account: email (read-only), "Change password" (triggers reset email), "Delete account" (typed confirm).
  - Family profiles: list with edit (CreateProfileModal in update mode) + delete (primary is non-deletable; confirm dialog).
- Migration to add a SELECT policy on `reports`/`scan_results` allowing access via owned profile_id (defense in depth alongside existing user_id policies).
- Run `supabase--linter` after migrations.

---

### Technical notes

- **No `auth.users` trigger.** Self-profile creation lives in app code (server fn called by `ProfileProvider`) to avoid mutating Supabase-reserved schemas.
- **Backwards compatibility.** Existing reports have `profile_id = NULL`; treat as belonging to the user's primary profile in queries (`.or(profile_id.eq.<id>,profile_id.is.null)` while activeProfile is primary; strict `.eq` for non-primary). A one-time backfill is *not* run automatically; users see legacy reports under Self.
- **Share view + audio script.** The existing `snapshot` jsonb column already carries the share payload; we extend it with a discriminated shape: `{ kind: "summary", ... } | { kind: "audio", summaryText, language, ... }`. No schema change needed for D6.
- **Server-fn boundary.** Profile CRUD goes through `createServerFn` + `requireSupabaseAuth` to keep RLS honest and avoid client-side admin clients.
- **Tokens.** Continue using existing `createShareToken` server fn — we only widen the snapshot shape and the route dispatcher.
- **Accessibility + i18n.** Audio player uses ARIA live regions; language labels come from `i18n/locales/*.json`.
- **Out of scope.** No WhatsApp bridge changes, no cross-profile analytics, no audit logging.
