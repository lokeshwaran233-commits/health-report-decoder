import type { ScanInput, ScanInterpretationResult } from "@/types/scan";

interface ScanStoreState {
  input: ScanInput | null;
  lastResult: ScanInterpretationResult | null;
}

let state: ScanStoreState = { input: null, lastResult: null };

export const scanStore = {
  setInput(input: ScanInput): void {
    state = { input, lastResult: null };
  },
  consumeInput(): ScanInput | null {
    const input = state.input;
    state = { ...state, input: null };
    return input;
  },
  getInput(): ScanInput | null {
    return state.input;
  },
  setLastResult(result: ScanInterpretationResult): void {
    state = { ...state, lastResult: result };
  },
  getLastResult(): ScanInterpretationResult | null {
    return state.lastResult;
  },
  clear(): void {
    state = { input: null, lastResult: null };
  },
};
