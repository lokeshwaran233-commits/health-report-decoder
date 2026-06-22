// Server-side magic-byte sniff for base64-encoded uploads.
// Client validation can be bypassed by anyone who crafts the multipart body
// directly, so we re-verify on the server before spending an AI call.

type AllowedImageMime =
  | "image/jpeg"
  | "image/png"
  | "image/webp";

const SIGNATURES: Record<AllowedImageMime, number[][]> = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]], // "RIFF"
};

const PDF_SIG = [0x25, 0x50, 0x44, 0x46]; // "%PDF"

function decodeFirstBytes(b64: string, count: number): Uint8Array {
  // Base64 is 4 chars per 3 bytes; over-slice and trim.
  const need = Math.ceil((count / 3) * 4) + 4;
  const slice = b64.slice(0, need);
  try {
    const bin = atob(slice);
    const out = new Uint8Array(Math.min(bin.length, count));
    for (let i = 0; i < out.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return new Uint8Array(0);
  }
}

function matchesAny(bytes: Uint8Array, sigs: number[][]): boolean {
  return sigs.some((sig) => sig.every((b, i) => bytes[i] === b));
}

export interface MagicByteCheck {
  ok: boolean;
  error?: string;
}

/** Validate that a base64 image blob's content matches its declared MIME type. */
export function verifyImageBase64(
  b64: string,
  declaredMime: string,
): MagicByteCheck {
  const mime = declaredMime.toLowerCase().split(";")[0].trim();
  const sigs = SIGNATURES[mime as AllowedImageMime];
  if (!sigs) {
    return { ok: false, error: "Unsupported image type." };
  }
  const head = decodeFirstBytes(b64, 12);
  if (head.length === 0) {
    return { ok: false, error: "Image payload is not valid base64." };
  }
  if (!matchesAny(head, sigs)) {
    return { ok: false, error: "Image content does not match its declared type." };
  }
  return { ok: true };
}

/** Validate that a base64 blob declared as PDF actually starts with %PDF. */
export function verifyPdfBase64(b64: string): MagicByteCheck {
  const head = decodeFirstBytes(b64, 8);
  if (head.length === 0) return { ok: false, error: "PDF payload is not valid base64." };
  if (!matchesAny(head, [PDF_SIG])) {
    return { ok: false, error: "File content is not a valid PDF." };
  }
  return { ok: true };
}
