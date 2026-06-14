import { createFileRoute } from "@tanstack/react-router";
import { Check, Clock } from "lucide-react";
import { Card } from "@/components/rx/Card";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — ReportRx" },
      {
        name: "description",
        content:
          "ReportRx pricing in USD. Payments coming soon — all features are free while we wire up secure checkout.",
      },
      { property: "og:title", content: "Pricing — ReportRx" },
      {
        property: "og:description",
        content: "Plans from $9/month. Payments coming soon.",
      },
    ],
  }),
  component: PricingPage,
});

// NOTE: Payments are intentionally suspended. The pricing tiers below are
// presented in USD for future activation. When ready, flip PAYMENTS_ENABLED
// to true and re-wire `handlePurchase` to Stripe or another gateway. The
// existing billing.functions.ts / payment_orders schema are kept intact for
// drop-in activation.
const PAYMENTS_ENABLED = false;

interface Plan {
  code: string;
  name: string;
  priceUsd: number | null; // null = Free
  description: string;
  features: string[];
  highlight?: boolean;
}

const PLANS: Plan[] = [
  {
    code: "free",
    name: "Free",
    priceUsd: null,
    description: "Try ReportRx with no commitment.",
    features: [
      "3 lab reports / month",
      "Visual biomarker breakdowns",
      "Plain-English summaries",
      "Doctor-ready questions",
    ],
  },
  {
    code: "starter",
    name: "Starter",
    priceUsd: 9,
    description: "For occasional check-ups.",
    features: [
      "15 lab reports / month",
      "Scan decoder (10 / month)",
      "Zeno AI companion",
      "Email support",
    ],
  },
  {
    code: "pro",
    name: "Pro",
    priceUsd: 19,
    description: "Best for ongoing monitoring.",
    features: [
      "Unlimited lab reports",
      "Unlimited scans",
      "Zeno AI with memory",
      "Trend tracking + alerts",
      "Priority support",
    ],
    highlight: true,
  },
  {
    code: "family",
    name: "Family",
    priceUsd: 29,
    description: "Up to 5 family profiles.",
    features: [
      "Everything in Pro",
      "5 family member profiles",
      "Shared timeline",
      "Family health snapshot",
    ],
  },
];

function formatUSD(amount: number) {
  return `$${amount}`;
}

function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 md:px-6 pt-24 pb-16">
      <header className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-semibold text-brand-dark tracking-tight">
          Simple, honest pricing
        </h1>
        <p className="mt-3 text-brand-muted max-w-xl mx-auto">
          Start free. Upgrade when you're ready.
        </p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-pill bg-brand-amber-light/70 border border-brand-amber/40 px-4 py-2 text-sm text-brand-amber font-medium">
          <Clock className="h-4 w-4" aria-hidden="true" />
          Payments are paused — every feature is free for now while we wire up secure checkout.
        </div>
      </header>

      <section aria-labelledby="plans-heading" className="mb-12">
        <h2 id="plans-heading" className="sr-only">
          Monthly plans
        </h2>
        <div className="grid gap-4 md:grid-cols-4">
          {PLANS.map((plan) => {
            const isFree = plan.priceUsd === null;
            return (
              <Card
                key={plan.code}
                className={`p-6 flex flex-col relative ${
                  plan.highlight ? "border-brand-teal ring-1 ring-brand-teal/30" : ""
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center justify-center text-[10px] uppercase tracking-wide bg-brand-teal text-white px-2.5 py-1 rounded-pill font-semibold">
                    Most popular
                  </span>
                )}
                <h3 className="text-lg font-semibold text-brand-dark">{plan.name}</h3>
                <div className="mt-3">
                  <span className="text-3xl font-bold text-brand-dark">
                    {isFree ? "Free" : formatUSD(plan.priceUsd!)}
                  </span>
                  {!isFree && (
                    <span className="text-sm text-brand-muted"> / month</span>
                  )}
                </div>
                <p className="mt-2 text-sm text-brand-muted">{plan.description}</p>
                <ul className="mt-4 space-y-2 text-sm text-brand-dark flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="h-4 w-4 mt-0.5 text-brand-teal shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <button
                    type="button"
                    disabled
                    title={PAYMENTS_ENABLED ? "" : "Payments coming soon"}
                    className="w-full inline-flex items-center justify-center h-10 rounded-btn bg-brand-surface border border-brand-border text-sm font-medium text-brand-muted cursor-not-allowed"
                  >
                    {isFree ? "Current default" : "Coming soon"}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <p className="text-xs text-brand-muted text-center max-w-md mx-auto">
        Prices shown in USD. Secure payment processing will roll out shortly.
        Existing accounts will be notified before any plan is enabled.
      </p>

      <EnterpriseSection />
    </div>
  );
}

function EnterpriseSection() {
  const features = [
    { icon: "🏥", label: "Custom report & scan volumes" },
    { icon: "🔒", label: "HIPAA-aligned deployment options" },
    { icon: "🎨", label: "White-label & custom branding" },
    { icon: "📊", label: "Admin analytics dashboard for teams" },
    { icon: "🤝", label: "Dedicated account manager" },
    { icon: "🔗", label: "EHR / EMR integration support" },
  ];

  return (
    <section
      id="enterprise"
      aria-labelledby="enterprise-heading"
      className="mt-14 rounded-2xl border border-[#1E2D42] bg-[#0A0E1A] p-8 md:p-12"
    >
      <div className="flex flex-col md:flex-row gap-10 md:gap-16">
        <div className="flex-1">
          <span className="inline-flex items-center rounded-full bg-brand-teal/10 border border-brand-teal/30 px-3 py-1 text-xs font-semibold text-brand-teal uppercase tracking-wide">
            Enterprise
          </span>
          <h2
            id="enterprise-heading"
            className="mt-4 text-2xl font-semibold text-white leading-snug"
          >
            Deploy ReportRx for your entire team or patient base.
          </h2>
          <p className="mt-3 text-sm text-[#8B9BAE] leading-relaxed max-w-lg">
            Built for diagnostic labs, hospitals, telemedicine platforms, and
            health-tech startups. Custom volume, white-label options, and a
            dedicated account manager included.
          </p>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {features.map((f) => (
              <div key={f.label} className="flex items-center gap-2.5 text-sm text-[#C5D0DE]">
                <span className="text-base leading-none" aria-hidden="true">{f.icon}</span>
                {f.label}
              </div>
            ))}
          </div>
        </div>

        <div className="md:w-72 flex flex-col justify-center">
          <div>
            <p className="text-4xl font-bold text-white">Custom</p>
            <p className="text-sm text-[#8B9BAE] mt-1">pricing based on your usage</p>
          </div>
          <a
            href="mailto:hello@reportrx.com?subject=Enterprise%20inquiry%20—%20ReportRx"
            className="mt-6 w-full inline-flex items-center justify-center h-[52px] rounded-xl text-sm font-semibold text-[#0A0E1A] transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #00D9A3 0%, #0F6E56 100%)" }}
          >
            Contact Sales →
          </a>
          <p className="mt-3 text-center text-xs text-[#56657a]">
            Or email{" "}
            <a href="mailto:hello@reportrx.com" className="text-brand-teal hover:underline">
              hello@reportrx.com
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

