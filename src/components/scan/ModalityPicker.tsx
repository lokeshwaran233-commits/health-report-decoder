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
  enabled: boolean;
  note?: string;
}

const TILES: Tile[] = [
  { id: "report_text", label: "Scan report (text/PDF)", Icon: FileText, enabled: true },
  { id: "xray", label: "X-Ray (image)", Icon: ImageIcon, enabled: true },
  { id: "ct", label: "CT", Icon: ScanLine, enabled: false, note: "Coming soon" },
  { id: "mri", label: "MRI", Icon: Brain, enabled: false, note: "Coming soon" },
  { id: "ultrasound", label: "Ultrasound", Icon: Waves, enabled: false, note: "Coming soon" },
  { id: "echo", label: "Echo", Icon: HeartPulse, enabled: false, note: "Coming soon" },
  { id: "ecg", label: "ECG", Icon: Activity, enabled: false, note: "Coming soon" },
  { id: "eeg", label: "EEG", Icon: Zap, enabled: false, note: "Coming soon" },
  { id: "pet", label: "PET", Icon: CircleDot, enabled: false, note: "Coming soon" },
  { id: "mammogram", label: "Mammogram", Icon: ImageIcon, enabled: false, note: "Coming soon" },
  { id: "dexa", label: "DEXA", Icon: Bone, enabled: false, note: "Coming soon" },
  { id: "nuclear", label: "Nuclear", Icon: Radiation, enabled: false, note: "Coming soon" },
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
      {TILES.map(({ id, label, Icon, enabled, note }) => {
        const selected = value === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={!enabled}
            onClick={() => enabled && onChange(id)}
            title={!enabled ? note : undefined}
            className={cn(
              "relative flex flex-col items-center justify-center gap-2 rounded-card border p-4 text-sm transition-all min-h-[96px]",
              "focus:outline-none focus:ring-2 focus:ring-brand-teal/40",
              enabled
                ? selected
                  ? "border-brand-teal bg-brand-teal-light/50 text-brand-dark"
                  : "border-brand-border bg-white text-brand-dark hover:border-brand-teal/60"
                : "border-brand-border bg-brand-surface text-brand-hint cursor-not-allowed",
            )}
          >
            <Icon className="h-6 w-6" aria-hidden="true" />
            <span className="text-center leading-tight">{label}</span>
            {!enabled && (
              <span className="absolute top-1 right-1 text-[10px] uppercase tracking-wide text-brand-muted/70">
                Soon
              </span>
            )}
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
