import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Upload,
  FileText,
  Activity,
  Shield,
  Sparkles,
  Share2,
  Check,
  ArrowRight,
  ArrowLeft,
  FlaskConical,
  ScanLine,
} from "lucide-react";

export const Route = createFileRoute("/tutorial")({
  head: () => ({
    meta: [
      { title: "How ReportRx Works — Interactive Tutorial" },
      {
        name: "description",
        content:
          "See exactly how ReportRx decodes a lab report or scan — step by step, with a real sample, narrated by Zeno.",
      },
      { property: "og:title", content: "How ReportRx Works — Interactive Tutorial" },
      {
        property: "og:description",
        content:
          "Watch a sample report go from upload to plain-English summary, with every safety layer shown.",
      },
    ],
  }),
  component: TutorialPage,
});

type Modality = "lab" | "scan";

interface Step {
  id: string;
  title: string;
  subtitle: string;
  icon: typeof Upload;
  body: (modality: Modality) => React.ReactNode;
}

const STEPS: Step[] = [
  {
    id: "upload",
    title: "1. Upload",
    subtitle: "Drag-and-drop your PDF, image, or scan",
    icon: Upload,
    body: (m) => (
      <div className="space-y-4">
        <div className="rounded-card border-2 border-dashed border-brand-teal/40 bg-brand-teal-light/30 p-8 text-center">
          <Upload className="mx-auto h-10 w-10 text-brand-teal" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-brand-dark">
            {m === "lab" ? "sample-cbc-report.pdf" : "chest-xray-jan2026.jpg"}
          </p>
          <p className="text-xs text-brand-muted">Uploaded securely</p>
        </div>
        <p className="text-sm text-brand-muted">
          Your file is encrypted in transit and never shared with third parties.
          Raw biomarker values stay on your account only.
        </p>
      </div>
    ),
  },
  {
    id: "ocr",
    title: "2. Extract & Parse",
    subtitle: "OCR pulls out structured values",
    icon: FileText,
    body: (m) =>
      m === "lab" ? (
        <div className="space-y-2">
          {[
            { name: "Hemoglobin", value: "11.2 g/dL", ref: "13.0 – 17.0" },
            { name: "WBC Count", value: "9,400 /μL", ref: "4,000 – 11,000" },
            { name: "Platelets", value: "1.6 lakh /μL", ref: "1.5 – 4.5 lakh" },
            { name: "Vitamin D", value: "18 ng/mL", ref: "30 – 100" },
          ].map((row, i) => (
            <div
              key={row.name}
              className="grid grid-cols-3 gap-3 rounded-btn border border-brand-border bg-brand-card px-3 py-2 text-sm"
              style={{ animation: `fadeUp 0.4s ease-out ${i * 0.1}s both` }}
            >
              <span className="text-brand-dark font-medium truncate">{row.name}</span>
              <span className="text-brand-dark">{row.value}</span>
              <span className="text-xs text-brand-muted text-right">{row.ref}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-card border border-brand-border bg-brand-card p-4 space-y-2 text-sm">
          <p className="font-medium text-brand-dark">Image regions detected</p>
          <ul className="space-y-1 text-brand-muted">
            <li>• Cardiac silhouette — normal contour</li>
            <li>• Lung fields — bilateral, no consolidation</li>
            <li>• Costophrenic angles — sharp</li>
            <li>• Hilar regions — within normal limits</li>
          </ul>
        </div>
      ),
  },
  {
    id: "analyze",
    title: "3. Core Engine",
    subtitle: "Each value is tagged and explained",
    icon: Activity,
    body: (m) =>
      m === "lab" ? (
        <div className="space-y-2">
          {[
            { name: "Hemoglobin", status: "flagged", note: "Below range — mild anemia" },
            { name: "Vitamin D", status: "flagged", note: "Significant deficiency" },
            { name: "Platelets", status: "watch", note: "On the lower end of normal" },
            { name: "WBC Count", status: "normal", note: "Within healthy range" },
          ].map((r) => (
            <div
              key={r.name}
              className="flex items-center justify-between gap-3 rounded-btn border border-brand-border bg-brand-card px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-brand-dark truncate">{r.name}</p>
                <p className="text-xs text-brand-muted truncate">{r.note}</p>
              </div>
              <span
                className={`shrink-0 inline-flex items-center px-2 h-6 rounded-pill text-[11px] font-semibold ${
                  r.status === "flagged"
                    ? "bg-brand-coral-light text-brand-coral"
                    : r.status === "watch"
                      ? "bg-brand-amber-light text-brand-amber"
                      : "bg-brand-teal-light text-brand-teal"
                }`}
              >
                {r.status}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2 text-sm">
          <div className="rounded-btn border border-brand-border bg-brand-card p-3">
            <p className="font-medium text-brand-dark">No acute abnormality detected</p>
            <p className="text-xs text-brand-muted mt-1">
              Heart size, lung markings, and bones appear within normal limits.
            </p>
          </div>
          <div className="rounded-btn border border-brand-amber/40 bg-brand-amber-light/40 p-3">
            <p className="text-xs text-brand-dark">
              <strong>Caveat:</strong> AI imaging review is a triage aid, not a
              diagnosis. A radiologist's reading is the source of truth.
            </p>
          </div>
        </div>
      ),
  },
  {
    id: "ultraguard",
    title: "4. UltraGuard Safety",
    subtitle: "9 layers verify every claim before you see it",
    icon: Shield,
    body: () => (
      <div className="grid grid-cols-1 gap-1.5">
        {[
          "Token constraints — no hallucinated units",
          "Closed-book prompting — no outside facts",
          "Multi-agent validator — second LLM cross-check",
          "Structured output enforcer — schema-bound",
          "Evidence link validator — every claim cited",
          "Syndrome cluster guard — no fabricated patterns",
          "Contradiction detector — internal consistency",
          "Confidence propagator — uncertainty surfaced",
          "Audit log — every verdict recorded",
        ].map((line, i) => (
          <div
            key={line}
            className="flex items-center gap-2 rounded-btn bg-brand-teal-light/40 border border-brand-teal/20 px-2.5 py-1.5"
            style={{ animation: `fadeUp 0.3s ease-out ${i * 0.06}s both` }}
          >
            <Check className="h-3.5 w-3.5 text-brand-teal shrink-0" aria-hidden="true" />
            <span className="text-xs text-brand-dark">{line}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "zeno",
    title: "5. Zeno Orchestrates",
    subtitle: "Your AI assistant writes the plain-English summary",
    icon: Sparkles,
    body: (m) => (
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-brand-teal to-brand-teal-mid" />
          <div className="min-w-0 rounded-card bg-brand-card border border-brand-border p-3 text-sm text-brand-dark">
            {m === "lab" ? (
              <>
                Hi! I went through your CBC. Two things stand out: your{" "}
                <strong>hemoglobin is a bit low</strong> and your{" "}
                <strong>vitamin D is well below normal</strong>. Together, this often
                explains tiredness. Most other values look fine.
              </>
            ) : (
              <>
                Your chest X-ray looks clear overall — no signs of fluid, masses, or
                heart enlargement. I'd still want a radiologist to confirm, but
                there's nothing that needs urgent attention.
              </>
            )}
          </div>
        </div>
        <div className="rounded-card border border-brand-border bg-brand-surface p-3">
          <p className="text-xs font-semibold text-brand-muted uppercase tracking-wide">
            Questions for your doctor
          </p>
          <ul className="mt-1.5 text-sm text-brand-dark space-y-1">
            {(m === "lab"
              ? [
                  "Should I start vitamin D supplementation?",
                  "Do I need iron studies to investigate the low hemoglobin?",
                  "When should we recheck these values?",
                ]
              : [
                  "Should I get a follow-up imaging in 6 months?",
                  "Are there findings the AI might have missed?",
                ]
            ).map((q) => (
              <li key={q} className="flex gap-2">
                <span className="text-brand-teal">→</span>
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: "share",
    title: "6. Share Safely",
    subtitle: "QR codes, audio, WhatsApp — all expire in 1 hour",
    icon: Share2,
    body: () => (
      <div className="space-y-3">
        <div className="rounded-card border border-brand-border bg-brand-card p-4 text-center">
          <div className="mx-auto h-32 w-32 rounded-md bg-[repeating-conic-gradient(#0f6e56_0deg_10deg,#fff_10deg_20deg)] opacity-90" />
          <p className="mt-3 text-xs text-brand-muted">
            Recipient scans this QR with their phone camera
          </p>
        </div>
        <ul className="text-sm text-brand-dark space-y-1.5">
          <li className="flex gap-2">
            <Check className="h-4 w-4 text-brand-teal shrink-0 mt-0.5" />
            Only the summary is shared — never raw biomarker values
          </li>
          <li className="flex gap-2">
            <Check className="h-4 w-4 text-brand-teal shrink-0 mt-0.5" />
            Link auto-expires after 60 minutes
          </li>
          <li className="flex gap-2">
            <Check className="h-4 w-4 text-brand-teal shrink-0 mt-0.5" />
            Audio version available in English, Hindi, Tamil, Telugu
          </li>
        </ul>
      </div>
    ),
  },
];

function TutorialPage() {
  const [modality, setModality] = useState<Modality>("lab");
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
      <header className="text-center mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-teal">
          Interactive Tutorial
        </p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-brand-dark">
          See how ReportRx works
        </h1>
        <p className="mt-3 text-base text-brand-muted max-w-xl mx-auto">
          A 60-second walkthrough using a real sample. Zero risk — no signup needed.
        </p>
      </header>

      {/* Modality toggle */}
      <div className="mx-auto inline-flex p-1 rounded-pill bg-brand-surface border border-brand-border w-full sm:w-auto justify-center mb-6">
        <button
          type="button"
          onClick={() => setModality("lab")}
          className={`inline-flex items-center gap-1.5 px-4 h-9 rounded-pill text-sm font-medium transition-colors ${
            modality === "lab"
              ? "bg-brand-card text-brand-dark shadow-card"
              : "text-brand-muted"
          }`}
        >
          <FlaskConical className="h-4 w-4" aria-hidden="true" />
          Lab report demo
        </button>
        <button
          type="button"
          onClick={() => setModality("scan")}
          className={`inline-flex items-center gap-1.5 px-4 h-9 rounded-pill text-sm font-medium transition-colors ${
            modality === "scan"
              ? "bg-brand-card text-brand-dark shadow-card"
              : "text-brand-muted"
          }`}
        >
          <ScanLine className="h-4 w-4" aria-hidden="true" />
          Imaging scan demo
        </button>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-1 mb-6" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={STEPS.length}>
        {STEPS.map((s, i) => (
          <div
            key={s.id}
            className={`h-1.5 flex-1 rounded-pill transition-colors ${
              i <= step ? "bg-brand-teal" : "bg-brand-border"
            }`}
          />
        ))}
      </div>

      {/* Stage */}
      <div className="rounded-card border border-brand-border bg-brand-card p-5 sm:p-8 shadow-card">
        <div className="flex items-start gap-3 mb-5">
          <div className="h-10 w-10 shrink-0 grid place-items-center rounded-xl bg-brand-teal-light text-brand-teal">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-brand-dark">{current.title}</h2>
            <p className="text-sm text-brand-muted">{current.subtitle}</p>
          </div>
        </div>

        <div key={`${current.id}-${modality}`} className="animate-fadeUp">
          {current.body(modality)}
        </div>
      </div>

      {/* Controls */}
      <div className="mt-6 grid grid-cols-[auto_1fr_auto] items-center gap-3">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="inline-flex items-center gap-1.5 h-11 px-4 rounded-btn border border-brand-border text-sm font-medium text-brand-dark hover:bg-brand-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </button>
        <p className="text-xs text-center text-brand-muted">
          Step {step + 1} of {STEPS.length}
        </p>
        {isLast ? (
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 h-11 px-5 rounded-btn bg-brand-teal text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Try it yourself
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            className="inline-flex items-center gap-1.5 h-11 px-5 rounded-btn bg-brand-teal text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Next
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-brand-muted">
        This walkthrough uses synthetic sample data. Your real reports stay
        private to your account.
      </p>
    </div>
  );
}
