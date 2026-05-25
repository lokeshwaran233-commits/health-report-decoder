<div align="center">

<img src="https://img.shields.io/badge/ReportRx-Your%20Lab%20Report%2C%20Finally%20Explained-0F6E56?style=for-the-badge&logoColor=white" alt="ReportRx" />

<br/><br/>

<img src="https://img.shields.io/badge/Built%20With-Lovable-7F77DD?style=flat-square" />
<img src="https://img.shields.io/badge/AI-Google%20Gemini%202.5%20Flash-4285F4?style=flat-square&logo=google" />
<img src="https://img.shields.io/badge/Stack-TanStack%20%2B%20Cloudflare-F97316?style=flat-square" />
<img src="https://img.shields.io/badge/TypeScript-Strict%20Mode-3178C6?style=flat-square&logo=typescript" />
<img src="https://img.shields.io/badge/Status-Live-1D9E75?style=flat-square" />
<img src="https://img.shields.io/badge/License-MIT-888780?style=flat-square" />

<br/><br/>

# 🩺 ReportRx

### *Your lab report, finally explained.*

**Upload any blood test or medical report. Get animated visual gauges, plain-English insights, and the exact questions to ask your doctor — in under 30 seconds.**

<br/>

[🚀 Live Demo](https://report-insight-decoder.lovable.app) · [🎬 Watch Demo Video](#-demo) · [📋 Features](#-features) · [🛠 Tech Stack](#️-tech-stack) · [🏗 Architecture](#-architecture) · [👤 Author](#-author)

<br/>

---

</div>

## 🎬 Demo

> **See ReportRx in action — full walkthrough of the upload → analysis → dashboard flow.**

[![Watch the Demo on Loom](https://img.shields.io/badge/Watch%20Demo-Loom%20Video-625DF5?style=for-the-badge&logo=loom&logoColor=white)](https://www.loom.com/share/42b7952f0ae44de78faf2575282a3560)

📽️ **[https://www.loom.com/share/42b7952f0ae44de78faf2575282a3560](https://www.loom.com/share/42b7952f0ae44de78faf2575282a3560)**

> Covers: report upload → AI extraction → biomarker dashboard → doctor questions → history & trends → share/export flow.

---

## 🎯 The Problem

When patients receive a CBC, LFT, or thyroid panel, they see values like:

```
Haemoglobin:  10.8 g/dL    [Ref: 12.0 - 16.0]  ⚠️ LOW
TSH:          4.8 μIU/mL   [Ref: 0.4 - 4.0]    ⚠️ HIGH
Vitamin D:    14.2 ng/mL   [Ref: 30 - 100]      🚨 DEFICIENT
```

And have **no idea what any of it means.**

They spend hours Googling each value in isolation, landing on alarming clinical articles written for doctors — not patients. Diagnostic labs give you a number. Nobody gives you understanding.

**ReportRx fills that gap.**

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 📄 Smart Upload
- Drag & drop PDF or image lab reports
- Client-side PDF text extraction via `pdfjs-dist`
- Image OCR via Gemini Vision API
- Paste raw text fallback
- Instant pre-baked demo — no upload needed

</td>
<td width="50%">

### 📊 Visual Gauge Dashboard
- Animated spring-physics gauge bars per biomarker
- Exact value positioned on reference range track
- Color-coded: 🟢 Normal · 🟡 Watch · 🔴 Flagged
- Category filters: Blood, Liver, Kidney, Thyroid, Metabolic, Vitamin

</td>
</tr>
<tr>
<td width="50%">

### 🤖 AI-Powered Insights
- Plain-English explanation per biomarker (1 sentence)
- Deep biological explanation on expand
- 3–4 paragraph overall report summary
- Connected findings (e.g. low Hb + low MCV = iron deficiency pattern)

</td>
<td width="50%">

### 💬 Doctor Questions Generator
- 4–6 specific, intelligent questions based on YOUR values
- Copy individual questions or all at once
- Designed to be screenshotted and brought to appointments
- The single most viral feature in the product

</td>
</tr>
<tr>
<td width="50%">

### 📈 History & Trends
- All reports stored locally — complete privacy, zero server storage
- Biomarker trend charts across multiple uploads (Recharts)
- Normal range shown as green band behind trend line
- Delete individual reports or clear all history

</td>
<td width="50%">

### 🔗 Share & Export
- Share summary via WhatsApp with pre-formatted message
- Shareable link with base64-encoded summary
- Clean PDF download via browser print API
- Shared view banner for recipients with CTA

</td>
</tr>
</table>

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Framework** | TanStack Start + TypeScript (strict) | SSR + type-safe file routing |
| **Styling** | Tailwind CSS v4 with custom `@theme` tokens | Design system consistency |
| **Runtime** | Cloudflare Workers | Edge performance, zero cold starts |
| **AI** | Google Gemini 2.5 Flash via Lovable AI Gateway | Fast, accurate structured output |
| **Charts** | Recharts | Animated donut + line trend charts |
| **Animations** | Framer Motion | Spring-physics gauges, stagger reveals |
| **PDF Extraction** | pdfjs-dist (dynamic import, browser-only) | Client-side, no server upload needed |
| **Icons** | Lucide React | Consistent, accessible icon set |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                      │
│                                                             │
│  LandingPage → UploadCard → useFileUpload hook              │
│       │                           │                         │
│  PDF extraction              Image → base64                  │
│  (pdfjs-dist, dynamic)      (browser only)                  │
│       │                           │                         │
│       └──────────┬────────────────┘                        │
│                  ↓                                          │
│            uploadStore (module-level store)                 │
│            + localStorage (report history, max 20)          │
│                  │                                          │
└──────────────────┼──────────────────────────────────────────┘
                   │ TanStack Server Function
┌──────────────────┼──────────────────────────────────────────┐
│              CLOUDFLARE WORKER                              │
│                  ↓                                          │
│         analyze.functions.ts                                │
│         ├─ Zod input validation                             │
│         ├─ Gemini 2.5 Flash API call (temp: 0.1)           │
│         ├─ JSON parse + regex fallback                      │
│         ├─ normalizeAnalysisResult()                        │
│         └─ Typed errors: PARSE_ERROR                        │
│                           NO_DATA_FOUND                     │
│                           API_ERROR                         │
└─────────────────────────────────────────────────────────────┘
                   │
┌──────────────────┼──────────────────────────────────────────┐
│              RESULTS DASHBOARD                              │
│                                                             │
│  HealthScoreCard (Recharts donut)                           │
│  ResultsHeader (metadata + status pills + actions)          │
│  CategoryFilterBar (horizontal scroll, hide empty)          │
│  BiomarkerGrid                                              │
│    └─ BiomarkerCard × N                                     │
│         ├─ Animated gauge bar (spring physics 800ms)        │
│         ├─ Plain English explanation                        │
│         └─ Expandable deep explanation                      │
│  InsightsSection                                            │
│    ├─ Summary (paragraphs, first sentence bolded)           │
│    └─ Doctor Questions (numbered, copyable)                 │
│  ShareModal + PDF download                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/                  # Button, Badge, Card, Tabs, Toast
│   ├── layout/              # Navbar, Footer, PageWrapper, ErrorBoundary
│   ├── upload/              # UploadCard, DropZone, FilePreview, PasteInput
│   ├── landing/             # HeroPreviewCard, HowItWorks, ResultsTeaser
│   ├── results/             # HealthScoreCard, ResultsHeader, CategoryFilterBar,
│   │                        # BiomarkerCard, BiomarkerGrid, InsightsSection,
│   │                        # ShareModal, LoadingScreen, SavedBanner
│   └── history/             # HistoryCard, TrendChart
├── pages/
│   ├── LandingPage.tsx
│   ├── ResultsPage.tsx
│   └── HistoryPage.tsx
├── routes/                  # TanStack file routes (/, /results, /history)
├── hooks/
│   ├── useFileUpload.ts     # Upload state, drag/drop, PDF extraction
│   └── useReportAnalysis.ts # AI call, state, category filter, statusCounts
├── lib/
│   ├── analyze.functions.ts # Cloudflare Worker → Gemini API
│   ├── normalizeAnalysis.ts # Response normalization + type safety
│   ├── pdfExtract.ts        # Browser-only dynamic pdfjs import
│   ├── validators.ts        # File type + size validation
│   ├── uploadStore.ts       # Module store + localStorage history
│   ├── sampleResult.ts      # Pre-baked CBC/LFT demo result
│   └── pdfSummary.ts        # window.print() PDF generation
└── types/
    └── report.ts            # AnalysisResult, Biomarker, UploadState interfaces
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Lovable account (for AI Gateway key) or your own Gemini API key

### Installation

```bash
# Clone the repository
git clone https://github.com/lokeshwaran233-commits/health-report-decoder.git
cd health-report-decoder

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your LOVABLE_API_KEY to .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and click **"Try with a sample CBC report →"** to see it instantly.

### Environment Variables

```env
LOVABLE_API_KEY=your_lovable_ai_gateway_key
```

---

## 🎨 Design System

Custom Tailwind v4 `@theme` token system:

| Token | Value | Usage |
|---|---|---|
| `--color-brand-teal` | `#0F6E56` | Primary actions, normal state |
| `--color-brand-teal-mid` | `#1D9E75` | Hover states, active indicators |
| `--color-brand-amber` | `#EF9F27` | Watch/borderline biomarkers |
| `--color-brand-coral` | `#D85A30` | Flagged/danger biomarkers |
| `--color-brand-surface` | `#FAFAF8` | Page background |
| `--color-brand-dark` | `#1a1a18` | Primary text |

---

## 🧠 How the AI Works

The system prompt is engineered for deterministic medical data extraction:

```
Model:       google/gemini-2.5-flash
Temperature: 0.1  ← Low variance for medical accuracy
Max tokens:  4000

Status logic:
  'normal'  → value within reference range
  'watch'   → within 10% outside range
  'flagged' → more than 10% outside OR clinically significant

Output: Structured JSON → biomarkers[] + summary + doctorQuestions[]
```

Every response passes through `normalizeAnalysisResult()`:
- Validates all status enum values
- Clamps numerics to 4 decimal places
- Adds `id` and `uploadedAt` timestamps
- Returns a fully typed `AnalysisResult` object

---

## 🔒 Privacy First

| What | How |
|---|---|
| Report data | Sent to AI for analysis only — never stored on any server |
| History | Stored in `localStorage` on your device only |
| Shared links | Encode only the summary — never raw biomarker values |
| PDF export | Generated entirely in-browser via `window.print()` |
| Search engines | Results + history pages are `noindex` — never crawled |

---

## ♿ Accessibility

- All icons have `aria-label` or `aria-hidden="true"`
- Gauge bars use `role="img"` with descriptive `aria-label`
- Drag-drop zone: `role="button"` + keyboard `Enter`/`Space` support
- Error messages: `role="alert"` + `aria-live="polite"`
- Share modal: `role="dialog"` + `aria-modal` + focus trap + `Escape` to close
- All animations respect `prefers-reduced-motion`
- Minimum 44×44px tap targets throughout (WCAG AA)
- Color contrast: all text passes WCAG AA (4.5:1 minimum)

---

## 🏆 Built for Lovable Competition 2026

🌐 **Live at → [report-insight-decoder.lovable.app](https://report-insight-decoder.lovable.app)**

> *"The domain expertise is baked into every explanation, every risk flag threshold, and every doctor question generated. This is not a generic AI wrapper — it's a product built by someone who understands what these numbers actually mean biologically."*

---

## 🗺 Roadmap

- [ ] Real-time report sharing with end-to-end encryption
- [ ] Multi-language support (Tamil, Hindi, Telugu)
- [ ] Integration with Apollo 24/7 and PharmEasy report formats
- [ ] Doctor-facing dashboard view
- [ ] WhatsApp bot for direct report upload
- [ ] B2B API for diagnostic labs to embed as patient-facing layer
- [ ] Medication interaction checker based on flagged values

---

## 👤 Author

**Lokesh Waran**
Postgraduate Gold Medallist — Biochemistry
University of Madras, Chennai, India

- 🎓 M.Sc Biochemistry (Gold Medal) — University of Madras
- 🏥 Clinical Data Management (CDM) & GCP certified
- 💼 Aspiring AI Product Manager | HealthTech Builder
- 🔗 [GitHub](https://github.com/lokeshwaran233-commits) · [LinkedIn](#)

> The domain expertise behind ReportRx comes from real scientific training. Every biomarker threshold, every plain-English explanation, every doctor question is grounded in biochemistry — not just prompt engineering.

---

## 📄 License

MIT © 2026 Lokesh Waran

---

<div align="center">

**Built with 🩺 domain expertise · ⚡ Lovable · 🤖 Gemini AI · ☁️ Cloudflare**

*If this helped you understand your lab report, share it with someone who needs it.*

[![Watch Demo](https://img.shields.io/badge/Watch%20Demo-Loom-625DF5?style=for-the-badge&logo=loom&logoColor=white)](https://www.loom.com/share/42b7952f0ae44de78faf2575282a3560)
[![Share on WhatsApp](https://img.shields.io/badge/Share%20ReportRx-WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://wa.me/?text=Check%20out%20ReportRx%20-%20it%20explains%20your%20lab%20report%20in%20plain%20English!)
[![Star on GitHub](https://img.shields.io/badge/Star%20on-GitHub-181717?style=for-the-badge&logo=github)](https://github.com/lokeshwaran233-commits/health-report-decoder)

</div>
