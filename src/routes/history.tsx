import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "History — ReportRx" },
      {
        name: "description",
        content: "Your previously analysed lab reports on this device.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold text-brand-dark">Your history</h1>
      <p className="mt-2 text-sm text-brand-muted">
        A list of your analysed reports will appear here on Day 3.
      </p>
    </section>
  );
}
