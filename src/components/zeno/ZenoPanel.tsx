import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ExternalLink, Mic, MicOff, Send, X, Volume2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useZeno } from "@/hooks/zeno/useZeno";
import { useZenoSTT } from "@/hooks/zeno/useZenoSTT";
import { ZenoMessage } from "./ZenoMessage";
import type { AnalysisResult } from "@/types/report";


interface ZenoPanelProps {
  open: boolean;
  onClose: () => void;
  report: AnalysisResult | null;
}

export function ZenoPanel({ open, onClose, report }: ZenoPanelProps) {
  const { messages, mode, setMode, send, loading, emergency, reset } = useZeno(report);
  const { supported: sttSupported, listening, transcript, start, stop, speak } =
    useZenoSTT();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (transcript) setInput((v) => (v ? `${v} ${transcript}` : transcript));
  }, [transcript]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  if (!open) return null;

  const handleSend = () => {
    const t = input.trim();
    if (!t) return;
    setInput("");
    void send(t);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-label="Zeno">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-md flex-col bg-brand-surface shadow-2xl animate-in slide-in-from-right">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-border bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-teal to-brand-teal-mid flex items-center justify-center text-white font-semibold shadow-sm">
              Z
            </div>
            <div>
              <div className="text-sm font-semibold text-brand-dark">Zeno</div>
              <div className="text-[11px] text-brand-muted">Your health companion</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-pill bg-brand-surface p-0.5 text-[11px] font-medium">
              <button
                onClick={() => setMode("simple")}
                className={`rounded-pill px-2.5 py-1 transition-colors ${mode === "simple" ? "bg-brand-teal text-white" : "text-brand-muted"}`}
              >
                Simple
              </button>
              <button
                onClick={() => setMode("medical")}
                className={`rounded-pill px-2.5 py-1 transition-colors ${mode === "medical" ? "bg-brand-teal text-white" : "text-brand-muted"}`}
              >
                Medical
              </button>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-brand-muted hover:bg-brand-surface"
              aria-label="Close Zeno"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Emergency banner */}
        {emergency && (
          <div className="bg-brand-coral-light border-b border-brand-coral/30 px-4 py-2 flex items-start gap-2 text-[13px] text-brand-coral">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Critical finding detected — please consult a doctor immediately.</span>
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-sm text-brand-muted py-10">
              {report
                ? "Ask me anything about your report — biomarkers, what to eat, what to ask your doctor."
                : "Upload a report first so I can give personalised guidance."}
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className="space-y-1">
              <ZenoMessage msg={m} />
              {m.role === "assistant" && (
                <button
                  onClick={() => speak(m.content)}
                  className="ml-2 text-[11px] text-brand-muted hover:text-brand-teal inline-flex items-center gap-1"
                >
                  <Volume2 className="h-3 w-3" /> Listen
                </button>
              )}
            </div>
          ))}
          {loading && (
            <div className="text-xs text-brand-muted px-2">Zeno is thinking…</div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-brand-border bg-white p-3">
          <div className="flex items-end gap-2">
            {sttSupported && (
              <button
                onClick={listening ? stop : start}
                className={`rounded-full p-2.5 ${listening ? "bg-brand-coral text-white" : "bg-brand-surface text-brand-muted"}`}
                aria-label={listening ? "Stop voice input" : "Start voice input"}
              >
                {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
            )}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask Zeno…"
              rows={1}
              className="flex-1 resize-none rounded-card border border-brand-border bg-brand-surface px-3 py-2 text-sm focus:outline-none focus:border-brand-teal max-h-32"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="rounded-full bg-brand-teal p-2.5 text-white disabled:opacity-40"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          {messages.length > 0 && (
            <button
              onClick={reset}
              className="mt-2 text-[11px] text-brand-muted hover:text-brand-teal"
            >
              Start new conversation
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
