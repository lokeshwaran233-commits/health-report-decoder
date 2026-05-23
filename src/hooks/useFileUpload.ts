import { useCallback, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  extractTextFromImage,
  extractTextFromPDF,
} from "@/lib/pdfExtract";
import { SAMPLE_REPORT_TEXT } from "@/lib/sampleReport";
import { setUploadPayload } from "@/lib/uploadStore";
import { validateFile } from "@/lib/validators";
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
}

const INITIAL_STATE: UploadState = { status: "idle" };

export function useFileUpload(): UseFileUploadReturn {
  const navigate = useNavigate();
  const [uploadState, setUploadState] = useState<UploadState>(INITIAL_STATE);
  const [isDragging, setIsDragging] = useState(false);

  const reset = useCallback(() => {
    setUploadState(INITIAL_STATE);
    setIsDragging(false);
  }, []);

  const processFile = useCallback(
    async (file: File) => {
      const validation = validateFile(file);
      if (!validation.valid) {
        setUploadState({
          status: "error",
          error: validation.message,
          file,
        });
        return;
      }

      setUploadState({ status: "extracting", file });

      try {
        const isPdf = file.type === "application/pdf";
        const extractedText = isPdf
          ? await extractTextFromPDF(file)
          : await extractTextFromImage(file);

        setUploadPayload({
          status: "done",
          extractedText,
          source: isPdf ? "pdf" : "image",
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          imageDataUrl: isPdf ? undefined : extractedText,
          receivedAt: Date.now(),
        });

        setUploadState({ status: "done", file, extractedText });
        await navigate({ to: "/results" });
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Something went wrong while reading your file.";
        setUploadState({ status: "error", error: message, file });
      }
    },
    [navigate],
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
      if (trimmed.length < 50) {
        setUploadState({
          status: "error",
          error: "Please paste at least 50 characters of report text.",
        });
        return;
      }
      setUploadPayload({
        status: "done",
        extractedText: trimmed,
        source: "text",
        receivedAt: Date.now(),
      });
      setUploadState({ status: "done", extractedText: trimmed });
      void navigate({ to: "/results" });
    },
    [navigate],
  );

  const loadSampleReport = useCallback(() => {
    setUploadPayload({
      status: "done",
      extractedText: SAMPLE_REPORT_TEXT,
      source: "sample",
      receivedAt: Date.now(),
    });
    setUploadState({ status: "done", extractedText: SAMPLE_REPORT_TEXT });
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
  };
}
