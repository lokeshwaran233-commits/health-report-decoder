import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — ReportRx" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Supabase appends a recovery token to the URL hash. The client
    // automatically processes it and emits a PASSWORD_RECOVERY event.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });
    // Fallback: if we already have a session (hash already processed) allow update.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated. You're signed in.");
      await navigate({ to: "/", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0E1A] px-6 py-12">
      <div
        className="w-full max-w-[420px] rounded-[20px] p-10 border"
        style={{
          background: "#111827",
          borderColor: "#1E2D42",
          boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
        }}
      >
        <h1 className="text-lg font-semibold text-white">Set a new password</h1>
        <p className="mt-1 text-sm text-[#8B9BAE]">
          {ready
            ? "Choose a strong password you don't use elsewhere."
            : "Waiting for the reset link to be validated…"}
        </p>

        <form className="mt-6 space-y-3" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="new-pw" className="block text-xs font-medium mb-1 text-[#8B9BAE]">
              New password
            </label>
            <input
              id="new-pw"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              disabled={!ready || busy}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-[52px] rounded-[12px] border border-[#1E2D42] bg-[#0A0E1A] px-3.5 text-sm text-white placeholder:text-[#56657a] focus:outline-none focus:border-[#00D9A3] focus:ring-2 focus:ring-[#00D9A3]/20 disabled:opacity-60"
              placeholder="At least 8 characters"
            />
          </div>
          <div>
            <label htmlFor="confirm-pw" className="block text-xs font-medium mb-1 text-[#8B9BAE]">
              Confirm password
            </label>
            <input
              id="confirm-pw"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              disabled={!ready || busy}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full h-[52px] rounded-[12px] border border-[#1E2D42] bg-[#0A0E1A] px-3.5 text-sm text-white placeholder:text-[#56657a] focus:outline-none focus:border-[#00D9A3] focus:ring-2 focus:ring-[#00D9A3]/20 disabled:opacity-60"
              placeholder="Repeat your new password"
            />
          </div>
          <button
            type="submit"
            disabled={!ready || busy}
            className="w-full h-[52px] rounded-[12px] text-sm font-semibold text-[#0A0E1A] transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #00D9A3 0%, #0F6E56 100%)" }}
          >
            {busy ? "…" : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
