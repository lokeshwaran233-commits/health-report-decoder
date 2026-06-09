import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BiomarkerTrend } from "@/lib/clinical2026/types";

const STATUS_COLORS: Record<string, string> = {
  normal: "#10B981",
  watch: "#FBBF24",
  flagged: "#F97316",
  critical: "#EF4444",
};

export function AnnotatedTrendChart({ trend }: { trend: BiomarkerTrend }) {
  const data = useMemo(
    () =>
      [...trend.dataPoints]
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        )
        .map((p) => ({
          date: new Date(p.date).toLocaleDateString("en-IN", {
            month: "short",
            year: "2-digit",
          }),
          value: p.value,
          status: p.status,
        })),
    [trend.dataPoints],
  );

  const minVal = Math.min(
    ...data.map((d) => d.value),
    trend.labRefMin ?? Infinity,
  );
  const maxVal = Math.max(
    ...data.map((d) => d.value),
    trend.labRefMax ?? -Infinity,
  );
  const padding = (maxVal - minVal) * 0.2 || 1;

  const trendColor =
    trend.trend === "improving"
      ? "#10B981"
      : trend.trend === "worsening"
        ? "#F97316"
        : "#00D9A3";

  return (
    <div className="rounded-2xl bg-brand-card dark:bg-[#0F1623] border border-brand-border dark:border-[#1C2A3E] overflow-hidden">
      <div className="px-5 pt-4 pb-2 flex items-start justify-between">
        <div>
          <h4
            className="text-sm font-semibold text-brand-dark dark:text-white/90"
            style={{ fontFamily: "Fraunces, Georgia, serif" }}
          >
            {trend.displayName}
          </h4>
          <p className="text-xs text-brand-muted dark:text-white/40 mt-0.5">
            {trend.unit}
          </p>
        </div>
        <div
          className={`flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase px-2.5 py-1 rounded-full ${
            trend.trend === "improving"
              ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/25"
              : trend.trend === "worsening"
                ? "bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-500/25"
                : "bg-brand-border dark:bg-white/5 text-brand-muted dark:text-white/40 border border-brand-border dark:border-white/10"
          }`}
        >
          {trend.trend === "improving"
            ? "↑ Improving"
            : trend.trend === "worsening"
              ? "↓ Watch this"
              : "→ Stable"}
        </div>
      </div>

      <div className="px-2 pb-2" style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
            <CartesianGrid
              stroke="currentColor"
              className="text-brand-border dark:text-white/[0.04]"
              strokeDasharray="4 4"
              vertical={false}
            />
            {trend.labRefMin !== null && trend.labRefMax !== null && (
              <ReferenceArea
                y1={trend.labRefMin}
                y2={trend.labRefMax}
                fill="#10B981"
                fillOpacity={0.08}
                stroke="none"
              />
            )}
            {trend.labRefMin !== null && (
              <ReferenceLine
                y={trend.labRefMin}
                stroke="#10B981"
                strokeWidth={1}
                strokeDasharray="3 3"
                strokeOpacity={0.4}
              />
            )}
            {trend.labRefMax !== null && (
              <ReferenceLine
                y={trend.labRefMax}
                stroke="#10B981"
                strokeWidth={1}
                strokeDasharray="3 3"
                strokeOpacity={0.4}
              />
            )}
            <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis
              domain={[minVal - padding, maxVal + padding]}
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={32}
            />
            <Tooltip
              formatter={(val: number) => [`${val} ${trend.unit}`, trend.displayName]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={trendColor}
              strokeWidth={2.5}
              dot={(props: { cx?: number; cy?: number; payload?: { status: string } }) => {
                const { cx, cy, payload } = props;
                if (cx == null || cy == null) return <g />;
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={5}
                    fill={
                      STATUS_COLORS[payload?.status ?? "normal"] ?? "#8B9BAE"
                    }
                    stroke="#fff"
                    strokeWidth={2}
                  />
                );
              }}
              activeDot={{ r: 7, stroke: trendColor, strokeWidth: 2, fill: "#fff" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mx-4 mb-4 rounded-xl bg-brand-surface dark:bg-[#080C14] border border-brand-border dark:border-[#1C2A3E] px-4 py-3">
        <p className="text-xs text-brand-dark dark:text-white/70 leading-relaxed">
          {trend.trendSentence}
        </p>
        {trend.projectionSentence && (
          <p className="text-xs text-orange-700 dark:text-orange-300/80 leading-relaxed mt-2 border-t border-orange-300 dark:border-orange-500/15 pt-2">
            <span className="font-semibold">If this continues: </span>
            {trend.projectionSentence}
          </p>
        )}
        {trend.projectedCrossDate && (
          <p className="text-xs text-brand-muted dark:text-white/50 mt-1.5">
            Projected threshold crossing:{" "}
            {new Date(trend.projectedCrossDate).toLocaleDateString("en-IN", {
              month: "long",
              year: "numeric",
            })}
          </p>
        )}
      </div>

      {trend.trend === "worsening" && (
        <div className="px-4 pb-4">
          <button
            className="w-full py-2 text-xs font-medium text-brand-teal border border-brand-teal/40 rounded-lg hover:bg-brand-teal-light/40 dark:hover:bg-[#0D4A3A]/30 transition-colors"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent("openZenoWithQuery", {
                  detail: {
                    query: `What can I do to improve my ${trend.displayName}? It's been trending in the wrong direction.`,
                  },
                }),
              )
            }
          >
            What can I do to reverse this? → Ask Zeno
          </button>
        </div>
      )}
    </div>
  );
}
