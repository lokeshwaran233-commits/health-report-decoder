import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/rx/Button";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { AUTH_RATE_LIMIT, checkRateLimit, recordAttempt, resetRateLimit } from "@/lib/security/rateLimiter";

export interface AuthFormProps {
  initialTab?: "signin" | "signup";
  onSuccess?: () => void;
  /** When true, render in a card-less, full-width layout (e.g. /auth page). */
  bare?: boolean;
  /** Dark themed variant for the /auth hero page. */
  dark?: boolean;
}

type Tab = "signin" | "signup";

export function AuthForm({ initialTab = "signin", onSuccess, bare = false, dark = false }: AuthFormProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const handleGoogle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: typeof window !== "undefined" ? window.location.origin : undefined,
      });
      if (result.error) throw result.error instanceof Error ? result.error : new Error(String(result.error));
      if (result.redirected) return;
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not sign in with Google");
    } finally {
      setBusy(false);
    }
  };

  const handleForgotPassword = async () => {
    if (busy) return;
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error("Enter your email address first.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/reset-password`
            : undefined,
      });
      if (error) throw error;
      toast.success("Check your inbox for a password reset link.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send reset email");
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;

    const rlKey = `auth:${tab}:${email.trim().toLowerCase()}`;
    const status = checkRateLimit(rlKey, AUTH_RATE_LIMIT);
    if (!status.allowed) {
      const mins = Math.ceil(status.retryAfterSec / 60);
      toast.error(`Too many attempts. Try again in ${mins} minute${mins === 1 ? "" : "s"}.`);
      return;
    }

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
        if (error) {
          recordAttempt(rlKey, AUTH_RATE_LIMIT);
          throw error;
        }
        resetRateLimit(rlKey);
        toast.success(t("auth.checkInbox"));
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          recordAttempt(rlKey, AUTH_RATE_LIMIT);
          throw error;
        }
        resetRateLimit(rlKey);
        toast.success(t("auth.welcomeBack"));
      }
      onSuccess?.();
      setEmail("");
      setPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  // Theme tokens
  const headingClass = dark ? "text-white" : "text-brand-dark";
  const subtextClass = dark ? "text-[#8B9BAE]" : "text-brand-muted";
  const labelClass = dark ? "text-[#8B9BAE]" : "text-brand-muted";
  const dividerClass = dark ? "bg-[#1E2D42]" : "bg-brand-border";
  const dividerTextClass = dark ? "text-[#8B9BAE]" : "text-brand-muted";

  const googleBtnClass = dark
    ? "mt-5 w-full h-[52px] inline-flex items-center justify-center gap-3 rounded-[12px] border border-[#1E2D42] bg-[#1A2235] text-sm font-medium text-white hover:bg-[#22304a] transition-colors disabled:opacity-60"
    : "mt-5 w-full h-11 inline-flex items-center justify-center gap-3 rounded-btn border border-brand-border bg-white text-sm font-medium text-brand-dark hover:bg-brand-surface transition-colors disabled:opacity-60";

  const tabsContainerClass = dark
    ? "inline-flex rounded-pill bg-[#0A0E1A] p-1 border border-[#1E2D42]"
    : "inline-flex rounded-pill bg-brand-surface p-1";

  const inputClass = dark
    ? "w-full h-[52px] rounded-[12px] border border-[#1E2D42] bg-[#0A0E1A] px-3.5 text-sm text-white placeholder:text-[#56657a] focus:outline-none focus:border-[#00D9A3] focus:ring-2 focus:ring-[#00D9A3]/20"
    : "w-full h-11 rounded-btn border border-brand-border bg-white px-3 text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-teal";

  const submitBtn = dark ? (
    <button
      type="submit"
      disabled={busy}
      className="w-full h-[52px] rounded-[12px] text-sm font-semibold text-[#0A0E1A] transition-opacity hover:opacity-90 disabled:opacity-60"
      style={{ background: "linear-gradient(135deg, #00D9A3 0%, #0F6E56 100%)" }}
    >
      {busy ? "…" : tab === "signin" ? t("auth.signInBtn") : t("auth.signUpBtn")}
    </button>
  ) : (
    <Button type="submit" variant="primary" size="md" fullWidth disabled={busy}>
      {busy ? "…" : tab === "signin" ? t("auth.signInBtn") : t("auth.signUpBtn")}
    </Button>
  );

  return (
    <div className={bare ? "w-full" : ""}>
      <h2 className={`text-lg font-semibold ${headingClass}`}>
        {tab === "signin" ? t("auth.signInHeading") : t("auth.signUpHeading")}
      </h2>
      <p className={`mt-1 text-sm ${subtextClass}`}>{t("auth.subtext")}</p>

      <button type="button" onClick={handleGoogle} disabled={busy} className={googleBtnClass}>
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.17-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.79 2.72v2.26h2.9c1.7-1.57 2.69-3.88 2.69-6.62z" />
          <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.97v2.33A9 9 0 0 0 9 18z" />
          <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.66 9c0-.59.1-1.16.29-1.7V4.97H.97A9 9 0 0 0 0 9c0 1.45.35 2.83.97 4.03l2.98-2.33z" />
          <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .97 4.97L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58z" />
        </svg>
        {t("auth.continueGoogle")}
      </button>

      <div className="my-5 flex items-center gap-3">
        <div className={`h-px flex-1 ${dividerClass}`} />
        <span className={`text-xs ${dividerTextClass}`}>{t("auth.orDivider")}</span>
        <div className={`h-px flex-1 ${dividerClass}`} />
      </div>

      <div role="tablist" aria-label="Auth mode" className={tabsContainerClass}>
        {(["signin", "signup"] as Tab[]).map((tt) => (
          <button
            key={tt}
            role="tab"
            aria-selected={tab === tt}
            type="button"
            onClick={() => setTab(tt)}
            className={`px-4 py-1.5 text-sm rounded-pill transition-colors ${
              tab === tt
                ? dark
                  ? "bg-[#1A2235] text-white shadow-sm"
                  : "bg-white text-brand-dark shadow-sm"
                : dark
                  ? "text-[#8B9BAE] hover:text-white"
                  : "text-brand-muted hover:text-brand-dark"
            }`}
          >
            {tt === "signin" ? t("auth.signInBtn") : t("auth.signUpBtn")}
          </button>
        ))}
      </div>

      <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="auth-email" className={`block text-xs font-medium mb-1 ${labelClass}`}>
            {t("auth.emailLabel")}
          </label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="auth-password" className={`block text-xs font-medium mb-1 ${labelClass}`}>
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
            className={inputClass}
            placeholder="At least 6 characters"
          />
        </div>
        {tab === "signin" && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={busy}
              className={`text-xs font-medium hover:underline disabled:opacity-60 ${
                dark ? "text-[#00D9A3]" : "text-brand-teal"
              }`}
            >
              Forgot password?
            </button>
          </div>
        )}
        {submitBtn}
      </form>
    </div>
  );
}

export default AuthForm;
