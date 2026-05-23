import { useState } from "react";
import { Button } from "@/components/ui/Button";

const MAX_CHARS = 5000;
const MIN_CHARS = 50;

export interface PasteInputProps {
  onAnalyze: (text: string) => void;
}

export function PasteInput({ onAnalyze }: PasteInputProps) {
  const [text, setText] = useState("");

  const trimmedLen = text.trim().length;
  const canAnalyze = trimmedLen >= MIN_CHARS;

  return (
    <div className="flex flex-col gap-3">
      <label htmlFor="paste-report" className="sr-only">
        Paste your lab report text
      </label>
      <textarea
        id="paste-report"
        rows={12}
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
        placeholder="Paste your lab report text here... (e.g. Haemoglobin: 10.8 g/dL, Ref: 12.0-16.0)"
        className="w-full resize-y rounded-btn border border-brand-border bg-white p-3 text-sm font-mono text-brand-dark placeholder:text-brand-hint focus:border-brand-teal focus:outline-none"
      />
      <div className="flex items-center justify-between text-xs text-brand-muted">
        <span>
          {trimmedLen < MIN_CHARS && trimmedLen > 0
            ? `At least ${MIN_CHARS} characters needed`
            : "\u00A0"}
        </span>
        <span aria-live="polite">
          {text.length} / {MAX_CHARS} characters
        </span>
      </div>
      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
        {text.length > 0 && (
          <Button variant="ghost" size="md" onClick={() => setText("")}>
            Clear
          </Button>
        )}
        <Button
          variant="primary"
          size="md"
          disabled={!canAnalyze}
          onClick={() => onAnalyze(text)}
        >
          Analyze pasted text
        </Button>
      </div>
    </div>
  );
}
