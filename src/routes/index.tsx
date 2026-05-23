import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/pages/LandingPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ReportRx — Your lab report, finally explained" },
      {
        name: "description",
        content:
          "AI-powered lab report analysis. Upload a PDF or photo and get visual biomarker breakdowns plus the right questions to ask your doctor.",
      },
      {
        property: "og:title",
        content: "ReportRx — Your lab report, finally explained",
      },
      {
        property: "og:description",
        content:
          "Upload your blood test and get plain-English explanations in under 30 seconds.",
      },
    ],
  }),
  component: LandingPage,
});
