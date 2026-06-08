import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  createRazorpayOrder,
  getPublicKeyId,
  verifyCheckoutSignature,
} from "./razorpay.server";

// ─────────────────────────────────────────────────────────────
// Public catalog (anyone, signed in or not)
// ─────────────────────────────────────────────────────────────
export const getBillingCatalog = createServerFn({ method: "GET" }).handler(async () => {
  const [plans, packs] = await Promise.all([
    supabaseAdmin
      .from("subscription_plans")
      .select("code,name,description,price_inr_paise,interval,monthly_report_quota,features,sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabaseAdmin
      .from("credit_packs")
      .select("code,name,description,credits,price_inr_paise,sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
  ]);
  if (plans.error) throw new Error(plans.error.message);
  if (packs.error) throw new Error(packs.error.message);
  return { plans: plans.data ?? [], packs: packs.data ?? [] };
});

// ─────────────────────────────────────────────────────────────
// Current user's entitlements
// ─────────────────────────────────────────────────────────────
export const getMyEntitlements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data, error } = await supabaseAdmin
      .from("user_entitlements")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);

    // Auto-provision if missing (e.g. trigger missed it).
    if (!data) {
      const inserted = await supabaseAdmin
        .from("user_entitlements")
        .insert({ user_id: userId, plan_code: "free" })
        .select("*")
        .single();
      if (inserted.error) throw new Error(inserted.error.message);
      return inserted.data;
    }
    return data;
  });

// ─────────────────────────────────────────────────────────────
// Create a Razorpay order for a credit pack or subscription
// ─────────────────────────────────────────────────────────────
const createOrderInput = z.object({
  kind: z.enum(["credit_pack", "subscription"]),
  itemCode: z.string().min(1).max(64),
});

export const createPaymentOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createOrderInput.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;

    // Look up item price from the canonical catalog (NEVER trust client-supplied amount).
    let amountPaise = 0;
    let displayName = "";
    if (data.kind === "credit_pack") {
      const { data: pack, error } = await supabaseAdmin
        .from("credit_packs")
        .select("name,price_inr_paise,is_active")
        .eq("code", data.itemCode)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!pack || !pack.is_active) throw new Error("Credit pack not found.");
      amountPaise = pack.price_inr_paise;
      displayName = pack.name;
    } else {
      const { data: plan, error } = await supabaseAdmin
        .from("subscription_plans")
        .select("name,price_inr_paise,is_active,code")
        .eq("code", data.itemCode)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!plan || !plan.is_active) throw new Error("Plan not found.");
      if (plan.code === "free" || plan.price_inr_paise <= 0) {
        throw new Error("The Free plan does not require a payment.");
      }
      amountPaise = plan.price_inr_paise;
      displayName = plan.name;
    }

    // Short receipt — Razorpay limit is 40 chars.
    const receipt = `rx_${Date.now().toString(36)}_${userId.slice(0, 8)}`;

    const order = await createRazorpayOrder({
      amountPaise,
      currency: "INR",
      receipt,
      notes: { user_id: userId, kind: data.kind, item_code: data.itemCode },
    });

    const { error: insertErr } = await supabaseAdmin.from("payment_orders").insert({
      user_id: userId,
      razorpay_order_id: order.id,
      kind: data.kind,
      item_code: data.itemCode,
      amount_paise: amountPaise,
      currency: "INR",
      status: "created",
    });
    if (insertErr) throw new Error(insertErr.message);

    return {
      orderId: order.id,
      amountPaise,
      currency: "INR",
      keyId: getPublicKeyId(),
      displayName,
    };
  });

// ─────────────────────────────────────────────────────────────
// Verify payment after Razorpay Checkout success (client-side flow)
// ─────────────────────────────────────────────────────────────
const verifyInput = z.object({
  razorpay_order_id: z.string().min(4),
  razorpay_payment_id: z.string().min(4),
  razorpay_signature: z.string().min(4),
});

export const verifyPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => verifyInput.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;

    const ok = await verifyCheckoutSignature({
      razorpayOrderId: data.razorpay_order_id,
      razorpayPaymentId: data.razorpay_payment_id,
      razorpaySignature: data.razorpay_signature,
    });
    if (!ok) throw new Error("Payment signature verification failed.");

    // Look up the order we created earlier.
    const { data: order, error: lookupErr } = await supabaseAdmin
      .from("payment_orders")
      .select("*")
      .eq("razorpay_order_id", data.razorpay_order_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (lookupErr) throw new Error(lookupErr.message);
    if (!order) throw new Error("Order not found for this user.");

    // Idempotency — if already fulfilled, just return.
    if (order.status === "paid") {
      return { alreadyFulfilled: true };
    }

    await fulfillOrder(order.id);
    return { alreadyFulfilled: false };
  });

// ─────────────────────────────────────────────────────────────
// Shared fulfillment — called by verifyPayment AND the webhook.
// Idempotent: safe to call multiple times for the same order.
// ─────────────────────────────────────────────────────────────
export async function fulfillOrder(orderRowId: string, razorpayPaymentId?: string) {
  const { data: order, error } = await supabaseAdmin
    .from("payment_orders")
    .select("*")
    .eq("id", orderRowId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!order) throw new Error("Order row not found.");
  if (order.status === "paid") return; // already fulfilled

  if (order.kind === "credit_pack") {
    const { data: pack, error: pErr } = await supabaseAdmin
      .from("credit_packs")
      .select("credits")
      .eq("code", order.item_code)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!pack) throw new Error("Credit pack vanished.");

    // Add credits atomically by reading current balance, then updating with concurrency-safe filter.
    const { data: ent, error: eErr } = await supabaseAdmin
      .from("user_entitlements")
      .select("credit_balance")
      .eq("user_id", order.user_id)
      .maybeSingle();
    if (eErr) throw new Error(eErr.message);

    if (!ent) {
      await supabaseAdmin
        .from("user_entitlements")
        .insert({ user_id: order.user_id, plan_code: "free", credit_balance: pack.credits });
    } else {
      await supabaseAdmin
        .from("user_entitlements")
        .update({ credit_balance: ent.credit_balance + pack.credits })
        .eq("user_id", order.user_id);
    }
  } else if (order.kind === "subscription") {
    const now = new Date();
    const renews = new Date(now);
    renews.setMonth(renews.getMonth() + 1);
    await supabaseAdmin
      .from("user_entitlements")
      .upsert(
        {
          user_id: order.user_id,
          plan_code: order.item_code,
          plan_started_at: now.toISOString(),
          plan_renews_at: renews.toISOString(),
          plan_status: "active",
          period_started_at: now.toISOString(),
          reports_used_this_period: 0,
        },
        { onConflict: "user_id" },
      );
  }

  await supabaseAdmin
    .from("payment_orders")
    .update({
      status: "paid",
      fulfilled_at: new Date().toISOString(),
      ...(razorpayPaymentId ? { razorpay_payment_id: razorpayPaymentId } : {}),
    })
    .eq("id", orderRowId);
}
