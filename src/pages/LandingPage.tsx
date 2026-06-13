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
    { icon: Shield, text: "Nothing stored on our servers — ever" },
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

export function LandingPage() {
  return (
    <>
      <Hero />
      <div className="px-4 pb-4">
        <UploadCard />
        <p className="mx-auto mt-4 max-w-2xl text-center text-xs text-brand-hint">
          Your data never leaves your device during extraction — we only send
          text to our AI.
        </p>
      </div>
      <ScrollReveal>
        <TrustBar />
      </ScrollReveal>
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
