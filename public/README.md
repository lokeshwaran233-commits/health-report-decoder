# ReportRx — Your lab report, finally explained

## What it does
ReportRx turns confusing medical lab reports into instant, visual, plain-English insights.
Upload a blood test or lab report — get animated biomarker gauges, a personalised AI summary,
and specific questions to bring to your next doctor's appointment. In under 30 seconds.

## The problem it solves
80% of patients don't understand their lab results. They receive a CBC or LFT report,
see values like "MCHC: 36.4 H" or "TSH: 4.8", and spend hours anxiously Googling each one
in isolation. No tool today solves this elegantly for the Indian and global market.

## Key features
- Upload PDF or image lab reports — AI extracts every biomarker automatically
- Animated visual gauge bars showing exactly where each value falls in the reference range
- Plain-English explanations written for non-medical users
- AI-generated "Questions to ask your doctor" based on your specific results
- Full report history stored locally — track biomarkers over time with trend charts
- Share your summary via WhatsApp or a shareable link
- Download a clean PDF summary for your next appointment

## Why this is different
Built by a Biochemistry gold medallist (University of Madras) with clinical data management
experience. The domain expertise is baked into every explanation, every risk flag logic,
and every doctor question generated. This is not a generic AI wrapper — it's a product
built by someone who understands what these numbers actually mean biologically.

## Tech stack
- TanStack Start + TypeScript (strict)
- Tailwind CSS v4
- Cloudflare Workers (serverless functions)
- Google Gemini 2.5 Flash via Lovable AI Gateway
- Recharts for data visualisation
- Framer Motion for animations
- pdfjs-dist for client-side PDF extraction

## Live demo
[ReportRx Live]({YOUR_PUBLISHED_URL})

Built for the Lovable Competition 2026.
