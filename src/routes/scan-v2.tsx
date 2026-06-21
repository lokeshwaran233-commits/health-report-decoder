import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { analyzeScanSafe } from "@/lib/imagingSafety/imagingSafety.functions";
import { SafetyReportView } from "@/components/imagingSafety/SafetyReportView";
import type { FinalSafetyReport, SafetyModality } from "@/lib/imagingSafety/types";
import type { BodyRegion } from "@/types/scan";

export const Route = createFileRoute("/scan-v2")({
  head: () => ({
    meta: [
      { title: "Scan Decoder v2 — Safety Pipeline" },
      { name: "robots", content: "noindex, nofollow" },
      {
        name: "description",
        content:
          "Internal: Imaging Safety Pipeline test harness.",
      },
    ],
  }),
  component: ScanV2Page,
});

const MODALITIES: Array<{ id: SafetyModality; label: string }> = [
  { id: "xray", label: "X-Ray" },
  { id: "ct", label: "CT" },
  { id: "mri", label: "MRI" },
  { id: "ultrasound", label: "Ultrasound" },
  { id: "echo", label: "Echo" },
  { id: "ecg", label: "ECG" },
  { id: "eeg", label: "EEG" },
  { id: "pet", label: "PET" },
  { id: "mammogram", label: "Mammogram" },
  { id: "dexa", label: "DEXA" },
  { id: "angiography", label: "Angiography" },
  { id: "nuclear", label: "Nuclear" },
];
const REGIONS: BodyRegion[] = [
  "head_brain",
  "spine",
  "chest_lungs",
  "heart_cardiac",
  "abdomen",
  "pelvis",
  "musculoskeletal",
  "breast",
  "vascular",
  "neck_thyroid",
  "orbit_eye",
  "obstetric",
  "whole_body",
  "unknown",
];

function fileToBase64(file: File): Promise<{ base64: string; mime: string }> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => {
      const result = r.result as string;
      const comma = result.indexOf(",");
      res({ base64: result.slice(comma + 1), mime: file.type });
    };
    r.onerror = () => rej(r.error);
    r.readAsDataURL(file);
  });
}

function ScanV2Page() {
  const analyze = useServerFn(analyzeScanSafe);
  const [modality, setModality] = useState<SafetyModality>("ct");
  const [region, setRegion] = useState<BodyRegion>("head_brain");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<FinalSafetyReport | null>(null);

  const onRun = async () => {
    setError(null);
    setReport(null);
    setLoading(true);
    try {
      let imageBase64: string | undefined;
      let mimeType: string | undefined;
      if (file) {
        const { base64, mime } = await fileToBase64(file);
        imageBase64 = base64;
        mimeType = mime;
      }
      const result = await analyze({
        data: { modality, bodyRegion: region, imageBase64, mimeType },
      });
      setReport(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-brand-surface dark:bg-[#080C14] py-10">
      <div className="max-w-3xl mx-auto px-4">
        <h1
          className="text-3xl font-medium text-brand-dark dark:text-white"
          style={{ fontFamily: "Fraunces, Georgia, serif" }}
        >
          Scan Decoder v2 — Safety Pipeline
        </h1>
        <p className="text-sm text-brand-muted dark:text-white/55 mt-2 mb-6">
          Every interpretation passes through a 12-phase guardrail: input check,
          quality, anatomy, evidence, critic, safety rules, and human-review
          decision. The system will defer rather than guess.
        </p>

        <div className="rounded-card border border-brand-border dark:border-white/10 bg-brand-card dark:bg-white/5 p-4 mb-6">
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="block text-xs text-brand-muted mb-1">Modality</span>
              <select
                value={modality}
                onChange={(e) => setModality(e.target.value as SafetyModality)}
                className="w-full h-10 rounded-btn border border-brand-border bg-white dark:bg-white/5 px-2"
              >
                {MODALITIES.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="block text-xs text-brand-muted mb-1">Body region</span>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value as BodyRegion)}
                className="w-full h-10 rounded-btn border border-brand-border bg-white dark:bg-white/5 px-2"
              >
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block mt-3 text-sm">
            <span className="block text-xs text-brand-muted mb-1">Image (JPG/PNG, optional)</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
          </label>
          <button
            type="button"
            onClick={onRun}
            disabled={loading}
            className="mt-4 inline-flex items-center justify-center h-10 px-4 rounded-pill bg-brand-teal text-white text-sm font-semibold hover:bg-brand-teal-mid transition-colors disabled:opacity-50"
          >
            {loading ? "Running pipeline…" : "Run safety pipeline"}
          </button>
          {error && (
            <p className="text-sm text-brand-coral mt-3" role="alert">
              {error}
            </p>
          )}
        </div>

        {report && <SafetyReportView report={report} />}
      </div>
    </div>
  );
}
