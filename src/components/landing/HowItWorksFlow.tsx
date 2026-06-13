import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Cpu,
  Activity,
  Stethoscope,
  FileText,
  Scan as ScanIcon,
  Sparkles,
} from "lucide-react";

const STEPS = [
  { Icon: Upload, title: "Upload", desc: "PDF, photo, or paste text" },
  { Icon: Cpu, title: "AI decodes", desc: "Every biomarker extracted automatically" },
  { Icon: Activity, title: "Visual gauges", desc: "See exactly where each value stands" },
  { Icon: Stethoscope, title: "Doctor guide", desc: "Walk in with the right questions" },
];

interface Pillar {
  id: "lab" | "scan" | "zeno";
  Icon: typeof FileText;
  title: string;
  tagline: string;
  details: string;
  color: string;
  bg: string;
  ring: string;
}

const PILLARS: Pillar[] = [
  {
    id: "lab",
    Icon: FileText,
    title: "Lab Reports",
    tagline: "Decode blood work in seconds",
    details:
      "Upload any lab PDF, photo or pasted text. ReportRx extracts every biomarker, flags out-of-range values, and explains what each one actually means.",
    color: "text-brand-teal",
    bg: "bg-brand-teal-light",
    ring: "ring-brand-teal/40",
  },
  {
    id: "scan",
    Icon: ScanIcon,
    title: "Scan Decoder",
    tagline: "Understand imaging reports",
    details:
      "Drop in an X-ray, CT, MRI or ultrasound report and get a plain-English breakdown of findings — with a built-in safety check for critical results.",
    color: "text-brand-amber",
    bg: "bg-brand-amber-light",
    ring: "ring-brand-amber/40",
  },
  {
    id: "zeno",
    Icon: Sparkles,
    title: "Zeno AI",
    tagline: "The companion that connects it all",
    details:
      "Zeno reads both your lab work and your scans together — so when you ask 'what does this mean for me?', the answer reflects your full picture, not just one number.",
    color: "text-brand-coral",
    bg: "bg-brand-coral-light",
    ring: "ring-brand-coral/40",
  },
];

export function HowItWorksFlow() {
  const [active, setActive] = useState<Pillar["id"]>("zeno");
  const activePillar = PILLARS.find((p) => p.id === active)!;

  return (
    <section
      id="how-it-works"
      aria-labelledby="how-heading"
      className="px-4 py-14 md:py-20 bg-white border-y border-brand-border scroll-mt-20"
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

        {/* Linear 4-step flow */}
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

        {/* Mind-map: three pillars */}
        <div className="mt-16 md:mt-20">
          <div className="text-center mb-8">
            <h3 className="text-xl md:text-2xl font-semibold text-brand-dark">
              Three tools, one health picture
            </h3>
            <p className="mt-2 text-sm text-brand-muted max-w-lg mx-auto">
              Use Lab Reports and Scan Decoder on their own, or let Zeno bring them together.
            </p>
          </div>

          <div className="grid md:grid-cols-[1fr_auto_1fr] gap-6 md:gap-4 items-center">
            {/* Left: Lab */}
            <PillarCard
              pillar={PILLARS[0]}
              active={active === "lab"}
              onClick={() => setActive("lab")}
            />

            {/* Center: Zeno */}
            <div className="flex flex-col items-center">
              <ConnectorLines />
              <PillarCard
                pillar={PILLARS[2]}
                active={active === "zeno"}
                onClick={() => setActive("zeno")}
                center
              />
            </div>

            {/* Right: Scan */}
            <PillarCard
              pillar={PILLARS[1]}
              active={active === "scan"}
              onClick={() => setActive("scan")}
            />
          </div>

          {/* Active details */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activePillar.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className={`mt-8 mx-auto max-w-2xl rounded-card border bg-white p-5 text-center ring-1 ${activePillar.ring}`}
            >
              <div
                className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide ${activePillar.color}`}
              >
                <activePillar.Icon className="h-4 w-4" aria-hidden="true" />
                {activePillar.tagline}
              </div>
              <p className="mt-2 text-[15px] text-brand-dark leading-relaxed">
                {activePillar.details}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function PillarCard({
  pillar,
  active,
  onClick,
  center = false,
}: {
  pillar: Pillar;
  active: boolean;
  onClick: () => void;
  center?: boolean;
}) {
  const Icon = pillar.Icon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group w-full text-left rounded-card border bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-card ${
        active
          ? `border-transparent ring-2 ${pillar.ring} shadow-card`
          : "border-brand-border"
      } ${center ? "md:scale-105" : ""}`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`h-11 w-11 rounded-btn flex items-center justify-center ${pillar.bg}`}
        >
          <Icon className={`h-5 w-5 ${pillar.color}`} aria-hidden="true" />
        </span>
        <div>
          <h4 className="text-sm font-semibold text-brand-dark">{pillar.title}</h4>
          <p className="text-[12px] text-brand-muted">{pillar.tagline}</p>
        </div>
      </div>
    </button>
  );
}

function ConnectorLines() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 200 40"
      className="hidden md:block w-32 h-10 text-brand-hint mb-2"
    >
      <path
        d="M0 20 Q50 0 100 20 T200 20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        fill="none"
      />
    </svg>
  );
}

export default HowItWorksFlow;
