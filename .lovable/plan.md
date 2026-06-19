## UltraGuard build-out

You uploaded a 2104-line concatenated source file containing 7 of the 9 layers (types + Layers 1, 2, 4, 5, 6, 7, 8). Layers 3 (multi-agent validator) and 9 (audit logger) are described in the header comment but missing from the file. I'll split the file into its intended module structure, scaffold the two missing layers, expose one `runUltraGuard(...)` orchestrator, and wire it into all three AI surfaces.

### 1. Module layout — `src/lib/ultraguard/`

```text
src/lib/ultraguard/
  types.ts                       (file lines 1-184)        — shared types
  tokenConstraints.ts            (lines 185-281)           — Layer 1
  closedBookPrompts.ts           (lines 282-552)           — Layer 2
  structuredOutputEnforcer.ts    (lines 553-840)           — Layer 4
  evidenceLinkValidator.ts       (lines 841-1122)          — Layer 5
  syndromeClusterGuard.ts        (lines 1123-1608)         — Layer 6
  contradictionDetector.ts       (lines 1609-1873)         — Layer 7
  confidencePropagator.ts        (lines 1874-2104)         — Layer 8
  multiAgentValidator.ts         (new — Layer 3)           — runs validator LLM
  auditLogger.ts                 (new — Layer 9)           — persists audit
  orchestrator.ts                (new)                     — runUltraGuard()
  index.ts                       (new)                     — public re-exports
```

Each split file keeps its original code verbatim; only the surrounding section-banner is dropped where it duplicates the new file header.

### 2. New layers

**Layer 3 — `multiAgentValidator.ts`**
- Calls Lovable AI Gateway (`google/gemini-3-flash-preview`) a second time using `buildValidatorSystemPrompt()` + `buildValidatorUserMessage()` from Layer 2.
- Uses Layer 1's `buildConstrainedPayload` (temperature=0).
- Returns `MultiAgentVerdict` (already typed in `types.ts`) — disagreements become `GuardViolation`s of severity `DOWNGRADE`.
- Server-side only (`*.server.ts` import) — never reachable from the client.

**Layer 9 — `auditLogger.ts`**
- Writes an `UltraGuardReport` per analysis to a new `ultraguard_audit` table (one row per run: `id`, `user_id`, `surface` (`scan|lab|zeno`), `report` JSONB, `sentinel`, `violation_count`, `created_at`).
- RLS: owner-read-only; service-role insert from server functions. Anonymous runs (sample reports) store `user_id = null` and an `ip_hash`.
- Reuses existing `guard_violations_log` table where shape fits; new audit table holds the full structured report.

**Orchestrator — `orchestrator.ts`**

```text
runUltraGuard({ rawLLM, modality, region, qualityHints, runValidator })
  → enforceStructuredOutput        (Layer 4)
  → normalizeToUltraGuardedFindings
  → validateEvidenceLinks          (Layer 5)
  → runSyndromeClusterGuard        (Layer 6)
  → detectContradictions           (Layer 7)
  → propagateConfidence            (Layer 8)
  → multiAgentValidate (optional)  (Layer 3, async)
  → auditLog                       (Layer 9)
  → returns UltraGuardReport + sentinel (RELEASE | RELEASE_WITH_CAVEAT | INSUFFICIENT_DATA | BLOCKED)
```

If sentinel === `BLOCKED`, callers must surface a safety message instead of findings.

### 3. Wiring into the three surfaces

- **Imaging safety (scans)** — `src/lib/scanAnalysis.functions.ts` + `src/lib/imagingSafety/pipeline.ts`: replace the existing ad-hoc guard with `buildConstrainedPayload` + `buildGeneratorSystemPrompt(modality, region)` for the request, then `runUltraGuard(...)` on the response. `ScanResultView` already understands `caveats`/`significance` — we'll pass through sanitized findings.
- **Lab reports** — `src/lib/analyze.functions.ts` and `src/lib/clinicalEngine/*`: replace `clinicalEngine/hallucinationGuard.ts` with `runUltraGuard` (modality="lab_report"). The existing Zod synthesis schema is mapped onto `RawLLMObservations` via a small adapter.
- **Zeno** — `src/lib/zeno/zeno.functions.ts`: each Zeno reply is wrapped: temperature=0 envelope, closed-book system prompt augmented with the user's report context, validator pass on the answer, downgrade or block + caveat injection. Emergency detector (existing) runs before UltraGuard.

In all three, `BLOCKED` sentinel returns a safe fallback ("I don't have enough evidence to answer that reliably — please consult a clinician") instead of the raw model output.

### 4. Database migration

One migration creates `ultraguard_audit` with RLS + grants per the project's standard pattern (authenticated owner-read, service-role full). No changes to existing tables.

### 5. Tests / verification

- Build must pass (TS strict).
- One manual scan run + one lab-report run + one Zeno question on the preview to confirm sentinel/caveats render and no regression on the existing happy path.
- Security scan re-run after migration.

### Out of scope

- No UI redesign — the existing scan/lab/Zeno views already render `caveats`, `significance`, and `confidence` bands.
- No changes to billing, auth, or payment flows.
- No rewrite of the existing `imagingSafety/pipeline.ts` orchestration beyond swapping the guard layer; the modality detection / consent flow stays as-is.

Approve and I'll execute end-to-end (split → scaffold → migration → wire → verify).