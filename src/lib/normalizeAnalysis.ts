import type {
  AnalysisResult,
  Biomarker,
  BiomarkerCategory,
  BiomarkerStatus,
  DetectedPattern,
  FollowUpTest,
  FollowUpUrgency,
  PatternSeverity,
} from "@/types/report";

const STATUS_VALUES: BiomarkerStatus[] = ["normal", "watch", "flagged"];
const CATEGORY_VALUES: BiomarkerCategory[] = [
  "blood",
  "liver",
  "kidney",
  "thyroid",
  "metabolic",
  "vitamin",
  "cardio",
  "coagulation",
  "electrolyte",
  "inflammation",
  "urine",
  "bloodgas",
  "other",
];
const SEVERITY_VALUES: PatternSeverity[] = [
  "informational",
  "watch",
  "flagged",
  "critical",
];
const URGENCY_VALUES: FollowUpUrgency[] = ["urgent", "soon", "routine"];

function clampNumber(n: unknown, fallback = 0): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.round(v * 10000) / 10000;
}

function clampStatus(s: unknown): BiomarkerStatus {
  return STATUS_VALUES.includes(s as BiomarkerStatus)
    ? (s as BiomarkerStatus)
    : "normal";
}

function clampCategory(c: unknown): BiomarkerCategory {
  return CATEGORY_VALUES.includes(c as BiomarkerCategory)
    ? (c as BiomarkerCategory)
    : "other";
}

function clampSeverity(s: unknown): PatternSeverity {
  return SEVERITY_VALUES.includes(s as PatternSeverity)
    ? (s as PatternSeverity)
    : "informational";
}

function clampUrgency(u: unknown): FollowUpUrgency {
  return URGENCY_VALUES.includes(u as FollowUpUrgency)
    ? (u as FollowUpUrgency)
    : "routine";
}

function makeId(prefix = "rep"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

interface RawBiomarker {
  id?: unknown;
  name?: unknown;
  value?: unknown;
  unit?: unknown;
  referenceRange?: { low?: unknown; high?: unknown; unit?: unknown };
  status?: unknown;
  category?: unknown;
  plainEnglish?: unknown;
  deepExplanation?: unknown;
  criticalFlag?: unknown;
}

interface RawPattern {
  name?: unknown;
  biomarkersInvolved?: unknown;
  plainEnglish?: unknown;
  severity?: unknown;
}

interface RawFollowUp {
  test?: unknown;
  reason?: unknown;
  urgency?: unknown;
}

interface RawAnalysis {
  metadata?: {
    patientName?: unknown;
    reportDate?: unknown;
    labName?: unknown;
  };
  biomarkers?: RawBiomarker[];
  summary?: unknown;
  doctorQuestions?: unknown;
  contentWarning?: unknown;
  detectedPatterns?: RawPattern[];
  followUpTests?: RawFollowUp[];
}

function normalizePatterns(raw: unknown): DetectedPattern[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((p): DetectedPattern | null => {
      const r = (p ?? {}) as RawPattern;
      const name = typeof r.name === "string" ? r.name : "";
      const plainEnglish =
        typeof r.plainEnglish === "string" ? r.plainEnglish : "";
      if (!name || !plainEnglish) return null;
      const involved = Array.isArray(r.biomarkersInvolved)
        ? r.biomarkersInvolved.filter((x): x is string => typeof x === "string")
        : [];
      return {
        name,
        biomarkersInvolved: involved,
        plainEnglish,
        severity: clampSeverity(r.severity),
      };
    })
    .filter((x): x is DetectedPattern => x !== null);
}

function normalizeFollowUps(raw: unknown): FollowUpTest[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((f): FollowUpTest | null => {
      const r = (f ?? {}) as RawFollowUp;
      const test = typeof r.test === "string" ? r.test : "";
      const reason = typeof r.reason === "string" ? r.reason : "";
      if (!test) return null;
      return {
        test,
        reason,
        urgency: clampUrgency(r.urgency),
      };
    })
    .filter((x): x is FollowUpTest => x !== null);
}

export function normalizeAnalysisResult(raw: unknown): AnalysisResult {
  const r = (raw ?? {}) as RawAnalysis;
  const biomarkers: Biomarker[] = Array.isArray(r.biomarkers)
    ? r.biomarkers.map((b, i): Biomarker => {
        const lowRaw = b.referenceRange?.low;
        const highRaw = b.referenceRange?.high;
        return {
          id: typeof b.id === "string" && b.id ? b.id : `bm-${i}-${makeId("x")}`,
          name: typeof b.name === "string" ? b.name : "Unknown marker",
          value: clampNumber(b.value),
          unit: typeof b.unit === "string" ? b.unit : "",
          referenceRange: {
            low: clampNumber(lowRaw),
            high: clampNumber(highRaw, clampNumber(lowRaw) + 1),
            unit:
              typeof b.referenceRange?.unit === "string"
                ? b.referenceRange.unit
                : undefined,
          },
          status: clampStatus(b.status),
          category: clampCategory(b.category),
          plainEnglish:
            typeof b.plainEnglish === "string" ? b.plainEnglish : "",
          deepExplanation:
            typeof b.deepExplanation === "string" ? b.deepExplanation : "",
          criticalFlag: b.criticalFlag === true,
        };
      })
    : [];

  const md = r.metadata ?? {};
  return {
    id: makeId("rep"),
    metadata: {
      patientName:
        typeof md.patientName === "string" && md.patientName.trim().length > 0
          ? md.patientName
          : null,
      reportDate:
        typeof md.reportDate === "string" && md.reportDate.trim().length > 0
          ? md.reportDate
          : null,
      labName:
        typeof md.labName === "string" && md.labName.trim().length > 0
          ? md.labName
          : null,
      uploadedAt: new Date().toISOString(),
    },
    biomarkers,
    summary: typeof r.summary === "string" ? r.summary : "",
    doctorQuestions: Array.isArray(r.doctorQuestions)
      ? r.doctorQuestions.filter((q): q is string => typeof q === "string")
      : [],
    contentWarning:
      typeof r.contentWarning === "string" && r.contentWarning.trim().length > 0
        ? r.contentWarning
        : null,
    detectedPatterns: normalizePatterns(r.detectedPatterns),
    followUpTests: normalizeFollowUps(r.followUpTests),
  };
}

export default normalizeAnalysisResult;
