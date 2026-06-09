import type {
  AmIOkayResult,
  OkayStatus,
  RulesEngineOutput,
} from "./types";

const HEADLINE: Record<OkayStatus, (c: number, w: number) => string> = {
  great: () => "Your report looks healthy — nothing needs urgent attention.",
  mostly_okay: (_c, w) =>
    `Your report looks mostly healthy. ${w} area${w > 1 ? "s" : ""} worth keeping an eye on.`,
  needs_attention: (_c, w) =>
    `Your report is largely okay, but ${w} value${w > 1 ? "s" : ""} need your attention in the next 30 days.`,
  act_now: (c) =>
    `Your report has ${c} value${c > 1 ? "s" : ""} that need attention soon — please review with your doctor.`,
  critical: (c) =>
    `${c} of your values are critically outside range. Please speak with a doctor today.`,
};

const SUBLINE: Record<OkayStatus, string> = {
  great: "Keep up what you're doing. Routine follow-up as advised.",
  mostly_okay: "No immediate action needed. Review the details below.",
  needs_attention: "Not urgent — but acting now prevents bigger issues later.",
  act_now: "These aren't emergencies, but they shouldn't be ignored.",
  critical: "Do not wait to discuss these results with a healthcare provider.",
};

export function computeAmIOkay(out: RulesEngineOutput): AmIOkayResult {
  const critical = out.criticalAlerts.length;
  const flagged = out.evaluatedBiomarkers.filter(
    (b) => b.status === "low" || b.status === "high",
  ).length;
  const watch = flagged;
  const normal = out.evaluatedBiomarkers.filter(
    (b) => b.status === "normal",
  ).length;
  const total = out.evaluatedBiomarkers.length;

  let status: OkayStatus;
  if (critical > 0) status = "critical";
  else if (flagged >= 3 || flagged > total * 0.3) status = "act_now";
  else if (flagged > 0 || watch > 2) status = "needs_attention";
  else if (watch > 0) status = "mostly_okay";
  else status = "great";

  const emojiMap: Record<OkayStatus, string> = {
    great: "✓",
    mostly_okay: "◐",
    needs_attention: "⚠",
    act_now: "!",
    critical: "‼",
  };
  const colorMap: Record<OkayStatus, string> = {
    great: "success",
    mostly_okay: "info",
    needs_attention: "warning",
    act_now: "warning",
    critical: "danger",
  };

  return {
    status,
    headline: HEADLINE[status](critical || flagged, watch),
    subline: SUBLINE[status],
    urgencyColor: colorMap[status],
    emoji: emojiMap[status],
    actionSummary:
      status === "critical"
        ? "Speak to a doctor today"
        : status === "act_now"
          ? "Book a follow-up this week"
          : status === "needs_attention"
            ? "Review with your doctor within 30 days"
            : "Continue regular health monitoring",
    timeframe:
      status === "critical"
        ? "24h"
        : status === "act_now"
          ? "7d"
          : status === "needs_attention"
            ? "30d"
            : "routine",
    priorityItems: [],
    normalCount: normal,
    flaggedCount: flagged,
    criticalCount: critical,
  };
}
