import { useCallback, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { extractImageBase64, extractTextFromPDF } from "@/lib/pdfExtract";
import { uploadStore } from "@/lib/uploadStore";
import { validateFile } from "@/lib/validators";
import { validateUploadedFile } from "@/lib/security/fileValidator";
import { buildSampleResult } from "@/lib/sampleResult";
import type { UploadState } from "@/types/report";

export interface UseFileUploadReturn {
  uploadState: UploadState;
  handleFileDrop: (files: FileList | File[]) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handlePasteText: (text: string) => void;
  loadSampleReport: () => void;
  reset: () => void;
  isDragging: boolean;
  setIsDragging: (v: boolean) => void;
  pendingNavigation: boolean;
  proceedToResults: () => void;
  cancelPending: () => void;
}

const INITIAL_STATE: UploadState = { status: "idle" };
const MIN_PASTE_CHARS = 50;

export function useFileUpload(): UseFileUploadReturn {
  const navigate = useNavigate();
  const [uploadState, setUploadState] = useState<UploadState>(INITIAL_STATE);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(false);

  const reset = useCallback(() => {
    setUploadState(INITIAL_STATE);
    setIsDragging(false);
    setPendingNavigation(false);
  }, []);

  const proceedToResults = useCallback(() => {
    setPendingNavigation(false);
    void navigate({ to: "/results" });
  }, [navigate]);

  const cancelPending = useCallback(() => {
    setPendingNavigation(false);
    uploadStore.setClinicalContext(null);
    void navigate({ to: "/results" });
  }, [navigate]);

  const processFile = useCallback(
    async (file: File) => {
      const validation = validateFile(file);
      if (!validation.valid) {
        setUploadState({ status: "error", error: validation.message, file });
        return;
      }
      const deep = await validateUploadedFile(file);
      if (!deep.valid) {
        setUploadState({ status: "error", error: deep.error, file });
        return;
      }

      setUploadState({ status: "extracting", file });
      try {
        const isPdf = file.type === "application/pdf";
        if (isPdf) {
          const text = await extractTextFromPDF(file);
          uploadStore.setInput(
            { type: "text", content: text },
            { name: file.name, size: file.size, type: file.type },
          );
        } else {
          const { base64, mimeType } = await extractImageBase64(file);
          uploadStore.setInput(
            { type: "image", content: base64, mimeType },
            { name: file.name, size: file.size, type: file.type },
          );
        }
        setUploadState({ status: "done", file });
        setPendingNavigation(true);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Something went wrong while reading your file.";
        setUploadState({ status: "error", error: message, file });
      }
    },
    [],
  );

  const handleFileDrop = useCallback(
    (files: FileList | File[]) => {
      const list = Array.from(files);
      if (list.length === 0) return;
      void processFile(list[0]);
    },
    [processFile],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void processFile(file);
      e.target.value = "";
    },
    [processFile],
  );

  const handlePasteText = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (trimmed.length < MIN_PASTE_CHARS) {
        setUploadState({
          status: "error",
          error: `Please paste at least ${MIN_PASTE_CHARS} characters of report text.`,
        });
        return;
      }
      uploadStore.setInput(
        { type: "text", content: trimmed },
        { name: "Pasted report", size: trimmed.length, type: "text/plain" },
      );
      setUploadState({ status: "done", extractedText: trimmed });
      setPendingNavigation(true);
    },
    [],
  );

  const loadSampleReport = useCallback(() => {
    uploadStore.setSampleMode(buildSampleResult());
    setUploadState({ status: "done" });
    void navigate({ to: "/results" });
  }, [navigate]);

  return {
    uploadState,
    handleFileDrop,
    handleFileSelect,
    handlePasteText,
    loadSampleReport,
    reset,
    isDragging,
    setIsDragging,
    pendingNavigation,
    proceedToResults,
    cancelPending,
  };
}

export default useFileUpload;
