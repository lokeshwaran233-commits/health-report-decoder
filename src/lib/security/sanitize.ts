/**
 * Text input sanitization helpers.
 *
 * Wraps DOMPurify so we have a single source of truth for the rules used
 * across the app. Use `sanitizeText` for plain-text fields (names, notes,
 * tags). Use `sanitizeRichText` only when you actually need to keep limited
 * inline formatting (e.g. user notes that allow bold/italic).
 *
 * Browser-only: DOMPurify reaches for `window`. Never call these from
 * server functions or module-top-level code that runs during SSR.
 */
import DOMPurify from "dompurify";

export function sanitizeText(input: string): string {
  if (typeof input !== "string") return "";
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  }).trim();
}

export function sanitizeRichText(input: string): string {
  if (typeof input !== "string") return "";
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "br"],
    ALLOWED_ATTR: [],
  });
}
