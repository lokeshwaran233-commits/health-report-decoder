import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/rx/Button";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  initialTab?: "signin" | "signup";
}

type Tab = "signin" | "signup";

export function AuthModal({ open, onClose, initialTab = "signin" }: AuthModalProps) {
  const reduceMotion = useReducedMotion();
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);

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

  const handleGoogle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: typeof window !== "undefined" ? window.location.origin : undefined,
      });
      if (result.error) throw result.error instanceof Error ? result.error : new Error(String(result.error));
      if (result.redirected) return;
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not sign in with Google";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

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
        toast.success(t("auth.checkInbox"));
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success(t("auth.welcomeBack"));
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
          {tab === "signin" ? t("auth.signInHeading") : t("auth.signUpHeading")}
        </h2>
        <p className="mt-1 text-sm text-brand-muted">{t("auth.subtext")}</p>

        {/* Google sign-in */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={busy}
          className="mt-5 w-full h-11 inline-flex items-center justify-center gap-3 rounded-btn border border-brand-border bg-white text-sm font-medium text-brand-dark hover:bg-brand-surface transition-colors disabled:opacity-60"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.17-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.79 2.72v2.26h2.9c1.7-1.57 2.69-3.88 2.69-6.62z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.97v2.33A9 9 0 0 0 9 18z" />
            <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.66 9c0-.59.1-1.16.29-1.7V4.97H.97A9 9 0 0 0 0 9c0 1.45.35 2.83.97 4.03l2.98-2.33z" />
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .97 4.97L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58z" />
          </svg>
          {t("auth.continueGoogle")}
        </button>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-brand-border" />
          <span className="text-xs text-brand-muted">{t("auth.orDivider")}</span>
          <div className="h-px flex-1 bg-brand-border" />
        </div>

        <div
          role="tablist"
          aria-label="Auth mode"
          className="inline-flex rounded-pill bg-brand-surface p-1"
        >
          {(["signin", "signup"] as Tab[]).map((tt) => (
            <button
              key={tt}
              role="tab"
              aria-selected={tab === tt}
              type="button"
              onClick={() => setTab(tt)}
              className={`px-4 py-1.5 text-sm rounded-pill transition-colors ${
                tab === tt
                  ? "bg-white text-brand-dark shadow-sm"
                  : "text-brand-muted hover:text-brand-dark"
              }`}
            >
              {tt === "signin" ? t("auth.signInBtn") : t("auth.signUpBtn")}
            </button>
          ))}
        </div>

        <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="auth-email"
              className="block text-xs font-medium text-brand-muted mb-1"
            >
              {t("auth.emailLabel")}
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
              {t("auth.passwordLabel")}
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
              ? "…"
              : tab === "signin"
                ? t("auth.signInBtn")
                : t("auth.signUpBtn")}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

export default AuthModal;
