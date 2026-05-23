import { motion } from "framer-motion";
import {
  ArrowRight,
  Award,
  Clock,
  FileSearch,
  Gauge,
  MessageSquare,
  Shield,
  Upload as UploadIcon,
} from "lucide-react";
import { UploadCard } from "@/components/upload/UploadCard";

function Hero() {
  return (
    <section
      className="px-4 pt-12 md:pt-20 pb-10 md:pb-14 text-center"
      aria-labelledby="hero-heading"
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="inline-flex items-center gap-2 rounded-pill bg-white border border-brand-border px-3 py-1.5 text-xs text-brand-muted shadow-card"
      >
        <span
          aria-hidden="true"
          className="h-2 w-2 rounded-full bg-brand-teal-mid"
        />
        AI-powered lab analysis · Free to try
      </motion.div>

      <motion.h1
        id="hero-heading"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
        className="mt-6 mx-auto max-w-3xl text-[30px] md:text-[48px] leading-[1.05] font-bold tracking-[-0.01em] md:tracking-[-0.02em] text-brand-dark"
      >
        Your lab report,
        <br />
        finally <span className="text-brand-teal">explained.</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
        className="mt-5 mx-auto max-w-[520px] text-base md:text-[18px] leading-relaxed text-brand-muted"
      >
        Upload your blood test or medical report. Get instant visual
        breakdowns, plain-English explanations, and the exact questions to ask
        your doctor.
      </motion.p>
    </section>
  );
}

function TrustBar() {
  const items = [
    { icon: Shield, text: "Nothing stored on our servers — ever" },
    {
      icon: Award,
      text: "Built by a Biochemistry gold medallist, University of Madras",
    },
    { icon: Clock, text: "Results in under 30 seconds" },
  ];

  return (
    <section
      aria-label="Trust"
      className="px-4 py-10 md:py-14"
    >
      <ul className="mx-auto max-w-4xl flex flex-col md:flex-row items-center justify-center gap-5 md:gap-10 text-center md:text-left">
        {items.map(({ icon: Icon, text }) => (
          <li
            key={text}
            className="inline-flex items-center gap-2.5 text-[13px] text-brand-muted"
          >
            <Icon
              className="h-4 w-4 text-brand-teal shrink-0"
              aria-hidden="true"
            />
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: UploadIcon,
      title: "Upload",
      desc: "PDF, photo, or paste your report text",
    },
    {
      icon: FileSearch,
      title: "AI decodes",
      desc: "We extract every biomarker automatically",
    },
    {
      icon: Gauge,
      title: "Visual gauges",
      desc: "See exactly where each value stands",
    },
    {
      icon: MessageSquare,
      title: "Doctor guide",
      desc: "Walk in with the right questions",
    },
  ];

  return (
    <section
      id="how-it-works"
      aria-labelledby="how-heading"
      className="px-4 py-14 md:py-20 bg-white border-y border-brand-border"
    >
      <div className="mx-auto max-w-6xl">
        <h2
          id="how-heading"
          className="text-center text-2xl md:text-3xl font-semibold tracking-tight text-brand-dark"
        >
          How it works
        </h2>
        <p className="mt-2 text-center text-sm text-brand-muted">
          Four simple steps from upload to clarity.
        </p>

        <ol className="mt-10 grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4">
          {steps.map((step, i) => (
            <li key={step.title} className="relative flex md:block items-start gap-4">
              <div className="flex flex-col items-start md:items-center md:text-center w-full">
                <div className="flex items-center justify-center h-7 w-7 rounded-full bg-brand-teal-light text-brand-teal text-sm font-semibold">
                  {i + 1}
                </div>
                <div className="mt-3 inline-flex items-center gap-2">
                  <step.icon
                    className="h-4 w-4 text-brand-teal"
                    aria-hidden="true"
                  />
                  <h3 className="text-sm font-semibold text-brand-dark">
                    {step.title}
                  </h3>
                </div>
                <p className="mt-1.5 text-[13px] text-brand-muted md:max-w-[200px]">
                  {step.desc}
                </p>
              </div>

              {i < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className="hidden md:flex absolute top-3 right-[-12px] items-center text-brand-hint"
                >
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function SocialProof() {
  return (
    <section className="px-4 py-10 text-center">
      <p className="mx-auto max-w-2xl text-sm text-brand-muted">
        Powered by Claude AI — the same technology trusted by leading
        healthcare researchers worldwide.
      </p>
    </section>
  );
}

export function LandingPage() {
  return (
    <>
      <Hero />
      <div className="px-4 pb-12 md:pb-20">
        <UploadCard />
      </div>
      <TrustBar />
      <HowItWorks />
      <SocialProof />
    </>
  );
}
