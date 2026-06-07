import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { AnalysisResult } from "@/types/report";

const analysisResultSchema = z.object({
  id: z.string(),
  metadata: z.object({
    patientName: z.string().nullable().optional(),
    reportDate: z.string().nullable().optional(),
    labName: z.string().nullable().optional(),
    uploadedAt: z.string(),
  }),
  biomarkers: z.array(z.any()),
  summary: z.string(),
  doctorQuestions: z.array(z.string()),
  contentWarning: z.string().nullable(),
  clinicalEngine: z.any().nullable().optional(),
});

const countsSchema = z.object({
  normal: z.number().int().nonnegative(),
  watch: z.number().int().nonnegative(),
  flagged: z.number().int().nonnegative(),
});

const shareMetadataSchema = z.object({
  patientName: z.string().max(300).nullable(),
  reportDate: z.string().max(100).nullable(),
  labName: z.string().max(300).nullable(),
});

const summarySnapshotSchema = z.object({
  kind: z.literal("summary").optional(),
  metadata: shareMetadataSchema,
  statusCounts: countsSchema,
  summary: z.string().max(20000),
  doctorQuestions: z.array(z.string().max(2000)).max(20),
  contentWarning: z.string().max(1000).nullable(),
});

const audioSnapshotSchema = z.object({
  kind: z.literal("audio"),
  metadata: shareMetadataSchema,
  language: z.string().min(2).max(8),
  summaryText: z.string().min(1).max(20000),
});

const sharePayloadSchema = z.union([summarySnapshotSchema, audioSnapshotSchema]);


function generateToken(): string {
  const bytes = new Uint8Array(9);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += b.toString(36);
  return out.slice(0, 12).toUpperCase();
}

function computeStatusCounts(result: AnalysisResult) {
  const counts = { normal: 0, watch: 0, flagged: 0 };
  for (const b of result.biomarkers as Array<{ status?: string }>) {
    if (b.status === "normal") counts.normal += 1;
    else if (b.status === "watch") counts.watch += 1;
    else if (b.status === "flagged") counts.flagged += 1;
  }
  return counts;
}

export const saveReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ result: analysisResultSchema }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const r = data.result as AnalysisResult;
    const counts = computeStatusCounts(r);
    const engine = r.clinicalEngine ?? null;

    const { data: row, error } = await supabase
      .from("reports")
      .insert({
        user_id: userId,
        report_date: r.metadata.reportDate ?? null,
        lab_name: r.metadata.labName ?? null,
        patient_name: r.metadata.patientName ?? null,
        status_counts: counts as unknown as never,
        biomarkers: r.biomarkers as unknown as never,
        summary: r.summary,
        doctor_questions: r.doctorQuestions as unknown as never,
        content_warning: r.contentWarning,
        clinical_engine_version: engine?.version ?? null,
        evaluated_biomarkers: (engine?.evaluatedBiomarkers ?? null) as unknown as never,
        pattern_evaluations: (engine?.patternEvaluations ?? null) as unknown as never,
        priority_findings: (engine?.priorityFindings ?? null) as unknown as never,
        critical_alerts: (engine?.criticalAlerts ?? null) as unknown as never,
        data_quality_warnings: (engine?.dataQualityWarnings ?? null) as unknown as never,
        overall_clinical_score: engine?.overallClinicalScore ?? null,
        guard_violations_count: engine?.guardViolations?.length ?? 0,
        guard_had_critical: engine?.guardHadCritical ?? false,
      })
      .select("id, created_at")
      .single();

    if (error) throw new Error(error.message);

    // Persist biomarker history (best-effort)
    try {
      const reportDate = r.metadata.reportDate ?? null;
      const rows = (r.biomarkers as Array<{
        name: string;
        value: number;
        unit?: string;
        status?: string;
        referenceRange?: { low: number; high: number };
      }>).map((b) => ({
        user_id: userId,
        report_id: row.id,
        biomarker_name: b.name.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
        raw_name: b.name,
        value: typeof b.value === "number" ? b.value : null,
        unit: b.unit ?? null,
        status: b.status ?? null,
        lab_ref_min: b.referenceRange?.low ?? null,
        lab_ref_max: b.referenceRange?.high ?? null,
        report_date: reportDate && /^\d{4}-\d{2}-\d{2}/.test(reportDate) ? reportDate.slice(0, 10) : null,
      }));
      if (rows.length > 0) {
        await supabase.from("biomarker_history").insert(rows as unknown as never);
      }
    } catch (e) {
      console.error("[saveReport] biomarker_history insert failed", e);
    }

    // Persist guard violations (best-effort)
    try {
      const violations = engine?.guardViolations ?? [];
      if (violations.length > 0) {
        await supabase.from("guard_violations_log").insert(
          violations.map((v) => ({
            report_id: row.id,
            violation_text: v.text,
            severity: v.severity,
            engine_version: engine?.version ?? "1.0",
          })) as unknown as never,
        );
      }
    } catch (e) {
      console.error("[saveReport] guard_violations_log insert failed", e);
    }

    return { id: row.id, createdAt: row.created_at };
  });

export const listReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return { reports: data ?? [] };
  });

export const deleteReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("reports").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteReports = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ ids: z.array(z.string().uuid()).min(1).max(200) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("reports").delete().in("id", data.ids);
    if (error) throw new Error(error.message);
    return { ok: true, count: data.ids.length };
  });

export const clearAllReports = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("reports")
      .delete()
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Auth-required: signed-in users mint share tokens for snapshots they own.
// Keeping this open allowed anonymous attackers to spam the share_tokens table.
export const createShareToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        snapshot: sharePayloadSchema,
        type: z.enum(["summary", "audio"]),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const { error } = await supabaseAdmin.from("share_tokens").insert({
      token,
      report_id: null,
      share_type: data.type,
      expires_at: expiresAt,
      snapshot: data.snapshot,
    });
    if (error) throw new Error(error.message);
    return { token, expiresAt };
  });
