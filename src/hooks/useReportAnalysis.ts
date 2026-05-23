import { useState } from "react";
import type { AnalysisResult } from "@/types/report";

export interface UseReportAnalysisReturn {
  result: AnalysisResult | null;
  isAnalyzing: boolean;
  error: string | null;
  analyze: (text: string) => Promise<void>;
  reset: () => void;
}

/**
 * Stub for Day 2. Provides a stable typed surface that components can
 * compile against today; the real implementation will wire to
 * analyzeReport + normalizeAnalysis.
 */
export function useReportAnalysis(): UseReportAnalysisReturn {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = async (_text: string): Promise<void> => {
    setIsAnalyzing(true);
    setError(null);
    setIsAnalyzing(false);
  };

  const reset = (): void => {
    setResult(null);
    setError(null);
    setIsAnalyzing(false);
  };

  return { result, isAnalyzing, error, analyze, reset };
}
