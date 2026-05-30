import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/rx/Button";
import { SharedSummaryView } from "@/components/share/SharedSummaryView";
import { getShareSnapshot } from "@/lib/share.functions";

export const Route = createFileRoute("/s/$token")({
  head: () => ({
    meta: [
      { title: "Shared lab report summary — ReportRx" },
      {
        name: "description",
        content:
          "A privacy-safe summary of a lab report, decoded with ReportRx AI. Link expires automatically.",
      },
      { property: "og:title", content: "Shared lab report summary — ReportRx" },
      {
        property: "og:description",
        content:
          "View a shared ReportRx lab report summary in plain English. Link expires in 1 hour.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SharedTokenPage,
  errorComponent: ErrorView,
  notFoundComponent: () => <Message title="Link not found" body="This share link does not exist." />,
});

function Message({
  title,
  body,
  showRetry,
}: {
  title: string;
  body: string;
  showRetry?: boolean;
}) {
  const router = useRouter();
  return (
    <section className="mx-auto max-w-md px-4 py-16 text-center">
      <AlertTriangle
        className="mx-auto h-12 w-12 text-brand-coral"
        aria-hidden="true"
      />
      <h1 className="mt-4 text-xl font-semibold text-brand-dark">{title}</h1>
      <p className="mt-2 text-sm text-brand-muted">{body}</p>
      <div className="mt-6 flex flex-col gap-2">
        {showRetry && (
          <Button
            variant="secondary"
            size="md"
            fullWidth
            onClick={() => router.invalidate()}
          >
            Try again
          </Button>
        )}
        <Link to="/">
          <Button variant="primary" size="md" fullWidth>
            Decode your own report
          </Button>
        </Link>
      </div>
    </section>
  );
}

function ErrorView() {
  return (
    <Message
      title="Couldn't open this link"
      body="Something went wrong loading this shared summary."
      showRetry
    />
  );
}

function SharedTokenPage() {
  const { token } = Route.useParams();
  const getShare = useServerFn(getShareSnapshot);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["share", token],
    queryFn: () => getShare({ data: { token } }),
    retry: false,
  });

  if (isLoading) {
    return (
      <section className="mx-auto max-w-md px-4 py-16 text-center">
        <Clock
          className="mx-auto h-10 w-10 text-brand-muted animate-pulse"
          aria-hidden="true"
        />
        <p className="mt-3 text-sm text-brand-muted">Opening shared summary…</p>
      </section>
    );
  }
  if (isError || !data) {
    return <ErrorView />;
  }

  if (!data.ok) {
    if (data.code === "EXPIRED") {
      return (
        <Message
          title="This link has expired"
          body="Links are valid for 1 hour for your privacy."
        />
      );
    }
    if (data.code === "LIMIT_EXCEEDED") {
      return (
        <Message
          title="This link has been accessed too many times"
          body="For privacy, each link can be opened a limited number of times."
        />
      );
    }
    return <Message title="Link not found" body="This share link does not exist." />;
  }

  return <SharedSummaryView snapshot={data.snapshot} />;
}
