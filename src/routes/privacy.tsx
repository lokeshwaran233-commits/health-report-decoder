import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, Eye, Server, Lock, UserCheck, Mail, FileText, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy & Terms — ReportRx" },
      {
        name: "description",
        content:
          "How ReportRx collects, processes, and protects your health data. Terms of use, your rights, and contact information.",
      },
      { property: "og:title", content: "Privacy & Terms — ReportRx" },
      {
        property: "og:description",
        content: "Data, security, and your rights when using ReportRx.",
      },
    ],
  }),
  component: PrivacyPage,
});

const SECTIONS = [
  {
    id: "overview",
    icon: Shield,
    title: "Overview",
    paragraphs: [
      'ReportRx ("we", "our", or "the Platform") is an AI-powered health intelligence platform. These Terms & Conditions and Privacy Policy govern your use of ReportRx, including its web application, AI-powered scan decoder, Zeno AI companion, and all associated services.',
      "By accessing or using ReportRx, you agree to be bound by these terms. If you do not agree, you must not use the Platform. We reserve the right to update these terms at any time; continued use constitutes acceptance of any revised terms.",
      "Last updated: June 2026.",
    ],
  },
  {
    id: "data",
    icon: Eye,
    title: "Data we collect",
    paragraphs: [
      "Account data: email, name, age, sex, blood group, and profile photo you provide during registration.",
      "Health data: lab reports (PDF, JPG, PNG) you upload for analysis, plus health conditions, medications, and allergies you voluntarily enter.",
      "Usage data: pages visited, features used, scan history, and session metadata used solely to improve the Platform.",
      "AI interaction data: messages exchanged with Zeno may be processed through our AI provider subject to their data policies.",
      "Technical data: IP address, browser type, OS, and authentication cookies. We do not use tracking cookies for advertising.",
    ],
  },
  {
    id: "processing",
    icon: Server,
    title: "How we use your data",
    paragraphs: [
      "Service delivery: analyzing your lab reports using AI to provide health insights and suggestions.",
      "Personalization: tailoring Zeno responses based on your profile to provide contextually relevant guidance.",
      "Security: detecting unauthorized access, preventing misuse, and maintaining platform integrity.",
      "We do not sell your personal or health data to third parties. We do not use your health data for advertising.",
    ],
  },
  {
    id: "security",
    icon: Lock,
    title: "Security",
    paragraphs: [
      "All data in transit is encrypted via HTTPS/TLS. Data at rest is encrypted in our managed database.",
      "Access to user health data is restricted via row-level security — only the authenticated owner can read or modify their data.",
      "We perform regular security audits and dependency scans to keep the Platform safe.",
    ],
  },
  {
    id: "rights",
    icon: UserCheck,
    title: "Your rights",
    paragraphs: [
      "You can access, edit, or export your profile and report history at any time from your account.",
      "You may delete your account, which removes your profile, reports, and chat history from active systems.",
      "Under India's DPDP Act 2023 and GDPR (where applicable), you have rights to access, correction, erasure, and grievance redressal.",
    ],
  },
  {
    id: "medical",
    icon: FileText,
    title: "Medical disclaimer",
    paragraphs: [
      "ReportRx is an informational tool. It is not a substitute for professional medical advice, diagnosis, or treatment.",
      "Always consult a qualified healthcare professional for medical decisions. Do not delay seeking advice because of information from ReportRx.",
      "In a medical emergency, contact your local emergency services immediately.",
    ],
  },
  {
    id: "contact",
    icon: Mail,
    title: "Contact",
    paragraphs: [
      "For questions about these terms, data requests, or grievances, email support@reportrx.app.",
    ],
  },
];

function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-brand-surface">
      <div className="mx-auto max-w-3xl px-4 md:px-6 pt-24 pb-20">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-dark transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-semibold text-brand-dark tracking-tight">
            Privacy & Terms
          </h1>
          <p className="mt-3 text-brand-muted">
            Your health data, your control. Here's exactly how ReportRx treats it.
          </p>
        </header>

        <nav aria-label="Sections" className="mb-10 flex flex-wrap gap-2">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="rounded-pill border border-brand-border bg-white px-3 py-1.5 text-xs text-brand-muted hover:text-brand-dark hover:border-brand-teal transition-colors"
            >
              {s.title}
            </a>
          ))}
        </nav>

        <div className="space-y-10">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <section key={s.id} id={s.id} className="scroll-mt-20">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-card bg-brand-teal-light text-brand-teal">
                    <Icon className="h-4 w-4" />
                  </span>
                  <h2 className="text-lg font-semibold text-brand-dark">{s.title}</h2>
                </div>
                <div className="space-y-3 text-sm leading-relaxed text-brand-dark/85 pl-12">
                  {s.paragraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
