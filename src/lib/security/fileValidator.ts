/**
 * Hardened file upload validation.
 * Layered on top of the basic `validateFile` from `@/lib/validators` to add:
 *  - filename sanity checks (length + path-traversal / control chars)
 *  - magic-byte ("content sniff") check so callers can't lie about MIME type
 */

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

type AllowedType = (typeof ALLOWED_TYPES)[number];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_FILENAME_LENGTH = 200;

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Magic byte signatures for each allowed MIME type.
 * For WebP we only verify the leading "RIFF" marker — checking the trailing
 * "WEBP" tag would require reading further into the file and isn't needed
 * to defend against the common "rename .exe to .webp" attack.
 */
const SIGNATURES: Record<AllowedType, number[][]> = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]], // "RIFF"
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]], // "%PDF"
};

async function readMagicBytes(file: File, count: number): Promise<Uint8Array> {
  const buffer = await file.slice(0, count).arrayBuffer();
  return new Uint8Array(buffer);
}

function isAllowedType(t: string): t is AllowedType {
  return (ALLOWED_TYPES as readonly string[]).includes(t);
}

export async function validateUploadedFile(
  file: File,
): Promise<FileValidationResult> {
  if (!file || file.size === 0) {
    return { valid: false, error: "This file appears to be empty." };
  }

  if (!isAllowedType(file.type)) {
    return {
      valid: false,
      error: "Only PDF, JPG, PNG, and WebP files are allowed.",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "File must be under 10 MB." };
  }

  if (file.name.length > MAX_FILENAME_LENGTH) {
    return { valid: false, error: "Filename is too long." };
  }

  // Reject path-traversal patterns + control chars + Windows-reserved chars.
  // eslint-disable-next-line no-control-regex
  if (/[<>:"/\\|?*\x00-\x1f]/.test(file.name)) {
    return { valid: false, error: "Filename contains invalid characters." };
  }

  const magic = await readMagicBytes(file, 8);
  const expected = SIGNATURES[file.type];
  const matches = expected.some((sig) =>
    sig.every((byte, i) => magic[i] === byte),
  );

  if (!matches) {
    return {
      valid: false,
      error: "File content does not match its declared type.",
    };
  }

  return { valid: true };
}
