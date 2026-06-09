// 2026 engine types — parallel namespace, does not replace the existing
// clinicalEngine types. See src/lib/clinical2026/adapter.ts for the bridge.

export type BiomarkerStatus =
  | "normal"
  | "low"
  | "high"
  | "critical_low"
  | "critical_high";

export type ConfidenceLevel = "HIGH" | "MODERATE" | "LOW" | "INSUFFICIENT";
export type BiomarkerPolarity = "higher_better" | "lower_better" | "in_range";
export type OkayStatus =
  | "great"
  | "mostly_okay"
  | "needs_attention"
  | "act_now"
  | "critical";
export type TrendDirection =
  | "improving"
  | "worsening"
  | "stable"
  | "fluctuating"
  | "insufficient_data";

export type OutputMode =
  | "standard"
  | "doctor_brief"
  | "action_focused"
  | "monitoring";

export interface ActionItem {
  timeframe: "7d" | "30d" | "doctor";
  action: string;
  isHighPriority: boolean;
  urgency?: "high" | "medium" | "low";
}

export interface EvaluatedBiomarker {
  normalizedName: string;
  name: string;
  displayName: string;
  value: number | string;
  unit: string | null;
  status: BiomarkerStatus;
  category: string;
  deviationPercent: number | null;
  confidence: ConfidenceLevel;
  hasConflicts?: boolean;
  polarity: BiomarkerPolarity;
  referenceMin?: number;
  referenceMax?: number;
}

export interface RulesEngineOutput {
  evaluatedBiomarkers: EvaluatedBiomarker[];
  criticalAlerts: EvaluatedBiomarker[];
  reportDate: string;
  reportId: string;
}

export interface PriorityItem {
  id: string;
  biomarkerName: string;
  displayName: string;
  value: number | string;
  unit: string | null;
  urgencyLevel: "act_now" | "watch" | "great" | "stable";
  urgencyLabel: string;
  timeframe: string;
  outcomeSentence: string;
  actionItems: ActionItem[];
}

export interface AmIOkayResult {
  status: OkayStatus;
  headline: string;
  subline: string;
  urgencyColor: string;
  emoji: string;
  actionSummary: string;
  timeframe: "24h" | "7d" | "30d" | "routine";
  priorityItems: PriorityItem[];
  normalCount: number;
  flaggedCount: number;
  criticalCount: number;
}

export interface BiomarkerDataPoint {
  date: string;
  value: number;
  unit: string;
  status: "normal" | "watch" | "flagged" | "critical";
  reportId?: string;
  labName?: string;
}

export interface BiomarkerTrend {
  normalizedName: string;
  displayName: string;
  unit: string;
  category?: string;
  polarity?: BiomarkerPolarity;
  dataPoints: BiomarkerDataPoint[];
  trend: TrendDirection;
  trendPercent: number | null;
  trendSentence: string;
  projectionSentence: string | null;
  projectedCrossDate: string | null;
  labRefMin: number | null;
  labRefMax: number | null;
  latestStatus?: BiomarkerStatus;
}

export interface NarrativeSummary {
  improved: BiomarkerTrend[];
  worsened: BiomarkerTrend[];
  stable: BiomarkerTrend[];
  headline: string;
  bigPicture: string;
  oneThatMattersMost: BiomarkerTrend | null;
  totalReports: number;
  dateRange: string;
  healthScoreChange: number | null;
  wrappedYear: number;
}

export interface ScoreBreakdown {
  category: string;
  score: number;
  maxScore: number;
  label: string;
}

export interface HealthScoreResult {
  score: number;
  previousScore: number | null;
  change: number | null;
  grade: "A" | "B" | "C" | "D" | "F";
  gradeLabel: string;
  breakdown: ScoreBreakdown[];
  percentile: number | null;
}

export type HealthIntent =
  | "cholesterol_heart"
  | "blood_sugar_diabetes"
  | "thyroid"
  | "full_blood_count"
  | "liver_kidney"
  | "everything"
  | "worried_about_results"
  | "already_managing"
  | "doctor_appointment";

export interface IntentConfig {
  id: HealthIntent;
  label: string;
  sublabel: string;
  icon: string;
  primaryBiomarkers: string[];
  outputMode: OutputMode;
  systemPromptHint: string;
}

export interface PersonalActionPlan {
  topPriority: string;
  actions7Day: string[];
  actions30Day: string[];
  doctorItems: string[];
  encouragement: string;
}
