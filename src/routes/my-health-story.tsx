import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { listReports } from "@/lib/cloudSync.functions";
import { NarrativeHero } from "@/components/v2/NarrativeHero";
import { AnnotatedTrendChart } from "@/components/v2/AnnotatedTrendChart";
import { TrendSection } from "@/components/v2/TrendSection";
import { HealthWrappedCard } from "@/components/v2/HealthWrappedCard";
import { adaptAnalysisResult } from "@/lib/clinical2026/adapter";
import { buildNarrativeSummary, buildTrends } from "@/lib/clinical2026/narrative";
import type {
  BiomarkerTrend,
  NarrativeSummary,
  RulesEngineOutput,
} from "@/lib/clinical2026/types";
import type { AnalysisResult } from "@/types/report";

export const Route = createFileRoute("/my-health-story")({
  head: () => ({
    meta: [
      { title: "My Health Story — ReportRx" },
      { name: "robots", content: "noindex, nofollow" },
      {
        name: "description",
        content:
          "See how your biomarkers have trended across every uploaded report — improvements, things to watch, and projections.",
      },
    ],
  }),
  component: HealthStoryPage,
});

function HealthStoryPage() {
  const navigate = useNavigate();
  const listFn = useServerFn(listReports);
  const [trends, setTrends] = useState<BiomarkerTrend[]>([]);
  const [summary, setSummary] = useState<NarrativeSummary | null>(null);
  const [selected, setSelected] = useState<BiomarkerTrend | null>(null);
  const [showWrapped, setShowWrapped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onUpdated = () => setRefreshTick((n) => n + 1);
    window.addEventListener("reportrx:history-updated", onUpdated);
    return () => window.removeEventListener("reportrx:history-updated", onUpdated);
  }, []);

  useEffect(() => {
    let cancelled = false;
    listFn({})
      .then((res) => {
        if (cancelled) return;
        const reports = (res.reports ?? []) as Array<{
          id: string;
          report_date: string | null;
          lab_name: string | null;
          patient_name: string | null;
          biomarkers: unknown;
          summary: string;
          doctor_questions: unknown;
          content_warning: string | null;
          status_counts: unknown;
          created_at: string;
        }>;

        const adapted: RulesEngineOutput[] = reports.map((r) => {
          const result: AnalysisResult = {
            id: r.id,
            metadata: {
              patientName: r.patient_name,
              reportDate: r.report_date,
              labName: r.lab_name,
              uploadedAt: r.created_at,
            },
            biomarkers: (r.biomarkers as AnalysisResult["biomarkers"]) ?? [],
            summary: r.summary,
            doctorQuestions:
              (r.doctor_questions as string[] | null) ?? [],
            contentWarning: r.content_warning,
            detectedPatterns: [],
            followUpTests: [],
          };
          return adaptAnalysisResult(result);
        });

        const built = buildTrends(adapted);
        setTrends(built);
        setSelected(
          built.find((t) => t.trend === "worsening") ?? built[0] ?? null,
        );

        const dates = adapted
          .map((r) => new Date(r.reportDate).getTime())
          .filter((n) => !Number.isNaN(n));
        const dateRange =
          dates.length > 0
            ? `${new Date(Math.min(...dates)).toLocaleDateString("en-IN", { month: "short", year: "numeric" })} – ${new Date(Math.max(...dates)).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}`
            : "—";

        setSummary(
          buildNarrativeSummary(built, adapted.length, dateRange, null),
        );
      })
      .catch((e) => console.error("[my-health-story]", e))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [listFn, refreshTick]);

  const oneThatMatters = useMemo(
    () =>
      summary?.oneThatMattersMost
        ? trends.find(
            (t) => t.normalizedName === summary.oneThatMattersMost?.normalizedName,
          ) ?? null
        : null,
    [trends, summary],
  );

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-brand-muted">
        Loading your health story…
      </div>
    );
  }

  if (!summary || trends.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1
          className="text-2xl font-medium text-brand-dark dark:text-white mb-2"
          style={{ fontFamily: "Fraunces, Georgia, serif" }}
        >
          No story yet
        </h1>
        <p className="text-sm text-brand-muted mb-6">
          Sign in and upload reports to start building your health story.
        </p>
        <button
          onClick={() => navigate({ to: "/" })}
          className="inline-flex items-center px-4 py-2 rounded-pill bg-brand-teal text-white text-sm font-medium hover:bg-brand-teal-mid transition-colors"
        >
          Upload a report
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-brand-surface dark:bg-[#080C14]">
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-4">
        <div className="flex items-center justify-between mb-1">
          <h1
            className="text-2xl sm:text-3xl font-medium text-brand-dark dark:text-white"
            style={{ fontFamily: "Fraunces, Georgia, serif" }}
          >
            Your Health Story
          </h1>
          <button
            onClick={() => setShowWrapped(true)}
            className="text-xs font-semibold tracking-wide uppercase text-brand-teal border border-brand-teal/40 rounded-full px-3 py-1.5 hover:bg-brand-teal-light/40 transition-colors"
          >
            Health Wrapped
          </button>
        </div>
        <p className="text-sm text-brand-muted dark:text-white/40">
          {summary.totalReports} report{summary.totalReports !== 1 ? "s" : ""} ·{" "}
          {summary.dateRange}
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-4 mb-6">
        <NarrativeHero summary={summary} />
      </div>

      {(selected ?? oneThatMatters) && (
        <div className="max-w-2xl mx-auto px-4 mb-6">
          <AnnotatedTrendChart trend={(selected ?? oneThatMatters)!} />
        </div>
      )}

      {trends.length > 1 && (
        <div className="max-w-2xl mx-auto px-4 mb-6 overflow-x-auto">
          <div className="flex gap-2 pb-2">
            {trends.map((t) => (
              <button
                key={t.normalizedName}
                onClick={() => setSelected(t)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selected?.normalizedName === t.normalizedName
                    ? "bg-brand-teal text-white"
                    : "bg-brand-card dark:bg-white/5 border border-brand-border dark:border-white/10 text-brand-muted hover:text-brand-dark"
                }`}
              >
                {t.displayName}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 space-y-4 pb-12">
        {summary.improved.length > 0 && (
          <TrendSection
            title="What improved"
            items={summary.improved}
            variant="improved"
            onSelect={setSelected}
          />
        )}
        {summary.worsened.length > 0 && (
          <TrendSection
            title="What's trending wrong"
            items={summary.worsened}
            variant="worsened"
            onSelect={setSelected}
          />
        )}
        {summary.stable.length > 0 && (
          <TrendSection
            title="What stayed stable"
            items={summary.stable}
            variant="stable"
            onSelect={setSelected}
          />
        )}
        <button
          onClick={() => navigate({ to: "/" })}
          className="w-full py-4 rounded-2xl border border-dashed border-brand-border hover:border-brand-teal/40 bg-brand-card dark:bg-white/[0.02] transition-all text-brand-muted hover:text-brand-teal text-sm font-medium"
        >
          + Upload your next report to continue the story
        </button>
      </div>

      {showWrapped && (
        <HealthWrappedCard
          summary={summary}
          onClose={() => setShowWrapped(false)}
        />
      )}
    </div>
  );
}
