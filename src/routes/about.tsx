import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Target, Heart, Zap, Users, Globe, Award, FileText } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — ReportRx" },
      {
        name: "description",
        content:
          "The story behind ReportRx — how one biochemistry student built an AI platform to make lab reports understandable for every family.",
      },
      { property: "og:title", content: "About — ReportRx" },
      {
        property: "og:description",
        content: "Built to make medical reports finally make sense, for everyone.",
      },
    ],
  }),
  component: AboutPage,
});

const STATS = [
  { icon: Users, label: "People helped", value: "1,000+" },
  { icon: FileText, label: "Reports analyzed", value: "5,000+" },
  { icon: Globe, label: "Cities reached", value: "12+" },
  { icon: Award, label: "Gold medals", value: "2×" },
];

const JOURNEY = [
  {
    year: "2022–2024",
    title: "The lab, the struggle",
    desc: "As a biochemistry student in Chennai, the founder watched patients and families receive lab reports they couldn't understand — pages of numbers, jargon, no explanation.",
  },
  {
    year: "April 2025",
    title: "The decision",
    desc: "Armed with dual gold medals in biochemistry, he began teaching himself AI product development from scratch — with zero prior coding experience.",
  },
  {
    year: "May 2025",
    title: "ReportRx is born",
    desc: "After weeks of learning React, databases, and AI APIs, ReportRx launched — turning cryptic lab reports into clear, actionable health insights.",
  },
  {
    year: "Now",
    title: "Growing every day",
    desc: "ReportRx is actively expanding with Zeno AI, scan decoding, report sharing — built with one mission: make health intelligence accessible to every family.",
  },
];

const VALUES = [
  { icon: Heart, title: "Empathy first", desc: "Every feature is designed for someone scared, confused, or worried about their health." },
  { icon: Target, title: "Clarity over jargon", desc: "If a 12-year-old can't understand it, we rewrite it." },
  { icon: Zap, title: "Ship fast, fix faster", desc: "Real users, real feedback, weekly improvements." },
];

function AboutPage() {
  return (
    <div className="min-h-dvh bg-brand-surface">
      <div className="mx-auto max-w-4xl px-4 md:px-6 pt-24 pb-20">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-dark transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-semibold text-brand-dark tracking-tight">
            Lab reports, finally explained.
          </h1>
          <p className="mt-4 text-lg text-brand-muted max-w-2xl">
            ReportRx began with one frustration: medical reports that no patient could read.
            We're building the layer that translates them — instantly, in plain language, in your language.
          </p>
        </header>

        {/* Stats */}
        <section aria-labelledby="impact" className="mb-14">
          <h2 id="impact" className="sr-only">Impact</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {STATS.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="rounded-card bg-brand-card border border-brand-border p-5 text-center"
                >
                  <Icon className="h-5 w-5 mx-auto text-brand-teal mb-2" />
                  <div className="text-2xl font-semibold text-brand-dark">{s.value}</div>
                  <div className="text-xs text-brand-muted mt-1">{s.label}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Journey */}
        <section aria-labelledby="journey" className="mb-14">
          <h2 id="journey" className="text-2xl font-semibold text-brand-dark mb-6">The journey</h2>
          <div className="space-y-4">
            {JOURNEY.map((step) => (
              <div
                key={step.year}
                className="rounded-card bg-brand-card border border-brand-border p-5"
              >
                <div className="text-xs font-medium text-brand-teal uppercase tracking-wide">
                  {step.year}
                </div>
                <h3 className="mt-1 text-base font-semibold text-brand-dark">{step.title}</h3>
                <p className="mt-2 text-sm text-brand-dark/80 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Values */}
        <section aria-labelledby="values" className="mb-14">
          <h2 id="values" className="text-2xl font-semibold text-brand-dark mb-6">What we believe</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {VALUES.map((v) => {
              const Icon = v.icon;
              return (
                <div key={v.title} className="rounded-card bg-brand-card border border-brand-border p-5">
                  <Icon className="h-5 w-5 text-brand-coral mb-3" />
                  <h3 className="text-sm font-semibold text-brand-dark">{v.title}</h3>
                  <p className="mt-1.5 text-xs text-brand-muted leading-relaxed">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        <div className="rounded-card bg-brand-teal text-white p-6 md:p-8 text-center">
          <h2 className="text-xl md:text-2xl font-semibold">Ready to decode your next report?</h2>
          <p className="mt-2 text-sm text-white/85">Upload a lab report or a scan — get answers in seconds.</p>
          <Link
            to="/"
            className="inline-flex items-center justify-center mt-4 rounded-pill bg-white text-brand-teal text-sm font-medium px-5 py-2.5 hover:bg-white/95 transition-colors"
          >
            Get started
          </Link>
        </div>
      </div>
    </div>
  );
}
