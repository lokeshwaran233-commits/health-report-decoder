import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, ClipboardList, Lock, Scan, Trash2 } from "lucide-react";
import { Button } from "@/components/rx/Button";
import { HistoryCard } from "@/components/history/HistoryCard";
import { TrendChart } from "@/components/history/TrendChart";
import { useAuth } from "@/hooks/useAuth";
import { listReports } from "@/lib/cloudSync.functions";
import { listScans } from "@/lib/scanCloudSync.functions";
import { scanStore } from "@/lib/scanStore";
import { uploadStore } from "@/lib/uploadStore";
import { cn } from "@/lib/utils";
import type { AnalysisResult, Biomarker } from "@/types/report";
import type { ScanInterpretationResult } from "@/types/scan";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "History — ReportRx" },
      {
        name: "description",
        content: "Your previously analysed lab reports and scans.",
      },
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

function ScanRow({
  scan,
  onOpen,
}: {
  scan: ScanInterpretationResult;
  onOpen: () => void;
}) {
  const urgency = scan.professional?.urgency ?? "routine";
  const urgencyBadge = cn(
    "inline-block text-[11px] uppercase tracking-wide px-2 py-0.5 rounded-pill",
    urgency === "critical"
      ? "bg-brand-coral text-white"
      : urgency === "urgent"
        ? "bg-amber-200 text-amber-900"
        : "bg-emerald-100 text-emerald-900",
  );
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left rounded-card border border-brand-border bg-white p-4 hover:border-brand-teal/60 transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-brand-dark capitalize">
            {scan.modality.replace(/_/g, " ")} · {scan.bodyRegion.replace(/_/g, " ")}
          </div>
          <div className="text-xs text-brand-muted mt-0.5">
            {new Date(scan.createdAt).toLocaleString()}
          </div>
          {scan.professional?.impression && (
            <p className="text-sm text-brand-dark mt-2 line-clamp-2">
              {scan.professional.impression}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={urgencyBadge}>{urgency}</span>
          {scan.criticalAlerts.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-brand-coral">
              <AlertTriangle className="h-3 w-3" aria-hidden="true" /> Critical
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function HistoryPage() {
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("reports");
  const [localHistory, setLocalHistory] = useState<AnalysisResult[]>([]);
  const [confirmClear, setConfirmClear] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  useEffect(() => {
    setLocalHistory(uploadStore.getHistory());
  }, []);

  useEffect(() => {
    return () => {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    };
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
  const seen = new Set<string>();
  const history: AnalysisResult[] = [];
  for (const r of [...cloudHistory, ...localHistory]) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    history.push(r);
  }
  const scans: ScanInterpretationResult[] = scansData?.scans ?? [];

  const handleDelete = (id: string) => {
    setLocalHistory((prev) => prev.filter((r) => r.id !== id));
  };

  const handleClearAll = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      confirmTimer.current = setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    uploadStore.clearHistory();
    setLocalHistory([]);
    setConfirmClear(false);
  };

  const openScan = (s: ScanInterpretationResult) => {
    scanStore.setLastResult(s);
    void navigate({ to: "/scan-results", search: { id: s.id } });
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: reduceMotion ? 0 : 0.06 },
    },
  };
  const item = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.3 }}
      className="mx-auto max-w-3xl px-4 py-8 md:px-8 md:py-12"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="text-[24px] font-semibold text-brand-dark">
            Your history
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-[13px] text-brand-muted">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            {user ? "Synced to your account" : "Stored locally on this device only"}
          </p>
        </div>
        {tab === "reports" && history.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="inline-flex items-center gap-1.5 text-[13px] text-brand-coral hover:underline shrink-0"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            {confirmClear ? "Are you sure? Click to confirm" : "Clear local history"}
          </button>
        )}
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
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="flex flex-col gap-3"
            >
              <AnimatePresence>
                {history.map((r) => (
                  <motion.div key={r.id} variants={item}>
                    <HistoryCard result={r} onDelete={handleDelete} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
            <TrendChart history={history} />
          </>
        ))}

      {tab === "scans" &&
        (scans.length === 0 ? (
          <EmptyState kind="scans" />
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-3"
          >
            {scans.map((s) => (
              <motion.div key={s.id} variants={item}>
                <ScanRow scan={s} onOpen={() => openScan(s)} />
              </motion.div>
            ))}
          </motion.div>
        ))}
    </motion.section>
  );
}

export default HistoryPage;
