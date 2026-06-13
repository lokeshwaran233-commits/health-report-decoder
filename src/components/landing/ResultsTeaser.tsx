import { BiomarkerCard } from "@/components/results/BiomarkerCard";
import type { Biomarker } from "@/types/report";

const TEASERS: Biomarker[] = [
  {
    id: "teaser-hdl",
    name: "HDL Cholesterol",
    value: 58,
    unit: "mg/dL",
    referenceRange: { low: 40, high: 60 },
    status: "normal",
    category: "lipid",
    plainEnglish: "Healthy range — your 'good' cholesterol looks great.",
    deepExplanation: "",
  },
  {
    id: "teaser-tsh",
    name: "TSH",
    value: 4.8,
    unit: "μIU/mL",
    referenceRange: { low: 0.4, high: 4.0 },
    status: "watch",
    category: "thyroid",
    plainEnglish: "Slightly above the upper limit — worth monitoring.",
    deepExplanation: "",
  },
  {
    id: "teaser-vitd",
    name: "Vitamin D",
    value: 14.2,
    unit: "ng/mL",
    referenceRange: { low: 30, high: 100 },
    status: "flagged",
    category: "vitamin",
    plainEnglish: "Significantly below normal — common and very treatable.",
    deepExplanation: "",
  },
];

export function ResultsTeaser() {
  return (
    <section
      aria-labelledby="teaser-heading"
      className="px-4 py-14 md:py-16"
    >
      <div
        className="mx-auto max-w-6xl rounded-2xl px-6 md:px-8 py-12 md:py-16"
        style={{ backgroundColor: "rgba(15,110,86,0.04)" }}
      >
        <h2
          id="teaser-heading"
          className="text-center text-xl md:text-2xl font-semibold tracking-tight text-brand-dark"
        >
          What you'll see in your results
        </h2>
        <p className="mt-2 text-center text-sm text-brand-muted">
          A preview of how every biomarker is broken down for you.
        </p>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {TEASERS.map((b) => (
            <div key={b.id} className="scale-[0.95] origin-top">
              <BiomarkerCard biomarker={b} isTeaser />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ResultsTeaser;
