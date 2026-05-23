import type { UploadStatus } from "@/types/report";

export interface UploadPayload {
  status: UploadStatus;
  extractedText: string;
  source: "pdf" | "image" | "text" | "sample";
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  imageDataUrl?: string;
  receivedAt: number;
}

let payload: UploadPayload | null = null;

export function setUploadPayload(next: UploadPayload): void {
  payload = next;
}

export function consumeUploadPayload(): UploadPayload | null {
  const current = payload;
  payload = null;
  return current;
}

export function peekUploadPayload(): UploadPayload | null {
  return payload;
}
