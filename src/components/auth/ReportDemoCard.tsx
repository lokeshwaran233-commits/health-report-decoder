import { CheckCircle2, AlertTriangle, Sparkles } from "lucide-react";

type Pill = "NORMAL" | "LOW" | "BORDERLINE" | "REVIEW";

const ROWS: Array<{ icon: string; label: string; value: string; pill: Pill }> = [
  { icon: "🔬", label: "Haemoglobin", value: "11.2 g/dL", pill: "LOW" },
  { icon: "🩸", label: "Fasting Glucose", value: "98 mg/dL", pill: "NORMAL" },
  { icon: "🫀", label: "LDL Cholesterol", value: "142 mg/dL", pill: "BORDERLINE" },
  { icon: "⚡", label: "TSH", value: "4.8 mIU/L", pill: "REVIEW" },
];

const PILL_STYLES: Record<Pill, string> = {
  NORMAL: "bg-[#0D4A3A] text-[#00D9A3]",
  LOW: "bg-[#3A2A00] text-[#F59E0B]",
  BORDERLINE: "bg-[#3A2A00] text-[#F59E0B]",
  REVIEW: "bg-[#3A0A0A] text-[#EF4444]",
};

export function ReportDemoCard() {
  return (
    <div className="w-full max-w-[420px] rounded-2xl bg-[#111827] border border-[#1E2D42] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.4)] rrx-demo-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rrx-pulse-dot inline-block h-2 w-2 rounded-full bg-[#00D9A3]" />
          <span className="text-[11px] font-medium tracking-[0.08em] uppercase text-[#8B9BAE]">
            Analysis in progress
          </span>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-[#0D4A3A] text-[#00D9A3] text-[11px] font-medium">
          &lt; 30 sec
        </span>
      </div>

      <ul className="mt-4 divide-y divide-[#1E2D42]/80">
        {ROWS.map((r, i) => (
          <li
            key={r.label}
            className="flex items-center justify-between py-2.5 text-sm text-[#F0F4F8] opacity-0 rrx-row-in"
            style={{ animationDelay: `${0.8 + i * 0.3}s` }}
          >
            <span className="flex items-center gap-2">
              <span aria-hidden="true">{r.icon}</span>
              <span className="text-[13px]">{r.label}</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="text-[12px] text-[#8B9BAE]">{r.value}</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${PILL_STYLES[r.pill]}`}>
                {r.pill}
              </span>
              {r.pill === "NORMAL" ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-[#00D9A3]" aria-hidden="true" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5 text-[#F59E0B]" aria-hidden="true" />
              )}
            </span>
          </li>
        ))}
      </ul>

      <div
        className="mt-3 flex items-center gap-2 rounded-lg px-3.5 py-2.5 opacity-0 rrx-row-in"
        style={{ animationDelay: "2s", background: "rgba(0,217,163,0.08)" }}
      >
        <Sparkles className="h-4 w-4 text-[#00D9A3]" aria-hidden="true" />
        <span className="text-sm font-medium text-[#00D9A3]">
          3 actionable insights ready
        </span>
      </div>
    </div>
  );
}

export default ReportDemoCard;
