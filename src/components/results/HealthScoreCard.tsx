import { motion, useReducedMotion } from "framer-motion";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import type { AnalysisResult } from "@/types/report";

export interface HealthScoreCardProps {
  result: AnalysisResult;
  counts: { normal: number; watch: number; flagged: number };
}

const COLORS = {
  normal: "#1D9E75",
  watch: "#EF9F27",
  flagged: "#D85A30",
};

function firstSentence(text: string): string {
  if (!text) return "";
  const idx = text.indexOf(".");
  if (idx === -1) return text;
  return text.slice(0, idx + 1);
}

export function HealthScoreCard({ result, counts }: HealthScoreCardProps) {
  const reduceMotion = useReducedMotion();
  const total = counts.normal + counts.watch + counts.flagged;
  const data = [
    { name: "Normal", value: counts.normal, color: COLORS.normal },
    { name: "Watch", value: counts.watch, color: COLORS.watch },
    { name: "Flagged", value: counts.flagged, color: COLORS.flagged },
  ].filter((d) => d.value > 0);

  const headline = firstSentence(result.summary);

  return (
    <motion.section
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.35, ease: "easeOut" }}
      className="rounded-card bg-white border border-brand-border border-l-4 border-l-brand-teal p-6 flex flex-col md:flex-row gap-6 items-center"
      aria-label="Overall health summary"
    >
      <div className="relative w-[160px] h-[160px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={55}
              outerRadius={75}
              startAngle={90}
              endAngle={-270}
              isAnimationActive={!reduceMotion}
              animationDuration={1000}
              stroke="none"
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-[28px] font-bold leading-none text-brand-dark">
            {total}
          </span>
          <span className="text-[11px] text-brand-muted mt-1">
            tests analysed
          </span>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <ul className="space-y-1.5">
          <li className="flex items-center gap-2 text-sm">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: COLORS.flagged }}
            />
            <span className="font-semibold text-brand-coral">
              {counts.flagged}
            </span>
            <span className="text-brand-muted">values flagged</span>
          </li>
          <li className="flex items-center gap-2 text-sm">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: COLORS.watch }}
            />
            <span className="font-semibold text-brand-amber">
              {counts.watch}
            </span>
            <span className="text-brand-muted">values to watch</span>
          </li>
          <li className="flex items-center gap-2 text-sm">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: COLORS.normal }}
            />
            <span className="font-semibold text-brand-teal">
              {counts.normal}
            </span>
            <span className="text-brand-muted">values normal</span>
          </li>
        </ul>
        {headline && (
          <p className="mt-4 italic text-sm text-brand-muted line-clamp-2">
            {headline}
          </p>
        )}
      </div>
    </motion.section>
  );
}

export default HealthScoreCard;
