import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthHeroPanel } from "@/components/auth/AuthHeroPanel";
import { useAuth } from "@/hooks/useAuth";
import { SESSION_EXPIRED_FLAG } from "@/hooks/useSessionTimeout";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — ReportRx" },
      { name: "description", content: "Sign in to ReportRx to decode your lab reports and scans with AI." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      void navigate({ to: "/", replace: true });
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0A0E1A]">
      <div className="hidden lg:block lg:w-[55%]">
        <AuthHeroPanel />
      </div>

      {/* Mobile compact strip */}
      <div className="lg:hidden bg-[#0A0E1A] text-white px-6 py-6 border-b border-[#1E2D42]">
        <div className="inline-flex items-center gap-2">
          <span className="h-8 w-8 rounded-full bg-[#00D9A3] text-[#0A0E1A] font-bold text-sm flex items-center justify-center">
            Rx
          </span>
          <span className="text-sm font-semibold tracking-tight">ReportRx</span>
        </div>
        <p className="mt-3 text-sm text-[#8B9BAE]">
          AI-powered analysis of lab reports & scans — in plain language.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 lg:w-[45%] flex items-center justify-center px-12 py-16 bg-[#0A0E1A]">
        <div
          className="w-full max-w-[420px] mx-auto rounded-[20px] p-10 border"
          style={{
            background: "#111827",
            borderColor: "#1E2D42",
            boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
          }}
        >
          <AuthForm dark onSuccess={() => navigate({ to: "/" })} />
        </div>

      </div>
    </div>
  );
}

export default AuthPage;
