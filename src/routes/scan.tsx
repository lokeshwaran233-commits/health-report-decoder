import { useRef, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertCircle, Loader2, Upload, LogIn } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/rx/Button";
import { ModalityPicker } from "@/components/scan/ModalityPicker";
import { LoadingScreen } from "@/components/results/LoadingScreen";
import { analyzeScan } from "@/lib/scanAnalysis.functions";
import { saveScan } from "@/lib/scanCloudSync.functions";

import { scanStore } from "@/lib/scanStore";
import { extractTextFromPDF } from "@/lib/pdfExtract";
import { validateUploadedFile } from "@/lib/security/fileValidator";
import { useAuth } from "@/hooks/useAuth";
import { ConsentModal, hasScanConsent } from "@/components/scan/ConsentModal";
import type {
  BodyRegion,
  ImageScanModality,
  ScanExtraContext,
  ScanModality,
} from "@/types/scan";

export const Route = createFileRoute("/scan")({
  head: () => ({
    meta: [
      { title: "Scan Decoder — ReportRx" },
      {
        name: "description",
        content:
          "Upload an X-Ray, CT, MRI, Ultrasound, ECG, mammogram, DEXA or any scan image — or paste a scan report. Get a plain-English explanation and a professional radiology-style read.",
      },
      { property: "og:title", content: "Scan Decoder — ReportRx" },
      {
        property: "og:description",
        content:
          "AI-assisted interpretation of medical imaging across modalities, with explicit limitations and clinical review reminders.",
      },
    ],
  }),
  component: ScanPage,
});

const ERROR_MESSAGES: Record<string, string> = {
  RATE_LIMIT: "Too many scans right now — please wait a minute and try again.",
  PAYMENT_REQUIRED: "AI credits exhausted. Please contact support.",
  QUOTA_EXCEEDED:
    "You've used your free scan. Upgrade to Plus or grab a credit pack on the Pricing page.",
  INADEQUATE_IMAGE:
    "The image is too blurry or low quality to read reliably. Try a clearer photo.",
  PARSE_ERROR: "We had trouble reading the AI response. Please try again.",
  API_ERROR:
    "The AI service is temporarily unavailable. Please try again in a moment.",
  UNAUTHORIZED: "Please sign in to analyse a scan.",
};

function humanizeError(raw: string): string {
  const upper = raw.toUpperCase();
  for (const [code, msg] of Object.entries(ERROR_MESSAGES)) {
    if (upper.includes(code)) return msg;
  }
  if (upper.includes("AUTHORIZATION") || upper.includes("UNAUTHORIZED")) {
    return ERROR_MESSAGES.UNAUTHORIZED;
  }
  if (upper.includes("429")) return ERROR_MESSAGES.RATE_LIMIT;
  if (upper.includes("402")) return ERROR_MESSAGES.PAYMENT_REQUIRED;
  return "Something went wrong. Please try again.";
}

const REGIONS: { id: BodyRegion; label: string }[] = [
  { id: "chest_lungs", label: "Chest / Lungs" },
  { id: "heart_cardiac", label: "Heart" },
  { id: "musculoskeletal", label: "Bone / Joint" },
  { id: "abdomen", label: "Abdomen" },
  { id: "pelvis", label: "Pelvis" },
  { id: "spine", label: "Spine" },
  { id: "head_brain", label: "Head / Brain" },
  { id: "neck_thyroid", label: "Neck / Thyroid" },
  { id: "breast", label: "Breast" },
  { id: "vascular", label: "Vascular" },
  { id: "obstetric", label: "Obstetric" },
  { id: "whole_body", label: "Whole body" },
  { id: "unknown", label: "Other / not sure" },
];

const MAX_IMAGE_MB = 12;
const MAX_TEXT_CHARS = 50000;

const IMAGE_MODALITY_LABEL: Record<ImageScanModality, string> = {
  xray: "X-Ray image",
  ct: "CT slice / series image",
  mri: "MRI image",
  ultrasound: "Ultrasound image",
  echo: "Echocardiogram still",
  ecg: "ECG strip photo",
  eeg: "EEG tracing image",
  pet: "PET / PET-CT image",
  mammogram: "Mammogram image",
  dexa: "DEXA report image",
  angiography: "Angiogram image",
  nuclear: "Nuclear medicine image",
};

