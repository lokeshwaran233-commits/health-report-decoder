import { useMemo, useState } from "react";
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
import { TrendingUp } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { AnalysisResult, Biomarker } from "@/types/report";

export interface TrendChartProps {
  history: AnalysisResult[];
}

interface Point {
  date: string;
  value: number;
  unit: string;
  status: Biomarker["status"];
  low: number;
  high: number;
  ts: number;
}

const STATUS_PRIORITY: Record<Biomarker["status"], number> = {
  flagged: 0,
  watch: 1,
  normal: 2,
};

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
  }).format(d);
}

function buildIndex(history: AnalysisResult[]): Map<string, Point[]> {
  const index = new Map<string, Point[]>();
  const sorted = [...history].sort(
    (a, b) =>
      new Date(a.metadata.uploadedAt).getTime() -
      new Date(b.metadata.uploadedAt).getTime(),
  );
  for (const report of sorted) {
    for (const b of report.biomarkers) {
      const key = b.name.trim().toLowerCase();
      const arr = index.get(key) ?? [];
      arr.push({
        date: fmtDate(report.metadata.reportDate || report.metadata.uploadedAt),
        value: b.value,
        unit: b.unit,
        status: b.status,
        low: b.referenceRange.low,
        high: b.referenceRange.high,
        ts: new Date(report.metadata.uploadedAt).getTime(),
      });
      index.set(key, arr);
    }
  }
  return index;
}

function getDisplayName(history: AnalysisResult[], key: string): string {
  for (const r of history) {
    const found = r.biomarkers.find((b) => b.name.trim().toLowerCase() === key);
    if (found) return found.name;
  }
  return key;
}

function pickDefault(
  history: AnalysisResult[],
  candidates: string[],
): string | null {
  if (candidates.length === 0) return null;
  let best: { key: string; rank: number; name: string } | null = null;
  for (const key of candidates) {
    for (const r of history) {
      const found = r.biomarkers.find(
        (b) => b.name.trim().toLowerCase() === key,
      );
      if (!found) continue;
      const rank = STATUS_PRIORITY[found.status];
      if (!best || rank < best.rank) {
        best = { key, rank, name: found.name };
      }
    }
  }
  if (!best) return null;
  if (best.rank === STATUS_PRIORITY.normal) {
    const sorted = [...candidates].sort((a, b) =>
      getDisplayName(history, a).localeCompare(getDisplayName(history, b)),
    );
    return sorted[0];
  }
  return best.key;
}

function StatusBadge({ status }: { status: Biomarker["status"] }) {
  const map: Record<Biomarker["status"], string> = {
    normal: "bg-brand-teal-light text-brand-teal",
    watch: "bg-brand-amber-light text-brand-amber",
    flagged: "bg-brand-coral-light text-brand-coral",
  };
  const label = status === "normal" ? "Normal" : status === "watch" ? "To watch" : "Flagged";
  return (
    <span className={cn("rounded-pill text-[11px] px-2 py-0.5", map[status])}>
      {label}
    </span>
  );
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: Point }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-card bg-white border border-brand-border shadow-card px-3 py-2 text-[12px] text-brand-dark">
      <div className="font-medium">{p.date}</div>
      <div className="mt-1 flex items-center gap-2">
        <span className="font-semibold">
          {p.value} <span className="text-brand-muted font-normal">{p.unit}</span>
        </span>
        <StatusBadge status={p.status} />
      </div>
    </div>
  );
}

export function TrendChart({ history }: TrendChartProps) {
  const reduceMotion = useReducedMotion();
  const index = useMemo(() => buildIndex(history), [history]);
  const candidates = useMemo(
    () => Array.from(index.entries()).filter(([, v]) => v.length >= 2).map(([k]) => k),
    [index],
  );
  const defaultKey = useMemo(
    () => pickDefault(history, candidates),
    [history, candidates],
  );
  const [selected, setSelected] = useState<string | null>(defaultKey);

  if (history.length < 2 || candidates.length === 0) return null;

  const activeKey = selected ?? defaultKey;
  const points = activeKey ? index.get(activeKey) ?? [] : [];
  const displayName = activeKey ? getDisplayName(history, activeKey) : "";

  let yDomain: [number, number] | undefined;
  if (points.length > 0) {
    const allVals = points.flatMap((p) => [p.value, p.low, p.high]);
    const min = Math.min(...allVals);
    const max = Math.max(...allVals);
    const pad = (max - min) * 0.2 || max * 0.2 || 1;
    yDomain = [min - pad, max + pad];
  }

  const refLow = points[0]?.low;
  const refHigh = points[0]?.high;
  const unit = points[0]?.unit ?? "";

  return (
    <section className="mt-10">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="h-5 w-5 text-brand-teal" aria-hidden="true" />
        <h2 className="text-[20px] font-semibold text-brand-dark">
          Your health trends over time
        </h2>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {candidates.map((key) => {
          const name = getDisplayName(history, key);
          const isActive = key === activeKey;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(key)}
              className={cn(
                "shrink-0 rounded-pill px-3 py-1.5 text-[12px] font-medium transition-colors",
                isActive
                  ? "bg-brand-teal text-white"
                  : "bg-white border border-brand-border text-brand-muted hover:text-brand-dark",
              )}
            >
              {name}
            </button>
          );
        })}
      </div>

      {points.length < 2 ? (
        <div className="mt-4 rounded-card bg-white border border-brand-border p-6 text-center text-sm text-brand-muted">
          Upload another report to start tracking {displayName} over time.
        </div>
      ) : (
        <div className="mt-4 rounded-card bg-white border border-brand-border p-4">
          <div className="flex items-baseline justify-between mb-2">
            <h3 className="text-sm font-semibold text-brand-dark">
              {displayName}
            </h3>
            <span className="text-[12px] text-brand-muted">{unit}</span>
          </div>
          <div className="h-[180px] md:h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points} margin={{ top: 8, right: 28, bottom: 8, left: 0 }}>
                <CartesianGrid stroke="#E5E5E3" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#73726C", fontSize: 11 }}
                  axisLine={{ stroke: "#E5E5E3" }}
                  tickLine={false}
                />
                <YAxis
                  domain={yDomain ?? ["auto", "auto"]}
                  tick={{ fill: "#73726C", fontSize: 11 }}
                  axisLine={{ stroke: "#E5E5E3" }}
                  tickLine={false}
                  width={40}
                />
                {refLow !== undefined && refHigh !== undefined && (
                  <ReferenceArea
                    y1={refLow}
                    y2={refHigh}
                    fill="rgba(15,110,86,0.08)"
                    stroke="none"
                  />
                )}
                {refLow !== undefined && (
                  <ReferenceLine
                    y={refLow}
                    stroke="#1D9E75"
                    strokeDasharray="4 4"
                    strokeWidth={1}
                    label={{
                      value: "Low",
                      position: "right",
                      fill: "#0F6E56",
                      fontSize: 11,
                    }}
                  />
                )}
                {refHigh !== undefined && (
                  <ReferenceLine
                    y={refHigh}
                    stroke="#1D9E75"
                    strokeDasharray="4 4"
                    strokeWidth={1}
                    label={{
                      value: "High",
                      position: "right",
                      fill: "#0F6E56",
                      fontSize: 11,
                    }}
                  />
                )}
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#0F6E56"
                  strokeWidth={2}
                  dot={{ r: 5, fill: "#0F6E56", strokeWidth: 0 }}
                  activeDot={{ r: 7, fill: "#0F6E56", strokeWidth: 0 }}
                  isAnimationActive={!reduceMotion}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </section>
  );
}

export default TrendChart;
