import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import type { ZenoMessage as ZenoMsg } from "@/lib/zeno/types";

export function ZenoMessage({ msg }: { msg: ZenoMsg }) {
  const [showClinical, setShowClinical] = useState(false);
  const isUser = msg.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-brand-teal text-white px-4 py-2.5 text-sm">
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] space-y-2">
        {msg.emergency && (
          <div className="rounded-card bg-brand-coral-light border border-brand-coral/30 px-3 py-2 flex items-start gap-2 text-[13px] text-brand-coral">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Possible emergency finding — see a doctor immediately.</span>
          </div>
        )}
        <div className="rounded-2xl rounded-tl-sm bg-white border border-brand-border px-4 py-2.5 text-sm text-brand-dark whitespace-pre-wrap">
          {msg.content}
        </div>

        {msg.clinicalNote && (
          <button
            onClick={() => setShowClinical((v) => !v)}
            className="flex items-center gap-1 text-[12px] text-brand-teal font-medium"
          >
            {showClinical ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            Clinical detail
          </button>
        )}
        {showClinical && msg.clinicalNote && (
          <div className="rounded-card bg-brand-teal-light/40 border border-brand-teal-light px-3 py-2 text-[13px] text-brand-dark whitespace-pre-wrap">
            {msg.clinicalNote}
          </div>
        )}

        {msg.suggestions && msg.suggestions.length > 0 && (
          <div className="space-y-1.5">
            {msg.suggestions.map((s, i) => (
              <div
                key={i}
                className="rounded-card bg-brand-amber-light/50 border border-brand-amber/20 px-3 py-2 text-[13px]"
              >
                <div className="font-medium text-brand-dark capitalize">
                  {s.type}: {s.item}
                </div>
                <div className="text-brand-muted text-[12px]">{s.reason}</div>
              </div>
            ))}
          </div>
        )}

        {msg.confidence && msg.confidence !== "high" && (
          <div className="text-[11px] text-brand-muted italic">
            Confidence: {msg.confidence} — please confirm with your doctor.
          </div>
        )}
      </div>
    </div>
  );
}
