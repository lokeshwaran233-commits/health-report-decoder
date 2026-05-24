import { motion, useReducedMotion } from "framer-motion";

export function HeroPreviewCard() {
  const reduce = useReducedMotion();
  return (
    <motion.div
      aria-hidden="true"
      initial={{ opacity: 0, y: 10 }}
      animate={
        reduce
          ? { opacity: 1, y: 0 }
          : { opacity: 1, y: [0, -8, 0, 8, 0] }
      }
      transition={
        reduce
          ? { duration: 0.3 }
          : { duration: 3, repeat: Infinity, ease: "easeInOut" }
      }
      className="w-full max-w-sm rounded-card bg-white border border-brand-border shadow-[0_10px_30px_rgba(15,110,86,0.12)] p-5 mx-auto"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] uppercase tracking-wide text-brand-muted">
          Blood
        </span>
        <span className="inline-flex items-center gap-1 rounded-pill bg-brand-coral-light text-brand-coral text-[11px] font-medium px-2 py-0.5">
          Flagged
        </span>
      </div>
      <h3 className="text-base font-semibold text-brand-dark">Haemoglobin</h3>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="text-[32px] font-bold leading-none text-brand-coral">
          10.8
        </span>
        <span className="text-sm text-brand-muted">g/dL</span>
      </div>
      <div className="mt-5 relative h-2 w-full rounded-full bg-[#E5E5E3]">
        <div
          className="absolute top-0 h-full rounded-full bg-[#1D9E75]/15"
          style={{ left: "40%", width: "40%" }}
        />
        <div
          className="absolute top-1/2 h-3 w-3 rounded-full bg-brand-coral"
          style={{ left: "18%", transform: "translate(-50%,-50%)" }}
        />
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-brand-muted">
        <span>6.0</span>
        <span className="text-brand-coral font-semibold">10.8</span>
        <span>24.0</span>
      </div>
      <p className="mt-4 text-sm text-brand-muted leading-relaxed">
        Slightly below normal — may indicate mild anaemia.
      </p>
    </motion.div>
  );
}

export default HeroPreviewCard;
