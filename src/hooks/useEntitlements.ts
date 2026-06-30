import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyEntitlements } from "@/lib/billing/billing.functions";
import { useAuth } from "@/hooks/useAuth";

export interface Entitlements {
  plan_code: string;
  plan_status: string;
  plan_renews_at: string | null;
  credit_balance: number;
  reports_used_this_period: number;
}

export function useEntitlements() {
  const { user, loading } = useAuth();
  const fetchEnt = useServerFn(getMyEntitlements);

  const query = useQuery({
    queryKey: ["entitlements", user?.id],
    enabled: !!user && !loading,
    queryFn: () => fetchEnt(),
    staleTime: 30_000,
  });

  const qc = useQueryClient();

  return {
    ...query,
    entitlements: (query.data ?? null) as Entitlements | null,
    refresh: () => qc.invalidateQueries({ queryKey: ["entitlements", user?.id] }),
  };
}

/** Convenience helper: can this user decode another report right now? */
export function canDecode(ent: Entitlements | null): {
  allowed: boolean;
  reason: "no-auth" | "quota-hit" | "ok";
} {
  if (!ent) return { allowed: false, reason: "no-auth" };
  // Signed-in users have unlimited access regardless of plan.
  return { allowed: true, reason: "ok" };
}
