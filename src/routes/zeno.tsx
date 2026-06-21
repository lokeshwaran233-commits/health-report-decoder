import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Send, Sparkles, Bot, User as UserIcon, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useZeno } from "@/hooks/zeno/useZeno";

export const Route = createFileRoute("/zeno")({
  head: () => ({
    meta: [
      { title: "Zeno — Your AI Health Companion | ReportRx" },
      { name: "robots", content: "noindex, nofollow" },
      {
        name: "description",
        content:
          "Chat with Zeno, the AI health companion that explains medical terms, answers wellness questions, and helps you make sense of your reports.",
      },
      { property: "og:title", content: "Zeno — AI Health Companion" },
      {
        property: "og:description",
        content: "Plain-language answers to your health questions, anytime.",
      },
    ],
  }),
  component: ZenoPage,
});

const STARTERS = [
  "What does my HbA1c value mean?",
  "Explain a cholesterol report",
  "Is my Vitamin D level normal?",
  "What lifestyle changes can help my results?",
];

function ZenoPage() {
  const { user, loading: authLoading } = useAuth();
  const { messages, send, loading, mode, setMode, reset } = useZeno(null);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (authLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-brand-surface">
        <Loader2 className="h-6 w-6 animate-spin text-brand-teal" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-brand-surface px-4">
        <div className="max-w-sm rounded-card bg-brand-card border border-brand-border p-6 text-center">
          <Sparkles className="h-6 w-6 text-brand-teal mx-auto mb-2" />
          <h1 className="text-lg font-semibold text-brand-dark">Sign in to chat with Zeno</h1>
          <p className="mt-1 text-sm text-brand-muted">
            Zeno needs your account to remember context and keep your chats private.
          </p>
          <Link
            to="/auth"
            className="inline-flex items-center justify-center mt-4 rounded-btn bg-brand-teal text-white text-sm font-medium px-4 py-2 hover:bg-brand-teal-mid transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    void send(input);
    setInput("");
  };

  return (
    <div className="min-h-dvh bg-brand-surface">
      <div className="mx-auto max-w-3xl px-4 md:px-6 pt-20 pb-4 flex flex-col h-dvh">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-brand-border">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-brand-surface text-brand-muted hover:text-brand-dark"
              aria-label="Back to home"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-teal-light text-brand-teal">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <h1 className="text-base font-semibold text-brand-dark leading-tight">Zeno</h1>
                <p className="text-[11px] text-brand-muted leading-tight">AI health companion</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-pill bg-white border border-brand-border p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setMode("simple")}
                className={`px-3 py-1 rounded-pill transition-colors ${mode === "simple" ? "bg-brand-teal text-white" : "text-brand-muted"}`}
              >
                Simple
              </button>
              <button
                type="button"
                onClick={() => setMode("medical")}
                className={`px-3 py-1 rounded-pill transition-colors ${mode === "medical" ? "bg-brand-teal text-white" : "text-brand-muted"}`}
              >
                Medical
              </button>
            </div>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={reset}
                className="text-xs text-brand-muted hover:text-brand-dark px-2"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center pt-8">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand-teal-light text-brand-teal mb-3">
                <Sparkles className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold text-brand-dark">Hi! I'm Zeno 👋</h2>
              <p className="mt-1 text-sm text-brand-muted max-w-md mx-auto">
                Your AI health companion. Ask me about lab values, medical terms, or general wellness — in plain language.
              </p>
              <div className="grid sm:grid-cols-2 gap-2 mt-6 max-w-lg mx-auto">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void send(s)}
                    className="text-left rounded-card border border-brand-border bg-brand-card p-3 text-xs text-brand-dark hover:border-brand-teal transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <span
                className={`flex-shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-full ${
                  m.role === "user"
                    ? "bg-brand-dark text-white"
                    : "bg-brand-teal-light text-brand-teal"
                }`}
              >
                {m.role === "user" ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </span>
              <div
                className={`max-w-[80%] rounded-card px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-brand-teal text-white"
                    : "bg-brand-card border border-brand-border text-brand-dark"
                }`}
              >
                {m.content}
                {m.suggestions && m.suggestions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-brand-border/60 space-y-1.5">
                    {m.suggestions.map((s, i) => (
                      <div key={i} className="text-xs">
                        <span className="font-medium text-brand-teal capitalize">{s.type}:</span>{" "}
                        <span className="text-brand-dark/85">{s.item}</span>
                      </div>
                    ))}
                  </div>
                )}
                {m.clinicalNote && (
                  <div className="mt-2 pt-2 border-t border-brand-border/60 text-xs text-brand-muted italic">
                    {m.clinicalNote}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <span className="flex-shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-teal-light text-brand-teal">
                <Bot className="h-4 w-4" />
              </span>
              <div className="rounded-card bg-brand-card border border-brand-border px-4 py-3 inline-flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-teal" />
                <span className="text-xs text-brand-muted">Zeno is thinking…</span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Composer */}
        <form
          onSubmit={submit}
          className="border-t border-brand-border pt-3 pb-2 flex items-end gap-2"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(e as unknown as React.FormEvent);
              }
            }}
            placeholder="Ask Zeno anything about your health…"
            rows={1}
            className="flex-1 resize-none rounded-card border border-brand-border bg-white px-3 py-2.5 text-sm text-brand-dark placeholder:text-brand-hint focus:outline-none focus:border-brand-teal max-h-32"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            aria-label="Send"
            className="inline-flex h-10 w-10 items-center justify-center rounded-btn bg-brand-teal text-white hover:bg-brand-teal-mid disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
        <p className="text-[10px] text-brand-hint text-center pb-2">
          Zeno provides educational information only. Not a substitute for medical advice.
        </p>
      </div>
    </div>
  );
}
