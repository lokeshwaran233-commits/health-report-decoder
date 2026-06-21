import { motion } from "framer-motion";
import { Award, Clock, Shield } from "lucide-react";
import { UploadCard } from "@/components/upload/UploadCard";
import { HeroPreviewCard } from "@/components/landing/HeroPreviewCard";
import { HowItWorksFlow } from "@/components/landing/HowItWorksFlow";
import { ResultsTeaser } from "@/components/landing/ResultsTeaser";
import { ScrollReveal } from "@/components/landing/ScrollReveal";
import { GuideButton } from "@/components/landing/GuideButton";

function Hero() {
  return (
    <section
      className="px-4 pt-12 md:pt-20 pb-10 md:pb-14"
      aria-labelledby="hero-heading"
    >
      <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <div className="text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-pill bg-white border border-brand-border px-3 py-1.5 text-xs text-brand-muted shadow-card"
          >
            <span className="h-2 w-2 rounded-full bg-brand-teal-mid animate-pulse" />
            AI-powered lab analysis · Free to try
          </motion.div>
          <motion.h1
            id="hero-heading"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-6 text-[30px] md:text-[48px] leading-[1.05] font-bold tracking-tight text-brand-dark"
          >
            Your lab report,
            <br />
            finally <span className="text-brand-teal">explained.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-5 max-w-[520px] mx-auto lg:mx-0 text-base md:text-[18px] leading-relaxed text-brand-muted"
          >
            Upload your blood test or medical report. Get instant visual
            breakdowns, plain-English explanations, and the exact questions to
            ask your doctor.
          </motion.p>
        </div>
        <div className="hidden lg:block">
          <HeroPreviewCard />
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  const items = [
    { icon: Shield, text: "Saved to your account only when you sign in — and you can delete anytime" },
    { icon: Award, text: "Built by a Biochemistry gold medallist, University of Madras" },
    { icon: Clock, text: "Results in under 30 seconds" },
  ];
  return (
    <section aria-label="Trust" className="px-4 py-10 md:py-14">
      <ul className="mx-auto max-w-4xl flex flex-col md:flex-row items-center justify-center gap-5 md:gap-10">
        {items.map(({ icon: Icon, text }) => (
          <li key={text} className="inline-flex items-center gap-2.5 text-[13px] text-brand-muted">
            <Icon className="h-4 w-4 text-brand-teal shrink-0" aria-hidden="true" />
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function B2BTeaser() {
  return (
    <section aria-label="Enterprise" className="px-4 pb-2">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-xl border border-brand-teal/20 bg-brand-teal-light/30 px-6 py-5">
          <div className="h-10 w-10 shrink-0 rounded-btn bg-brand-teal-light flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-brand-teal">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9,22 9,12 15,12 15,22" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-brand-dark">Building for clinics or hospitals?</p>
            <p className="text-xs text-brand-muted mt-0.5">
              We offer white-label deployments, custom volumes, and HIPAA-aligned options.
            </p>
          </div>
          <a
            href="/pricing#enterprise"
            className="shrink-0 text-sm font-medium text-brand-teal hover:underline whitespace-nowrap"
          >
            Learn more →
          </a>
        </div>
      </div>
    </section>
  );
}

export function LandingPage() {
  return (
    <>
      <Hero />
      <div className="px-4 pb-4">
        <UploadCard />
        <p className="mx-auto mt-4 max-w-2xl text-center text-xs text-brand-hint">
          PDFs are read in your browser; images and pasted text are sent to our
          AI for analysis. Results are saved to your account only when you're
          signed in — see our Privacy Policy.
        </p>
      </div>
      <ScrollReveal>
        <TrustBar />
      </ScrollReveal>
      <B2BTeaser />
      <ScrollReveal>
        <ResultsTeaser />
      </ScrollReveal>
      <ScrollReveal>
        <HowItWorksFlow />
      </ScrollReveal>
      <GuideButton />
    </>
  );
}

export default LandingPage;

