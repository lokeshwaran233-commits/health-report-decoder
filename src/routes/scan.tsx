import { useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertCircle, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/rx/Button";
import { ModalityPicker } from "@/components/scan/ModalityPicker";
import { analyzeScan } from "@/lib/scanAnalysis.functions";
import { saveScan } from "@/lib/scanCloudSync.functions";
import { scanStore } from "@/lib/scanStore";
import { useAuth } from "@/hooks/useAuth";
import type { BodyRegion, ScanModality } from "@/types/scan";

export const Route = createFileRoute("/scan")({
  head: () => ({
    meta: [
      { title: "Scan Decoder — ReportRx" },
      {
        name: "description",
        content:
          "Upload an X-Ray or paste a scan report. Get a plain-English explanation and a professional radiology-style read — reviewed and structured by AI.",
      },
      { property: "og:title", content: "Scan Decoder — ReportRx" },
      {
        property: "og:description",
        content:
          "AI-assisted interpretation of X-Ray images and scan reports, with explicit limitations and clinical review reminders.",
      },
    ],
  }),
  component: ScanPage,
});

const REGIONS: { id: BodyRegion; label: string }[] = [
  { id: "chest_lungs", label: "Chest / Lungs" },
  { id: "musculoskeletal", label: "Bone / Joint" },
  { id: "abdomen", label: "Abdomen" },
  { id: "pelvis", label: "Pelvis" },
  { id: "spine", label: "Spine" },
  { id: "head_brain", label: "Head / Brain" },
  { id: "neck_thyroid", label: "Neck" },
  { id: "breast", label: "Breast" },
  { id: "vascular", label: "Vascular" },
  { id: "whole_body", label: "Whole body" },
  { id: "unknown", label: "Other / not sure" },
];

const MAX_IMAGE_MB = 8;
const MAX_TEXT_CHARS = 50000;

function fileToBase64(file: File): Promise<{ b64: string; mime: string }> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => {
      const result = r.result as string;
      const [, b64] = result.split(",");
      res({ b64, mime: file.type || "image/jpeg" });
    };
    r.onerror = () => rej(new Error("Could not read file"));
    r.readAsDataURL(file);
  });
}

