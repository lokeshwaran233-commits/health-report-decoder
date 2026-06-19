import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildSystemPrompt } from "./contextBuilder";
import { parseZenoResponse } from "./responseParser";
import { guardHallucinations } from "./hallucinationGuard";
import type { AnalysisResult } from "@/types/report";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(8000),
});

const reportSchema = z.unknown().nullable().optional();

const chatInput = z.object({
  conversationId: z.string().uuid().nullable().optional(),
  mode: z.enum(["simple", "medical"]).default("simple"),
  report: reportSchema,
  messages: z.array(messageSchema).min(1).max(40),
  language: z.enum(["en", "ta", "hi", "te"]).default("en"),
});

async function embedQuery(query: string, apiKey: string): Promise<number[] | null> {
  try {
    const res = await fetch(
      "https://ai.gateway.lovable.dev/v1/embeddings",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-embedding-001",
          input: query,
          dimensions: 768,
        }),
      },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: { embedding: number[] }[] };
    return json.data?.[0]?.embedding ?? null;
  } catch {
    return null;
  }
}

export const chatWithZeno = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => chatInput.parse(input))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI gateway not configured.");

    const { supabase, userId } = context;
    const report = (data.report as AnalysisResult | null) ?? null;
    const lastUser = [...data.messages].reverse().find((m) => m.role === "user");

    // RAG retrieval (best-effort)
    let knowledgeChunks: Array<{ title: string; content: string; source: string }> = [];
    if (lastUser) {
      const embedding = await embedQuery(lastUser.content, apiKey);
      if (embedding) {
        const { data: matches } = await supabase.rpc("match_zeno_knowledge", {
          query_embedding: embedding as unknown as string,
          match_count: 4,
        });
        if (Array.isArray(matches)) {
          knowledgeChunks = matches
            .filter((m: { similarity: number }) => m.similarity > 0.65)
            .map((m: { title: string; content: string; source: string }) => ({
              title: m.title,
              content: m.content,
              source: m.source,
            }));
        }
      }
    }

    const systemPrompt = buildSystemPrompt({
      mode: data.mode,
      report,
      knowledgeChunks,
    });

    const res = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          temperature: 0.3,
          max_tokens: 1500,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            ...data.messages.map((m) => ({ role: m.role, content: m.content })),
          ],
        }),
      },
    );

    if (res.status === 429) throw new Error("Zeno is busy. Try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted on this workspace.");
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`AI error ${res.status}: ${txt.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = json.choices?.[0]?.message?.content ?? "";

    const parsed = parseZenoResponse(raw);
    parsed.explanation = guardHallucinations(parsed.explanation);
    if (parsed.clinicalNote) {
      parsed.clinicalNote = guardHallucinations(parsed.clinicalNote);
    }

    // Persist conversation (best-effort)
    let convId = data.conversationId ?? null;
    const messagesToSave = [
      ...data.messages,
      { role: "assistant" as const, content: JSON.stringify(parsed) },
    ];
    try {
      if (convId) {
        await supabase
          .from("zeno_conversations")
          .update({
            messages: messagesToSave,
            mode: data.mode,
            emergency_detected: parsed.emergency,
          })
          .eq("id", convId)
          .eq("user_id", userId);
      } else {
        const { data: inserted } = await supabase
          .from("zeno_conversations")
          .insert({
            user_id: userId,
            report_id: report?.id ?? null,
            mode: data.mode,
            messages: messagesToSave,
            emergency_detected: parsed.emergency,
          })
          .select("id")
          .single();
        convId = inserted?.id ?? null;
      }
    } catch (e) {
      console.error("[zeno] persist failed", e);
    }


    // UltraGuard 9-layer audit pass (non-blocking).
    try {
      const { guardAndAudit } = await import("@/lib/ultraguard/guardAndAudit.server");
      await guardAndAudit({
        rawLlmOutput: raw,
        surface: "zeno",
        userId,
        modality: "zeno_chat",
        bodyRegion: "n/a",
        contextSummary: `Zeno • mode=${data.mode}`,
      });
    } catch (err) {
      console.error("[zeno] UltraGuard audit skipped:", err);
    }

    return { conversationId: convId, ...parsed };
  });
