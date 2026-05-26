import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/rx/Button";
import { supabase } from "@/integrations/supabase/client";

export interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

type Tab = "signin" | "signup";

export function AuthModal({ open, onClose }: AuthModalProps) {
  const reduceMotion = useReducedMotion();
  const [tab, setTab] = useState<Tab>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (tab === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo:
              typeof window !== "undefined" ? window.location.origin : undefined,
          },
        });
        if (error) throw error;
        toast.success("Welcome to ReportRx — check your inbox to verify your email");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Welcome back to ReportRx");
      }
      onClose();
      setEmail("");
      setPassword("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-title"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.18 }}
        className="w-full max-w-md rounded-card bg-white p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 p-1.5 text-brand-muted hover:text-brand-dark"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <h2 id="auth-title" className="text-lg font-semibold text-brand-dark">
          {tab === "signin" ? "Welcome back" : "Create your ReportRx account"}
        </h2>
        <p className="mt-1 text-sm text-brand-muted">
          Optional — saves your reports across devices.
        </p>

        <div
          role="tablist"
          aria-label="Auth mode"
          className="mt-5 inline-flex rounded-pill bg-brand-surface p-1"
        >
          {(["signin", "signup"] as Tab[]).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 text-sm rounded-pill transition-colors ${
                tab === t
                  ? "bg-white text-brand-dark shadow-sm"
                  : "text-brand-muted hover:text-brand-dark"
              }`}
            >
              {t === "signin" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="auth-email"
              className="block text-xs font-medium text-brand-muted mb-1"
            >
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 rounded-btn border border-brand-border bg-white px-3 text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-teal"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label
              htmlFor="auth-password"
              className="block text-xs font-medium text-brand-muted mb-1"
            >
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              autoComplete={tab === "signin" ? "current-password" : "new-password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 rounded-btn border border-brand-border bg-white px-3 text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-teal"
              placeholder="At least 6 characters"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            size="md"
            fullWidth
            disabled={busy}
          >
            {busy
              ? "Please wait…"
              : tab === "signin"
                ? "Sign in"
                : "Create account"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

export default AuthModal;