function ScanPage() {
  const navigate = useNavigate();
  const analyze = useServerFn(analyzeScan);
  const save = useServerFn(saveScan);
  const { user } = useAuth();

  const [modality, setModality] = useState<ScanModality | null>(null);
  const [region, setRegion] = useState<BodyRegion>("chest_lungs");
  const [context, setContext] = useState("");
  const [reportText, setReportText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const isImageMode = modality === "xray";
  const isTextMode = modality === "report_text";

  const handlePickFile = (f: File | null) => {
    setError(null);
    if (!f) { setFile(null); setPreviewUrl(null); return; }
    if (!f.type.startsWith("image/")) {
      setError("Please upload a JPG or PNG image of the X-Ray.");
      return;
    }
    if (f.size > MAX_IMAGE_MB * 1024 * 1024) {
      setError(`Image is too large. Please keep it under ${MAX_IMAGE_MB} MB.`);
      return;
    }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const canSubmit =
    !loading &&
    !!modality &&
    ((isImageMode && !!file) ||
      (isTextMode && reportText.trim().length >= 20));

  const handleSubmit = async () => {
    if (!canSubmit || !modality) return;
    setError(null);
    setLoading(true);
    try {
      let result;
      if (isImageMode && file) {
        const { b64, mime } = await fileToBase64(file);
        result = await analyze({
          data: {
            type: "xray_image",
            content: b64,
            mimeType: mime,
            bodyRegion: region,
            clinicalContext: context.trim() || null,
            language: "en",
          },
        });
      } else if (isTextMode) {
        result = await analyze({
          data: {
            type: "report_text",
            content: reportText.trim().slice(0, MAX_TEXT_CHARS),
            bodyRegion: region,
            clinicalContext: context.trim() || null,
            language: "en",
          },
        });
      } else {
        return;
      }

      scanStore.setLastResult(result);

      if (user) {
        try {
          await save({ data: { result } });
        } catch (e) {
          console.warn("[scan] cloud save failed", e);
          toast.warning("Saved locally. Could not sync to your account.");
        }
      }

      void navigate({ to: "/scan-results" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 md:px-6 pt-24 pb-16 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-semibold text-brand-dark tracking-tight">
          Scan Decoder
        </h1>
        <p className="text-brand-muted max-w-2xl">
          Get a structured, honest read of an X-Ray image or a written scan report.
          You'll see both a patient-friendly summary and a professional impression
          — with explicit limitations.
        </p>
      </header>

      <div className="rounded-card border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        <strong>Important:</strong> This tool assists understanding. It does not
        replace a qualified radiologist or your treating doctor. Never make
        treatment decisions from this output alone.
      </div>

      <section>
        <h2 className="text-sm font-semibold text-brand-dark mb-3">
          1. Choose what you'd like to interpret
        </h2>
        <ModalityPicker value={modality} onChange={(m) => { setModality(m); setError(null); }} />
      </section>

      {modality && (
        <section className="rounded-card border border-brand-border bg-white p-5 space-y-5">
          <h2 className="text-sm font-semibold text-brand-dark">
            2. Provide the {isImageMode ? "X-Ray image" : "scan report text"}
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs text-brand-muted">Body region</span>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value as BodyRegion)}
                className="mt-1 w-full h-10 rounded-btn border border-brand-border bg-white px-3 text-sm"
              >
                {REGIONS.map((r) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-brand-muted">
                Clinical context (optional)
              </span>
              <input
                type="text"
                value={context}
                onChange={(e) => setContext(e.target.value.slice(0, 2000))}
                placeholder="e.g. cough for 2 weeks, post-fall right wrist"
                className="mt-1 w-full h-10 rounded-btn border border-brand-border bg-white px-3 text-sm"
              />
            </label>
          </div>

          {isImageMode && (
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                hidden
                onChange={(e) => handlePickFile(e.target.files?.[0] ?? null)}
              />
              {previewUrl ? (
                <div className="rounded-card border border-brand-border p-3 flex gap-4 items-start">
                  <img
                    src={previewUrl}
                    alt="X-Ray preview"
                    className="h-32 w-32 object-cover rounded-md bg-black"
                  />
                  <div className="flex-1 text-sm">
                    <div className="font-medium text-brand-dark truncate">
                      {file?.name}
                    </div>
                    <div className="text-xs text-brand-muted">
                      {((file?.size ?? 0) / 1024).toFixed(0)} KB
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePickFile(null)}
                      className="mt-2 text-xs text-brand-coral underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full rounded-card border-[1.5px] border-dashed border-brand-teal/60 bg-brand-teal-light/30 hover:bg-brand-teal-light/50 transition p-8 text-center"
                >
                  <Upload className="mx-auto h-6 w-6 text-brand-teal" aria-hidden="true" />
                  <div className="mt-2 text-sm font-medium text-brand-dark">
                    Upload X-Ray image
                  </div>
                  <div className="text-xs text-brand-muted">
                    JPG or PNG, up to {MAX_IMAGE_MB} MB
                  </div>
                </button>
              )}
            </div>
          )}

          {isTextMode && (
            <div>
              <label className="block">
                <span className="text-xs text-brand-muted">
                  Paste the scan report text (or a PDF's text content)
                </span>
                <textarea
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value.slice(0, MAX_TEXT_CHARS))}
                  rows={10}
                  placeholder="Paste the radiologist's report here…"
                  className="mt-1 w-full rounded-card border border-brand-border bg-white p-3 text-sm font-mono"
                />
              </label>
              <div className="mt-1 text-[11px] text-brand-muted text-right">
                {reportText.length} / {MAX_TEXT_CHARS}
              </div>
            </div>
          )}

          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-card border border-brand-coral bg-brand-coral-light/30 p-3 text-sm text-brand-dark">
              <AlertCircle className="h-4 w-4 mt-0.5 text-brand-coral" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              variant="primary"
              size="lg"
              disabled={!canSubmit}
              onClick={handleSubmit}
              leftIcon={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
            >
              {loading ? "Analysing…" : "Interpret scan"}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
