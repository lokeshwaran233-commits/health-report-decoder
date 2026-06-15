<div align="center">

<br/>

```
██████╗ ███████╗██████╗  ██████╗ ██████╗ ████████╗    ██████╗ ██╗  ██╗
██╔══██╗██╔════╝██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝    ██╔══██╗╚██╗██╔╝
██████╔╝█████╗  ██████╔╝██║   ██║██████╔╝   ██║       ██████╔╝ ╚███╔╝ 
██╔══██╗██╔══╝  ██╔═══╝ ██║   ██║██╔══██╗   ██║       ██╔══██╗ ██╔██╗ 
██║  ██║███████╗██║     ╚██████╔╝██║  ██║   ██║       ██║  ██║██╔╝ ██╗
╚═╝  ╚═╝╚══════╝╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝       ╚═╝  ╚═╝╚═╝  ╚═╝
```

### *Your lab report, finally explained.*

<br/>

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-report--insight--decoder.lovable.app-0F6E56?style=for-the-badge)](https://report-insight-decoder.lovable.app)
[![Watch Demo](https://img.shields.io/badge/🎬_Demo_Video-Loom-625DF5?style=for-the-badge&logo=loom&logoColor=white)](https://www.loom.com/share/42b7952f0ae44de78faf2575282a3560)

<br/>

![TanStack Start](https://img.shields.io/badge/TanStack_Start-SSR_First-F97316?style=flat-square)
![React 19](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict_Mode-3178C6?style=flat-square&logo=typescript)
![Tailwind v4](https://img.shields.io/badge/Tailwind-v4_Custom_Tokens-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Gemini 2.5 Flash](https://img.shields.io/badge/AI-Gemini_2.5_Flash-4285F4?style=flat-square&logo=google&logoColor=white)
![Cloudflare Workers](https://img.shields.io/badge/Runtime-Cloudflare_Workers-F38020?style=flat-square&logo=cloudflare&logoColor=white)
![Supabase](https://img.shields.io/badge/Backend-Supabase_+_RLS-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![Razorpay](https://img.shields.io/badge/Payments-Razorpay-072654?style=flat-square)
![i18n](https://img.shields.io/badge/Languages-EN_|_TA_|_HI_|_TE-888780?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-1D9E75?style=flat-square)

<br/>

**Upload a blood test. Get animated visual gauges, cross-biomarker pattern detection, plain-English insights, and the exact questions to ask your doctor — in under 30 seconds.**

</div>

---

## Table of Contents

1. [The Problem](#-the-problem)
2. [What ReportRx Does — In One Sentence Per Feature](#-what-reportrx-does--in-one-sentence-per-feature)
3. [Feature Deep-Dive](#-feature-deep-dive)
4. [Full System Architecture](#-full-system-architecture)
5. [Data Flow — End to End](#-data-flow--end-to-end)
6. [Clinical Intelligence Engine](#-clinical-intelligence-engine)
7. [Security Architecture](#-security-architecture)
8. [Database Schema](#-database-schema)
9. [Tech Stack — With Rationale](#️-tech-stack--with-rationale)
10. [Project Structure](#-project-structure)
11. [Getting Started](#-getting-started)
12. [Environment Variables](#-environment-variables)
13. [Design System](#-design-system)
14. [Accessibility](#-accessibility)
15. [Pricing Model](#-pricing-model)
16. [Roadmap](#-roadmap)
17. [Author](#-author)

---

## 🎯 The Problem

Every year, hundreds of millions of patients receive a lab result that looks like this:

```
Haemoglobin:     10.8 g/dL     [Ref: 12.0–16.0]  ⚠ LOW
TSH:              4.8 µIU/mL   [Ref: 0.40–4.00]  ⚠ HIGH
Vitamin D:       14.2 ng/mL    [Ref: 30–100]     🚨 DEFICIENT
MCV:             71.0 fL       [Ref: 80–100]     ⚠ LOW
MCHC:            31.0 g/dL     [Ref: 32.0–36.0]  ⚠ LOW
```

They are handed a printout, sent home, and told to "follow up with their doctor." 

The follow-up rarely happens that day. So they do what people do — they Google each value in isolation. They land on clinical research papers written for doctors, not patients. They spiral. They misinterpret. They miss the connection between low Hb + low MCV + low MCHC that together scream *microcytic hypochromic anemia*.

**The diagnostic lab gives you numbers. Nobody gives you understanding.**

ReportRx fills that gap — not by replacing your doctor, but by making you a better-informed patient before you see one.

---

## ✨ What ReportRx Does — In One Sentence Per Feature

| Feature | One Sentence |
|---|---|
| **Lab Report Decoder** | Upload any blood test PDF or image; get visual gauges and plain-English biomarker explanations in 30 seconds. |
| **Clinical Rules Engine** | Detects 15+ cross-biomarker patterns (e.g. iron deficiency, metabolic syndrome) with confidence scoring. |
| **Scan Decoder** | Upload X-Rays, CT, MRI, Ultrasound, ECG, DEXA, or mammograms for a radiology-style plain-English read. |
| **Zeno AI Companion** | Chat with a RAG-powered health assistant that answers follow-up questions using your actual report as context. |
| **Doctor Questions Generator** | Produces 4–6 specific, personalized questions based on your flagged values — the most-shared feature. |
| **My Health Story** | Tracks every biomarker across all your uploads, shows trend lines, projects trajectories, and generates a narrative. |
| **Am I Okay?** | Reduces an entire report to a single 5-tier wellness verdict with a one-sentence summary and action timeline. |
| **Audio Briefing** | Generates a text-to-speech audio summary of your report that you can play or share. |
| **Share & Export** | Shareable link (token-gated, expiring), WhatsApp message, and browser-native PDF — all without server storage. |
| **Multilingual** | Full UI and AI output in English, Tamil (தமிழ்), Hindi (हिंदी), and Telugu (తెలుగు). |
| **Imaging Safety Pipeline** | 12-phase AI pipeline with anatomy verification, finding grounding, critic pass, and safety-rule gates for scans. |

---

## 🔬 Feature Deep-Dive

### 📄 Lab Report Decoder

The core feature. Accepts:

- **PDF upload** — text extracted client-side via `pdfjs-dist` (dynamic import, zero server upload)
- **Image upload** — JPEG, PNG, WebP; base64-encoded and sent to Gemini Vision
- **Text paste** — raw copy-paste fallback with instant analysis
- **Demo mode** — pre-baked CBC/LFT result, no upload required

After upload, a multi-step AI pipeline runs:
1. Gemini 2.5 Flash extracts all biomarkers with their values, units, and reference ranges
2. The extraction output is validated against a Zod schema
3. A hallucination guard strips any diagnostic language before it reaches the user
4. Results are normalized (`normalizeAnalysis.ts`) and typed as `AnalysisResult`
5. The clinical rules engine runs independently over the extracted biomarkers to detect cross-marker patterns

The dashboard renders:
- A **health score donut chart** (Recharts)
- **Animated spring-physics gauge bars** per biomarker (Framer Motion, 800ms spring)
- Color-coded status: 🟢 Normal · 🟡 Watch · 🔴 Flagged · 🚨 Critical
- Category filter bar (Blood, Liver, Kidney, Thyroid, Metabolic, Vitamin, Cardio, Electrolytes, ...)
- Expandable deep explanations per biomarker
- Detected pattern cards (cross-biomarker clinical patterns)
- Follow-up test recommendations with urgency tiers

---

### 🩻 Scan Decoder

A parallel product surface that handles medical imaging rather than numeric lab data.

Supports these modalities:
- X-Ray · CT · MRI · Ultrasound (USG) · ECG · Mammogram · DEXA · Spirometry · Endoscopy

Upload flow mirrors the lab report flow: user picks a modality and body region, grants one-time consent, then uploads. A modality-specific system prompt is selected from `scanPrompts.ts` and sent alongside the image to Gemini Vision.

Results render via `ScanResultView.tsx` with:
- A patient-safe plain-English summary
- Detected findings with significance ratings
- A "clinician brief" version for anyone bringing this to a doctor
- Explicit limitation banners (not a diagnosis, not a substitute for radiologist review)

The **Imaging Safety Pipeline** (`imagingSafety/pipeline.ts`) runs for every scan and gates output through 6 sequenced phases before any findings are shown to the user (see [Imaging Safety Pipeline](#imaging-safety-pipeline) below).

---

### 🤖 Zeno — AI Health Companion

Zeno is a RAG-powered conversational AI built on top of your report data.

**How Zeno works:**
1. User sends a message (e.g. "What does my HbA1c mean for diabetes risk?")
2. The last user message is embedded via `google/gemini-embedding-001` (768-dimensional)
3. The embedding is compared against a curated medical knowledge base stored in Supabase (`match_zeno_knowledge` RPC, pgvector cosine similarity)
4. Top 4 knowledge chunks (similarity > 0.65) are injected into the system prompt
5. Your active report (if any) is also injected as structured context
6. Gemini 2.5 Flash generates a response in JSON mode (`{ explanation, clinicalNote, emergency, sources }`)
7. A hallucination guard runs on the explanation and clinical note before display
8. The full conversation is persisted to `zeno_conversations` in Supabase for continuity

Zeno supports two modes: **Simple** (friendly, patient-facing) and **Medical** (clinical terminology, aimed at medical students or patients who want depth).

Emergency detection: if Zeno detects crisis-level language, it surfaces an emergency alert and suggests immediate action.

---

### 📈 My Health Story

For users with multiple reports, this is where longitudinal intelligence lives.

All uploaded reports are fetched from Supabase via `listReports`. The 2026 Clinical Engine adapter (`clinical2026/adapter.ts`) normalizes each `AnalysisResult` into a `RulesEngineOutput`. The `buildTrends()` function then:

- Normalizes biomarker names across labs (e.g. "Haemoglobin", "Hb", "Hemoglobin" → `hemoglobin`)
- Groups all values by normalized name across reports
- Computes trend direction (improving / worsening / stable / fluctuating / insufficient_data)
- Calculates trend percent change from first to last data point
- Generates a `trendSentence` ("Your Hemoglobin has improved by 12% since December")
- Projects crossing dates for values trending toward critical thresholds
- Renders the reference range as a green band behind the trend line

The page also surfaces a **Health Wrapped card** — a shareable annual summary card (similar to Spotify Wrapped) showing your health score change, most-improved biomarker, and most-watched category.

---

### 💬 Doctor Questions Generator

The single most-shared feature. After analysis, the AI generates 4–6 specific questions personalized to your exact values.

Not generic ("ask your doctor about your diet"). Specific ("Why is my TSH elevated at 4.8 when my free T4 is in range — could this be subclinical hypothyroidism?").

Each question:
- Is individually copyable
- Has a "Copy all" button for bulk copy
- Is designed to be screenshotted and shown to a doctor

---

### 🔗 Share & Export

Three sharing modalities:

**Shareable Link** — A 12-character token is generated server-side and stored in `share_tokens` (Supabase). The token encodes a snapshot of only the summary — never raw biomarker values. Links expire and have an access count ceiling (`max_accesses: 10`). Recipients see a "Shared View" banner with a CTA to analyze their own reports.

**WhatsApp Share** — Formats a pre-written message with the report summary and a direct link to the live demo.

**PDF Export** — Generated entirely in-browser via `window.print()`. No server involvement, no data leave the device.

**Audio Briefing** — A text-to-speech audio summary is generated and stored as an audio-type share token, allowing recipients to listen to the report findings.

---

## 🏗 Full System Architecture

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║                         BROWSER / CLIENT                                        ║
║                                                                                  ║
║  ┌─────────────────────────────────────────────────────────────────────────┐    ║
║  │                        PAGES & ROUTES (TanStack File Router)            │    ║
║  │                                                                         │    ║
║  │  /          Landing Page + Hero + HowItWorksFlow                        │    ║
║  │  /results   Results Dashboard (biomarker grid + insights)               │    ║
║  │  /scan      Scan Decoder (imaging modalities + consent gate)            │    ║
║  │  /scan-results  Scan Results View (imaging findings)                    │    ║
║  │  /zeno      Zeno AI Chat (RAG-powered health assistant)                 │    ║
║  │  /history   Report History + Trend Charts                               │    ║
║  │  /my-health-story  Longitudinal narrative + Wrapped card                │    ║
║  │  /profile   Health Snapshot (conditions, meds, blood group)             │    ║
║  │  /pricing   Plans + Credit Packs (Razorpay, INR)                        │    ║
║  │  /auth      Supabase Auth (email/password + magic link)                 │    ║
║  │  /about     About page                                                   │    ║
║  │  /s/:token  Shared view (token-gated summary or audio)                  │    ║
║  │  /privacy   Privacy policy                                               │    ║
║  └─────────────────────┬───────────────────────────────────────────────────┘    ║
║                         │                                                        ║
║  ┌─────────────────────┴───────────────────────────────────────────────────┐    ║
║  │                    CLIENT-SIDE DATA PIPELINE                            │    ║
║  │                                                                         │    ║
║  │  PDF → pdfjs-dist (dynamic import) → extractedText                      │    ║
║  │  Image → FileReader.readAsDataURL() → base64                            │    ║
║  │  Both → security/fileValidator → magic-byte check → size/type guard     │    ║
║  │  uploadStore (module-level singleton) + localStorage (report history)   │    ║
║  └─────────────────────┬───────────────────────────────────────────────────┘    ║
╚═════════════════════════╪════════════════════════════════════════════════════════╝
                          │ TanStack Server Functions (RPC over HTTP)
╔═════════════════════════╪════════════════════════════════════════════════════════╗
║              CLOUDFLARE WORKERS — EDGE RUNTIME                                   ║
║                         │                                                        ║
║  ┌──────────────────────▼────────────┐  ┌──────────────────────────────────┐   ║
║  │     analyze.functions.ts          │  │   scanAnalysis.functions.ts       │   ║
║  │   (Lab Report Pipeline)           │  │   (Scan Decoder Pipeline)         │   ║
║  │                                   │  │                                   │   ║
║  │  1. Zod input validation          │  │  1. Modality + consent check      │   ║
║  │  2. Rate limit gate               │  │  2. Zod input validation          │   ║
║  │  3. Entitlement check (quota)     │  │  3. Quota enforcement             │   ║
║  │  4. Gemini 2.5 Flash API call     │  │  4. Modality-specific prompt      │   ║
║  │     (temp: 0.1, max_tokens: 4000) │  │  5. Gemini Vision API call        │   ║
║  │  5. JSON parse + regex fallback   │  │  6. imagingSafety pipeline        │   ║
║  │  6. Hallucination guard           │  │  7. normalizeScan()               │   ║
║  │  7. Clinical rules engine         │  │  8. Cloud sync to scans table     │   ║
║  │  8. normalizeAnalysisResult()     │  └──────────────────────────────────┘   ║
║  │  9. Cloud sync → Supabase         │                                          ║
║  └───────────────────────────────────┘  ┌──────────────────────────────────┐   ║
║                                          │   zeno.functions.ts               │   ║
║  ┌───────────────────────────────────┐  │   (RAG Chat Pipeline)             │   ║
║  │   cloudSync.functions.ts          │  │                                   │   ║
║  │   (Report CRUD + Share Tokens)    │  │  1. Auth middleware                │   ║
║  │                                   │  │  2. Embed last message (768d)     │   ║
║  │  - saveReport()                   │  │  3. pgvector similarity search    │   ║
║  │  - listReports()                  │  │  4. Build context (report + RAG)  │   ║
║  │  - deleteReport()                 │  │  5. Gemini chat completion         │   ║
║  │  - createShareToken()             │  │  6. Hallucination guard           │   ║
║  │  - resolveShareToken()            │  │  7. Persist conversation          │   ║
║  └───────────────────────────────────┘  └──────────────────────────────────┘   ║
╚═════════════════════════════════════════════════════════════════════════════════╝
                          │
╔═════════════════════════╪════════════════════════════════════════════════════════╗
║                     SUPABASE (PostgreSQL + Auth + pgvector)                      ║
║                                                                                  ║
║   reports          share_tokens      zeno_conversations   scans                 ║
║   profiles         subscription_plans  credit_packs       user_entitlements     ║
║   payment_orders   zeno_knowledge (pgvector, RAG source)                        ║
║                                                                                  ║
║   Row Level Security enforced on all tables (auth.uid() policies)               ║
╚══════════════════════════════════════════════════════════════════════════════════╝
                          │
╔═════════════════════════╪════════════════════════════════════════════════════════╗
║                   EXTERNAL SERVICES                                               ║
║                                                                                  ║
║  Lovable AI Gateway ──→ google/gemini-2.5-flash (analysis, chat, scan)          ║
║  Lovable AI Gateway ──→ google/gemini-embedding-001 (RAG embeddings, 768d)      ║
║  Razorpay REST API ───→ Subscription billing + credit packs (INR)               ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

---

## 🔄 Data Flow — End to End

### Flow A: Lab Report Upload → Dashboard

```
User uploads PDF / image
        │
        ▼
validateUploadedFile()
  ├── MIME type whitelist (PDF, JPEG, PNG, WebP)
  ├── Magic byte check (actual bytes vs declared type)
  ├── Max 10MB size gate
  └── Filename sanitization (path-traversal guard)
        │
        ▼
PDF?  → pdfjs-dist (dynamic import, browser-only)
           extractTextFromPDF() → plain text string
Image? → FileReader.readAsDataURL() → base64 string
        │
        ▼
recordAttempt() — client-side sliding window rate limiter
(5 requests / 15 min, then 15-min block)
        │
        ▼
analyzeReport() ← TanStack Server Function
  [Cloudflare Worker]
  ├── Zod schema validation on input
  ├── requireSupabaseAuth middleware
  ├── checkUserQuota() — entitlements table
  ├── Gemini 2.5 Flash call (temp: 0.1)
  │     System prompt: extraction + status logic
  │     (watch = within 10% outside range, flagged = >10%)
  ├── JSON.parse() with regex fallback strip
  ├── runHallucinationGuard()
  │     ├── Rejects definitive diagnoses
  │     ├── Strips drug name recommendations
  │     └── Replaces overconfident language
  ├── runClinicalRulesEngine()
  │     ├── evaluateBiomarker() × N
  │     ├── CRITICAL_OVERRIDES check (potassium, sodium, glucose, ...)
  │     ├── Pattern matching against 15 CLINICAL_PATTERNS
  │     ├── Confidence scoring (INSUFFICIENT → HIGH)
  │     └── Priority findings + critical alerts
  ├── normalizeAnalysisResult()
  │     ├── Validates all status enums
  │     ├── Clamps numeric values to 4 decimal places
  │     ├── Adds derived biomarkers (HOMA-IR, Anion Gap)
  │     └── Stamps id + uploadedAt
  └── saveReport() → Supabase reports table
        │
        ▼
uploadStore.set(result) — module-level singleton
        │
        ▼
navigate('/results')
        │
        ▼
Results Dashboard renders:
  ├── HealthScoreCard (Recharts donut, animated)
  ├── CriticalValuesBanner (if any critical alerts)
  ├── CategoryFilterBar (horizontal scroll, hides empty)
  ├── BiomarkerGrid
  │     └── BiomarkerCard × N
  │           ├── Spring-physics gauge bar (Framer Motion, 800ms)
  │           ├── Plain English explanation (1 sentence)
  │           └── Expandable deep explanation
  ├── PatternsSection (detected clinical patterns)
  ├── FollowUpTestsSection (urgency-tagged)
  └── InsightsSection
        ├── Summary (paragraphs, first sentence bolded)
        └── DoctorQuestions (numbered, individually copyable)
```

---

### Flow B: Scan Upload → Safety Pipeline → Results

```
User selects modality (X-Ray / CT / MRI / USG / ECG / DEXA / Mammogram)
        │
        ▼
ConsentModal → hasScanConsent() gate (one-time per browser)
        │
        ▼
Image file → validateUploadedFile() → base64
        │
        ▼
analyzeScan() [Cloudflare Worker]
  ├── Zod validation + auth middleware + quota check
  ├── Select modality-specific prompt from scanPrompts.ts
  ├── Gemini Vision call (image + text prompt)
  ├── imagingSafety pipeline (12-phase):
  │     Phase 1: Input validation (MIME, resolution, screenshot detection)
  │     Phase 2: Image quality scoring (0–100, rejects below threshold)
  │     Phase 3: Anatomy detection (body region matches declared modality?)
  │     Phase 4: Finding extraction (grounded observations with locators)
  │     Phase 5: Critic pass (removes unsupported claims, adds caveats)
  │     Phase 6–12: Safety rules (blocks clinical overreach, adds deferrals)
  │     └── Output: FinalSafetyReport { decision, findings, deferrals, audit }
  └── normalizeScan() → typed ScanResult
        │
        ▼
ScanResultView renders:
  ├── SafetyDecision banner (release / release_with_caveat / defer)
  ├── Calibrated findings (with significance + confidence bands)
  ├── Patient summary (plain English)
  ├── Clinician brief (for handoff to a doctor)
  └── Explicit limitation disclaimers
```

---

### Flow C: Zeno Chat → RAG Response

```
User sends message in Zeno chat
        │
        ▼
chatWithZeno() [Cloudflare Worker]
  ├── Auth required (redirect to /auth if unauthenticated)
  ├── Zod validation on messages array (max 40 turns, 8000 chars each)
  ├── embedQuery(lastUserMessage)
  │     └── google/gemini-embedding-001 → float32[768]
  ├── supabase.rpc('match_zeno_knowledge', { query_embedding, match_count: 4 })
  │     └── pgvector cosine similarity, threshold: 0.65
  ├── buildSystemPrompt({ mode, report, knowledgeChunks })
  │     ├── Simple mode: patient-friendly, no clinical jargon
  │     ├── Medical mode: clinical terminology, deeper pathophysiology
  │     ├── Injects report context (biomarkers + summary) if present
  │     └── Injects top RAG knowledge chunks
  ├── Gemini 2.5 Flash chat completion
  │     (temp: 0.3, JSON mode: { explanation, clinicalNote, emergency, sources })
  ├── guardHallucinations() on explanation + clinicalNote
  ├── emergencyDetector() → surfaces crisis alert if triggered
  └── Persist to zeno_conversations (upsert on conversationId)
        │
        ▼
Zeno chat UI renders response:
  ├── Explanation text
  ├── Clinical note (if medical mode)
  ├── Source citations
  └── Emergency banner (if emergency: true)
```

---

### Flow D: My Health Story — Longitudinal Trends

```
listReports() → all reports from Supabase for this user
        │
        ▼
adaptAnalysisResult() × N
  └── Converts AnalysisResult → RulesEngineOutput (2026 engine format)
        │
        ▼
buildTrends(reports)
  ├── Normalize biomarker names (aliases → canonical name)
  ├── Group data points by canonical name across all reports
  ├── For each biomarker with ≥ 2 data points:
  │     ├── Calculate trend direction
  │     ├── Calculate percent change (first → last)
  │     ├── Generate trendSentence
  │     ├── Project crossing date (if trending toward critical range)
  │     └── Reference range (green band)
  └── buildNarrativeSummary()
        ├── improved: biomarkers trending positively
        ├── worsened: biomarkers trending negatively
        ├── stable: within ±5% over all readings
        ├── headline + bigPicture text
        ├── oneThatMattersMost (highest urgency + worst trend)
        ├── healthScoreChange (latest vs first)
        └── HealthWrapped card data
        │
        ▼
My Health Story page renders:
  ├── NarrativeHero (headline + summary)
  ├── BiomarkerTrend selector
  ├── AnnotatedTrendChart (Recharts line + reference band)
  ├── TrendSection (improved / worsened / stable grouped)
  └── HealthWrappedCard (shareable annual summary)
```

---

## 🧠 Clinical Intelligence Engine

ReportRx's analytical backbone goes well beyond a simple "high/low" check. There are two parallel engines:

### Layer 1 — Extraction + Status Classification (Gemini-Powered)

The AI extraction prompt instructs Gemini to classify each biomarker's status using a precise threshold:

```
Status Logic:
  'normal'  → value within reference range
  'watch'   → within 10% outside reference range on either side
  'flagged' → more than 10% outside range OR clinically significant (e.g. TSH > 4.0 even at 4.1)
  'critical'→ beyond absolute override thresholds (see Layer 2)
```

Every extraction runs at **temperature: 0.1** — the lowest setting that still allows flexible text parsing, chosen deliberately to minimize hallucination variance on medical data.

### Layer 2 — Clinical Rules Engine (Deterministic, Code-Driven)

After Gemini extraction, a deterministic TypeScript rules engine runs independently over the extracted biomarkers. This layer catches multi-marker clinical patterns that a per-biomarker LLM pass would miss.

**Absolute Critical Overrides** (bypass lab reference ranges):

| Biomarker | Critical Low | Critical High | Reason |
|---|---|---|---|
| Hemoglobin | < 7.0 g/dL | > 20.0 g/dL | Transfusion territory |
| WBC | < 2.0 ×10³/µL | > 30.0 ×10³/µL | Leukopenia / leukemia screen |
| Platelets | < 50 ×10³/µL | > 1000 ×10³/µL | Bleeding / thrombosis risk |
| Glucose | < 50 mg/dL | > 500 mg/dL | Hypoglycemia / DKA |
| Potassium | < 2.5 mEq/L | > 6.5 mEq/L | Cardiac arrhythmia risk |
| Sodium | < 120 mEq/L | > 160 mEq/L | Seizure / osmotic emergency |
| Creatinine | — | > 10 mg/dL | Uremia / dialysis threshold |

**Detected Patterns** (examples from `clinicalPatterns.ts`):

| Pattern ID | Key Biomarkers Required | Confidence Threshold |
|---|---|---|
| `microcytic_hypochromic_anemia` | Hb↓ + MCV↓ + MCHC↓ | MODERATE |
| `normocytic_anemia` | Hb↓ + MCV normal | MODERATE |
| `macrocytic_anemia` | Hb↓ + MCV↑ | MODERATE |
| `iron_deficiency_pattern` | Ferritin↓ + Serum Iron↓ | HIGH |
| `metabolic_syndrome` | Glucose↑ + Triglycerides↑ + HDL↓ | MODERATE |
| `hypothyroidism_pattern` | TSH↑ + FT4↓ | MODERATE |
| `hepatocellular_pattern` | ALT↑↑ + AST↑↑ | HIGH |
| `cholestatic_pattern` | ALP↑ + GGT↑ | MODERATE |
| `diabetic_control_poor` | HbA1c > 7.0% | LOW |
| `vitamin_d_deficiency` | 25-OH-VitD < 20 | LOW |
| ... 15+ more | | |

Each pattern evaluation returns:
- `confidenceLevel`: INSUFFICIENT → LOW → MODERATE → HIGH
- `confidenceScore`: 0–100 numeric score
- `supportingEvidence`: which biomarkers fired for this pattern
- `conflictingEvidence`: which biomarkers contradict it
- `canDisplay`: only true when confidence meets the pattern's `canConcludeAt` threshold
- `clinicalPriority`: 1–5 urgency scale

Patterns are sorted by `clinicalPriority × (confidenceScore / 100)` before rendering, so the highest-urgency, highest-confidence patterns always surface first.

### Layer 3 — Hallucination Guard (Safety Net)

A regex-based text scanner runs on **every AI output** before it touches the UI:

**CRITICAL severity** (triggers full text replacement with safe fallback):
- Any definitive diagnosis ("You have anemia", "You have diabetes")
- Drug/medication recommendations ("Take iron supplements", "Start metformin")
- Confirmed/definitive findings language

**HIGH severity** (replaces matched phrase inline):
- Overconfident language ("this is definitely", "no doubt", "without question")
- Alarming outcome predictions ("this will lead to severe...")

If any CRITICAL violation is detected, the AI's output is **entirely replaced** with a safe fallback paragraph that acknowledges findings without asserting diagnoses.

### Layer 4 — Imaging Safety Pipeline (12-Phase for Scans)

Every scan result passes through a staged safety pipeline before any findings reach the user:

```
Phase 1:  Input Validation   → MIME type, resolution, screenshot detection
Phase 2:  Quality Scoring    → 0–100 score; defers if inadequate
Phase 3:  Anatomy Detection  → Does the image match the declared modality?
Phase 4:  Finding Extraction → Grounded observations with image locators
Phase 5:  Critic Pass        → Removes unsupported claims, adds caveats
Phase 6:  Safety Rules       → Hardcoded blocks for clinical overreach
Phases 7–12: Audit trail + final decision (release / release_with_caveat / defer)
```

If the pipeline reaches a `defer` decision, the user sees a clear explanation of why the image could not be reliably interpreted, rather than an unreliable result.

---

## 🔒 Security Architecture

Security is not an afterthought — it is layered at every boundary.

### Upload Security
- **Magic byte validation**: Files are sniffed at the byte level. A renamed `.exe` claiming to be a JPEG is rejected at the first `0xFF 0xD8` check.
- **Filename sanitization**: Path-traversal characters (`../`, `\`, `:`, `<`, `>`, null bytes) are blocked.
- **Size limit**: 10MB hard ceiling enforced before any bytes are read.
- **MIME whitelist**: Only `image/jpeg`, `image/png`, `image/webp`, `application/pdf`.

### Rate Limiting
Client-side sliding window rate limiter (`security/rateLimiter.ts`):
- Auth endpoints: 5 attempts per 15 minutes, then 15-minute block
- Upload endpoints: configurable per context
- Backed by `localStorage` with a safe-read wrapper (returns empty bucket on failure)

> Note: This is a UX guard against accidental abuse. Server-side Supabase Auth rate limiting is the security source of truth.

### API Security
- All server functions use `requireSupabaseAuth` middleware — no authenticated data is accessible without a valid Supabase JWT
- Every input is validated through a Zod schema before any business logic runs
- Razorpay webhook uses HMAC-SHA256 signature verification before processing any payment events
- Share tokens are stored server-side; the client never holds private data

### Database Security
- Row Level Security (RLS) enforced on **every table**
- All user data policies follow the pattern: `USING (auth.uid() = user_id)`
- `share_tokens` table has no user-facing RLS — all access goes through service-role server functions only
- `subscription_plans` and `credit_packs` are read-only for `anon` and `authenticated` roles

### AI Output Safety
- Hallucination guard on every text output before UI render (see [Layer 3](#layer-3--hallucination-guard-safety-net))
- Scan imaging safety pipeline with 6 gated phases (see [Layer 4](#layer-4--imaging-safety-pipeline-12-phase-for-scans))
- Emergency detector on Zeno responses
- Results and history pages are `noindex` — never crawled by search engines

---

## 🗄 Database Schema

```sql
-- Core Report Store
reports (
  id UUID PRIMARY KEY,
  user_id UUID → auth.users,
  created_at TIMESTAMPTZ,
  report_date TEXT,
  lab_name TEXT,
  patient_name TEXT,
  status_counts JSONB,     -- { normal: N, watch: N, flagged: N }
  biomarkers JSONB,        -- Biomarker[]
  summary TEXT,
  doctor_questions JSONB,  -- string[]
  content_warning TEXT
)

-- Scan Results (Imaging Decoder)
scans (
  id UUID PRIMARY KEY,
  user_id UUID → auth.users,
  modality TEXT,           -- 'xray' | 'ct' | 'mri' | 'ultrasound' | 'ecg' | ...
  body_region TEXT,
  result JSONB,            -- ScanResult (normalized)
  created_at TIMESTAMPTZ
)

-- Expiring Share Links
share_tokens (
  token TEXT PRIMARY KEY,  -- 12-char random alphanumeric
  report_id UUID → reports,
  share_type TEXT,         -- 'summary' | 'audio'
  expires_at TIMESTAMPTZ,
  accessed_count INT,
  max_accesses INT DEFAULT 10,
  snapshot JSONB           -- encoded summary or audio data (never raw biomarkers)
)

-- Zeno Conversations (AI Health Chat)
zeno_conversations (
  id UUID PRIMARY KEY,
  user_id UUID → auth.users,
  report_id UUID (nullable),
  mode TEXT,               -- 'simple' | 'medical'
  messages JSONB,          -- { role, content }[]
  emergency_detected BOOLEAN,
  created_at TIMESTAMPTZ
)

-- Zeno Knowledge Base (pgvector RAG)
zeno_knowledge (
  id UUID PRIMARY KEY,
  title TEXT,
  content TEXT,
  source TEXT,
  embedding vector(768)    -- Gemini embedding-001
)

-- User Health Profile
profiles (
  user_id UUID PRIMARY KEY → auth.users,
  full_name TEXT,
  age TEXT,
  sex TEXT,
  blood_group TEXT,
  phone TEXT,
  conditions JSONB,        -- string[] (diabetes, hypertension, ...)
  medications TEXT,
  emergency_contact JSONB,
  avatar_url TEXT
)

-- Billing & Entitlements
subscription_plans (code TEXT PK, name, price_inr_paise, monthly_report_quota, features JSONB)
credit_packs       (code TEXT PK, name, credits INT, price_inr_paise)
user_entitlements  (user_id UUID PK, plan_code, credit_balance, reports_used_this_period)
payment_orders     (id UUID PK, user_id, razorpay_order_id, kind, status, amount_paise)
```

All tables enforce **Row Level Security**. A new user's entitlements row (set to `free`) is created automatically via a `BEFORE INSERT` trigger on `auth.users`.

---

## 🛠️ Tech Stack — With Rationale

| Layer | Choice | Why This, Not the Default |
|---|---|---|
| **Framework** | TanStack Start | SSR with type-safe file-based routing; server functions run as Cloudflare Workers with zero config. React Router or Next.js would require separate API routes and lose the colocation advantage. |
| **Runtime** | Cloudflare Workers | Edge-deployed, sub-5ms cold starts globally. Vercel Serverless would add 200–800ms cold start latency to every AI call. |
| **AI Model** | Gemini 2.5 Flash | Best cost-to-capability ratio for structured medical data extraction in 2026. Temperature 0.1 for extraction (determinism), 0.3 for chat (natural variation). |
| **AI Gateway** | Lovable AI Gateway | Handles API key management, rate limiting, and model routing. Direct Gemini API access would require exposing keys on the client. |
| **Auth + DB** | Supabase | Postgres with built-in RLS, real-time, and pgvector for RAG — all in one. Rolling a separate auth service + managed Postgres + vector DB would add 3× infra complexity. |
| **Vector Search** | pgvector (Supabase) | Cosine similarity for Zeno RAG, co-located with the rest of the data. Pinecone or Weaviate would add a third service. |
| **Styling** | Tailwind CSS v4 | Custom `@theme` token system for brand consistency. v4's `@layer` model removes the need for a `tailwind.config.js` entirely. |
| **Animations** | Framer Motion | Spring-physics gauges and stagger reveals. CSS transitions alone cannot produce the 800ms spring feel on the gauge bars. |
| **Charts** | Recharts | Composable, SSR-safe, and easy to overlay reference range bands behind line charts for the trend views. |
| **PDF Extraction** | pdfjs-dist | Client-side PDF text extraction via dynamic import — no server upload, no data retention risk. |
| **Payments** | Razorpay | India-first payment gateway with UPI, net banking, and card support. Stripe lacks deep UPI integration for Indian users. |
| **i18n** | react-i18next | Full UI translation into EN / TA / HI / TE with browser auto-detection. |
| **Form Validation** | Zod + React Hook Form | End-to-end type safety from DB → server fn → client form — one schema, one source of truth. |
| **Security** | DOMPurify | Sanitizes any HTML that might appear in user-generated content before DOM injection. |

---

## 📁 Project Structure

```
reportrx/
├── public/
│   └── favicon.svg
│
├── src/
│   ├── components/
│   │   ├── auth/               # AuthForm, AuthHeroPanel, ReportDemoCard
│   │   ├── history/            # ReportHistoryList, ScanHistoryList, TrendChart, ClearAllModal
│   │   ├── imagingSafety/      # SafetyReportView (scan result renderer)
│   │   ├── landing/            # HeroPreviewCard, HowItWorksFlow, ResultsTeaser, ScrollReveal
│   │   ├── layout/             # Navbar, Footer, PageWrapper, ErrorBoundary, LanguageSwitcher
│   │   ├── profile/            # HealthSnapshotCard
│   │   ├── results/            # Full results dashboard:
│   │   │   ├── BiomarkerCard.tsx       # Gauge bar + plain English + expandable deep explanation
│   │   │   ├── BiomarkerGrid.tsx       # Responsive grid wrapper
│   │   │   ├── CategoryFilterBar.tsx   # Horizontal scroll category pills
│   │   │   ├── CriticalValuesBanner.tsx # Critical alert strip
│   │   │   ├── FollowUpTestsSection.tsx # Urgency-tagged follow-up tests
│   │   │   ├── HealthScoreCard.tsx     # Recharts donut + score
│   │   │   ├── InsightsSection.tsx     # Summary + doctor questions
│   │   │   ├── LoadingScreen.tsx       # Animated analysis stages
│   │   │   ├── MixedContentBanner.tsx  # Warning for partially-parsed results
│   │   │   ├── PatternsSection.tsx     # Clinical pattern cards
│   │   │   ├── ResultsFlowGraphic.tsx  # Architecture flow graphic (landing)
│   │   │   ├── ResultsHeader.tsx       # Metadata + status pills + action buttons
│   │   │   ├── SavedBanner.tsx         # "Saved to your account" confirmation
│   │   │   ├── ShareModal.tsx          # Share link + WhatsApp + PDF + Audio
│   │   │   ├── AudioPlayer.tsx         # Audio briefing playback
│   │   │   ├── AudioShareView.tsx      # Audio share page for recipients
│   │   │   └── WaveformVisualizer.tsx  # Audio waveform animation
│   │   ├── rx/                 # Design system primitives: Button, Badge, Card, Tabs
│   │   ├── scan/               # ConsentModal, ModalityPicker, ScanResultView
│   │   ├── share/              # SharedSummaryView (recipient view)
│   │   ├── theme/              # ThemeProvider, ThemeToggle (dark / light)
│   │   ├── ui/                 # Full shadcn/ui component set (accordion → tooltip)
│   │   └── v2/                 # Health Story views: NarrativeHero, AnnotatedTrendChart,
│   │                           # TrendSection, HealthWrappedCard
│   │
│   ├── hooks/
│   │   ├── useAuth.ts          # Supabase auth state subscription
│   │   ├── useFileUpload.ts    # Upload state, drag/drop, PDF extraction, rate limit
│   │   ├── useReportAnalysis.ts # AI call orchestration, status counts, category filter
│   │   └── zeno/
│   │       └── useZeno.ts      # Zeno chat state (messages, send, mode, reset)
│   │
│   ├── lib/
│   │   ├── analyze.functions.ts      # Lab report pipeline (Cloudflare Worker)
│   │   ├── scanAnalysis.functions.ts # Scan decoder pipeline (Cloudflare Worker)
│   │   ├── cloudSync.functions.ts    # Report CRUD + share token server functions
│   │   ├── scanCloudSync.functions.ts # Scan CRUD server functions
│   │   ├── share.functions.ts        # Share token resolution
│   │   │
│   │   ├── clinicalEngine/           # Layer 2: Deterministic rules engine
│   │   │   ├── rulesEngine.ts        # CRITICAL_OVERRIDES, URGENCY_MAP, pattern runner
│   │   │   ├── clinicalPatterns.ts   # 15+ CLINICAL_PATTERNS definitions
│   │   │   ├── biomarkerNormalizer.ts # Alias → canonical name mapping
│   │   │   ├── hallucinationGuard.ts  # Regex-based safety net (CRITICAL / HIGH)
│   │   │   ├── extractionPrompt.ts   # Gemini extraction system prompt
│   │   │   ├── synthesisPrompt.ts    # Gemini summary + doctor Q system prompt
│   │   │   └── types.ts             # Engine-specific TypeScript interfaces
│   │   │
│   │   ├── clinical2026/             # Layer 3: 2026 longitudinal engine
│   │   │   ├── adapter.ts            # Bridge: AnalysisResult → RulesEngineOutput
│   │   │   ├── amIOkay.ts            # Am I Okay? 5-tier wellness verdict
│   │   │   ├── fallbacks.ts          # Safe defaults for missing data
│   │   │   ├── healthScore.ts        # Composite health score (0–100) + grade
│   │   │   ├── intent.ts             # HealthIntent config (cholesterol, thyroid, etc.)
│   │   │   ├── narrative.ts          # buildTrends() + buildNarrativeSummary()
│   │   │   ├── personalPlan.ts       # 7-day / 30-day / doctor action items
│   │   │   ├── polarity.ts           # Higher-better vs lower-better vs in-range
│   │   │   ├── priorityStack.ts      # Sort priority items by urgency × deviation
│   │   │   └── types.ts             # Full 2026 type system
│   │   │
│   │   ├── imagingSafety/            # Layer 4: 12-phase imaging pipeline
│   │   │   ├── pipeline.ts           # Full pipeline orchestration
│   │   │   ├── imagingSafety.functions.ts # Server function wrapper
│   │   │   └── types.ts             # FinalSafetyReport, CalibratedFinding, etc.
│   │   │
│   │   ├── zeno/                     # RAG chat engine
│   │   │   ├── zeno.functions.ts     # chatWithZeno server function
│   │   │   ├── contextBuilder.ts     # System prompt assembly (mode + report + RAG)
│   │   │   ├── emergencyDetector.ts  # Crisis language detection
│   │   │   ├── hallucinationGuard.ts # Zeno-specific output guard
│   │   │   ├── responseParser.ts     # JSON → ZenoResponse type
│   │   │   └── types.ts
│   │   │
│   │   ├── billing/
│   │   │   └── razorpay.server.ts    # Razorpay REST + HMAC webhook verification
│   │   │
│   │   ├── security/
│   │   │   ├── fileValidator.ts      # Magic byte + MIME + filename validation
│   │   │   ├── rateLimiter.ts        # Sliding window rate limiter (localStorage)
│   │   │   ├── sanitize.ts           # DOMPurify wrapper
│   │   │   ├── securityHeaders.ts    # CSP + HSTS header helpers
│   │   │   └── storagePath.ts        # Safe key generation for storage
│   │   │
│   │   ├── normalizeAnalysis.ts      # AnalysisResult normalization + derived markers
│   │   ├── normalizeScan.ts          # ScanResult normalization
│   │   ├── clinicalDerivations.ts    # HOMA-IR, Anion Gap, eGFR (client-side)
│   │   ├── pdfExtract.ts             # Browser-only pdfjs-dist wrapper
│   │   ├── pdfSummary.ts             # window.print() PDF generation
│   │   ├── uploadStore.ts            # Module-level store + localStorage history
│   │   ├── scanStore.ts              # Module-level scan store
│   │   ├── shareCodec.ts             # Token encode / decode
│   │   ├── relativeTime.ts           # "2 days ago" formatter
│   │   ├── sampleResult.ts           # Pre-baked CBC/LFT demo result
│   │   ├── audioService.ts           # TTS audio generation
│   │   └── validators.ts             # Basic file type + size validation
│   │
│   ├── routes/
│   │   ├── __root.tsx           # Root layout + ThemeProvider + i18n init
│   │   ├── index.tsx            # / → LandingPage
│   │   ├── results.tsx          # /results → Results dashboard
│   │   ├── results-v2.tsx       # /results-v2 → Enhanced results (v2 features)
│   │   ├── scan.tsx             # /scan → Scan decoder
│   │   ├── scan-v2.tsx          # /scan-v2 → Enhanced scan (v2 UI)
│   │   ├── scan-results.tsx     # /scan-results → Scan results view
│   │   ├── zeno.tsx             # /zeno → AI health chat
│   │   ├── history.tsx          # /history → Report + scan history
│   │   ├── my-health-story.tsx  # /my-health-story → Longitudinal trends
│   │   ├── profile.tsx          # /profile → Health profile editor
│   │   ├── pricing.tsx          # /pricing → Plans + credit packs
│   │   ├── auth.tsx             # /auth → Login / signup
│   │   ├── auth.reset-password.tsx
│   │   ├── about.tsx
│   │   ├── privacy.tsx
│   │   ├── s.$token.tsx         # /s/:token → Shared summary view
│   │   └── api/public/
│   │       └── razorpay-webhook.ts  # POST /api/public/razorpay-webhook
│   │
│   ├── types/
│   │   ├── report.ts            # AnalysisResult, Biomarker, UploadState, ...
│   │   ├── scan.ts              # ScanResult, ImageScanModality, BodyRegion, ...
│   │   └── profile.ts           # ProfileData
│   │
│   ├── pages/
│   │   └── LandingPage.tsx
│   │
│   ├── routeTree.gen.ts         # Auto-generated by TanStack Router (do not edit)
│   ├── router.tsx
│   ├── server.ts                # Cloudflare Worker entry
│   ├── start.ts
│   └── styles.css               # Tailwind v4 @theme tokens + global styles
│
├── supabase/
│   ├── config.toml
│   └── migrations/              # 14 ordered migration files (2026-05 → 2026-06)
│
├── .env.example
├── bunfig.toml
├── components.json              # shadcn/ui config
├── eslint.config.js
├── tsconfig.json                # Strict mode enabled
├── vite.config.ts
├── wrangler.jsonc               # Cloudflare Workers config
└── vercel.json                  # Vercel deployment fallback
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** (or Bun — `bunfig.toml` is included)
- A **Lovable account** for the AI Gateway key (or a direct Gemini API key)
- A **Supabase project** (free tier works)
- A **Razorpay account** (optional — payments are suspended in config by default)

### Installation

```bash
# Clone the repository
git clone https://github.com/lokeshwaran233-commits/health-report-decoder.git
cd health-report-decoder

# Install dependencies
npm install
# or with Bun:
bun install

# Set up environment variables
cp .env.example .env.local
# → Fill in LOVABLE_API_KEY and SUPABASE_* values (see below)

# Apply database migrations
npx supabase db push
# or connect to your Supabase project and run migrations in order from supabase/migrations/

# Start the development server
npm run dev
# → Opens at http://localhost:3000

# Try it instantly — no upload needed:
# Click "Try with a sample CBC report →" on the landing page
```

### Build & Deploy

```bash
# Production build (Cloudflare Workers)
npm run build

# Preview production bundle locally
npm run preview

# Lint
npm run lint

# Format
npm run format
```

The project deploys to Cloudflare Workers via the `@cloudflare/vite-plugin`. A `vercel.json` is included as a deployment fallback.

---

## 🔑 Environment Variables

```env
# ── AI Gateway ───────────────────────────────────────────────────────────────
LOVABLE_API_KEY=your_lovable_ai_gateway_key
# Proxies all Gemini calls. Handles key rotation, rate limits, and billing.

# ── Supabase ─────────────────────────────────────────────────────────────────
SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...           # Safe for client exposure (RLS enforced)
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # Server-only. Never expose to client.

# ── Razorpay (optional — PAYMENTS_ENABLED = false by default) ────────────────
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=your_secret
# Webhook signature: HMAC-SHA256 verified server-side before any order update.
```

> The `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS. It is used only in server functions (Cloudflare Worker context). Never import `client.server.ts` from a client component.

---

## 🎨 Design System

Custom Tailwind v4 `@theme` token system defined in `src/styles.css`:

| Token | Value | Usage |
|---|---|---|
| `--color-brand-teal` | `#0F6E56` | Primary actions, normal biomarker state |
| `--color-brand-teal-mid` | `#1D9E75` | Hover states, active category pills |
| `--color-brand-amber` | `#EF9F27` | Watch / borderline biomarkers |
| `--color-brand-coral` | `#D85A30` | Flagged / danger biomarkers |
| `--color-brand-critical` | `#B91C1C` | Critical value banners |
| `--color-brand-surface` | `#FAFAF8` | Page background (off-white, easy on the eyes) |
| `--color-brand-card` | `#FFFFFF` | Card surfaces |
| `--color-brand-dark` | `#1a1a18` | Primary text |
| `--color-brand-muted` | `#6B7280` | Secondary text, metadata |
| `--color-brand-border` | `#E5E7EB` | Card and input borders |
| `--radius-card` | `12px` | Consistent card radius |

The `rx/` component folder contains a minimal primitive layer (Button, Badge, Card, Tabs) that sits above shadcn/ui and enforces the brand tokens on every surface.

---

## ♿ Accessibility

WCAG AA compliance throughout:

- All icons have `aria-label` or `aria-hidden="true"`
- Gauge bars: `role="img"` with descriptive `aria-label` including value and status
- Drag-drop zone: `role="button"` + keyboard `Enter` / `Space` activation
- Error messages: `role="alert"` + `aria-live="polite"`
- Share modal: `role="dialog"` + `aria-modal` + focus trap + `Escape` to close
- All animations respect `prefers-reduced-motion`
- Minimum 44×44px tap targets (mobile WCAG AA)
- Color contrast: all text ≥ 4.5:1 against background

---

## 💳 Pricing Model

Payments are currently suspended (`PAYMENTS_ENABLED = false` in `pricing.tsx`). The billing schema, Razorpay integration, and entitlements system are fully wired and can be activated with a single flag flip.

| Plan | Price | Key Limits |
|---|---|---|
| **Free** | ₹0 | 1 report / month |
| **Plus** | ₹199 / month | Unlimited reports · Full history · Zeno chat |
| **Pro** | ₹499 / month | Everything in Plus · Family profiles (5) · PDF + Audio exports |

**Credit Packs** (pay-per-use, no subscription):

| Pack | Credits | Price |
|---|---|---|
| Single Report | 1 | ₹49 |
| 5-Report Pack | 5 | ₹199 |
| 20-Report Pack | 20 | ₹499 |

Payments use Razorpay (UPI, net banking, cards). Each payment triggers a webhook that is HMAC-SHA256 verified before fulfilling the user's `credit_balance` or `plan_code`.

---

## 🗺 Roadmap

**Near-term:**
- [ ] Activate Razorpay payments (one flag flip)
- [ ] WhatsApp bot for direct report upload (no app needed)
- [ ] Expanded Zeno knowledge base (disease-specific protocol guides)
- [ ] OCR improvement for low-quality scanned lab reports

**Mid-term:**
- [ ] B2B API for diagnostic labs to embed as a patient-facing layer
- [ ] Integration with Apollo 24/7 and PharmEasy report formats
- [ ] Doctor-facing dashboard with clinical notation export
- [ ] Medication interaction checker against flagged biomarker values

**Long-term:**
- [ ] Real-time report sharing with end-to-end encryption
- [ ] Expanded language support (Kannada, Malayalam, Bengali)
- [ ] Personal health coach mode (longitudinal AI nudges based on trend data)

---

## 👤 Author

**Lokesh Waran**  
Postgraduate Gold Medallist — Biochemistry, University of Madras, Chennai, India

- 🎓 M.Sc Biochemistry (Gold Medal) — University of Madras
- 🏥 Clinical Data Management (CDM) & GCP Certified
- 💼 Aspiring AI Product Manager | HealthTech Builder
- 🌍 Based in Chennai, Tamil Nadu 🇮🇳
- 🔗 [GitHub](https://github.com/lokeshwaran233-commits) · [LinkedIn](#)

> Every biomarker threshold, every plain-English explanation, every doctor question, and every clinical pattern in ReportRx is grounded in biochemistry — not just prompt engineering. The hallucination guard exists not because AI is unreliable, but because medical communication demands a higher standard of certainty than general text generation. That constraint is baked into the architecture at every layer.

---

## 📄 License

MIT © 2026 Lokesh Waran

---

<div align="center">

**Built with 🩺 domain expertise · ⚡ TanStack Start · 🤖 Gemini AI · ☁️ Cloudflare Workers · 🐘 Supabase**

*If this helped you understand your lab report, share it with someone who needs it.*

<br/>

[![Live Demo](https://img.shields.io/badge/🌐_Try_It_Now-report--insight--decoder.lovable.app-0F6E56?style=for-the-badge)](https://report-insight-decoder.lovable.app)
[![Watch Demo](https://img.shields.io/badge/🎬_Watch_Demo-Loom-625DF5?style=for-the-badge&logo=loom&logoColor=white)](https://www.loom.com/share/42b7952f0ae44de78faf2575282a3560)
[![Star on GitHub](https://img.shields.io/badge/⭐_Star_on-GitHub-181717?style=for-the-badge&logo=github)](https://github.com/lokeshwaran233-commits/health-report-decoder)
[![Share on WhatsApp](https://img.shields.io/badge/📲_Share-WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://wa.me/?text=Check%20out%20ReportRx%20%E2%80%94%20it%20explains%20your%20lab%20report%20in%20plain%20English!%20https%3A%2F%2Freport-insight-decoder.lovable.app)

</div>
