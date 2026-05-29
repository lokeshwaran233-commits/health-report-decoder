import { cn } from "@/lib/utils";
import {
  Activity,
  Bone,
  Brain,
  CircleDot,
  FileText,
  HeartPulse,
  Image as ImageIcon,
  Radiation,
  ScanLine,
  Stethoscope,
  Waves,
  Zap,
} from "lucide-react";
import type { ScanModality } from "@/types/scan";

interface Tile {
  id: ScanModality;
  label: string;
  Icon: typeof Brain;
}

const TILES: Tile[] = [
  { id: "report_text", label: "Scan report (text/PDF)", Icon: FileText },
  { id: "xray", label: "X-Ray", Icon: ImageIcon },
  { id: "ct", label: "CT", Icon: ScanLine },
  { id: "mri", label: "MRI", Icon: Brain },
  { id: "ultrasound", label: "Ultrasound", Icon: Waves },
  { id: "echo", label: "Echo", Icon: HeartPulse },
  { id: "ecg", label: "ECG", Icon: Activity },
  { id: "eeg", label: "EEG", Icon: Zap },
  { id: "pet", label: "PET", Icon: CircleDot },
  { id: "mammogram", label: "Mammogram", Icon: ImageIcon },
  { id: "dexa", label: "DEXA", Icon: Bone },
  { id: "nuclear", label: "Nuclear", Icon: Radiation },
];

export function ModalityPicker({
  value,
  onChange,
}: {
  value: ScanModality | null;
  onChange: (m: ScanModality) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Choose scan type"
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
    >
      {TILES.map(({ id, label, Icon }) => {
        const selected = value === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(id)}
            className={cn(
              "relative flex flex-col items-center justify-center gap-2 rounded-card border p-4 text-sm transition-all min-h-[96px]",
              "focus:outline-none focus:ring-2 focus:ring-brand-teal/40",
              selected
                ? "border-brand-teal bg-brand-teal-light/50 text-brand-dark"
                : "border-brand-border bg-white text-brand-dark hover:border-brand-teal/60",
            )}
          >
            <Icon className="h-6 w-6" aria-hidden="true" />
            <span className="text-center leading-tight">{label}</span>
            {selected && (
              <Stethoscope
                className="absolute top-2 left-2 h-3.5 w-3.5 text-brand-teal"
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
