import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { analyzeReport } from "@/lib/analyze.functions";
import { saveReport } from "@/lib/cloudSync.functions";
import { uploadStore } from "@/lib/uploadStore";
import { supabase } from "@/integrations/supabase/client";


import type {
  AnalysisError,
  AnalysisResult,
  AnalyzeInput,
  Biomarker,
  BiomarkerCategory,
} from "@/types/report";

export type AnalysisState = "idle" | "loading" | "success" | "error";
export type CategoryFilter = BiomarkerCategory | "all";

export interface UseReportAnalysisReturn {
  analysisResult: AnalysisResult | null;
  analysisState: AnalysisState;
  error: AnalysisError | null;
  activeCategory: CategoryFilter;
  setActiveCategory: (cat: CategoryFilter) => void;
  filteredBiomarkers: Biomarker[];
  statusCounts: { normal: number; watch: number; flagged: number };
  runAnalysis: (input: AnalyzeInput) => Promise<void>;
  retry: () => void;
  loadResult: (result: AnalysisResult) => void;
}

const STATUS_ORDER: Record<Biomarker["status"], number> = {
  flagged: 0,
  watch: 1,
  normal: 2,
};

export function useReportAnalysis(): UseReportAnalysisReturn {
  const analyzeFn = useServerFn(analyzeReport);
  const saveReportFn = useServerFn(saveReport);
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const [analysisResult, setResult] = useState<AnalysisResult | null>(null);
  const [analysisState, setState] = useState<AnalysisState>("idle");
  const [error, setError] = useState<AnalysisError | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [lastInput, setLastInput] = useState<AnalyzeInput | null>(null);

  const runAnalysis = useCallback(
    async (input: AnalyzeInput) => {
      const lang = (i18n.language ?? "en").split("-")[0];
      const ctx = uploadStore.getClinicalContext();
      const withLang = {
        ...input,
        language: lang,
        ...(ctx ? { clinicalContext: ctx } : {}),
      } as AnalyzeInput;
      setLastInput(withLang);
      setState("loading");
      setError(null);
      try {
        const result = (await analyzeFn({ data: withLang })) as AnalysisResult;
        setResult(result);
        uploadStore.setLastResult(result);
        setState("success");
        const isSample = uploadStore.isSampleMode() || uploadStore.isHistoryView();
        if (!isSample) {
          toast.success("Analysis ready");
          // Persist to the signed-in user's cloud history only.
          if (user) {
            try {
              await saveReportFn({ data: { result } });
            } catch (err) {
              console.error("[saveReport] failed", err);
            }
          }
        }
      } catch (e) {
        const code =
          e && typeof e === "object" && "code" in e
            ? (e as AnalysisError).code
            : "API_ERROR";
        const message =
          e instanceof Error
            ? e.message
            : "Something went wrong. Please try again.";
        console.error("[analyzeReport]", code, message, e);
        setError({ code, message });
        setState("error");
      }
    },
    [analyzeFn, saveReportFn, user, i18n.language],
  );

  const loadResult = useCallback((result: AnalysisResult) => {
    setResult(result);
    uploadStore.setLastResult(result);
    setState("success");
    setError(null);
  }, []);

  const retry = useCallback(() => {
    if (lastInput) void runAnalysis(lastInput);
  }, [lastInput, runAnalysis]);

  const statusCounts = useMemo(() => {
    const counts = { normal: 0, watch: 0, flagged: 0 };
    if (analysisResult) {
      for (const b of analysisResult.biomarkers) counts[b.status] += 1;
    }
    return counts;
  }, [analysisResult]);

  const filteredBiomarkers = useMemo(() => {
    if (!analysisResult) return [];
    const list =
      activeCategory === "all"
        ? [...analysisResult.biomarkers].sort(
            (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status],
          )
        : analysisResult.biomarkers.filter((b) => b.category === activeCategory);
    return list;
  }, [analysisResult, activeCategory]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const name = analysisResult?.metadata.patientName;
    if (name) {
      document.title = `${name}'s Results — ReportRx`;
    } else if (analysisResult) {
      document.title = "Your Results — ReportRx";
    }
    return () => {
      document.title = "ReportRx — Your lab report, finally explained";
    };
  }, [analysisResult]);

  return {
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
  };
}

export default useReportAnalysis;
