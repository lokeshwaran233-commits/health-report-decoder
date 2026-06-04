import { Link } from "@tanstack/react-router";
import type { SummaryShareSnapshot } from "@/lib/share.functions";

export interface SharedSummaryViewProps {
  snapshot: SummaryShareSnapshot;
}

export function SharedSummaryView({ snapshot }: SharedSummaryViewProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-card bg-brand-teal-light/60 border border-brand-teal-light p-4 text-sm text-brand-teal flex items-center justify-between gap-3 mb-6">
        <span>
          You're viewing a shared ReportRx summary — shared links expire after 1 hour.
        </span>
        <Link to="/" className="font-medium underline shrink-0">
          Try it
        </Link>
      </div>
      <h1 className="text-xl font-semibold text-brand-dark">
        {snapshot.metadata.patientName
          ? `${snapshot.metadata.patientName}'s shared summary`
          : "Shared report summary"}
      </h1>
      <p className="mt-1 text-sm text-brand-muted">
        {[snapshot.metadata.reportDate, snapshot.metadata.labName]
          .filter(Boolean)
          .join(" · ")}
      </p>
      <div className="mt-4 flex gap-2 flex-wrap text-[13px]">
        <span className="rounded-pill bg-brand-teal-light text-brand-teal px-3 py-1">
          {snapshot.statusCounts.normal} Normal
        </span>
        <span className="rounded-pill bg-brand-amber-light text-brand-amber px-3 py-1">
          {snapshot.statusCounts.watch} To watch
        </span>
        <span className="rounded-pill bg-brand-coral-light text-brand-coral px-3 py-1">
          {snapshot.statusCounts.flagged} Flagged
        </span>
      </div>
      <section className="mt-6 rounded-card bg-white border border-brand-border p-5">
        {snapshot.summary.split(/\n\n+/).map((p, i) => (
          <p
            key={i}
            className="text-[15px] text-brand-muted leading-[1.75] mb-3"
          >
            {p}
          </p>
        ))}
      </section>
      {snapshot.doctorQuestions.length > 0 && (
        <section className="mt-6 rounded-card bg-white border border-brand-border p-5">
          <h2 className="text-base font-semibold text-brand-dark mb-3">
            Questions for your doctor
          </h2>
          <ol className="space-y-2 list-decimal pl-5 text-sm text-brand-dark">
            {snapshot.doctorQuestions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

export default SharedSummaryView;
