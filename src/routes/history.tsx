import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "History — ReportRx" },
      {
        name: "description",
        content: "Your previously decoded lab reports on ReportRx.",
      },
      { property: "og:title", content: "History — ReportRx" },
      {
        property: "og:description",
        content: "Browse your previously analyzed lab reports.",
      },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  return (
    <section
      aria-label="History"
      className="mx-auto max-w-3xl px-4 py-16 text-center"
    >
      <h1 className="text-2xl font-semibold text-brand-dark">History</h1>
      <p className="mt-2 text-sm text-brand-muted">
        Saved report history lands on Day 3.
      </p>
    </section>
  );
}
