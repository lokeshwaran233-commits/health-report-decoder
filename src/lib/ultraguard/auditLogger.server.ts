// ═══════════════════════════════════════════════════════════════════════════
// UltraGuard — Layer 9: Audit Logger
//
// Best-effort persistence of an UltraGuardReport into the `ultraguard_audit`
// table. Uses supabaseAdmin so it works for both authenticated and anonymous
// runs. Never throws — audit logging must not break the user-facing flow.
//
// Server-only (`*.server.ts`): never import from a route or *.functions.ts at
// module scope.
// ═══════════════════════════════════════════════════════════════════════════

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { AuditEntry, GuardLayer, UltraGuardReport } from "./types";

export type UltraGuardSurface = "scan" | "lab" | "zeno";

export interface AuditLogInput {
  surface: UltraGuardSurface;
  userId?: string | null;
  ipHash?: string | null;
  report: UltraGuardReport;
  contextSummary?: string;
}

let auditSeq = 0;

export function makeAuditEntry(
  layer: GuardLayer,
  action: AuditEntry["action"],
  detail: string,
  durationMs: number,
  findingId?: string,
): AuditEntry {
  auditSeq += 1;
  return {
    seq: auditSeq,
    timestamp: new Date().toISOString(),
    layer,
    action,
    findingId,
    detail,
    durationMs,
  };
}

export async function persistAuditTrail(input: AuditLogInput): Promise<void> {
  try {
    // Supabase generated types do not yet include `ultraguard_audit` until the
    // migration runs and types are regenerated. Cast to a permissive client so
    // this compiles in the interim and remains correct at runtime.
    const client = supabaseAdmin as unknown as {
      from: (table: string) => {
        insert: (row: Record<string, unknown>) => Promise<{ error: unknown }>;
      };
    };
    await client.from("ultraguard_audit").insert({
      surface: input.surface,
      user_id: input.userId ?? null,
      ip_hash: input.ipHash ?? null,
      sentinel: input.report.sentinel,
      blocked_by_layer: input.report.blockedByLayer,
      violation_count: input.report.violations.length,
      downgrade_count: input.report.downgrades.length,
      approved_count: input.report.approvedFindings.length,
      rejected_count: input.report.rejectedFindings.length,
      processing_ms: input.report.totalProcessingMs,
      pipeline_version: input.report.pipelineVersion,
      report: input.report as unknown as Record<string, unknown>,
      context_summary: input.contextSummary ?? null,
    });
  } catch (err) {
    // Audit must never break the user-facing flow.
    console.error("[UltraGuard|L9] Failed to persist audit trail:", err);
  }
}
