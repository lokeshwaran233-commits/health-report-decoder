import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Shield, CheckSquare, Square, AlertTriangle, ExternalLink } from "lucide-react";

const CONSENT_KEY = "reportrx_scan_consent_v1";

const CONSENT_ITEMS = [
  { id: "data", text: "I understand my uploaded reports will be processed by AI and stored securely on ReportRx." },
  { id: "medical", text: "I acknowledge ReportRx is not a substitute for professional medical advice or treatment." },
  { id: "accuracy", text: "I understand AI analysis may not always be accurate; I should consult a qualified doctor." },
  { id: "terms", text: "I agree to the Privacy & Terms." },
  { id: "age", text: "I am 18 or older, or have parental/guardian consent." },
];

interface ConsentModalProps {
  onAccept: () => void;
  onDecline: () => void;
}

export function ConsentModal({ onAccept, onDecline }: ConsentModalProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const allChecked = checked.size === CONSENT_ITEMS.length;

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const accept = () => {
    if (!allChecked) return;
    try {
      sessionStorage.setItem(CONSENT_KEY, "accepted");
    } catch {
      /* ignore */
    }
    onAccept();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-brand-card border border-brand-border rounded-card shadow-card overflow-hidden">
        <div className="p-6 border-b border-brand-border">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-card bg-brand-teal-light text-brand-teal">
              <Shield className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-brand-dark">Before you upload</h2>
              <p className="text-xs text-brand-muted mt-0.5">Please review and agree to continue.</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-3 max-h-[50vh] overflow-y-auto">
          {CONSENT_ITEMS.map((item) => {
            const on = checked.has(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggle(item.id)}
                className="w-full flex items-start gap-3 text-left rounded-card border border-brand-border hover:border-brand-teal hover:bg-brand-teal-light/30 p-3 transition-colors"
              >
                {on ? (
                  <CheckSquare className="h-4 w-4 mt-0.5 text-brand-teal flex-shrink-0" />
                ) : (
                  <Square className="h-4 w-4 mt-0.5 text-brand-hint flex-shrink-0" />
                )}
                <span className="text-xs text-brand-dark leading-relaxed">{item.text}</span>
              </button>
            );
          })}

          <Link
            to="/privacy"
            className="inline-flex items-center gap-1 text-xs text-brand-teal hover:underline mt-2"
          >
            Read full Privacy & Terms
            <ExternalLink className="h-3 w-3" />
          </Link>

          <div className="flex items-start gap-2 rounded-card bg-brand-amber-light p-3 mt-3">
            <AlertTriangle className="h-4 w-4 text-brand-amber flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-brand-dark/85 leading-relaxed">
              In a medical emergency, contact local emergency services immediately. ReportRx is not for urgent care.
            </p>
          </div>
        </div>

        <div className="p-6 pt-4 border-t border-brand-border flex gap-2">
          <button
            type="button"
            onClick={onDecline}
            className="flex-1 rounded-btn border border-brand-border bg-white text-sm font-medium text-brand-dark px-4 py-2.5 hover:bg-brand-surface transition-colors"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={accept}
            disabled={!allChecked}
            className="flex-1 rounded-btn bg-brand-teal text-white text-sm font-medium px-4 py-2.5 hover:bg-brand-teal-mid transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            I agree
          </button>
        </div>
      </div>
    </div>
  );
}

export function hasScanConsent(): boolean {
  try {
    return sessionStorage.getItem(CONSENT_KEY) === "accepted";
  } catch {
    return false;
  }
}