const SAFETY_NOTE: Partial<Record<ImageScanModality, string>> = {
  ecg: "Use a clear, well-lit photo of the full 12-lead printout — calibration markers visible.",
  ct: "Single slices give a limited view. Consider also pasting the radiologist's report text for completeness.",
  mri: "Single slices give a limited view. Consider also pasting the radiologist's report text for completeness.",
  ultrasound: "Static frames lose Doppler / motion information — report text is more reliable.",
  echo: "Static stills lose colour Doppler — for a complete read, paste the echo report text.",
  mammogram: "Photographing a hardcopy reduces resolution. Pasting the BI-RADS report text gives a better read.",
  dexa: "DEXA is mostly numbers — pasting the printed T-/Z-scores will give a more accurate interpretation.",
};

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
  const saveScanFn = useServerFn(saveScan);
  const { user } = useAuth();

  const [consent, setConsent] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return hasScanConsent();
  });



  const [modality, setModality] = useState<ScanModality | null>(null);
  const [region, setRegion] = useState<BodyRegion>("chest_lungs");
  const [context, setContext] = useState("");
  const [reportText, setReportText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modality-specific extras
  const [contrastUsed, setContrastUsed] = useState<"" | "yes" | "no">("");
  const [sequences, setSequences] = useState("");
  const [isPregnant, setIsPregnant] = useState(false);
  const [echoType, setEchoType] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);
  const textFileRef = useRef<HTMLInputElement>(null);

  const isTextMode = modality === "report_text";
  const isImageMode = modality != null && modality !== "report_text";
  const imageModality = isImageMode ? (modality as ImageScanModality) : null;

  const handlePickImage = async (f: File | null) => {
    setError(null);
    if (!f) { setFile(null); setPreviewUrl(null); return; }
    if (!f.type.startsWith("image/")) {
      setError("Please upload a JPG or PNG image of the scan.");
      return;
    }
    if (f.size > MAX_IMAGE_MB * 1024 * 1024) {
      setError(`Image is too large. Please keep it under ${MAX_IMAGE_MB} MB.`);
      return;
    }
    const deep = await validateUploadedFile(f);
    if (!deep.valid) {
      setError(deep.error ?? "This file couldn't be verified.");
      return;
    }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const handlePickPdf = async (f: File | null) => {
    setError(null);
    if (!f) return;
    if (f.type !== "application/pdf") {
      setError("Please upload a PDF, or paste the report text directly.");
      return;
    }
    const deep = await validateUploadedFile(f);
    if (!deep.valid) {
      setError(deep.error ?? "This file couldn't be verified.");
      return;
    }
    try {
      setLoading(true);
      const text = await extractTextFromPDF(f);
      setReportText(text.slice(0, MAX_TEXT_CHARS));
      toast.success("PDF text extracted.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't read PDF.");
    } finally {
      setLoading(false);
    }
  };

  const canSubmit =
    !loading &&
    !!modality &&
    ((isImageMode && !!file) ||
      (isTextMode && reportText.trim().length >= 20));

  const buildExtra = (): ScanExtraContext | undefined => {
    if (!imageModality) return undefined;
    const e: ScanExtraContext = {};
    if ((imageModality === "ct" || imageModality === "mri") && contrastUsed) {
      e.contrastUsed = contrastUsed === "yes";
    }
    if (imageModality === "mri" && sequences.trim()) {
      e.sequences = sequences.trim().slice(0, 500);
    }
    if (imageModality === "ultrasound" && isPregnant) {
      e.isPregnant = true;
    }
    if (imageModality === "echo" && echoType.trim()) {
      e.echoType = echoType.trim().slice(0, 200);
    }
    return Object.keys(e).length ? e : undefined;
  };

  const handleSubmit = async () => {
    if (!canSubmit || !modality) return;
    if (!user) {
      toast.error("Please sign in to analyse a scan.");
      void navigate({ to: "/auth", search: { mode: "signin" } });
      return;
    }
    setError(null);
    setLoading(true);
    try {
      let result;
      if (isImageMode && file && imageModality) {
        const { b64, mime } = await fileToBase64(file);
        result = await analyze({
          data: {
            type: "scan_image",
            modality: imageModality,
            content: b64,
            mimeType: mime,
            bodyRegion: region,
            clinicalContext: context.trim() || null,
            language: "en",
            extra: buildExtra(),
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
      // Persist to history for signed-in users only.
      // Check session synchronously from Supabase — `user` from useAuth may
      // still be loading on first navigation and would skip the save.
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session?.user) {
          try {
            const saved = await saveScanFn({ data: { result } });
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("reportrx:history-updated"));
            }
            void navigate({ to: "/scan-results", search: { id: saved.id } });
            return;
          } catch (err) {
            console.error("[saveScan] failed", err);
            toast.error("We couldn't save this scan to your history. Showing results anyway.");
          }
        }
      } catch (err) {
        console.error("[saveScan] session check failed", err);
      }
      void navigate({ to: "/scan-results", search: {} });
    } catch (e) {
      const raw = e instanceof Error ? e.message : "Something went wrong.";
      const msg = humanizeError(raw);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 md:px-6 pt-24 pb-16">
        <LoadingScreen />
        <p className="mt-4 text-center text-xs text-brand-muted">
          Scans typically take 15–30 seconds — please don't close this tab.
        </p>
      </div>
    );
  }


  return (
    <>
      {!consent && (
        <ConsentModal
          onAccept={() => setConsent(true)}
          onDecline={() => void navigate({ to: "/" })}
        />
      )}
    <div className="mx-auto max-w-4xl px-4 md:px-6 pt-24 pb-16 space-y-8">

      <header className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-semibold text-brand-dark tracking-tight">
          Scan Decoder
        </h1>
        <p className="text-brand-muted max-w-2xl">
          Get a structured, honest read of a scan image (X-Ray, CT, MRI, Ultrasound,
          ECG, Echo, mammogram, DEXA and more) or a written scan report. You'll see
          both a patient-friendly summary and a professional impression — with explicit
          limitations.
        </p>
      </header>

      {!user && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-brand-teal/40 bg-brand-teal-light/30 p-4 text-sm text-brand-dark"
        >
          <div className="flex items-start gap-2">
            <LogIn className="h-4 w-4 mt-0.5 text-brand-teal" aria-hidden="true" />
            <span>
              <strong>Sign in required.</strong> Create a free account to analyse
              scans — it takes 10 seconds and your history is saved securely.
            </span>
          </div>
          <Link
            to="/auth"
            search={{ mode: "signin" }}
            className="inline-flex h-9 items-center rounded-btn bg-brand-teal px-4 text-sm font-medium text-white hover:bg-brand-teal-mid"
          >
            Sign in
          </Link>
        </div>
      )}

      <div className="rounded-card border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        <strong>Important:</strong> This tool assists understanding. It does not
        replace a qualified radiologist or your treating doctor. Never make
        treatment decisions from this output alone.
      </div>

      <section>
        <h2 className="text-sm font-semibold text-brand-dark mb-3">
          1. Choose what you'd like to interpret
        </h2>
        <ModalityPicker
          value={modality}
          onChange={(m) => {
            setModality(m);
            setError(null);
            setFile(null);
            setPreviewUrl(null);
          }}
        />
      </section>

      {modality && (
        <section className="rounded-card border border-brand-border bg-white p-5 space-y-5">
          <h2 className="text-sm font-semibold text-brand-dark">
            2. Provide the {isImageMode && imageModality ? IMAGE_MODALITY_LABEL[imageModality] : "scan report text"}
          </h2>

          {imageModality && SAFETY_NOTE[imageModality] && (
            <p className="text-xs text-brand-muted bg-brand-surface rounded-card p-3 border border-brand-border">
              {SAFETY_NOTE[imageModality]}
            </p>
          )}

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

          {/* Modality-specific extras */}
          {(imageModality === "ct" || imageModality === "mri") && (
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs text-brand-muted">Contrast given?</span>
                <select
                  value={contrastUsed}
                  onChange={(e) => setContrastUsed(e.target.value as "" | "yes" | "no")}
                  className="mt-1 w-full h-10 rounded-btn border border-brand-border bg-white px-3 text-sm"
                >
                  <option value="">Unknown</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>
              {imageModality === "mri" && (
                <label className="block">
                  <span className="text-xs text-brand-muted">Sequences shown (optional)</span>
                  <input
                    type="text"
                    value={sequences}
                    onChange={(e) => setSequences(e.target.value.slice(0, 500))}
                    placeholder="T1, T2, FLAIR, DWI…"
                    className="mt-1 w-full h-10 rounded-btn border border-brand-border bg-white px-3 text-sm"
                  />
                </label>
              )}
            </div>
          )}
          {imageModality === "ultrasound" && (
            <label className="flex items-center gap-2 text-sm text-brand-dark">
              <input
                type="checkbox"
                checked={isPregnant}
                onChange={(e) => setIsPregnant(e.target.checked)}
              />
              Patient is pregnant
            </label>
          )}
          {imageModality === "echo" && (
            <label className="block">
              <span className="text-xs text-brand-muted">Echo type (optional)</span>
              <input
                type="text"
                value={echoType}
                onChange={(e) => setEchoType(e.target.value.slice(0, 200))}
                placeholder="TTE / TOE / stress echo"
                className="mt-1 w-full h-10 rounded-btn border border-brand-border bg-white px-3 text-sm"
              />
            </label>
          )}

          {isImageMode && (
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg"
                hidden
                onChange={(e) => handlePickImage(e.target.files?.[0] ?? null)}
              />
              {previewUrl ? (
                <div className="rounded-card border border-brand-border p-3 flex gap-4 items-start">
                  <img
                    src={previewUrl}
                    alt="Scan preview"
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
                      onClick={() => handlePickImage(null)}
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
                    Upload scan image
                  </div>
                  <div className="text-xs text-brand-muted">
                    JPG or PNG, up to {MAX_IMAGE_MB} MB
                  </div>
                </button>
              )}
            </div>
          )}

          {isTextMode && (
            <div className="space-y-3">
              <div>
                <input
                  ref={textFileRef}
                  type="file"
                  accept="application/pdf"
                  hidden
                  onChange={(e) => handlePickPdf(e.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  onClick={() => textFileRef.current?.click()}
                  className="inline-flex items-center gap-2 h-9 px-3 rounded-btn border border-brand-border bg-white text-sm hover:border-brand-teal/60"
                >
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  Upload PDF instead
                </button>
              </div>
              <label className="block">
                <span className="text-xs text-brand-muted">
                  Paste the scan report text
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
              leftIcon={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : !user ? <LogIn className="h-4 w-4" /> : undefined}
            >
              {loading ? "Analysing…" : !user ? "Sign in to interpret" : "Interpret scan"}
            </Button>
          </div>
        </section>
      )}
    </div>
    </>
  );
}
