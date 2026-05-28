import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ScanInterpretationResult } from "@/types/scan";

const scanResultSchema = z.object({
  id: z.string(),
  modality: z.string(),
  bodyRegion: z.string(),
  clinicalContext: z.string().nullable().optional(),
  language: z.string().optional(),
  imageQuality: z.string(),
  imageQualityNote: z.string().optional(),
  professional: z.unknown(),
  layman: z.unknown(),
  indeterminateFindings: z.array(z.string()),
  criticalAlerts: z.array(z.string()),
  cannotAssess: z.array(z.string()),
  aiConfidenceNote: z.string(),
  createdAt: z.string(),
});

export const saveScan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ result: scanResultSchema }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const r = data.result as ScanInterpretationResult;
    const { data: row, error } = await supabase
      .from("scan_results")
      .insert({
        user_id: userId,
        modality: r.modality,
        body_region: r.bodyRegion,
        clinical_context: r.clinicalContext ?? null,
        image_quality: r.imageQuality,
        professional_output: r.professional as unknown as never,
        layman_output: r.layman as unknown as never,
        critical_alerts: r.criticalAlerts as unknown as never,
        indeterminate: r.indeterminateFindings as unknown as never,
        cannot_assess: r.cannotAssess as unknown as never,
        urgency:
          (r.professional as { urgency?: string } | null)?.urgency ?? null,
        ai_confidence_note: r.aiConfidenceNote,
        language: r.language ?? "en",
      })
      .select("id, created_at")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id, createdAt: row.created_at };
  });

export const listScans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("scan_results")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return { scans: data ?? [] };
  });

export const deleteScan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("scan_results")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
