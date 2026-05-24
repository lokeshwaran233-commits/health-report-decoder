/**
 * BROWSER-ONLY. Uses pdfjs-dist with a web worker. Imported dynamically so
 * the ~1MB library never ships in the initial bundle.
 */

const PDFJS_VERSION = "5.7.284";
const WORKER_URL = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;

export async function extractTextFromPDF(file: File): Promise<string> {
  if (typeof window === "undefined") {
    throw new Error("extractTextFromPDF can only run in the browser.");
  }
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_URL;

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
}

export async function extractImageBase64(
  file: File,
): Promise<{ base64: string; mimeType: string }> {
  if (typeof window === "undefined") {
    throw new Error("extractImageBase64 can only run in the browser.");
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Failed to read image file."));
        return;
      }
      const comma = result.indexOf(",");
      const base64 = comma >= 0 ? result.slice(comma + 1) : result;
      resolve({ base64, mimeType: file.type });
    };
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.readAsDataURL(file);
  });
}
