import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [
      { title: "Your results — ReportRx" },
      {
        name: "description",
        content:
          "Your decoded lab report with visual gauges and plain-English explanations.",
      },
      { property: "og:title", content: "Your results — ReportRx" },
      {
        property: "og:description",
        content: "Your decoded lab report on ReportRx.",
      },
    ],
  }),
  component: ResultsPage,
});

function ResultsPage() {
  return (
    <section
      aria-label="Results"
      className="mx-auto max-w-3xl px-4 py-16 text-center"
    >
      <h1 className="text-2xl font-semibold text-brand-dark">Your results</h1>
      <p className="mt-2 text-sm text-brand-muted">
        Detailed biomarker analysis arrives on Day 2.
      </p>
    </section>
  );
}
