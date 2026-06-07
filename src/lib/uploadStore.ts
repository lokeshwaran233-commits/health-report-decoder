import type { AnalysisResult, AnalyzeInput, ClinicalContext, FileMeta } from "@/types/report";

interface UploadStoreState {
  input: AnalyzeInput | null;
  fileMeta: FileMeta | null;
  sampleMode: boolean;
  historyView: boolean;
  receivedAt: number | null;
  lastResult: AnalysisResult | null;
  clinicalContext: ClinicalContext | null;
}

const STORAGE_KEY = "reportrx_history";
const MAX_HISTORY = 20;

let state: UploadStoreState = {
  input: null,
  fileMeta: null,
  sampleMode: false,
  historyView: false,
  receivedAt: null,
  lastResult: null,
  clinicalContext: null,
};


export const uploadStore = {
  setInput(input: AnalyzeInput, fileMeta?: FileMeta): void {
    state = {
      ...state,
      input,
      fileMeta: fileMeta ?? null,
      sampleMode: false,
      receivedAt: Date.now(),
    };
  },
  setFileMeta(meta: FileMeta): void {
    state = { ...state, fileMeta: meta };
  },
  setSampleMode(result: AnalysisResult): void {
    state = {
      ...state,
      input: null,
      fileMeta: { name: "Sample report", size: 0, type: "text/plain" },
      sampleMode: true,
      receivedAt: Date.now(),
      lastResult: result,
    };
  },
  setHistoryView(result: AnalysisResult): void {
    state = {
      ...state,
      input: null,
      fileMeta: null,
      sampleMode: true,
      historyView: true,
      receivedAt: Date.now(),
      lastResult: result,
    };
  },
  isHistoryView(): boolean {
    return state.historyView;
  },
  getInput(): AnalyzeInput | null {
    return state.input;
  },
  getFileMeta(): FileMeta | null {
    return state.fileMeta;
  },
  isSampleMode(): boolean {
    return state.sampleMode;
  },
  consumeSampleResult(): AnalysisResult | null {
    if (!state.sampleMode) return null;
    const r = state.lastResult;
    state = { ...state, sampleMode: false };
    return r;
  },
  clear(): void {
    state = {
      input: null,
      fileMeta: null,
      sampleMode: false,
      historyView: false,
      receivedAt: null,
      lastResult: null,
      clinicalContext: null,
    };
  },

  setClinicalContext(ctx: ClinicalContext | null): void {
    state = { ...state, clinicalContext: ctx };
  },
  getClinicalContext(): ClinicalContext | null {
    return state.clinicalContext;
  },

  setLastResult(result: AnalysisResult): void {
    state = { ...state, lastResult: result };
    try {
      if (typeof window === "undefined") return;
      const existing = uploadStore.getHistory();
      const filtered = existing.filter((r) => r.id !== result.id);
      const next = [result, ...filtered].slice(0, MAX_HISTORY);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore quota / privacy errors
    }
  },
  getLastResult(): AnalysisResult | null {
    return state.lastResult;
  },
  getHistory(): AnalysisResult[] {
    try {
      if (typeof window === "undefined") return [];
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as AnalysisResult[];
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch {
      return [];
    }
  },
  clearHistory(): void {
    try {
      if (typeof window === "undefined") return;
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  },
  deleteHistoryItem(id: string): void {
    try {
      const next = uploadStore.getHistory().filter((r) => r.id !== id);
      if (typeof window === "undefined") return;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  },
};

export default uploadStore;
