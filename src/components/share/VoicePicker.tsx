import { Check, Globe, Mic } from "lucide-react";
import { LANG_LABELS, SUPPORTED_LANGS, type SupportedLang } from "@/i18n/config";

export type VoiceStyle = "warm" | "clinical" | "energetic";

interface VoicePickerProps {
  language: SupportedLang;
  onLanguageChange: (lang: SupportedLang) => void;
  voiceStyle?: VoiceStyle;
  onVoiceStyleChange?: (v: VoiceStyle) => void;
  showStyle?: boolean;
  className?: string;
}

const STYLES: Array<{ value: VoiceStyle; label: string; hint: string }> = [
  { value: "warm", label: "Warm", hint: "Friendly, reassuring" },
  { value: "clinical", label: "Clinical", hint: "Precise, neutral" },
  { value: "energetic", label: "Energetic", hint: "Upbeat, clear" },
];

/**
 * Inline language + voice-style picker used by share/audio surfaces.
 * Keeps language explicit on the surface where audio is generated so the
 * recipient always hears the chosen language (not whatever cached value
 * a previous render left in localStorage).
 */
export function VoicePicker({
  language,
  onLanguageChange,
  voiceStyle = "warm",
  onVoiceStyleChange,
  showStyle = true,
  className,
}: VoicePickerProps) {
  return (
    <div className={`space-y-3 ${className ?? ""}`}>
      <div>
        <label className="flex items-center gap-1.5 text-xs font-medium text-brand-muted mb-1.5">
          <Globe className="h-3.5 w-3.5" aria-hidden="true" />
          Language
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {SUPPORTED_LANGS.map((code) => {
            const meta = LANG_LABELS[code as SupportedLang];
            const active = code === language;
            return (
              <button
                key={code}
                type="button"
                onClick={() => onLanguageChange(code as SupportedLang)}
                className={`inline-flex items-center justify-between gap-2 px-3 h-9 rounded-btn text-sm border transition-colors ${
                  active
                    ? "border-brand-teal bg-brand-teal-light text-brand-teal font-medium"
                    : "border-brand-border bg-brand-card text-brand-dark hover:bg-brand-surface"
                }`}
              >
                <span className="inline-flex items-center gap-1.5 truncate">
                  <span aria-hidden="true">{meta.flag}</span>
                  <span className="truncate">{meta.name}</span>
                </span>
                {active && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </div>

      {showStyle && onVoiceStyleChange && (
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-brand-muted mb-1.5">
            <Mic className="h-3.5 w-3.5" aria-hidden="true" />
            Voice style
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {STYLES.map((s) => {
              const active = s.value === voiceStyle;
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => onVoiceStyleChange(s.value)}
                  title={s.hint}
                  className={`px-2 h-9 rounded-btn text-xs border transition-colors ${
                    active
                      ? "border-brand-teal bg-brand-teal-light text-brand-teal font-medium"
                      : "border-brand-border bg-brand-card text-brand-dark hover:bg-brand-surface"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default VoicePicker;
