// Server-only quota enforcement helper.
// Used by analyzeReport and analyzeScan to gate AI calls behind the
// user's entitlement plan + credit balance. Mirrors useEntitlements.canDecode
// so client predictions and server enforcement agree.

import type { SupabaseClient } from "@supabase/supabase-js";

export interface QuotaDecision {
  allowed: boolean;
  reason: "ok" | "quota-hit" | "no-entitlements";
  plan_code: string;
  credit_balance: number;
  reports_used_this_period: number;
}

/**
 * Read the user's entitlements; auto-provision a free row if missing.
 * Fails closed for unexpected DB errors (returns disallow).
 */
export async function readEntitlements(
  supabaseAdmin: SupabaseClient,
  userId: string,
): Promise<QuotaDecision> {
  const { data, error } = await supabaseAdmin
    .from("user_entitlements")
    .select("plan_code, credit_balance, reports_used_this_period")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[quota] entitlements read failed", error.message);
    return {
      allowed: false,
      reason: "no-entitlements",
      plan_code: "free",
      credit_balance: 0,
      reports_used_this_period: 0,
    };
  }

  let row = data;
  if (!row) {
    const insert = await supabaseAdmin
      .from("user_entitlements")
      .insert({ user_id: userId, plan_code: "free" })
      .select("plan_code, credit_balance, reports_used_this_period")
      .single();
    if (insert.error) {
      console.error("[quota] entitlements provision failed", insert.error.message);
      return {
        allowed: false,
        reason: "no-entitlements",
        plan_code: "free",
        credit_balance: 0,
        reports_used_this_period: 0,
      };
    }
    row = insert.data;
  }

  const plan = row.plan_code ?? "free";
  const credits = row.credit_balance ?? 0;
  const used = row.reports_used_this_period ?? 0;

  if (plan === "plus" || plan === "pro") {
    return { allowed: true, reason: "ok", plan_code: plan, credit_balance: credits, reports_used_this_period: used };
  }
  if (credits > 0) {
    return { allowed: true, reason: "ok", plan_code: plan, credit_balance: credits, reports_used_this_period: used };
  }
  if (plan === "free" && used < 1) {
    return { allowed: true, reason: "ok", plan_code: plan, credit_balance: credits, reports_used_this_period: used };
  }
  return { allowed: false, reason: "quota-hit", plan_code: plan, credit_balance: credits, reports_used_this_period: used };
}

/**
 * Atomically record one decode against the user's entitlements.
 * Prefers decrementing credits over incrementing the period counter.
 * Best-effort: failure to record does not undo the AI call.
 */
export async function recordDecode(
  supabaseAdmin: SupabaseClient,
  userId: string,
  current: QuotaDecision,
): Promise<void> {
  try {
    if (current.credit_balance > 0 && current.plan_code === "free") {
      await supabaseAdmin
        .from("user_entitlements")
        .update({ credit_balance: current.credit_balance - 1 })
        .eq("user_id", userId);
      return;
    }
    if (current.plan_code === "free") {
      await supabaseAdmin
        .from("user_entitlements")
        .update({ reports_used_this_period: current.reports_used_this_period + 1 })
        .eq("user_id", userId);
    }
    // Plus/Pro: nothing to record (unlimited within plan).
  } catch (e) {
    console.error("[quota] recordDecode failed", e);
  }
}
