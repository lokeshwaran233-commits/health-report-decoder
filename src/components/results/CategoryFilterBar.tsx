import { cn } from "@/lib/utils";
import type { BiomarkerCategory } from "@/types/report";
import type { CategoryFilter } from "@/hooks/useReportAnalysis";

const ORDER: BiomarkerCategory[] = [
  "blood",
  "liver",
  "kidney",
  "thyroid",
  "metabolic",
  "vitamin",
  "other",
];

const LABEL: Record<BiomarkerCategory | "all", string> = {
  all: "All",
  blood: "Blood",
  liver: "Liver",
  kidney: "Kidney",
  thyroid: "Thyroid",
  metabolic: "Metabolic",
  vitamin: "Vitamin",
  other: "Other",
};

export interface CategoryFilterBarProps {
  active: CategoryFilter;
  onChange: (cat: CategoryFilter) => void;
  available: Set<BiomarkerCategory>;
}

export function CategoryFilterBar({
  active,
  onChange,
  available,
}: CategoryFilterBarProps) {
  const categories: CategoryFilter[] = [
    "all",
    ...ORDER.filter((c) => available.has(c)),
  ];

  return (
    <nav
      aria-label="Filter biomarkers by category"
      className="flex gap-2 overflow-x-auto pb-1"
      style={{ scrollbarWidth: "none" }}
    >
      {categories.map((c) => {
        const isActive = active === c;
        return (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className={cn(
              "shrink-0 rounded-pill px-4 py-1.5 text-[13px] font-medium transition-colors border",
              isActive
                ? "bg-brand-teal text-white border-brand-teal"
                : "bg-white text-brand-muted border-brand-border hover:border-brand-teal hover:text-brand-teal",
            )}
            aria-pressed={isActive}
          >
            {LABEL[c]}
          </button>
        );
      })}
    </nav>
  );
}

export default CategoryFilterBar;
