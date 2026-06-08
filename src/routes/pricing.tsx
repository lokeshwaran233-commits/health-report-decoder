import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/rx/Button";
import { Card } from "@/components/rx/Card";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/auth/AuthModal";
import { useEntitlements } from "@/hooks/useEntitlements";
import {
  getBillingCatalog,
  createPaymentOrder,
  verifyPayment,
} from "@/lib/billing/billing.functions";
import { loadRazorpayCheckout } from "@/lib/billing/loadRazorpay";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — ReportRx" },
      {
        name: "description",
        content:
          "Pay-per-report credits or unlimited monthly plans. Indian pricing, secure payments via Razorpay.",
      },
      { property: "og:title", content: "Pricing — ReportRx" },
      {
        property: "og:description",
        content: "Credits from ₹49, unlimited plans from ₹199/month.",
      },
    ],
  }),
  component: PricingPage,
});

function formatINR(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

function PricingPage() {
  const { user } = useAuth();
  const { entitlements, refresh } = useEntitlements();
  const fetchCatalog = useServerFn(getBillingCatalog);
  const createOrder = useServerFn(createPaymentOrder);
  const verify = useServerFn(verifyPayment);
  const [busyCode, setBusyCode] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["billing-catalog"],
    queryFn: () => fetchCatalog(),
    staleTime: 5 * 60_000,
  });

  async function handlePurchase(kind: "credit_pack" | "subscription", itemCode: string) {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    setBusyCode(itemCode);
    try {
      const order = await createOrder({ data: { kind, itemCode } });
      await loadRazorpayCheckout();
      if (!window.Razorpay) throw new Error("Razorpay failed to load");

      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay!({
          key: order.keyId,
          amount: order.amountPaise,
          currency: order.currency,
          name: "ReportRx",
          description: order.displayName,
          order_id: order.orderId,
          prefill: { email: user.email ?? undefined },
          theme: { color: "#00D9A3" },
          handler: async (resp) => {
            try {
              await verify({ data: resp });
              toast.success("Payment successful — your account has been updated.");
              await refresh();
              resolve();
            } catch (e) {
              reject(e);
            }
          },
          modal: { ondismiss: () => resolve() },
        });
        rzp.open();
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payment failed. Please try again.");
    } finally {
      setBusyCode(null);
    }
  }

  return (
    <>
      <Navbar />
      <PageWrapper>
        <div className="mx-auto max-w-6xl px-4 md:px-6 pt-24 pb-16">
          <header className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-semibold text-brand-dark tracking-tight">
              Simple, honest pricing
            </h1>
            <p className="mt-3 text-brand-muted max-w-xl mx-auto">
              Start free, pay only for what you use, or unlock unlimited decoding with a plan.
            </p>
            {entitlements && (
              <p className="mt-4 text-sm text-brand-teal">
                Current plan: <strong className="capitalize">{entitlements.plan_code}</strong>
                {entitlements.credit_balance > 0 && (
                  <> · {entitlements.credit_balance} credits</>
                )}
              </p>
            )}
          </header>

          {isLoading && (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-brand-teal" />
            </div>
          )}

          {data && (
            <>
              <section aria-labelledby="plans-heading" className="mb-14">
                <h2 id="plans-heading" className="text-xl font-semibold text-brand-dark mb-4">
                  Monthly plans
                </h2>
                <div className="grid gap-4 md:grid-cols-3">
                  {data.plans.map((plan) => {
                    const current = entitlements?.plan_code === plan.code;
                    const isFree = plan.code === "free";
                    return (
                      <Card key={plan.code} className="p-6 flex flex-col">
                        <div className="flex items-baseline justify-between">
                          <h3 className="text-lg font-semibold text-brand-dark">{plan.name}</h3>
                          {current && (
                            <span className="text-[11px] uppercase tracking-wide bg-brand-teal-light text-brand-teal px-2 py-0.5 rounded-pill">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="mt-3">
                          <span className="text-3xl font-bold text-brand-dark">
                            {isFree ? "Free" : formatINR(plan.price_inr_paise)}
                          </span>
                          {!isFree && (
                            <span className="text-sm text-brand-muted"> / month</span>
                          )}
                        </div>
                        {plan.description && (
                          <p className="mt-2 text-sm text-brand-muted">{plan.description}</p>
                        )}
                        <ul className="mt-4 space-y-2 text-sm text-brand-dark flex-1">
                          {(plan.features as string[]).map((f) => (
                            <li key={f} className="flex items-start gap-2">
                              <Check className="h-4 w-4 mt-0.5 text-brand-teal shrink-0" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-6">
                          {isFree ? (
                            <Button variant="secondary" size="md" fullWidth disabled>
                              {current ? "Your plan" : "Default"}
                            </Button>
                          ) : (
                            <Button
                              variant={current ? "secondary" : "primary"}
                              size="md"
                              fullWidth
                              disabled={current || busyCode === plan.code}
                              onClick={() => handlePurchase("subscription", plan.code)}
                            >
                              {busyCode === plan.code ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : current ? (
                                "Active"
                              ) : (
                                `Upgrade to ${plan.name}`
                              )}
                            </Button>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </section>

              <section aria-labelledby="packs-heading">
                <h2 id="packs-heading" className="text-xl font-semibold text-brand-dark mb-2">
                  Credit packs
                </h2>
                <p className="text-sm text-brand-muted mb-4">
                  Prefer pay-as-you-go? Buy credits once, use them whenever. Never expire.
                </p>
                <div className="grid gap-4 md:grid-cols-3">
                  {data.packs.map((pack) => (
                    <Card key={pack.code} className="p-6 flex flex-col">
                      <h3 className="text-lg font-semibold text-brand-dark">{pack.name}</h3>
                      <div className="mt-2">
                        <span className="text-3xl font-bold text-brand-dark">
                          {formatINR(pack.price_inr_paise)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-brand-muted">
                        {pack.credits} report{pack.credits > 1 ? "s" : ""} ·{" "}
                        {formatINR(Math.round(pack.price_inr_paise / pack.credits))} each
                      </p>
                      {pack.description && (
                        <p className="mt-2 text-sm text-brand-muted flex-1">{pack.description}</p>
                      )}
                      <div className="mt-6">
                        <Button
                          variant="primary"
                          size="md"
                          fullWidth
                          disabled={busyCode === pack.code}
                          onClick={() => handlePurchase("credit_pack", pack.code)}
                        >
                          {busyCode === pack.code ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Buy now"
                          )}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>

              <p className="mt-10 text-xs text-brand-muted text-center max-w-md mx-auto">
                Secure payments via Razorpay. UPI, cards, netbanking and wallets supported. GST
                invoices available on request.
              </p>
            </>
          )}
        </div>
      </PageWrapper>
      <Footer />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialTab="signup" />
    </>
  );
}
