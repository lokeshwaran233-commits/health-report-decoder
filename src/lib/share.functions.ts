import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type ShareErrorCode = "NOT_FOUND" | "EXPIRED" | "LIMIT_EXCEEDED";

export interface ShareSnapshot {
  metadata: {
    patientName: string | null;
    reportDate: string | null;
    labName: string | null;
  };
  statusCounts: { normal: number; watch: number; flagged: number };
  summary: string;
  doctorQuestions: string[];
  contentWarning: string | null;
}

export interface ShareResult {
  ok: true;
  snapshot: ShareSnapshot;
  shareType: "summary" | "audio";
  expiresAt: string;
}

export interface ShareError {
  ok: false;
  code: ShareErrorCode;
}

export const getShareSnapshot = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        token: z
          .string()
          .min(6)
          .max(32)
          .regex(/^[A-Z0-9]+$/i),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<ShareResult | ShareError> => {
    const token = data.token.toUpperCase();

    const { data: row, error } = await supabaseAdmin
      .from("share_tokens")
      .select(
        "token, share_type, expires_at, accessed_count, max_accesses, snapshot",
      )
      .eq("token", token)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!row) return { ok: false, code: "NOT_FOUND" };

    if (new Date(row.expires_at).getTime() < Date.now()) {
      return { ok: false, code: "EXPIRED" };
    }
    if (row.accessed_count >= row.max_accesses) {
      return { ok: false, code: "LIMIT_EXCEEDED" };
    }

    await supabaseAdmin
      .from("share_tokens")
      .update({ accessed_count: row.accessed_count + 1 })
      .eq("token", token);

    return {
      ok: true,
      snapshot: row.snapshot as unknown as ShareSnapshot,
      shareType: row.share_type as "summary" | "audio",
      expiresAt: row.expires_at,
    };
  });
