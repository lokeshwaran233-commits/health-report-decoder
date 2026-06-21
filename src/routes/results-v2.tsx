import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { TrustBar } from "@/components/v2/TrustBar";
import { IntentSelector } from "@/components/v2/IntentSelector";
import { AmIOkayHero } from "@/components/v2/AmIOkayHero";
import { HealthScoreCard } from "@/components/v2/HealthScoreCard";
import { PriorityStack } from "@/components/v2/PriorityStack";
import { PersonalActionPlan } from "@/components/v2/PersonalActionPlan";
import { uploadStore } from "@/lib/uploadStore";
import { adaptAnalysisResult } from "@/lib/clinical2026/adapter";
import { computeAmIOkay } from "@/lib/clinical2026/amIOkay";
import { calculateHealthScore } from "@/lib/clinical2026/healthScore";
import { buildPriorityStack } from "@/lib/clinical2026/priorityStack";
import { buildPersonalActionPlan } from "@/lib/clinical2026/personalPlan";
import type {
  AmIOkayResult,
  HealthIntent,
  HealthScoreResult,
} from "@/lib/clinical2026/types";
import type { AnalysisResult } from "@/types/report";

export const Route = createFileRoute("/results-v2")({
  head: () => ({
    meta: [
      { title: "Your Results — ReportRx 2026" },
      { name: "robots", content: "noindex, nofollow" },
      {
        name: "description",
        content:
          "ReportRx 2026 results: Am I Okay? hero, priority stack, health score, and personal action plan.",
      },
    ],
  }),
  component: ResultsV2Page,
});

function EmptyState() {
  const navigate = useNavigate();
  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <h1
        className="text-2xl font-medium text-brand-dark dark:text-white mb-2"
        style={{ fontFamily: "Fraunces, Georgia, serif" }}
      >
        No report loaded yet
      </h1>
      <p className="text-sm text-brand-muted dark:text-white/55 mb-6">
        Upload a lab report from the home page to see your 2026 results.
      </p>
      <button
        onClick={() => navigate({ to: "/" })}
        className="inline-flex items-center px-4 py-2 rounded-pill bg-brand-teal text-white text-sm font-medium hover:bg-brand-teal-mid transition-colors"
      >
        Go to upload
      </button>
    </div>
  );
}

function ResultsV2Page() {
  const navigate = useNavigate();
  const [result, setResult] = useState<AnalysisResult | null>(
    () => uploadStore.getLastResult(),
  );
  const [intent, setIntent] = useState<HealthIntent | null>(null);
  const [amIOkay, setAmIOkay] = useState<AmIOkayResult | null>(null);
  const [healthScore, setHealthScore] = useState<HealthScoreResult | null>(null);
  const [stackLoading, setStackLoading] = useState(false);

  useEffect(() => {
    const r = uploadStore.getLastResult();
    if (r) setResult(r);
  }, []);

  const rulesOutput = result ? adaptAnalysisResult(result) : null;

  useEffect(() => {
    if (!rulesOutput) return;
    setHealthScore(calculateHealthScore(rulesOutput));
    setAmIOkay(computeAmIOkay(rulesOutput));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.id]);

  useEffect(() => {
    if (!intent || !rulesOutput || !amIOkay) return;
    setStackLoading(true);
    buildPriorityStack(rulesOutput)
      .then((items) =>
        setAmIOkay((prev) => (prev ? { ...prev, priorityItems: items } : prev)),
      )
      .finally(() => setStackLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent, result?.id]);

  if (!result || !rulesOutput) return <EmptyState />;

  const plan = amIOkay ? buildPersonalActionPlan(amIOkay) : null;
  const confidence =
    rulesOutput.evaluatedBiomarkers.length > 0
      ? Math.round(
          rulesOutput.evaluatedBiomarkers.reduce((s, b) => {
            const map = { HIGH: 100, MODERATE: 67, LOW: 33, INSUFFICIENT: 0 };
            return s + (map[b.confidence] ?? 0);
          }, 0) / rulesOutput.evaluatedBiomarkers.length,
        )
      : 0;

  return (
    <div className="min-h-dvh bg-brand-surface dark:bg-[#080C14]">
      <TrustBar
        confidenceScore={confidence}
        modelVersion="clinical-rules-v2"
        onHowItWorks={() => navigate({ to: "/about" })}
        onDataRights={() => navigate({ to: "/privacy" })}
        onDeleteData={() => navigate({ to: "/profile" })}
      />

      {!intent ? (
        <IntentSelector
          onSelect={setIntent}
          userName={result.metadata.patientName ?? null}
        />
      ) : (
        <div className="max-w-2xl mx-auto px-4 py-6">
          {amIOkay && (
            <AmIOkayHero
              result={amIOkay}
              patientName={result.metadata.patientName ?? null}
            />
          )}
          {healthScore && (
            <HealthScoreCard
              healthScore={healthScore}
              onShare={async () => {
                const text = `My Health Score: ${healthScore.score}/100 (Grade ${healthScore.grade}) | ReportRx`;
                if (navigator.share) {
                  try {
                    await navigator.share({
                      title: "My Health Score",
                      text,
                      url: "https://reportrx.app",
                    });
                    return;
                  } catch (e) {
                    if ((e as Error).name === "AbortError") return;
                  }
                }
                window.open(
                  `https://wa.me/?text=${encodeURIComponent(text)}`,
                  "_blank",
                  "noopener",
                );
              }}
            />
          )}
          {amIOkay && (
            <PriorityStack
              items={amIOkay.priorityItems}
              isLoading={stackLoading}
            />
          )}
          {plan && (
            <PersonalActionPlan
              plan={plan}
              onZenoClick={() => navigate({ to: "/zeno" })}
              onDoctorBriefClick={() =>
                window.dispatchEvent(
                  new CustomEvent("openDoctorBrief", { detail: {} }),
                )
              }
            />
          )}
          <div className="text-center">
            <button
              onClick={() => navigate({ to: "/my-health-story" })}
              className="text-sm text-brand-teal hover:underline"
            >
              View your full health story over time →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
