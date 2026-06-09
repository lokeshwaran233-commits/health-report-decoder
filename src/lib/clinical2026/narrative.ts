import type {
  BiomarkerDataPoint,
  BiomarkerPolarity,
  BiomarkerStatus,
  BiomarkerTrend,
  NarrativeSummary,
  RulesEngineOutput,
  TrendDirection,
} from "./types";

interface AnalyzeTrendInput {
  dataPoints: Array<{ date: string; value: number }>;
  polarity: BiomarkerPolarity;
  latestStatus: BiomarkerStatus;
  referenceMin?: number;
  referenceMax?: number;
  displayName: string;
}

interface AnalyzeTrendResult {
  trend: TrendDirection;
  trendPercent: number | null;
  trendSentence: string;
  projectionSentence: string | null;
  projectedCrossDate: string | null;
}

export function analyzeTrend(input: AnalyzeTrendInput): AnalyzeTrendResult {
  const {
    dataPoints,
    polarity,
    latestStatus,
    referenceMin,
    referenceMax,
    displayName,
  } = input;

  if (dataPoints.length < 2) {
    return {
      trend: "insufficient_data",
      trendPercent: null,
      trendSentence:
        "Only one data point — upload more reports to track trends.",
      projectionSentence: null,
      projectedCrossDate: null,
    };
  }

  const sorted = [...dataPoints].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const first = sorted[0].value;
  const last = sorted[sorted.length - 1].value;
  const changePct = first === 0 ? 0 : ((last - first) / Math.abs(first)) * 100;

  let trend: TrendDirection = "stable";
  if (Math.abs(changePct) > 5) {
    switch (polarity) {
      case "lower_better":
        trend = changePct > 0 ? "worsening" : "improving";
        break;
      case "higher_better":
        trend = changePct < 0 ? "worsening" : "improving";
        break;
      case "in_range": {
        if (referenceMin !== undefined && referenceMax !== undefined) {
          const mid = (referenceMin + referenceMax) / 2;
          const firstDist = Math.abs(first - mid);
          const lastDist = Math.abs(last - mid);
          trend = lastDist > firstDist ? "worsening" : "improving";
        } else {
          trend = latestStatus !== "normal" ? "worsening" : "stable";
        }
        break;
      }
    }
  }

  const dateFrom = new Date(sorted[0].date).toLocaleDateString("en-IN", {
    month: "short",
    year: "2-digit",
  });
  const dateTo = new Date(sorted[sorted.length - 1].date).toLocaleDateString(
    "en-IN",
    { month: "short", year: "2-digit" },
  );
  const absPct = Math.abs(changePct).toFixed(0);
  const direction = changePct > 0 ? "Increased" : "Decreased";

  const trendSentence =
    trend === "stable"
      ? `Stayed stable between ${dateFrom} and ${dateTo} — no significant change.`
      : trend === "improving"
        ? `Improved by ${absPct}% from ${dateFrom} to ${dateTo} — moving in the right direction.`
        : `${direction} by ${absPct}% from ${dateFrom} to ${dateTo} — worth monitoring.`;

  // Projection
  const MS_PER_DAY = 86_400_000;
  const daySpan =
    (new Date(sorted[sorted.length - 1].date).getTime() -
      new Date(sorted[0].date).getTime()) /
    MS_PER_DAY;
  let projectionSentence: string | null = null;
  let projectedCrossDate: string | null = null;

  if (daySpan > 0) {
    const changePerDay = (last - first) / daySpan;
    if (Math.abs(changePerDay) > 1e-6) {
      let threshold: number | undefined;
      if (
        polarity === "lower_better" &&
        referenceMax !== undefined &&
        last > referenceMax
      )
        threshold = referenceMax;
      else if (
        polarity === "higher_better" &&
        referenceMin !== undefined &&
        last < referenceMin
      )
        threshold = referenceMin;
      else if (polarity === "in_range" && latestStatus !== "normal")
        threshold = changePerDay > 0 ? referenceMax : referenceMin;

      if (threshold !== undefined) {
        const daysToThreshold = (threshold - last) / changePerDay;
        if (daysToThreshold > 0) {
          projectedCrossDate = new Date(
            new Date(sorted[sorted.length - 1].date).getTime() +
              daysToThreshold * MS_PER_DAY,
          )
            .toISOString()
            .split("T")[0];
          const months = Math.round(daysToThreshold / 30);
          const timeLabel =
            months === 0
              ? "less than a month"
              : months === 1
                ? "about 1 month"
                : `about ${months} months`;
          const dirText =
            changePerDay > 0
              ? "reach the upper limit"
              : "fall below the lower limit";
          projectionSentence = `At the current rate, your ${displayName} will ${dirText} in ${timeLabel}.`;
        }
      }
    }
  }

  return {
    trend,
    trendPercent: Math.round(changePct * 10) / 10,
    trendSentence,
    projectionSentence,
    projectedCrossDate,
  };
}

