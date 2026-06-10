import { AlertTriangle, CheckCircle2, ShieldAlert, ShieldCheck } from "lucide-react";
import type { FinalSafetyReport } from "@/lib/imagingSafety/types";

const decisionStyles: Record<
  FinalSafetyReport["decision"],
  { icon: typeof CheckCircle2; bg: string; label: string }
> = {
  release: { icon: CheckCircle2, bg: "bg-brand-teal-light text-brand-teal", label: "Released" },
  release_with_caveat: {
    icon: ShieldAlert,
    bg: "bg-brand-amber-light text-brand-amber",
    label: "Released with caveats",
  },
  defer: { icon: AlertTriangle, bg: "bg-brand-coral-light text-brand-coral", label: "Deferred to clinician" },
};

const bandColor: Record<string, string> = {
  HIGH: "bg-brand-teal text-white",
  MODERATE: "bg-brand-amber text-white",
  LOW: "bg-brand-muted text-white",
  INSUFFICIENT: "bg-brand-coral text-white",
};

export function SafetyReportView({ report }: { report: FinalSafetyReport }) {
  const { phases, decision } = report;
  const ds = decisionStyles[decision];
  const Icon = ds.icon;
  return (
    <div className="space-y-4 text-brand-dark dark:text-white/90">
      {/* Decision banner */}
      <div
        className={`rounded-card p-4 flex items-start gap-3 ${ds.bg} dark:bg-white/5`}
      >
        <Icon className="h-5 w-5 mt-0.5" aria-hidden="true" />
        <div className="flex-1">
          <div className="text-sm font-semibold">{ds.label}</div>
          {report.deferrals.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-xs space-y-1">
              {report.deferrals.map((d, i) => (
                <li key={i}>
                  <span className="font-medium">{d.code}:</span> {d.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Quality + Anatomy */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="rounded-card border border-brand-border dark:border-white/10 bg-brand-card dark:bg-white/5 p-4">
          <div className="text-xs uppercase tracking-wide text-brand-muted dark:text-white/55">
            Image quality
          </div>
          <div className="text-lg font-semibold mt-1 capitalize">
            {phases.quality.verdict}{" "}
            <span className="text-sm text-brand-muted">({phases.quality.score}/100)</span>
          </div>
          {phases.quality.reasons.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-xs text-brand-muted dark:text-white/55 space-y-1">
              {phases.quality.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-card border border-brand-border dark:border-white/10 bg-brand-card dark:bg-white/5 p-4">
          <div className="text-xs uppercase tracking-wide text-brand-muted dark:text-white/55">
            Anatomy check
          </div>
          <div className="text-lg font-semibold mt-1">
            {phases.anatomy.matchesExpected ? (
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="h-4 w-4" /> Matched
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-brand-coral">
                <ShieldAlert className="h-4 w-4" /> Mismatch
              </span>
            )}
          </div>
          <div className="text-xs text-brand-muted mt-1">
            Detected: {phases.anatomy.detectedRegion}
            {phases.anatomy.detectedView ? ` • ${phases.anatomy.detectedView}` : ""}
          </div>
        </div>
      </div>

      {/* Findings */}
      {report.findings.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-wide text-brand-muted dark:text-white/55">
            Calibrated findings
          </div>
          {report.findings.map((f) => (
            <div
              key={f.id}
              className="rounded-card border border-brand-border dark:border-white/10 bg-brand-card dark:bg-white/5 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="font-medium">{f.label}</div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-pill font-semibold ${bandColor[f.confidence]}`}
                >
                  {f.confidence}
                </span>
              </div>
              <p className="text-sm text-brand-muted dark:text-white/70 mt-1">{f.plain}</p>
              {f.evidence.length > 0 && (
                <div className="mt-2 text-xs text-brand-muted dark:text-white/55">
                  Evidence:{" "}
                  {f.evidence
                    .map((e) => `${e.locator}${e.description ? ` — ${e.description}` : ""}`)
                    .join(" · ")}
                </div>
              )}
              {f.caveats.length > 0 && (
                <ul className="mt-2 list-disc pl-5 text-xs text-brand-coral">
                  {f.caveats.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Critic + Safety hits */}
      {(phases.critic.overreach.length > 0 || phases.safety.length > 0) && (
        <details className="rounded-card border border-brand-border dark:border-white/10 bg-brand-card dark:bg-white/5 p-4">
          <summary className="text-sm font-medium cursor-pointer">
            Critic &amp; safety log
          </summary>
          {phases.critic.overreach.length > 0 && (
            <div className="mt-3">
              <div className="text-xs uppercase text-brand-muted">Critic adjustments</div>
              <ul className="list-disc pl-5 text-xs mt-1 space-y-1">
                {phases.critic.overreach.map((o, i) => (
                  <li key={i}>{o}</li>
                ))}
              </ul>
            </div>
          )}
          {phases.safety.length > 0 && (
            <div className="mt-3">
              <div className="text-xs uppercase text-brand-muted">Safety rules</div>
              <ul className="list-disc pl-5 text-xs mt-1 space-y-1">
                {phases.safety.map((h, i) => (
                  <li key={i}>
                    <span className="font-medium">[{h.severity}] {h.rule}:</span> {h.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </details>
      )}

      {/* Patient + clinician */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="rounded-card border border-brand-border dark:border-white/10 p-4">
          <div className="text-xs uppercase tracking-wide text-brand-muted">For you</div>
          <p className="whitespace-pre-line text-sm mt-1">{report.patientSummary}</p>
        </div>
        <div className="rounded-card border border-brand-border dark:border-white/10 p-4">
          <div className="text-xs uppercase tracking-wide text-brand-muted">For your doctor</div>
          <pre className="whitespace-pre-wrap text-xs mt-1 font-mono">{report.clinicianBrief}</pre>
        </div>
      </div>

      {/* Audit footer */}
      <div className="text-[10px] text-brand-muted dark:text-white/40 text-center">
        Pipeline {report.audit.pipelineVersion} · models: {report.audit.modelChain.join(", ")} ·
        prompt #{report.audit.promptHash} · {new Date(report.audit.createdAt).toLocaleString()}
      </div>
    </div>
  );
}
