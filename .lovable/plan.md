## Overview

This spec covers ~15 sub-features across three themes:
- **D1** — security hardening (validation, auth, RLS, headers, audit logs)
- **D4** — Zeno: sliding chat panel, report-aware AI companion, voice, RAG, emergency detection
- **D5** — cross-report memory + WhatsApp Q&A bridge

It's far too large for one implementation pass. I'll plan it as **6 phases**, each independently testable. After approval, I'll build Phase 1 and stop; you re-approve before Phase 2, and so on. This keeps each turn focused and lets you correct course early.

Stack adaptations confirmed:
- Lovable AI Gateway via TanStack `createServerFn` (no Anthropic/OpenAI keys, no browser-direct calls)
- Security headers via TanStack request middleware (no `netlify.toml`)
- Audit logging + RAG embeddings via `createServerFn` (no Supabase Edge Functions)
- WhatsApp pieces deferred — no existing WA infra in repo, would need separate provider decision

---

## Phase 1 — Input validation & sanitization (D1 C1)

Smallest, zero-risk foundation. No DB changes.

- `src/lib/security/fileValidator.ts` — MIME allowlist, 10MB cap, filename rules, magic-byte check (JPEG/PNG/WebP/PDF)
- `src/lib/security/sanitize.ts` — DOMPurify wrappers (`sanitizeText`, `sanitizeRichText`)
- Install `dompurify` + `@types/dompurify`
- Wire `validateUploadedFile` into `src/components/upload/DropZone.tsx` and `src/components/scan/` upload paths; show friendly error toast on rejection
- Wire `sanitizeText` into any free-text persistence points (currently minimal — mostly auth form inputs)

Stop. Verify uploads still work; invalid files blocked.

## Phase 2 — Auth hardening + session timeout (D1 C2)

- `src/lib/security/rateLimiter.ts` — generic localStorage attempt tracker (sign-up 3/hr/email, password-reset 3/hr, resend-verify 3/hr)
- Password reset flow:
  - "Forgot password?" link in `AuthForm.tsx`
  - New route `src/routes/auth.reset-password.tsx` handling `PASSWORD_RECOVERY` event, with password rules matching signup
- `src/hooks/useSessionTimeout.ts` — 30-min idle timeout, signs out + sets `rx_session_expired` flag
- Mount in `__root.tsx` (only when authenticated)
- "Session expired" modal on `/auth` when flag present
- CSRF helpers (`src/lib/security/csrf.ts`) — provided but only wired if we add custom forms; JWT-bearer flows don't need it

Stop. Test forgot-password roundtrip, idle logout.

## Phase 3 — RLS audit, storage policies, security headers (D1 C3-C4)

Migration:
- Audit existing `reports`, `scan_results`, `share_tokens` policies (already mostly correct per current schema)
- Add `share_tokens` public-read policy gated by `expires_at > now() AND accessed_count < max_accesses`
- Create `lab_reports` private storage bucket + folder-scoped RLS (`{user_id}/...`)
- `src/lib/security/storagePath.ts` helper

Headers (stack-appropriate):
- `src/start.ts` — add request middleware that sets CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy on all responses; `Cache-Control: no-store, private` + `X-Robots-Tag: noindex` for `/s/*` and `/profile`

Stop. Verify headers in DevTools; share links still work.

## Phase 4 — Zeno UI shell + Lovable AI wiring (D4 C1-C2)

DB migration:
- `zeno_conversations` table (user_id, report_id, messages jsonb, summary, timestamps) + RLS

Server fn:
- `src/lib/zeno/zeno.functions.ts` — `chatWithZeno` using Lovable AI Gateway (`google/gemini-2.5-pro` for medical depth), streaming via SSE, `requireSupabaseAuth` middleware
- System prompt built server-side from report + profile context (never client-side)
- Strict safety rules (no meds, no diagnosis, emergency prefix, etc.)

UI:
- `src/components/zeno/ZenoOrb.tsx` — floating bottom-right pulse button
- `src/components/zeno/ZenoPanel.tsx` — right-slide panel (bottom-sheet on mobile), animated orb header, message list, mode toggle (Simple/Medical), input bar
- `src/components/zeno/ZenoMessage.tsx` — bubble styles per spec
- `src/hooks/zeno/useZeno.ts` — state + streaming consumer
- `src/lib/zeno/contextBuilder.ts` — system prompt builder (server-only)
- CSS tokens added to `src/styles.css`
- Mount orb in results pages where a report is loaded

Stop. Verify chat works with a real report; safety guardrails respected.

## Phase 5 — Dual-mode parsing, emergency detection, anti-hallucination (D4 C3 partial + C5)

- `src/lib/zeno/responseParser.ts` — `[CLINICAL_START]...[CLINICAL_END]` extraction
- Medical mode: collapsible clinical section in bubble
- `src/lib/zeno/emergencyDetector.ts` — threshold table (Hb, glucose, K, Na, creatinine, troponin)
- Persistent amber banner in panel + red dot on orb when emergencies detected
- `src/lib/zeno/hallucinationGuard.ts` — server-side regex post-filter on streamed response; on violation, replace with safe phrasing and silently log
- Conversation persistence to `zeno_conversations`

Stop. Mock an Hb < 7 report; verify banner + advisory wording.

## Phase 6 — RAG knowledge base + voice (D4 C3 RAG + C4)

DB migration:
- `pgvector` extension + `zeno_knowledge` table (vector(3072) for `google/gemini-embedding-001`) + HNSW index + `match_zeno_knowledge` RPC

Server:
- `src/lib/zeno/rag.functions.ts` — embed query via Lovable AI `/v1/embeddings`, retrieve top-k chunks, inject into system prompt; flag low-confidence (<0.7 similarity) so Zeno hedges
- `scripts/seedZenoKnowledge.ts` — seed ICMR/WHO/MedlinePlus chunks (small starter set)

Voice:
- `src/hooks/zeno/useZenoSTT.ts` — Web Speech API (en-IN default), guarded for unsupported browsers
- TTS toggle using existing AudioService if present, else `speechSynthesis`
- Language pill for STT/TTS language

Stop. Verify retrieval grounds answers; voice in/out works in Chrome.

---

## Deferred (not in this plan, flag for later)

- **D5 cross-report memory** — straightforward extension of Phase 4-6, adds conversation summarization + summaries injected into context
- **D5 WhatsApp bridge** — requires choosing a WA provider (Twilio, Meta Cloud API, Uazapi); no scaffolding exists. Separate planning round.
- **Audit log table + anomaly detection** (D1 C5) — useful but additive; can slot in after Phase 3 if needed. I left it out of the critical path to keep phases shippable.
- **JSON-mode structured dietary cards** (D5 C5) — small follow-up after RAG is stable.

## Technical notes

- All AI calls go through TanStack `createServerFn` → Lovable AI Gateway. `LOVABLE_API_KEY` is already provisioned; no secret request needed.
- Streaming uses SSE through a TanStack server route (`src/routes/api/zeno.stream.ts`) since `createServerFn` returns serializable data, not streams. Client reads via `fetch` + reader.
- All `src/integrations/supabase/*` files remain untouched (auto-generated).
- Migrations are presented one-per-phase for clear approval gates.
- No new top-level deps beyond `dompurify` + types in Phase 1.

## What to do now

Approve to start **Phase 1 only**. After it's in and verified, say "continue" and I'll plan/build Phase 2.
