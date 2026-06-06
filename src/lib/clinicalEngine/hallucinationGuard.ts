const FORBIDDEN_PATTERNS: Array<{
  pattern: RegExp;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  replacement?: string;
}> = [
  {
    pattern:
      /you have\s+[a-z\s]+(?:anemia|diabetes|disorder|disease|syndrome|condition|infection)/gi,
    severity: "CRITICAL",
  },
  {
    pattern:
      /(?:confirmed|definitive|certain)\s+(?:diagnosis|finding|result)/gi,
    severity: "CRITICAL",
  },
  { pattern: /diagnosed with/gi, severity: "CRITICAL" },
  {
    pattern:
      /\b(?:you|patient)\s+(?:has|have|suffers?\s+from|shows?\s+signs of)\s+\w+\s+(?:anemia|diabetes|cancer|leukemia|disorder)/gi,
    severity: "CRITICAL",
  },
  {
    pattern:
      /this (?:confirms|indicates|proves|shows) (?:that )?(?:you have|the presence of|diagnosis of)/gi,
    severity: "CRITICAL",
  },
  {
    pattern: /\bthis is\s+(?:definitely|certainly|clearly)\b/gi,
    severity: "HIGH",
    replacement: "this may be",
  },
  {
    pattern: /\bthe results? (?:clearly|definitively|conclusively) show/gi,
    severity: "HIGH",
    replacement: "the results may suggest",
  },
  { pattern: /\bno doubt\b/gi, severity: "HIGH", replacement: "it appears" },
  {
    pattern: /\bwithout question\b/gi,
    severity: "HIGH",
    replacement: "the evidence suggests",
  },
  {
    pattern:
      /(?:take|start|begin|prescribe|use|try)\s+(?:iron|ferrous|vitamin|supplement|medication|drug|tablet|capsule)\s+(?:supplement|tablet|capsule|syrup)?/gi,
    severity: "CRITICAL",
  },
  {
    pattern:
      /\b(?:metformin|aspirin|paracetamol|ibuprofen|lisinopril|atorvastatin)\b/gi,
    severity: "CRITICAL",
  },
  {
    pattern:
      /this (?:will|may)\s+(?:lead to|cause|result in)\s+(?:serious|severe|fatal|dangerous)/gi,
    severity: "HIGH",
  },
];

export interface GuardResult {
  passed: boolean;
  violations: Array<{ text: string; severity: string; position: number }>;
  sanitizedText: string;
  hadCriticalViolations: boolean;
}

const CRITICAL_FALLBACK = `Based on the values provided, some findings require your doctor's attention. The automated analysis identified patterns in your results, but these observations are not a diagnosis and require clinical evaluation to interpret properly. Please review these results with your healthcare provider.`;

export function runHallucinationGuard(llmOutput: string): GuardResult {
  const violations: GuardResult["violations"] = [];
  let sanitized = llmOutput;
  let hadCritical = false;

  for (const { pattern, severity, replacement } of FORBIDDEN_PATTERNS) {
    const matches = [...sanitized.matchAll(pattern)];
    for (const match of matches) {
      violations.push({
        text: match[0],
        severity,
        position: match.index ?? 0,
      });
      if (severity === "CRITICAL") hadCritical = true;
      if (replacement) sanitized = sanitized.replace(match[0], replacement);
    }
  }

  if (hadCritical) {
    return {
      passed: false,
      violations,
      sanitizedText: CRITICAL_FALLBACK,
      hadCriticalViolations: true,
    };
  }

  return {
    passed: violations.length === 0,
    violations,
    sanitizedText: sanitized,
    hadCriticalViolations: false,
  };
}
