import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import {
  AUTH_RATE_LIMIT,
  checkRateLimit,
  recordAttempt,
  resetRateLimit,
} from "@/lib/security/rateLimiter";

export interface AuthFormProps {
  initialTab?: "signin" | "signup";
  onSuccess?: () => void;
}

type Tab = "signin" | "signup";

function getPasswordStrength(pw: string): 0 | 1 | 2 | 3 {
  if (pw.length === 0) return 0;
  if (pw.length < 8) return 1;
  const hasMixed = /[A-Z]/.test(pw) && /[a-z]/.test(pw);
  const hasNumber = /\d/.test(pw);
  const hasSpecial = /[^A-Za-z0-9]/.test(pw);
  if (pw.length >= 12 && hasSpecial) return 3;
  if (hasMixed || hasNumber) return 2;
  return 1;
}

export function AuthForm({ initialTab = "signin", onSuccess }: AuthFormProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const handleGoogle = async (): Promise<void> => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: typeof window !== "undefined" ? window.location.origin : undefined,
      });
      if (result.error) {
        throw result.error instanceof Error ? result.error : new Error(String(result.error));
      }
      if (result.redirected) return;
      onSuccess?.();
    } catch {
      toast.error("Could not sign in with Google. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleForgotPassword = async (): Promise<void> => {
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
    } catch {
      toast.error("Could not send reset email. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (busy) return;

    const normalizedEmail = email.trim().toLowerCase();
    const rlKey = `auth:${tab}:${normalizedEmail}`;
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
    } catch {
      toast.error(
        tab === "signin"
          ? "Could not sign in. Check your email and password."
          : "Could not create your account. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const strength = tab === "signup" ? getPasswordStrength(password) : 0;
  const strengthLabels = ["", "Weak", "Fair", "Strong"];
  const strengthColors = ["", "#EF4444", "#F59E0B", "#00D9A3"];

  return (
    <div className="w-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-8">
        <svg width="32" height="32" viewBox="0 0 28 28" aria-hidden="true" className="text-[#00D9A3]">
          <circle cx="14" cy="14" r="12" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path
            d="M3 14 H9 L11 9 L14 19 L17 12 L19 14 H25"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
        <span className="text-white text-base font-semibold tracking-tight">ReportRx</span>
      </div>

      {/* Heading */}
      <h2 className="text-[22px] font-semibold text-white leading-tight">
        {tab === "signin" ? "Welcome back" : "Create your account"}
      </h2>
      <p className="mt-1 text-sm text-[#8B9BAE]">
        AI-powered lab &amp; scan analysis, in plain English.
      </p>

      {/* Google OAuth */}
      <button
        type="button"
        onClick={handleGoogle}
        disabled={busy}
        aria-label="Continue with Google"
        className="mt-6 w-full h-[52px] inline-flex items-center justify-center gap-3 rounded-xl border border-[#1E2D42] bg-[#1A2235] text-sm font-medium text-white hover:bg-[#22304a] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.17-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.79 2.72v2.26h2.9c1.7-1.57 2.69-3.88 2.69-6.62z" />
          <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.97v2.33A9 9 0 0 0 9 18z" />
          <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.66 9c0-.59.1-1.16.29-1.7V4.97H.97A9 9 0 0 0 0 9c0 1.45.35 2.83.97 4.03l2.98-2.33z" />
          <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .97 4.97L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58z" />
        </svg>
        Continue with Google
      </button>

      {/* Divider */}
      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-[#1E2D42]" />
        <span className="text-xs text-[#56657a]">or</span>
        <div className="h-px flex-1 bg-[#1E2D42]" />
      </div>

      {/* Tab switcher */}
      <div
        role="tablist"
        aria-label="Auth mode"
        className="inline-flex rounded-full bg-[#0A0E1A] border border-[#1E2D42] p-1 w-full"
      >
        {(["signin", "signup"] as const).map((tt) => (
          <button
            key={tt}
            role="tab"
            aria-selected={tab === tt}
            type="button"
            onClick={() => setTab(tt)}
            className={`flex-1 py-1.5 text-sm rounded-full transition-colors ${
              tab === tt
                ? "bg-[#1A2235] text-white shadow-sm"
                : "text-[#8B9BAE] hover:text-white"
            }`}
          >
            {tt === "signin" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      {/* Form */}
      <form className="mt-5 space-y-4" onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="auth-email" className="block text-xs font-medium mb-1.5 text-[#8B9BAE]">
            Email address
          </label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
            className="w-full h-[52px] rounded-xl border border-[#1E2D42] bg-[#0A0E1A] px-3.5 text-sm text-white placeholder:text-[#56657a] focus:outline-none focus:border-[#00D9A3] focus:ring-2 focus:ring-[#00D9A3]/20 transition-colors disabled:opacity-60"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="auth-password" className="block text-xs font-medium mb-1.5 text-[#8B9BAE]">
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
            disabled={busy}
            className="w-full h-[52px] rounded-xl border border-[#1E2D42] bg-[#0A0E1A] px-3.5 text-sm text-white placeholder:text-[#56657a] focus:outline-none focus:border-[#00D9A3] focus:ring-2 focus:ring-[#00D9A3]/20 transition-colors disabled:opacity-60"
            placeholder={tab === "signin" ? "Your password" : "At least 8 characters"}
          />
          {tab === "signup" && password.length > 0 && (
            <div className="mt-2 flex items-center gap-2" aria-live="polite">
              <div className="flex gap-1">
                {[1, 2, 3].map((level) => (
                  <div
                    key={level}
                    className="h-1 w-8 rounded-full transition-colors duration-300"
                    style={{
                      backgroundColor:
                        strength >= level ? strengthColors[strength] : "#1E2D42",
                    }}
                  />
                ))}
              </div>
              <span className="text-xs" style={{ color: strengthColors[strength] }}>
                {strengthLabels[strength]}
              </span>
            </div>
          )}
          {tab === "signin" && (
            <div className="flex justify-end mt-1.5">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={busy}
                className="text-xs font-medium text-[#00D9A3] hover:underline disabled:opacity-60"
              >
                Forgot password?
              </button>
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={busy}
          aria-busy={busy}
          className="w-full h-[52px] rounded-xl text-sm font-semibold text-[#0A0E1A] transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          style={{ background: "linear-gradient(135deg, #00D9A3 0%, #0F6E56 100%)" }}
        >
          {busy ? "…" : tab === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      {/* Footer legal */}
      <p className="mt-5 text-center text-[11px] text-[#56657a]">
        By continuing you agree to our{" "}
        <a href="/privacy" className="underline hover:text-[#8B9BAE] transition-colors">
          Privacy Policy
        </a>
        . No medical advice — for informational use only.
      </p>
    </div>
  );
}

export default AuthForm;
