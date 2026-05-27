import { useEffect, useRef, useState } from "react";
import { Globe, Check } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { LANG_LABELS, SUPPORTED_LANGS, type SupportedLang } from "@/i18n/config";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className={`relative ${className ?? ""}`} ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Change language"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-pill border border-brand-border bg-white text-sm text-brand-dark hover:bg-brand-surface transition-colors"
      >
        <Globe className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{lang.toUpperCase()}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-card bg-white border border-brand-border shadow-lg py-1 z-50">
          {SUPPORTED_LANGS.map((code) => {
            const meta = LANG_LABELS[code as SupportedLang];
            const active = code === lang;
            return (
              <button
                key={code}
                type="button"
                onClick={() => {
                  void setLang(code as SupportedLang);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm inline-flex items-center justify-between hover:bg-brand-surface ${
                  active ? "text-brand-dark font-medium" : "text-brand-dark"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <span aria-hidden="true">{meta.flag}</span>
                  <span>{meta.name}</span>
                </span>
                {active && (
                  <Check className="h-3.5 w-3.5 text-brand-teal" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default LanguageSwitcher;
