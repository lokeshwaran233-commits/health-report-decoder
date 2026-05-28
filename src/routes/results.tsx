import { useEffect } from "react";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, History } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/rx/Button";
import { LoadingScreen } from "@/components/results/LoadingScreen";
import { HealthScoreCard } from "@/components/results/HealthScoreCard";
import { ResultsHeader } from "@/components/results/ResultsHeader";
import { CategoryFilterBar } from "@/components/results/CategoryFilterBar";
import { BiomarkerGrid } from "@/components/results/BiomarkerGrid";
import { InsightsSection } from "@/components/results/InsightsSection";
import { ShareModal } from "@/components/results/ShareModal";
import { SavedBanner } from "@/components/results/SavedBanner";
import { MixedContentBanner } from "@/components/results/MixedContentBanner";
import { ResultsFlowGraphic } from "@/components/results/ResultsFlowGraphic";
import { useReportAnalysis } from "@/hooks/useReportAnalysis";
import { uploadStore } from "@/lib/uploadStore";
import { decodeShare } from "@/lib/shareCodec";
import { downloadReportPdf } from "@/lib/pdfSummary";
import { useState } from "react";
import type { BiomarkerCategory } from "@/types/report";

const searchSchema = z.object({
  share: z.string().optional(),
});

export const Route = createFileRoute("/results")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Your Results — ReportRx" },
      {
        name: "description",
        content:
          "Your personalised lab report analysis — biomarker breakdowns, plain-English explanations, and questions for your doctor.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResultsPage,
});

