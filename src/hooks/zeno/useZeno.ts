import { useCallback, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { chatWithZeno } from "@/lib/zeno/zeno.functions";
import type { ZenoMessage, ZenoMode } from "@/lib/zeno/types";
import type { AnalysisResult } from "@/types/report";

export function useZeno(report: AnalysisResult | null) {
  const [messages, setMessages] = useState<ZenoMessage[]>([]);
  const [mode, setMode] = useState<ZenoMode>("simple");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emergency, setEmergency] = useState(false);

  const chatFn = useServerFn(chatWithZeno);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const userMsg: ZenoMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
      };
      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      setLoading(true);

      try {
        const result = await chatFn({
          data: {
            conversationId,
            mode,
            report: report as never,
            messages: nextMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            language: "en",
          },
        });

        const assistant: ZenoMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result.explanation,
          clinicalNote: result.clinicalNote,
          suggestions: result.suggestions,
          confidence: result.confidence,
          emergency: result.emergency,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistant]);
        if (result.conversationId) setConversationId(result.conversationId);
        if (result.emergency) setEmergency(true);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Zeno couldn't respond.");
      } finally {
        setLoading(false);
      }
    },
    [messages, mode, report, loading, conversationId, chatFn],
  );

  const reset = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setEmergency(false);
  }, []);

  return { messages, mode, setMode, send, loading, emergency, reset };
}
