import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Check, FileSearch, FlaskConical, Loader2, Sparkles } from "lucide-react";

const TIPS = [
  "Low MCV combined with low haemoglobin often points to iron-deficiency anaemia.",
  "TSH above 4.0 can indicate early hypothyroidism — worth discussing with your doctor.",
  "Vitamin D below 20 ng/mL is considered deficient by most clinical guidelines.",
];

const STEPS = [
  { Icon: FileSearch, label: "Extracting biomarkers from your report…" },
  { Icon: FlaskConical, label: "Analysing your values against reference ranges…" },
  { Icon: Sparkles, label: "Generating your personalised insights…" },
];

export function LoadingScreen() {
  const reduceMotion = useReducedMotion();
  const [activeStep, setActiveStep] = useState(0);
  const [tipIdx, setTipIdx] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setActiveStep(1), 2000);
    const t2 = setTimeout(() => setActiveStep(2), 4000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(
      () => setTipIdx((i) => (i + 1) % TIPS.length),
      3000,
    );
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      aria-live="polite"
      aria-busy="true"
      className="min-h-[70vh] flex flex-col items-center justify-center px-4"
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 28 28"
        aria-hidden="true"
        className="text-brand-teal"
      >
        <circle
          cx="14"
          cy="14"
          r="12"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M3 14 H9 L11 9 L14 19 L17 12 L19 14 H25"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>

      <ol className="mt-10 w-full max-w-md space-y-3">
        {STEPS.map((s, i) => {
          const state =
            i < activeStep ? "complete" : i === activeStep ? "active" : "pending";
          return (
            <li
              key={i}
              className="flex items-center gap-3 rounded-btn border border-brand-border bg-white p-3"
            >
              <s.Icon
                className={
                  state === "pending"
                    ? "h-4 w-4 text-brand-hint"
                    : "h-4 w-4 text-brand-teal"
                }
                aria-hidden="true"
              />
              <span
                className={
                  state === "pending"
                    ? "text-sm text-brand-hint flex-1"
                    : "text-sm text-brand-dark flex-1"
                }
              >
                {s.label}
              </span>
              <span aria-hidden="true">
                {state === "complete" && (
                  <Check className="h-4 w-4 text-brand-teal" />
                )}
                {state === "active" && (
                  <Loader2 className="h-4 w-4 text-brand-teal animate-spin" />
                )}
                {state === "pending" && (
                  <span className="block h-2 w-2 rounded-full bg-brand-hint" />
                )}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="mt-6 w-full max-w-md h-1 bg-brand-border rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-brand-teal"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{
            duration: reduceMotion ? 0 : 6,
            ease: "linear",
          }}
        />
      </div>

      <div className="mt-6 h-10 max-w-[420px] text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={tipIdx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.3 }}
            className="text-[13px] text-brand-muted"
          >
            Did you know? {TIPS[tipIdx]}
          </motion.p>
        </AnimatePresence>
      </div>
    </section>
  );
}

export default LoadingScreen;
