import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Loader2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/rx/Button";
import { ScanResultView } from "@/components/scan/ScanResultView";
import { scanStore } from "@/lib/scanStore";
import { getScan } from "@/lib/scanCloudSync.functions";
import type { ScanInterpretationResult } from "@/types/scan";

const searchSchema = z.object({
  id: z.string().uuid().optional(),
});

export const Route = createFileRoute("/scan-results")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Scan Interpretation — ReportRx" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ScanResultsPage,
});

function ScanResultsPage() {
  const navigate = useNavigate();
  const { id } = Route.useSearch();
  const getScanFn = useServerFn(getScan);
  const [result, setResult] = useState<ScanInterpretationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const fromStore = scanStore.getLastResult();
    if (fromStore && (!id || fromStore.id === id)) {
      setResult(fromStore);
      setLoading(false);
      return;
    }
    if (id) {
      getScanFn({ data: { id } })
        .then((r) => {
          if (!alive) return;
          setResult(r.scan);
          scanStore.setLastResult(r.scan);
        })
        .catch((e) => {
          if (!alive) return;
          setError(e instanceof Error ? e.message : "Could not load scan.");
        })
        .finally(() => alive && setLoading(false));
    } else {
      void navigate({ to: "/scan" });
    }
    return () => {
      alive = false;
    };
  }, [id, getScanFn, navigate]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 md:px-6 pt-32 pb-16 flex items-center gap-3 text-brand-muted">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Loading interpretation…
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="mx-auto max-w-3xl px-4 md:px-6 pt-32 pb-16 space-y-4">
        <p className="text-sm text-brand-dark">{error ?? "No interpretation found."}</p>
        <Link to="/scan">
          <Button variant="primary" size="md">Start a new scan</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 md:px-6 pt-24 pb-16">
      <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <Link to="/scan" className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-dark">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Analyse another scan
        </Link>
        <div className="text-xs text-brand-muted">
          {new Date(result.createdAt).toLocaleString()} · {result.modality.replace(/_/g, " ")} · {result.bodyRegion.replace(/_/g, " ")}
        </div>
      </div>

      <h1 className="text-2xl md:text-3xl font-semibold text-brand-dark mb-6">
        Your scan interpretation
      </h1>

      <ScanResultView result={result} />

      <div className="mt-10 flex flex-wrap gap-3">
        <Link to="/scan">
          <Button variant="secondary" size="md">Analyse another scan</Button>
        </Link>
        <Link to="/history">
          <Button variant="ghost" size="md">View history</Button>
        </Link>
      </div>
    </div>
  );
}
