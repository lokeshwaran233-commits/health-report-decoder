import { Activity, Cpu, Stethoscope, Upload } from "lucide-react";

const STEPS = [
  { Icon: Upload, title: "Upload", desc: "PDF, photo, or paste text" },
  { Icon: Cpu, title: "AI decodes", desc: "Every biomarker extracted automatically" },
  { Icon: Activity, title: "Visual gauges", desc: "See exactly where each value stands" },
  { Icon: Stethoscope, title: "Doctor guide", desc: "Walk in with the right questions" },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-heading"
      className="px-4 py-14 md:py-20 bg-white border-y border-brand-border"
    >
      <div className="mx-auto max-w-6xl">
        <h2
          id="how-heading"
          className="text-center text-2xl md:text-3xl font-semibold tracking-tight text-brand-dark"
        >
          How it works
        </h2>
        <p className="mt-2 text-center text-sm text-brand-muted">
          Four simple steps from upload to clarity.
        </p>

        <ol className="mt-10 grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {STEPS.map((s, i) => (
            <li
              key={s.title}
              className="relative rounded-card border border-brand-border bg-brand-surface/40 p-5"
            >
              <span className="absolute top-3 right-3 inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-pill bg-brand-teal text-white text-[10px] font-semibold">
                {i + 1}
              </span>
              <div className="h-10 w-10 rounded-btn bg-brand-teal-light flex items-center justify-center">
                <s.Icon className="h-5 w-5 text-brand-teal" aria-hidden="true" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-brand-dark">
                {s.title}
              </h3>
              <p className="mt-1 text-[13px] text-brand-muted">{s.desc}</p>
              {i < STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className="hidden md:block absolute top-1/2 -right-3 w-6 border-t border-dashed border-brand-hint"
                />
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export default HowItWorks;
