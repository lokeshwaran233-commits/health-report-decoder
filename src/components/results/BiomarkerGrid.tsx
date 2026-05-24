import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { SearchX } from "lucide-react";
import { BiomarkerCard } from "@/components/results/BiomarkerCard";
import type { Biomarker } from "@/types/report";

export interface BiomarkerGridProps {
  biomarkers: Biomarker[];
  category: string;
}

export function BiomarkerGrid({ biomarkers, category }: BiomarkerGridProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();

  const toggle = (id: string) =>
    setExpandedId((curr) => (curr === id ? null : id));

  if (biomarkers.length === 0) {
    return (
      <div className="rounded-card border border-brand-border bg-white p-10 text-center">
        <SearchX className="mx-auto h-6 w-6 text-brand-hint" aria-hidden="true" />
        <p className="mt-2 text-sm text-brand-muted">
          No {category === "all" ? "" : category + " "}tests found in this report.
        </p>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={category}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.18 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {biomarkers.map((b, i) => (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: reduceMotion ? 0 : 0.3,
              delay: reduceMotion ? 0 : i * 0.06,
            }}
          >
            <BiomarkerCard
              biomarker={b}
              expanded={expandedId === b.id}
              onToggleExpand={toggle}
            />
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}

export default BiomarkerGrid;
