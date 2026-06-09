import type { AmIOkayResult, PersonalActionPlan } from "./types";

export function buildPersonalActionPlan(
  result: AmIOkayResult,
): PersonalActionPlan {
  const all = result.priorityItems.flatMap((p) => p.actionItems);
  const actions7Day = all
    .filter((a) => a.timeframe === "7d")
    .map((a) => a.action);
  const actions30Day = all
    .filter((a) => a.timeframe === "30d")
    .map((a) => a.action);
  const doctorItems = all
    .filter((a) => a.timeframe === "doctor")
    .map((a) => a.action);

  const top =
    result.priorityItems.find((p) => p.urgencyLevel === "act_now") ??
    result.priorityItems.find((p) => p.urgencyLevel === "watch");
  const topPriority =
    top?.outcomeSentence ||
    (result.status === "great"
      ? "Keep up your current routine — your results look healthy."
      : result.actionSummary);

  const encouragement =
    result.status === "great"
      ? "You're doing great — consistency is the key from here."
      : result.status === "critical"
        ? "Acting now is the most important thing you can do — you've got this."
        : "Small, steady changes add up. You're already a step ahead by knowing your numbers.";

  return { topPriority, actions7Day, actions30Day, doctorItems, encouragement };
}
