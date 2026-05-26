import type {
  AnalysisResult,
  Biomarker,
  BiomarkerCategory,
  BiomarkerStatus,
} from "@/types/report";

const STATUS_VALUES: BiomarkerStatus[] = ["normal", "watch", "flagged"];
const CATEGORY_VALUES: BiomarkerCategory[] = [
  "blood",
  "liver",
  "kidney",
  "thyroid",
  "metabolic",
  "vitamin",
  "other",
];

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
  };
}

export default normalizeAnalysisResult;
