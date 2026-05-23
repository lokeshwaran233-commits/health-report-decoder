export const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export interface ValidationResult {
  valid: boolean;
  error?: "type" | "size" | "empty";
  message?: string;
}

export function validateFile(file: File): ValidationResult {
  if (!file || file.size === 0) {
    return {
      valid: false,
      error: "empty",
      message: "This file appears to be empty. Please choose another.",
    };
  }
  if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
    return {
      valid: false,
      error: "type",
      message: "Only PDF, JPG, and PNG files are supported. Please try again.",
    };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: "size",
      message: `Your file is ${sizeMb} MB. Please use a file under ${MAX_FILE_SIZE_MB} MB.`,
    };
  }
  return { valid: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
