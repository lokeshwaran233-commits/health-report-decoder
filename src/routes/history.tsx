import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ClipboardList, Lock, Trash2 } from "lucide-react";
import { Button } from "@/components/rx/Button";
import { HistoryCard } from "@/components/history/HistoryCard";
import { TrendChart } from "@/components/history/TrendChart";
import { useAuth } from "@/hooks/useAuth";
import { listReports } from "@/lib/cloudSync.functions";
import { uploadStore } from "@/lib/uploadStore";
import type { AnalysisResult, Biomarker } from "@/types/report";

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

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20">
      <div className="h-16 w-16 rounded-xl bg-brand-teal-light flex items-center justify-center">
        <ClipboardList className="h-8 w-8 text-brand-teal" aria-hidden="true" />
      </div>
      <h2 className="mt-5 text-[20px] font-semibold text-brand-dark">
        No reports yet
      </h2>
      <p className="mt-2 max-w-sm text-sm text-brand-muted">
        Upload your first lab report to start tracking your health over time.
      </p>
      <Link to="/" className="mt-6">
        <Button variant="primary" size="md">
          Decode my first report →
        </Button>
      </Link>
    </div>
  );
}

function HistoryPage() {
  const reduceMotion = useReducedMotion();
  const [localHistory, setLocalHistory] = useState<AnalysisResult[]>([]);
  const [confirmClear, setConfirmClear] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user } = useAuth();
  const listFn = useServerFn(listReports);

  const { data: cloudData } = useQuery({
    queryKey: ["cloud-reports", user?.id ?? null],
    queryFn: () => listFn(),
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

  // Merge cloud + local, dedupe by id
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
    }),
  );
  const seen = new Set<string>();
  const history: AnalysisResult[] = [];
  for (const r of [...cloudHistory, ...localHistory]) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    history.push(r);
  }

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

  if (history.length === 0) {
    return (
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.3 }}
        className="mx-auto max-w-3xl px-4 py-8 md:px-8 md:py-12"
      >
        <EmptyState />
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.3 }}
      className="mx-auto max-w-3xl px-4 py-8 md:px-8 md:py-12"
    >
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[24px] font-semibold text-brand-dark">
            Your report history
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-[13px] text-brand-muted">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            All reports are stored locally on your device only
          </p>
        </div>
        <button
          type="button"
          onClick={handleClearAll}
          className="inline-flex items-center gap-1.5 text-[13px] text-brand-coral hover:underline shrink-0"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          {confirmClear ? "Are you sure? Click to confirm" : "Clear all history"}
        </button>
      </div>

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
    </motion.section>
  );
}

export default HistoryPage;
