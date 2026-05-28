import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/rx/Button";
import { ScanResultView } from "@/components/scan/ScanResultView";
import { scanStore } from "@/lib/scanStore";
import type { ScanInterpretationResult } from "@/types/scan";

export const Route = createFileRoute("/scan-results")({
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
  const [result, setResult] = useState<ScanInterpretationResult | null>(null);

  useEffect(() => {
    const r = scanStore.getLastResult();
    if (!r) {
      void navigate({ to: "/scan" });
      return;
    }
    setResult(r);
  }, [navigate]);

  if (!result) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 md:px-6 pt-24 pb-16">
      <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <Link to="/scan" className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-dark">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Analyse another scan
        </Link>
        <div className="text-xs text-brand-muted">
          {new Date(result.createdAt).toLocaleString()} · {result.modality.replace("_", " ")} · {result.bodyRegion.replace("_", " ")}
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
