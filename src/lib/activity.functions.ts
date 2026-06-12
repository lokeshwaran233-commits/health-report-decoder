import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface FeatureCounts {
  report: number;
  scan: number;
  zeno: number;
}

export interface ActivityStats {
  global24h: FeatureCounts;
  globalLastHour: FeatureCounts;
  globalActiveNow: number;
  recent: Array<{
    id: string;
    feature: "report" | "scan" | "zeno";
    is_anonymous: boolean;
    created_at: string;
  }>;
}

export interface PersonalStats {
  totals: FeatureCounts;
  last7Days: Array<{ day: string; report: number; scan: number; zeno: number }>;
  streakDays: number;
  combinedSessions: number;
}

function emptyCounts(): FeatureCounts {
  return { report: 0, scan: 0, zeno: 0 };
}

/** Anonymous global stats — safe for everyone. Uses admin client (no PII). */
export const getGlobalActivity = createServerFn({ method: "GET" })
  .handler(async (): Promise<ActivityStats> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = Date.now();
    const since24h = new Date(now - 24 * 3600 * 1000).toISOString();
    const since1h = new Date(now - 3600 * 1000).toISOString();
    const since5m = new Date(now - 5 * 60 * 1000).toISOString();

    const [eventsRes, lastHourRes, recentRes, activeRes] = await Promise.all([
      supabaseAdmin
        .from("activity_events")
        .select("feature")
        .gte("created_at", since24h),
      supabaseAdmin
        .from("activity_events")
        .select("feature")
        .gte("created_at", since1h),
      supabaseAdmin
        .from("activity_events")
        .select("id, feature, is_anonymous, created_at")
        .gte("created_at", since24h)
        .order("created_at", { ascending: false })
        .limit(30),
      supabaseAdmin
        .from("activity_events")
        .select("user_id", { count: "exact", head: false })
        .gte("created_at", since5m),
    ]);

    const tally = (rows: { feature: string }[] | null): FeatureCounts => {
      const c = emptyCounts();
      for (const r of rows ?? []) {
        if (r.feature === "report" || r.feature === "scan" || r.feature === "zeno") c[r.feature] += 1;
      }
      return c;
    };

    const activeIds = new Set<string>();
    for (const r of activeRes.data ?? []) if (r.user_id) activeIds.add(r.user_id);

    return {
      global24h: tally(eventsRes.data),
      globalLastHour: tally(lastHourRes.data),
      globalActiveNow: activeIds.size + ((activeRes.data?.length ?? 0) - activeIds.size > 0 ? 1 : 0),
      recent: (recentRes.data ?? []) as ActivityStats["recent"],
    };
  });

/** Personal stats for the signed-in user. */
export const getPersonalActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PersonalStats> => {
    const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const { data: rows } = await context.supabase
      .from("activity_events")
      .select("feature, created_at")
      .eq("user_id", context.userId)
      .gte("created_at", since)
      .order("created_at", { ascending: false });

    const totals = emptyCounts();
    const byDay = new Map<string, FeatureCounts>();
    const daysActive = new Set<string>();

    for (const r of rows ?? []) {
      if (r.feature !== "report" && r.feature !== "scan" && r.feature !== "zeno") continue;
      totals[r.feature] += 1;
      const day = (r.created_at as string).slice(0, 10);
      daysActive.add(day);
      if (!byDay.has(day)) byDay.set(day, emptyCounts());
      byDay.get(day)![r.feature] += 1;
    }

    const last7Days: PersonalStats["last7Days"] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 3600 * 1000).toISOString().slice(0, 10);
      const c = byDay.get(d) ?? emptyCounts();
      last7Days.push({ day: d, ...c });
    }

    // Streak: consecutive days from today with at least one event
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(Date.now() - i * 24 * 3600 * 1000).toISOString().slice(0, 10);
      if (daysActive.has(d)) streak++;
      else if (i > 0) break;
    }

    // Combined sessions: days where ≥2 distinct features were used
    let combined = 0;
    for (const c of byDay.values()) {
      const used = (c.report > 0 ? 1 : 0) + (c.scan > 0 ? 1 : 0) + (c.zeno > 0 ? 1 : 0);
      if (used >= 2) combined++;
    }

    return { totals, last7Days, streakDays: streak, combinedSessions: combined };
  });
