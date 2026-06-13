import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { FileText, Scan, MessageCircle, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { relativeTime } from "@/lib/relativeTime";

interface SnapshotData {
  latestReport: { id: string; created_at: string; lab_name: string | null } | null;
  latestScan: { id: string; created_at: string; modality: string | null } | null;
  latestZeno: { id: string; created_at: string; mode: string | null } | null;
  totalReports: number;
  totalScans: number;
  totalZeno: number;
}

interface Props {
  userId: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export function HealthSnapshotCard({ userId }: Props) {
  const [data, setData] = useState<SnapshotData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [reportsRes, scansRes, zenoRes, rCount, sCount, zCount] = await Promise.all([
          db.from("reports").select("id, created_at, lab_name").eq("user_id", userId).order("created_at", { ascending: false }).limit(1),
          db.from("scan_results").select("id, created_at, modality").eq("user_id", userId).order("created_at", { ascending: false }).limit(1),
          db.from("zeno_conversations").select("id, created_at, mode").eq("user_id", userId).order("created_at", { ascending: false }).limit(1),
          db.from("reports").select("id", { count: "exact", head: true }).eq("user_id", userId),
          db.from("scan_results").select("id", { count: "exact", head: true }).eq("user_id", userId),
          db.from("zeno_conversations").select("id", { count: "exact", head: true }).eq("user_id", userId),
        ]);
        if (cancelled) return;
        setData({
          latestReport: reportsRes.data?.[0] ?? null,
          latestScan: scansRes.data?.[0] ?? null,
          latestZeno: zenoRes.data?.[0] ?? null,
          totalReports: rCount.count ?? 0,
          totalScans: sCount.count ?? 0,
          totalZeno: zCount.count ?? 0,
        });
      } catch (e) {
        console.error("[HealthSnapshot]", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) {
    return (
      <section className="rounded-card bg-gradient-to-br from-brand-teal-light to-white border border-brand-border p-5">
        <div className="h-6 w-40 bg-brand-border/60 rounded animate-pulse mb-3" />
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-brand-border/40 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  const tiles = [
    {
      to: "/history" as const,
      label: "Lab reports",
      icon: FileText,
      total: data?.totalReports ?? 0,
      latest: data?.latestReport ? `${relativeTime(data.latestReport.created_at)}${data.latestReport.lab_name ? " · " + data.latestReport.lab_name : ""}` : "No reports yet",
      color: "text-brand-teal",
      bg: "bg-brand-teal-light",
    },
    {
      to: "/history" as const,
      label: "Scans",
      icon: Scan,
      total: data?.totalScans ?? 0,
      latest: data?.latestScan ? `${relativeTime(data.latestScan.created_at)}${data.latestScan.modality ? " · " + data.latestScan.modality.toUpperCase() : ""}` : "No scans yet",
      color: "text-brand-amber",
      bg: "bg-brand-amber-light",
    },
    {
      to: "/zeno" as const,
      label: "Zeno chats",
      icon: MessageCircle,
      total: data?.totalZeno ?? 0,
      latest: data?.latestZeno ? relativeTime(data.latestZeno.created_at) : "No chats yet",
      color: "text-brand-coral",
      bg: "bg-brand-coral-light",
    },
  ];

  return (
    <section className="rounded-card bg-gradient-to-br from-brand-teal-light/60 via-white to-white border border-brand-border p-5">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-brand-dark flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-brand-teal" />
          Your health snapshot
        </h2>
        <p className="text-xs text-brand-muted mt-0.5">Latest activity across ReportRx</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {tiles.map((t, i) => {
          const Icon = t.icon;
          return (
            <motion.div
              key={t.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link to={t.to} className="block rounded-lg bg-white border border-brand-border p-3 hover:border-brand-teal/60 hover:-translate-y-0.5 transition-all">
                <div className="flex items-center justify-between">
                  <span className={`h-8 w-8 rounded-full flex items-center justify-center ${t.bg}`}>
                    <Icon className={`h-4 w-4 ${t.color}`} />
                  </span>
                  <span className="text-2xl font-bold text-brand-dark tabular-nums">{t.total}</span>
                </div>
                <p className="mt-2 text-xs font-medium text-brand-dark">{t.label}</p>
                <p className="text-[11px] text-brand-muted truncate">{t.latest}</p>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

export default HealthSnapshotCard;
