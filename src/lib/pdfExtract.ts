/**
 * BROWSER-ONLY. Uses pdfjs-dist with a web worker.
 * Never import this module from a server function, server route, or any
 * Cloudflare Worker context — it will fail to bundle/run.
 */
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://unpkg.com/pdfjs-dist@5/build/pdf.worker.min.mjs";

export async function extractTextFromPDF(file: File): Promise<string> {
  if (typeof window === "undefined") {
    throw new Error("extractTextFromPDF can only run in the browser.");
  }
  try {
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ");
      pages.push(text);
    }
    const joined = pages.join("\n\n").trim();
    if (!joined) {
      throw new Error(
        "We couldn't read any text from this PDF. It may be a scanned image — try uploading a photo instead.",
      );
    }
    return joined;
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error("Failed to read PDF. Please try a different file.");
  }
}

export async function extractTextFromImage(file: File): Promise<string> {
  if (typeof window === "undefined") {
    throw new Error("extractTextFromImage can only run in the browser.");
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") resolve(result);
      else reject(new Error("Failed to read image file."));
    };
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.readAsDataURL(file);
  });
}