function statusToTrendStatus(
  s: BiomarkerStatus,
): BiomarkerDataPoint["status"] {
  if (s === "critical_high" || s === "critical_low") return "critical";
  if (s === "high" || s === "low") return "flagged";
  return "normal";
}

export function buildTrends(
  reports: RulesEngineOutput[],
): BiomarkerTrend[] {
  const grouped = new Map<string, Array<{
    report: RulesEngineOutput;
    bio: RulesEngineOutput["evaluatedBiomarkers"][number];
  }>>();

  for (const r of reports) {
    for (const b of r.evaluatedBiomarkers) {
      if (typeof b.value !== "number") continue;
      const arr = grouped.get(b.normalizedName) ?? [];
      arr.push({ report: r, bio: b });
      grouped.set(b.normalizedName, arr);
    }
  }

  const trends: BiomarkerTrend[] = [];
  for (const [name, entries] of grouped) {
    const sorted = entries.sort(
      (a, b) =>
        new Date(a.report.reportDate).getTime() -
        new Date(b.report.reportDate).getTime(),
    );
    const last = sorted[sorted.length - 1].bio;
    const dataPoints: BiomarkerDataPoint[] = sorted.map((e) => ({
      date: e.report.reportDate,
      value: e.bio.value as number,
      unit: e.bio.unit ?? "",
      status: statusToTrendStatus(e.bio.status),
      reportId: e.report.reportId,
    }));

    const analysis = analyzeTrend({
      dataPoints: dataPoints.map((p) => ({ date: p.date, value: p.value })),
      polarity: last.polarity,
      latestStatus: last.status,
      referenceMin: last.referenceMin,
      referenceMax: last.referenceMax,
      displayName: last.displayName,
    });

    trends.push({
      normalizedName: name,
      displayName: last.displayName,
      unit: last.unit ?? "",
      category: last.category,
      polarity: last.polarity,
      dataPoints,
      labRefMin: last.referenceMin ?? null,
      labRefMax: last.referenceMax ?? null,
      latestStatus: last.status,
      ...analysis,
    });
  }
  return trends;
}

export function buildNarrativeSummary(
  trends: BiomarkerTrend[],
  totalReports: number,
  dateRange: string,
  healthScoreChange: number | null,
  wrappedYear: number = new Date().getFullYear(),
): NarrativeSummary {
  const improved = trends.filter((t) => t.trend === "improving");
  const worsened = trends.filter((t) => t.trend === "worsening");
  const stable = trends.filter((t) => t.trend === "stable");
  const oneThatMattersMost = worsened[0] ?? null;

  const headline =
    worsened.length === 0 && improved.length > 0
      ? `You've made real progress — ${improved.length} marker${improved.length > 1 ? "s" : ""} improved.`
      : worsened.length > 0 && improved.length > 0
        ? `Progress on ${improved.length} front${improved.length > 1 ? "s" : ""}, attention needed on ${worsened.length}.`
        : worsened.length > 0
          ? `${worsened.length} area${worsened.length > 1 ? "s" : ""} ${worsened.length > 1 ? "are" : "is"} trending in the wrong direction.`
          : "Your values are stable across all tracked markers.";

  const bigPicture = oneThatMattersMost
    ? `The one area that needs your focus: ${oneThatMattersMost.displayName}. ${oneThatMattersMost.trendSentence}`
    : `All tracked values are either stable or improving. Keep doing what you're doing.`;

  return {
    improved,
    worsened,
    stable,
    headline,
    bigPicture,
    oneThatMattersMost,
    totalReports,
    dateRange,
    healthScoreChange,
    wrappedYear,
  };
}
