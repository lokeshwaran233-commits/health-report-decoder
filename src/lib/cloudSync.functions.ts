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
  biomarkers: z.array(z.unknown()),
  summary: z.string(),
  doctorQuestions: z.array(z.string()),
  contentWarning: z.string().nullable(),
});

const countsSchema = z.object({
  normal: z.number().int().nonnegative(),
  watch: z.number().int().nonnegative(),
  flagged: z.number().int().nonnegative(),
});

const sharePayloadSchema = z.object({
  metadata: z.object({
    patientName: z.string().nullable(),
    reportDate: z.string().nullable(),
    labName: z.string().nullable(),
  }),
  statusCounts: countsSchema,
  summary: z.string().max(20000),
  doctorQuestions: z.array(z.string().max(2000)).max(20),
  contentWarning: z.string().nullable(),
});

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
      })
      .select("id, created_at")
      .single();

    if (error) throw new Error(error.message);
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

// Public — no auth required. Anyone (signed-in or out) can mint a share token
// for a snapshot they already see in their own browser.
export const createShareToken = createServerFn({ method: "POST" })
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
