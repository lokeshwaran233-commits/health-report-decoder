## Phase 4A — Auth + secure short-token sharing

Enable Lovable Cloud, add optional email/password auth, move share links to short DB-backed tokens with 1-hour expiry, and sync history to the cloud for signed-in users.

---

### 1. Enable Lovable Cloud
Call `supabase--enable` (provisions Supabase + env vars). No external project setup needed — `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` come pre-wired. Disregards the user's manual env-var instructions; same effect.

### 2. Database schema (single migration)

```sql
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  report_date text,
  lab_name text,
  patient_name text,
  status_counts jsonb not null,
  biomarkers jsonb not null,
  summary text not null,
  doctor_questions jsonb not null,
  content_warning text
);
alter table public.reports enable row level security;
create policy "own reports select" on public.reports for select using (auth.uid() = user_id);
create policy "own reports insert" on public.reports for insert with check (auth.uid() = user_id);
create policy "own reports update" on public.reports for update using (auth.uid() = user_id);
create policy "own reports delete" on public.reports for delete using (auth.uid() = user_id);

create table public.share_tokens (
  token text primary key,
  report_id uuid not null references public.reports(id) on delete cascade,
  share_type text not null check (share_type in ('summary','audio')),
  expires_at timestamptz not null,
  accessed_count int not null default 0,
  max_accesses int not null default 10,
  created_at timestamptz not null default now(),
  -- denormalised snapshot so the public viewer never reads `reports`
  snapshot jsonb not null
);
alter table public.share_tokens enable row level security;
-- No anon policies: all reads/writes go through server fns (service role).
create index on public.share_tokens (report_id);
```

Notes:
- `snapshot` stores only what the public viewer needs (metadata, statusCounts, summary, doctorQuestions, contentWarning). Public callers never read `reports`, so PII stays gated by RLS.
- No anon RLS policies — public viewer hits a public server fn that uses `supabaseAdmin`.

### 3. Auth — email/password only
- **`src/components/auth/AuthModal.tsx`** — Two-tab modal (Sign in / Create account), email + password, `supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })` and `signInWithPassword`. On success: toast "Welcome to ReportRx", close. Use existing browser `@/integrations/supabase/client`.
- **`src/hooks/useAuth.ts`** — Subscribes to `onAuthStateChange` (set up BEFORE `getSession()`), exposes `{ user, session, signOut }`. Single source of truth for nav + sync hooks.
- **`src/components/layout/Navbar.tsx`** — Add right of History link:
  - Logged out: "Sign in to save your reports" button → opens AuthModal
  - Logged in: small circle with email-initial → click opens menu with email + "Sign out"
- The app remains fully usable signed-out — no route guards.

### 4. Short-token share (replace base64 URL)
- **New `src/lib/cloudSync.functions.ts`** (server fns, thin file — only `createServerFn` declarations):
  - `saveReport` — `requireSupabaseAuth`, upserts into `reports`, returns row id.
  - `listReports` — `requireSupabaseAuth`, returns user's reports.
  - `deleteReport` — `requireSupabaseAuth`, deletes by id.
  - `createShareToken({ result, counts, type })` — `requireSupabaseAuth`. Generates 12-char alphanumeric token (`crypto.randomBytes`), inserts into `share_tokens` with `expires_at = now + 1h` and a denormalised `snapshot`. If user has no `reports` row yet (signed-out flow can't reach here), this fn requires auth — share button shown only when signed in OR we save an ephemeral snapshot keyed only by token (no `report_id` linkage). **Decision: allow signed-OUT shares too** by making `share_tokens.report_id` nullable; insert with `report_id = null` and snapshot only. Adjusted schema accordingly:
    ```sql
    alter table public.share_tokens alter column report_id drop not null;
    ```
    For signed-out callers we need a public server fn — see below.
  - `createPublicShareToken({ snapshot, type })` — NO middleware, validates input shape with Zod, generates token, inserts via `supabaseAdmin`. Used when no session exists.
- **New `src/lib/share.functions.ts`** — Public `getShareSnapshot({ token })` server fn (no auth). Uses `supabaseAdmin`. Checks `expires_at`, checks `accessed_count < max_accesses`, increments `accessed_count`, returns `{ snapshot, type, expiresAt }` or typed errors `EXPIRED` / `LIMIT_EXCEEDED` / `NOT_FOUND`.

### 5. Route `/s/$token`
- **New `src/routes/s.$token.tsx`** — Loader calls `getShareSnapshot({ data: { token } })`. Renders the existing shared summary UI (refactored out of `results.tsx` into `src/components/share/SharedSummaryView.tsx` so both routes use it).
- States:
  - `EXPIRED` → "This link has expired. Links are valid for 1 hour for your privacy." + CTA to `/`
  - `LIMIT_EXCEEDED` → "This link has been accessed too many times"
  - `NOT_FOUND` → "Link not found"
  - Success → renders summary + banner "You're viewing a shared ReportRx summary — shared links expire after 1 hour"
- `errorComponent` + `notFoundComponent` set per Tanstack rules.

### 6. ShareModal update
- Replace `encodeShare` URL with a call to `createShareToken` (signed in) or `createPublicShareToken` (signed out). Loading state on the copy/WhatsApp buttons while token mints.
- WhatsApp message:  
  `Check out my ReportRx health summary → {origin}/s/{TOKEN}\n(This link expires in 1 hour)`
- Delete `src/lib/shareCodec.ts` after removing all references (search confirms only `ShareModal.tsx` and `results.tsx` shared-view branch use it; the shared-view branch in `results.tsx` is removed since `/s/$token` replaces it).

### 7. Multi-device history sync
- **`src/hooks/useReportAnalysis.ts`** — after `setLastResult`, if `useAuth().user` exists, call `saveReport({ data: result })`. Silently no-op on failure (toast warn).
- **`src/routes/history.tsx`** — if signed in: `useQuery` against `listReports` server fn + merge with local. If signed out: existing localStorage path + banner "Sign in to access your reports across all your devices".
- Delete from history: signed-in calls `deleteReport`; signed-out uses existing local removal.

### 8. Wiring + boilerplate
- Confirm `src/start.ts` registers `attachSupabaseAuth` in `functionMiddleware` (added by Cloud scaffold; check & append if missing).
- Add `supabase.auth.onAuthStateChange` listener in `__root.tsx` that calls `router.invalidate()` so history view refreshes on sign-in/out.
- No new npm packages (Supabase client is auto-generated by Cloud).

### 9. Verification
- `bunx tsc --noEmit` clean.
- Manual: signed-out share generates short token, opens in incognito, expires after 1h (test by manually backdating `expires_at`).
- Manual: sign up → upload report → see it in History; sign in on another browser → same report appears.

### Out of scope (explicit)
- App-level encryption (using Supabase default, per user choice).
- OAuth providers.
- Password reset flow.
- i18n (Phase 4B).
- Audio (Phase 4C).