function ResultsPage() {
  const navigate = useNavigate();
  const { share } = useSearch({ from: "/results" });
  const {
    analysisResult,
    analysisState,
    error,
    activeCategory,
    setActiveCategory,
    filteredBiomarkers,
    statusCounts,
    runAnalysis,
    retry,
    loadResult,
  } = useReportAnalysis();
  const [shareOpen, setShareOpen] = useState(false);

  // Shared view path
  const sharedPayload = share ? decodeShare(share) : null;

  useEffect(() => {
    if (sharedPayload) return; // shared mode — no analysis
    if (analysisState !== "idle") return;

    const sample = uploadStore.consumeSampleResult();
    if (sample) {
      loadResult(sample);
      return;
    }
    const input = uploadStore.getInput();
    if (input) {
      void runAnalysis(input);
      return;
    }
    toast.info("Please upload a report first");
    void navigate({ to: "/" });
  }, [sharedPayload, analysisState, loadResult, runAnalysis, navigate]);

  // Shared summary view
  if (sharedPayload) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-card bg-brand-teal-light/60 border border-brand-teal-light p-4 text-sm text-brand-teal flex items-center justify-between gap-3 mb-6">
          <span>
            You're viewing a shared ReportRx summary — upload your own report
            to get your full analysis.
          </span>
          <Link to="/" className="font-medium underline shrink-0">
            Try it
          </Link>
        </div>
        <h1 className="text-xl font-semibold text-brand-dark">
          {sharedPayload.metadata.patientName
            ? `${sharedPayload.metadata.patientName}'s shared summary`
            : "Shared report summary"}
        </h1>
        <p className="mt-1 text-sm text-brand-muted">
          {[sharedPayload.metadata.reportDate, sharedPayload.metadata.labName]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <div className="mt-4 flex gap-2 flex-wrap text-[13px]">
          <span className="rounded-pill bg-brand-teal-light text-brand-teal px-3 py-1">
            {sharedPayload.statusCounts.normal} Normal
          </span>
          <span className="rounded-pill bg-brand-amber-light text-brand-amber px-3 py-1">
            {sharedPayload.statusCounts.watch} To watch
          </span>
          <span className="rounded-pill bg-brand-coral-light text-brand-coral px-3 py-1">
            {sharedPayload.statusCounts.flagged} Flagged
          </span>
        </div>
        <section className="mt-6 rounded-card bg-white border border-brand-border p-5">
          {sharedPayload.summary.split(/\n\n+/).map((p, i) => (
            <p
              key={i}
              className="text-[15px] text-brand-muted leading-[1.75] mb-3"
            >
              {p}
            </p>
          ))}
        </section>
        <section className="mt-6 rounded-card bg-white border border-brand-border p-5">
          <h2 className="text-base font-semibold text-brand-dark mb-3">
            Questions for your doctor
          </h2>
          <ol className="space-y-2 list-decimal pl-5 text-sm text-brand-dark">
            {sharedPayload.doctorQuestions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ol>
        </section>
      </div>
    );
  }

  if (analysisState === "loading" || analysisState === "idle") {
    return <LoadingScreen />;
  }

  if (analysisState === "error" || !analysisResult) {
    const isNoData = error?.code === "NO_DATA_FOUND";
    return (
      <section className="mx-auto max-w-md px-4 py-16 text-center">
        <AlertTriangle
          className="mx-auto h-12 w-12 text-brand-coral"
          aria-hidden="true"
        />
        <h1 className="mt-4 text-xl font-semibold text-brand-dark">
          We couldn't analyse this report
        </h1>
        <p className="mt-2 text-sm text-brand-muted">
          {error?.message ?? "Something went wrong. Please try again."}
        </p>
        <div className="mt-6 flex flex-col gap-2">
          {isNoData ? (
            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={() => navigate({ to: "/" })}
            >
              Try pasting the text instead
            </Button>
          ) : (
            <Button variant="primary" size="md" fullWidth onClick={retry}>
              Try again
            </Button>
          )}
          <Button
            variant="secondary"
            size="md"
            fullWidth
            onClick={() => navigate({ to: "/" })}
          >
            Upload a different report
          </Button>
        </div>
        <p className="mt-6 text-xs text-brand-hint">
          If this keeps happening, try copying your report text and using the
          paste option.
        </p>
      </section>
    );
  }

  const available = new Set<BiomarkerCategory>(
    analysisResult.biomarkers.map((b) => b.category),
  );

  const handleAnalyseAnother = () => {
    uploadStore.clear();
    if (typeof document !== "undefined") {
      document.title = "ReportRx — Your lab report, finally explained";
    }
    void navigate({ to: "/" });
  };

  const isHistoryView = uploadStore.isHistoryView();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8 md:py-12 space-y-6">
      {isHistoryView ? (
        <div className="rounded-btn bg-brand-teal-light text-brand-teal px-4 py-2.5 flex items-center gap-2 text-sm">
          <History className="h-4 w-4" aria-hidden="true" />
          <span className="flex-1">
            Viewing a past report
            {analysisResult.metadata.reportDate
              ? ` from ${analysisResult.metadata.reportDate}`
              : ""}
          </span>
          <Link to="/history" className="font-medium hover:underline shrink-0">
            ← Back to history
          </Link>
        </div>
      ) : (
        <SavedBanner />
      )}
      {analysisResult.contentWarning && (
        <MixedContentBanner message={analysisResult.contentWarning} />
      )}
      <HealthScoreCard result={analysisResult} counts={statusCounts} />
      <ResultsHeader
        result={analysisResult}
        counts={statusCounts}
        onShare={() => setShareOpen(true)}
        onDownload={() => downloadReportPdf(analysisResult)}
        onAnalyseAnother={handleAnalyseAnother}
      />

      <CategoryFilterBar
        active={activeCategory}
        onChange={setActiveCategory}
        available={available}
      />
      <BiomarkerGrid
        biomarkers={filteredBiomarkers}
        category={activeCategory}
      />

      <div className="flex items-center gap-3 py-2">
        <span className="h-px flex-1 bg-brand-border" />
        <span className="h-2 w-2 rounded-full bg-brand-teal" aria-hidden="true" />
        <span className="h-px flex-1 bg-brand-border" />
      </div>

      <InsightsSection result={analysisResult} />

      <ResultsFlowGraphic result={analysisResult} counts={statusCounts} />

      <div className="rounded-card bg-brand-coral-light/60 border border-brand-coral-light p-4 flex items-start gap-3 text-[13px] text-brand-dark">
        <AlertTriangle
          className="h-4 w-4 text-brand-coral shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <p>
          ReportRx is for informational purposes only. These results do not
          constitute medical advice. Always consult a qualified healthcare
          professional.
        </p>
      </div>

      <div className="text-center pt-4 space-y-3">
        <Button
          variant="primary"
          size="lg"
          onClick={handleAnalyseAnother}
          leftIcon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
        >
          Analyse another report
        </Button>
        <div>
          <Link
            to="/history"
            className="text-[13px] text-brand-muted hover:text-brand-teal transition-colors"
          >
            ← View all your past reports
          </Link>
        </div>
      </div>


      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        result={analysisResult}
        counts={statusCounts}
      />
    </div>
  );
}
