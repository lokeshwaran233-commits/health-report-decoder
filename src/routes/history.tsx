import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { ClipboardList, Lock, Scan } from "lucide-react";
import { Button } from "@/components/rx/Button";
import { TrendChart } from "@/components/history/TrendChart";
import { ReportHistoryList } from "@/components/history/ReportHistoryList";
import { ScanHistoryList } from "@/components/history/ScanHistoryList";
import { useAuth } from "@/hooks/useAuth";
import { listReports } from "@/lib/cloudSync.functions";
import { listScans } from "@/lib/scanCloudSync.functions";
import { uploadStore } from "@/lib/uploadStore";
import { cn } from "@/lib/utils";
import type { AnalysisResult, Biomarker } from "@/types/report";
import type { ScanInterpretationResult } from "@/types/scan";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "History — ReportRx" },
      { name: "description", content: "Your previously analysed lab reports and scans." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HistoryPage,
});

type Tab = "reports" | "scans";

function EmptyState({ kind }: { kind: Tab }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20">
      <div className="h-16 w-16 rounded-xl bg-brand-teal-light flex items-center justify-center">
        {kind === "reports" ? (
          <ClipboardList className="h-8 w-8 text-brand-teal" aria-hidden="true" />
        ) : (
          <Scan className="h-8 w-8 text-brand-teal" aria-hidden="true" />
        )}
      </div>
      <h2 className="mt-5 text-[20px] font-semibold text-brand-dark">
        {kind === "reports" ? "No reports yet" : "No scans yet"}
      </h2>
      <p className="mt-2 max-w-sm text-sm text-brand-muted">
        {kind === "reports"
          ? "Upload your first lab report to start tracking your health over time."
          : "Decode your first scan — X-Ray, CT, MRI, Ultrasound, ECG, mammogram and more."}
      </p>
      <Link to={kind === "reports" ? "/" : "/scan"} className="mt-6">
        <Button variant="primary" size="md">
          {kind === "reports" ? "Decode my first report →" : "Decode my first scan →"}
        </Button>
      </Link>
    </div>
  );
}

function HistoryPage() {
  const reduceMotion = useReducedMotion();
  const [tab, setTab] = useState<Tab>("reports");
  const [localHistory, setLocalHistory] = useState<AnalysisResult[]>([]);
  const { user } = useAuth();
  const listReportsFn = useServerFn(listReports);
  const listScansFn = useServerFn(listScans);

  const { data: cloudData } = useQuery({
    queryKey: ["cloud-reports", user?.id ?? null],
    queryFn: () => listReportsFn(),
    enabled: !!user,
    retry: false,
  });

  const { data: scansData } = useQuery({
    queryKey: ["cloud-scans", user?.id ?? null],
    queryFn: () => listScansFn(),
    enabled: !!user,
    retry: false,
  });

  // Sync from cloud data
  useEffect(() => {
    setLocalHistory(uploadStore.getHistory());
  }, [cloudData]);

  // Subscribe to immediate local store mutations (delete, clear, add)
  useEffect(() => {
    const unsubscribe = uploadStore.subscribe(() => {
      setLocalHistory(uploadStore.getHistory());
    });
    return unsubscribe;
  }, []);


  type RawReport = {
    id: string;
    created_at?: string;
    report_date?: string | null;
    lab_name?: string | null;
    patient_name?: string | null;
    status_counts?: unknown;
    biomarkers?: unknown;
    summary?: string;
    doctor_questions?: unknown;
    content_warning?: string | null;
  };
  const cloudHistory: AnalysisResult[] = (cloudData?.reports ?? []).map(
    (r: RawReport): AnalysisResult => ({
      id: r.id,
      metadata: {
        patientName: r.patient_name ?? null,
        reportDate: r.report_date ?? null,
        labName: r.lab_name ?? null,
        uploadedAt: r.created_at ?? new Date().toISOString(),
      },
      biomarkers: (r.biomarkers as Biomarker[]) ?? [],
      summary: r.summary ?? "",
      doctorQuestions: (r.doctor_questions as string[]) ?? [],
      contentWarning: r.content_warning ?? null,
      detectedPatterns: [],
      followUpTests: [],
    }),
  );
  const cloudIds = new Set(cloudHistory.map((r) => r.id));
  const seen = new Set<string>();
  const history: AnalysisResult[] = [];
  for (const r of [...cloudHistory, ...localHistory]) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    history.push(r);
  }
  const scans: ScanInterpretationResult[] = scansData?.scans ?? [];

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.3 }}
      className="mx-auto max-w-3xl px-4 py-8 md:px-8 md:py-12"
    >
      <div className="mb-4">
        <h1 className="text-[24px] font-semibold text-brand-dark">Your history</h1>
        <p className="mt-1 flex items-center gap-1.5 text-[13px] text-brand-muted">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          Signed-in reports and scans are saved here automatically. Guest sessions are never stored.
        </p>
      </div>


      <div className="inline-flex rounded-pill bg-brand-surface p-1 mb-6">
        <button
          type="button"
          onClick={() => setTab("reports")}
          className={cn(
            "px-4 h-9 rounded-pill text-sm font-medium transition",
            tab === "reports" ? "bg-white shadow text-brand-dark" : "text-brand-muted",
          )}
        >
          Lab reports {history.length > 0 && `(${history.length})`}
        </button>
        <button
          type="button"
          onClick={() => setTab("scans")}
          className={cn(
            "px-4 h-9 rounded-pill text-sm font-medium transition",
            tab === "scans" ? "bg-white shadow text-brand-dark" : "text-brand-muted",
          )}
        >
          Scans {scans.length > 0 && `(${scans.length})`}
        </button>
      </div>

      {tab === "reports" &&
        (history.length === 0 ? (
          <EmptyState kind="reports" />
        ) : (
          <>
            <ReportHistoryList reports={history} cloudIds={cloudIds} />
            <TrendChart history={history} />
          </>
        ))}

      {tab === "scans" &&
        (scans.length === 0 ? (
          <EmptyState kind="scans" />
        ) : (
          <ScanHistoryList scans={scans} />
        ))}
    </motion.section>
  );
}

export default HistoryPage;
