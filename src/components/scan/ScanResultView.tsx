import { useState } from "react";
import { AlertTriangle, Stethoscope, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScanInterpretationResult } from "@/types/scan";

type Tab = "layman" | "professional";

function SigBadge({ s }: { s: string }) {
  const map: Record<string, string> = {
    critical: "bg-brand-coral text-white",
    urgent: "bg-brand-coral text-white",
    abnormal: "bg-amber-100 text-amber-900",
    significant: "bg-amber-100 text-amber-900",
    incidental: "bg-blue-100 text-blue-900",
    minor: "bg-blue-100 text-blue-900",
    normal_variant: "bg-emerald-100 text-emerald-900",
    normal: "bg-emerald-100 text-emerald-900",
  };
  return (
    <span className={cn("inline-block text-[11px] px-2 py-0.5 rounded-pill", map[s] ?? "bg-brand-surface text-brand-dark")}>
      {s.replace(/_/g, " ")}
    </span>
  );
}

export function ScanResultView({ result }: { result: ScanInterpretationResult }) {
  const [tab, setTab] = useState<Tab>("layman");

  return (
    <div className="space-y-6">
      {/* Critical alerts banner */}
      {result.criticalAlerts.length > 0 && (
        <div className="rounded-card border border-brand-coral bg-brand-coral-light/40 p-4">
          <div className="flex items-center gap-2 text-brand-coral font-semibold">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            <span>Critical findings flagged — seek clinical review urgently</span>
          </div>
          <ul className="mt-2 list-disc pl-6 text-sm text-brand-dark space-y-1">
            {result.criticalAlerts.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      {/* AI disclaimer */}
      <div className="rounded-card border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
        <strong>AI interpretation — not a diagnosis.</strong>{" "}
        {result.aiConfidenceNote}
      </div>

      {/* Tabs */}
      <div className="inline-flex rounded-pill bg-brand-surface p-1">
        <button
          type="button"
          onClick={() => setTab("layman")}
          className={cn(
            "inline-flex items-center gap-1.5 px-4 h-9 rounded-pill text-sm font-medium transition",
            tab === "layman" ? "bg-white shadow text-brand-dark" : "text-brand-muted",
          )}
        >
          <User className="h-4 w-4" aria-hidden="true" /> Patient view
        </button>
        <button
          type="button"
          onClick={() => setTab("professional")}
          className={cn(
            "inline-flex items-center gap-1.5 px-4 h-9 rounded-pill text-sm font-medium transition",
            tab === "professional" ? "bg-white shadow text-brand-dark" : "text-brand-muted",
          )}
        >
          <Stethoscope className="h-4 w-4" aria-hidden="true" /> Professional view
        </button>
      </div>

      {tab === "layman" ? (
        <div className="space-y-5">
          <section className="rounded-card border border-brand-border bg-white p-5">
            <h2 className="text-base font-semibold text-brand-dark">What we see</h2>
            <p className="mt-2 text-sm text-brand-dark leading-relaxed">{result.layman.summary}</p>
          </section>

          {result.layman.keyFindings.length > 0 && (
            <section className="rounded-card border border-brand-border bg-white p-5">
              <h3 className="text-sm font-semibold text-brand-dark mb-3">Key findings</h3>
              <ul className="space-y-3">
                {result.layman.keyFindings.map((f, i) => (
                  <li key={i} className="border-l-2 border-brand-teal/40 pl-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-brand-dark">{f.area}</span>
                      <SigBadge s={f.significance} />
                    </div>
                    <p className="text-sm text-brand-muted mt-1">{f.plainEnglish}</p>
                    {f.analogy && <p className="text-xs italic text-brand-muted mt-1">{f.analogy}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {result.layman.whatThisMeans && (
            <section className="rounded-card border border-brand-border bg-white p-5">
              <h3 className="text-sm font-semibold text-brand-dark mb-2">What this might mean</h3>
              <p className="text-sm text-brand-dark">{result.layman.whatThisMeans}</p>
            </section>
          )}

          {result.layman.nextSteps.length > 0 && (
            <section className="rounded-card border border-brand-border bg-white p-5">
              <h3 className="text-sm font-semibold text-brand-dark mb-2">Suggested next steps</h3>
              <ul className="list-disc pl-5 text-sm text-brand-dark space-y-1">
                {result.layman.nextSteps.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </section>
          )}

          {result.layman.questionsForDoctor.length > 0 && (
            <section className="rounded-card border border-brand-teal bg-brand-teal-light/30 p-5">
              <h3 className="text-sm font-semibold text-brand-dark mb-2">Questions for your doctor</h3>
              <ul className="list-disc pl-5 text-sm text-brand-dark space-y-1">
                {result.layman.questionsForDoctor.map((q, i) => <li key={i}>{q}</li>)}
              </ul>
            </section>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <section className="rounded-card border border-brand-border bg-white p-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-base font-semibold text-brand-dark">Impression</h2>
              <span className={cn(
                "text-[11px] uppercase tracking-wide px-2 py-0.5 rounded-pill",
                result.professional.urgency === "critical" ? "bg-brand-coral text-white" :
                result.professional.urgency === "urgent" ? "bg-amber-200 text-amber-900" :
                "bg-emerald-100 text-emerald-900"
              )}>{result.professional.urgency}</span>
            </div>
            <p className="mt-2 text-sm text-brand-dark leading-relaxed whitespace-pre-wrap">
              {result.professional.impression || "—"}
            </p>
            <div className="mt-3 text-xs text-brand-muted">
              Image quality: <strong>{result.imageQuality}</strong>
              {result.imageQualityNote ? ` — ${result.imageQualityNote}` : ""}
            </div>
          </section>

          {result.professional.findings.length > 0 && (
            <section className="rounded-card border border-brand-border bg-white p-5">
              <h3 className="text-sm font-semibold text-brand-dark mb-3">Findings</h3>
              <ul className="space-y-3">
                {result.professional.findings.map((f, i) => (
                  <li key={i} className="border-l-2 border-brand-teal/40 pl-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-brand-dark">{f.location}</span>
                      <SigBadge s={f.significance} />
                    </div>
                    <p className="text-sm text-brand-dark mt-1">{f.description}</p>
                    {f.characterisation && (
                      <p className="text-xs text-brand-muted mt-1">{f.characterisation}</p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {result.professional.differentials.length > 0 && (
            <section className="rounded-card border border-brand-border bg-white p-5">
              <h3 className="text-sm font-semibold text-brand-dark mb-3">Differential considerations</h3>
              <ul className="space-y-3">
                {result.professional.differentials.map((d, i) => (
                  <li key={i}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-brand-dark">{d.diagnosis}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-pill bg-brand-surface text-brand-dark">
                        {d.likelihood.replace("_", " ")}
                      </span>
                    </div>
                    {d.supportingFindings.length > 0 && (
                      <p className="text-xs text-brand-muted mt-1">
                        Supporting: {d.supportingFindings.join("; ")}
                      </p>
                    )}
                    {d.againstFindings.length > 0 && (
                      <p className="text-xs text-brand-muted">
                        Against: {d.againstFindings.join("; ")}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {result.professional.recommendations.length > 0 && (
            <section className="rounded-card border border-brand-border bg-white p-5">
              <h3 className="text-sm font-semibold text-brand-dark mb-2">Recommendations</h3>
              <ul className="list-disc pl-5 text-sm text-brand-dark space-y-1">
                {result.professional.recommendations.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </section>
          )}

          {result.professional.limitations.length > 0 && (
            <section className="rounded-card border border-brand-border bg-white p-5">
              <h3 className="text-sm font-semibold text-brand-dark mb-2">Limitations</h3>
              <ul className="list-disc pl-5 text-sm text-brand-muted space-y-1">
                {result.professional.limitations.map((l, i) => <li key={i}>{l}</li>)}
              </ul>
            </section>
          )}

          {(result.indeterminateFindings.length > 0 || result.cannotAssess.length > 0) && (
            <section className="rounded-card border border-brand-border bg-white p-5">
              {result.indeterminateFindings.length > 0 && (
                <>
                  <h3 className="text-sm font-semibold text-brand-dark mb-2">Indeterminate</h3>
                  <ul className="list-disc pl-5 text-sm text-brand-muted space-y-1 mb-3">
                    {result.indeterminateFindings.map((x, i) => <li key={i}>{x}</li>)}
                  </ul>
                </>
              )}
              {result.cannotAssess.length > 0 && (
                <>
                  <h3 className="text-sm font-semibold text-brand-dark mb-2">Cannot be assessed</h3>
                  <ul className="list-disc pl-5 text-sm text-brand-muted space-y-1">
                    {result.cannotAssess.map((x, i) => <li key={i}>{x}</li>)}
                  </ul>
                </>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
