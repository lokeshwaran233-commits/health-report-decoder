import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/start-client-core";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { verifyWebhookSignature } from "@/lib/billing/razorpay.server";
import { fulfillOrder } from "@/lib/billing/billing.functions";

// Public endpoint Razorpay POSTs to. Configure in Razorpay Dashboard →
//   Settings → Webhooks → URL:
//   https://<your-domain>/api/public/razorpay-webhook
// Subscribe at minimum to: payment.captured, payment.failed.
export const Route = createFileRoute("/api/public/razorpay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const signature = request.headers.get("x-razorpay-signature");
        const rawBody = await request.text();

        if (!signature) {
          return new Response("Missing signature", { status: 400 });
        }

        let ok = false;
        try {
          ok = await verifyWebhookSignature(rawBody, signature);
        } catch (e) {
          console.error("[razorpay-webhook] signature check failed", e);
          return new Response("Server misconfigured", { status: 500 });
        }
        if (!ok) return new Response("Invalid signature", { status: 401 });

        let payload: {
          event?: string;
          payload?: {
            payment?: { entity?: { id?: string; order_id?: string; status?: string } };
          };
        };
        try {
          payload = JSON.parse(rawBody);
        } catch {
          return new Response("Bad JSON", { status: 400 });
        }

        const event = payload.event ?? "";
        const payment = payload.payload?.payment?.entity;

        if (event === "payment.captured" && payment?.order_id) {
          const { data: order, error } = await supabaseAdmin
            .from("payment_orders")
            .select("id,status")
            .eq("razorpay_order_id", payment.order_id)
            .maybeSingle();
          if (error) {
            console.error("[razorpay-webhook] lookup failed", error);
            return new Response("Lookup error", { status: 500 });
          }
          if (order && order.status !== "paid") {
            try {
              await fulfillOrder(order.id, payment.id);
            } catch (e) {
              console.error("[razorpay-webhook] fulfillment failed", e);
              return new Response("Fulfillment error", { status: 500 });
            }
          }
        } else if (event === "payment.failed" && payment?.order_id) {
          await supabaseAdmin
            .from("payment_orders")
            .update({ status: "failed", raw_payload: payload as never })
            .eq("razorpay_order_id", payment.order_id);
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
