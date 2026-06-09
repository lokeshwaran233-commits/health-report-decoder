import type { ActionItem, EvaluatedBiomarker } from "./types";

export function buildFallbackOutcome(b: EvaluatedBiomarker): string {
  const direction =
    b.status === "high" || b.status === "critical_high" ? "above" : "below";
  const severity = b.status.startsWith("critical") ? "significantly" : "slightly";
  const delta =
    b.deviationPercent !== null ? ` by ${Math.abs(b.deviationPercent)}%` : "";
  return `Your ${b.displayName} is ${severity} ${direction} the healthy range${delta}.`;
}

export function buildFallbackActions(b: EvaluatedBiomarker): ActionItem[] {
  if (b.status === "critical_high" || b.status === "critical_low") {
    return [
      {
        timeframe: "doctor",
        action: "See a doctor this week",
        isHighPriority: true,
        urgency: "high",
      },
      {
        timeframe: "7d",
        action: "Do not delay — this level may need immediate attention",
        isHighPriority: true,
        urgency: "high",
      },
    ];
  }
  return [
    {
      timeframe: "doctor",
      action: `Discuss your ${b.displayName} with your doctor`,
      isHighPriority: false,
      urgency: "medium",
    },
    {
      timeframe: "30d",
      action: "Retest in 30–60 days",
      isHighPriority: false,
      urgency: "low",
    },
  ];
}
