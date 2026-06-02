const FORBIDDEN_PATTERNS: Array<{ re: RegExp; replace: string }> = [
  // Specific drug dosages
  {
    re: /\b\d+\s?(mg|mcg|µg|g|ml|iu)\b/gi,
    replace: "[a specific dose — please ask your doctor]",
  },
  // Diagnosis verbs
  {
    re: /\byou (definitely )?have\b/gi,
    replace: "your results suggest possible signs of",
  },
  {
    re: /\bI diagnose\b/gi,
    replace: "this may suggest",
  },
  // Prescription verbs
  {
    re: /\b(prescribe|take|start taking)\s+\w+/gi,
    replace: "discuss medication options with your doctor",
  },
];

export function guardHallucinations(text: string): string {
  let out = text;
  for (const { re, replace } of FORBIDDEN_PATTERNS) {
    out = out.replace(re, replace);
  }
  return out;
}
