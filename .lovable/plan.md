## Goal

Two things in one pass:
1. **Finish the 3 pending wiring edits** from the previous turn so dark/light mode actually works end-to-end.
2. **Apply the uploaded "Reducing Hallucinations in Medical Imaging AI" roadmap** to the existing scan pipeline (CT, MRI, DEXA, US, Echo, ECG, EEG, PET, X-ray, Mammo) as a parallel safety layer — no rewrite of the legacy path, no broken builds.

Existing `clinical2026/` parallel-namespace approach is reused so nothing in `/results`, `/scan-results`, or `/history` regresses.

---

## Part A — Theme wiring (3 edits, ~5 min)

1. `src/routes/__root.tsx` — wrap `RootComponent` body with `<ThemeProvider>` (around the `QueryClientProvider`).
2. `src/components/layout/Navbar.tsx` — render `<ThemeToggle />` next to `LanguageSwitcher` (both desktop and mobile menu).
3. `src/styles.css` — add `.dark` overrides for existing brand tokens (`--brand-surface`, `--brand-dark`, `--brand-muted`, `--brand-border`, card/teal hover) + `@keyframes fadeUp` used by v2 components.

No new dependencies. No DB changes.

---

## Part B — Medical Imaging Safety Pipeline (new parallel namespace)

New folder `src/lib/imagingSafety/` — never imported by the legacy `/scan` route, only by a new `/scan-v2` opt-in route, so zero risk to existing flows. Maps the doc's 12 phases to code:

```text
src/lib/imagingSafety/
  types.ts                 # ModalityInput, QualityReport, AnatomyCheck,
                           # CalibratedFinding, Evidence, CriticReport,
                           # SafetyDecision, FinalReport, DeferralReason
  phase1_input.ts          # MIME/extension/header sniff per modality,
                           # DICOM tag presence check (best-effort, browser),
                           # screenshot vs original detection, reject list
  phase2_quality.ts        # Heuristic image-quality scorers per modality
                           # (resolution, contrast spread, motion proxy,
                           # ECG lead-count + sample-rate parser)
  phase3_anatomy.ts        # LLM-assisted anatomy verifier with strict
                           # JSON schema (region, view, laterality)
  phase4_disease.ts        # Per-modality prompt routing + temperature 0
                           # + JSON-mode finding extraction
  phase5_calibration.ts    # Map LLM self-confidence → calibrated bands
                           # (HIGH/MOD/LOW/INSUFFICIENT) using quality
                           # + anatomy + evidence count
  phase6_evidence.ts       # Require ≥1 image-grounded evidence string
                           # per finding; drop ungrounded findings
  phase7_critic.ts         # Second-pass critic LLM that re-reads the
                           # report + image and flags overreach
  phase8_safetyRules.ts    # Hard rules: no dosages, no diagnosis verbs,
                           # critical-finding escalation, pregnancy/contrast
                           # gates, lead-reversal & STEMI artefact guard,
                           # DEXA positioning guard, US gel/probe artefact
  phase9_reporting.ts      # Build patient-safe + clinician-brief outputs
                           # with explicit uncertainty language
  phase10_humanReview.ts   # Decide auto-release vs defer-to-clinician;
                           # emit DeferralReason with reasons
  phase11_validation.ts    # Local golden-set runner (JSON fixtures in
                           # tests/imagingSafety/) — no network
  phase12_regulatory.ts    # Audit-log writer (model versions, prompts,
                           # hashes, decisions) → guard_violations_log
  pipeline.ts              # runImagingSafetyPipeline(input): orchestrates
                           # phases 1→10, short-circuits on hard fails,
                           # always returns FinalReport
  fixtures/                # 8-10 JSON test fixtures across modalities
```

Server side:
- `src/lib/imagingSafety/imagingSafety.functions.ts` — `analyzeScanSafe` createServerFn (`requireSupabaseAuth`), calls Lovable AI Gateway (existing `LOVABLE_API_KEY`), writes audit row to existing `guard_violations_log` via `supabaseAdmin`.
- No new DB tables. Reuses `guard_violations_log` (already deny-by-default with admin writes) for phase-12 audit.

UI side (opt-in, behind theme toggle row):
- `src/routes/scan-v2.tsx` — uploads → calls `analyzeScanSafe` → renders new components.
- `src/components/imagingSafety/` — `QualityGatePanel`, `AnatomyBadge`, `CalibratedFindingCard`, `CriticBanner`, `SafetyDecisionBanner`, `DeferralCard`, `AuditFooter`. Dark-mode aware from day 1.

Legacy `/scan` keeps working unchanged.

---

## Hallucination guardrails (applied uniformly)

- LLM calls use `temperature: 0`, JSON-mode, max-tokens cap, retry-once-with-stricter-prompt.
- Existing `src/lib/zeno/hallucinationGuard.ts` patterns extended into `phase8_safetyRules.ts` (drug doses, diagnosis verbs, prescriptions, lead-reversal phrases, BI-RADS overreach, EF point estimates from single view).
- Every finding without an evidence string is dropped before reaching the UI.
- If quality < threshold OR anatomy mismatch → pipeline returns `{ decision: 'defer', reasons: [...] }` and UI shows a clear "we can't safely read this" card, never a fabricated diagnosis.

---

## Verification

- Build (auto).
- Run `bun test tests/imagingSafety/*.test.ts` against the local fixtures (no network — uses a stubbed LLM client) to confirm:
  - low-quality CT → `defer`
  - lead-reversal ECG → `defer` with reason
  - clean DEXA → `release` with calibrated finding
- Manually load `/scan-v2`, upload a sample image, confirm pipeline UI renders in both light and dark mode.

---

## Out of scope

- No replacement of legacy `/scan` route.
- No new payment/credit logic (existing entitlements already gate scans).
- No new DB tables, no new secrets.
- No regulatory submission artifacts beyond an in-app audit log.

---

## Files touched (summary)

- **Edit:** `src/routes/__root.tsx`, `src/components/layout/Navbar.tsx`, `src/styles.css`
- **Create:** `src/lib/imagingSafety/*` (~15 files), `src/routes/scan-v2.tsx`, `src/components/imagingSafety/*` (~7 files), `tests/imagingSafety/*` (~3 files + fixtures)

Approve and I'll execute everything in one build pass.