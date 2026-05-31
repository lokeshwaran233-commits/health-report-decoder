import { Lock, Globe, Zap } from "lucide-react";
import { ReportDemoCard } from "./ReportDemoCard";

export function AuthHeroPanel() {
  return (
    <div className="relative isolate min-h-screen overflow-hidden text-white rrx-auth-hero">
      {/* drifting blobs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 -left-10 h-[400px] w-[400px] rounded-full rrx-blob rrx-blob-a" />
        <div className="absolute top-1/3 right-0 h-[300px] w-[300px] rounded-full rrx-blob rrx-blob-b" />
        <div className="absolute bottom-0 left-1/3 h-[250px] w-[250px] rounded-full rrx-blob rrx-blob-c" />
      </div>

      {/* logo pill */}
      <div className="relative z-10 p-8">
        <div className="inline-flex items-center gap-2">
          <span className="h-9 w-9 rounded-full bg-[#00D9A3] text-[#0A0E1A] font-bold text-sm flex items-center justify-center">
            Rx
          </span>
          <span className="text-base font-semibold tracking-tight">ReportRx</span>
        </div>
      </div>

      {/* center hero */}
      <div className="relative z-10 flex flex-col items-start justify-center px-12 py-16 pt-16 pb-32 min-h-[calc(100vh-120px)]">
        <h1 className="text-5xl md:text-6xl lg:text-6xl font-semibold leading-[1.05] tracking-tight max-w-[520px]">

          Understand your
          <br />
          <span className="text-[#00D9A3]">lab results,</span>
          <br />
          instantly.
        </h1>
        <p className="mt-5 text-base md:text-lg text-[#8B9BAE] max-w-[460px] leading-relaxed">
          AI-powered analysis of blood panels, scans, and metabolic reports — in plain language.
        </p>

        <div className="mt-10 w-full">
          <ReportDemoCard />
        </div>
      </div>

      {/* trust badges */}
      <div className="absolute bottom-6 left-6 right-6 z-10 flex flex-wrap gap-2">
        {[
          { icon: Lock, label: "End-to-end encrypted" },
          { icon: Globe, label: "English · Tamil · Hindi" },
          { icon: Zap, label: "AI in < 30 seconds" },
        ].map(({ icon: Icon, label }) => (
          <span
            key={label}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#111827] border border-[#1E2D42] px-3 py-1.5 text-[12px] text-[#8B9BAE]"
          >
            <Icon className="h-3 w-3" aria-hidden="true" />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default AuthHeroPanel;
