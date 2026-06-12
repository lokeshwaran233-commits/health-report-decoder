import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, FileText, Scan, MessageCircle, Flame, Sparkles, Users } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { getGlobalActivity, getPersonalActivity } from "@/lib/activity.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { relativeTime } from "@/lib/relativeTime";

export const Route = createFileRoute("/activity")({
  head: () => ({
    meta: [
      { title: "Live Activity — ReportRx" },
      { name: "description", content: "Live tracking of how people are using ReportRx — reports, scans, and Zeno conversations in real time." },
    ],
  }),
  component: ActivityPage,
});

const FEATURE_META = {
  report: { label: "Reports", icon: FileText, color: "text-brand-teal", bg: "bg-brand-teal-light" },
  scan: { label: "Scans", icon: Scan, color: "text-brand-amber", bg: "bg-brand-amber-light" },
  zeno: { label: "Zeno chats", icon: MessageCircle, color: "text-brand-coral", bg: "bg-brand-coral-light" },
} as const;

function ActivityPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const fetchGlobal = useServerFn(getGlobalActivity);
  const fetchPersonal = useServerFn(getPersonalActivity);

  const globalQ = useQuery({
    queryKey: ["activity-global"],
    queryFn: () => fetchGlobal(),
    refetchInterval: 15_000,
  });

  const personalQ = useQuery({
    queryKey: ["activity-personal", user?.id],
    queryFn: () => fetchPersonal(),
    enabled: !!user,
    refetchInterval: 30_000,
  });

  // Realtime: nudge the global feed whenever a new event lands
  useEffect(() => {
    const channel = supabase
      .channel("activity-stream")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_events" }, () => {
        void qc.invalidateQueries({ queryKey: ["activity-global"] });
        if (user) void qc.invalidateQueries({ queryKey: ["activity-personal", user.id] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc, user]);

  const g = globalQ.data;
  const p = personalQ.data;

  return (
    <PageWrapper>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-12">
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-teal-light px-3 py-1 text-xs font-semibold text-brand-teal">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-teal opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-teal" />
            </span>
            Live now
          </div>
          <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-brand-dark dark:text-white">
            Live Activity
          </h1>
          <p className="mt-2 text-brand-muted max-w-2xl">
            See how people are using ReportRx right now — reports decoded, scans interpreted, and Zeno conversations happening live across the world.
          </p>
        </header>

        {/* GLOBAL PULSE */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-muted mb-3">Global pulse</h2>
          <div className="grid gap-3 sm:grid-cols-4">
            <PulseCard
              icon={Users}
              label="Active right now"
              value={g?.globalActiveNow ?? 0}
              hint="last 5 minutes"
              accent="text-brand-teal"
            />
            {(Object.keys(FEATURE_META) as Array<keyof typeof FEATURE_META>).map((k) => {
              const meta = FEATURE_META[k];
              return (
                <PulseCard
                  key={k}
                  icon={meta.icon}
                  label={meta.label}
                  value={g?.global24h?.[k] ?? 0}
                  hint={`${g?.globalLastHour?.[k] ?? 0} in last hour`}
                  accent={meta.color}
                />
              );
            })}
          </div>
        </section>

        {/* PERSONAL */}
        {user ? (
          <section className="mb-10">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-muted mb-3">Your usage (last 7 days)</h2>
            <div className="grid gap-3 sm:grid-cols-3 mb-4">
              <PersonalTile
                icon={Flame}
                label="Day streak"
                value={p?.streakDays ?? 0}
                hint={p?.streakDays && p.streakDays > 1 ? "Keep it up!" : "Start your streak today"}
              />
              <PersonalTile
                icon={Sparkles}
                label="Combined sessions"
                value={p?.combinedSessions ?? 0}
                hint="Days using 2+ features"
              />
              <PersonalTile
                icon={Activity}
                label="Total actions"
                value={(p?.totals.report ?? 0) + (p?.totals.scan ?? 0) + (p?.totals.zeno ?? 0)}
                hint="Across all features"
              />
            </div>
            <WeeklyChart data={p?.last7Days ?? []} />
          </section>
        ) : (
          <section className="mb-10 rounded-card bg-white dark:bg-[#1A2235] border border-brand-border dark:border-[#1E2D42] p-6">
            <p className="text-brand-dark dark:text-white font-medium">Sign in to track your own usage</p>
            <p className="mt-1 text-sm text-brand-muted">Personal streaks, combined sessions, and a 7-day chart unlock when you log in.</p>
          </section>
        )}

        {/* LIVE FEED */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-muted mb-3">Live feed</h2>
          <div className="rounded-card bg-white dark:bg-[#1A2235] border border-brand-border dark:border-[#1E2D42] divide-y divide-brand-border dark:divide-[#1E2D42]">
            <AnimatePresence initial={false}>
              {(g?.recent ?? []).slice(0, 12).map((e) => {
                const meta = FEATURE_META[e.feature];
                const Icon = meta.icon;
                return (
                  <motion.div
                    key={e.id}
                    layout
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <span className={`h-8 w-8 rounded-full flex items-center justify-center ${meta.bg}`}>
                      <Icon className={`h-4 w-4 ${meta.color}`} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-brand-dark dark:text-white">
                        {e.is_anonymous ? "Someone" : "A signed-in user"} used <span className="font-semibold">{meta.label.toLowerCase()}</span>
                      </p>
                      <p className="text-xs text-brand-hint">{relativeTime(e.created_at)}</p>
                    </div>
                  </motion.div>
                );
              })}
              {!g?.recent?.length && (
                <div className="px-4 py-10 text-center text-sm text-brand-muted">No activity yet in the last 24 hours.</div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </main>
    </PageWrapper>
  );
}

function PulseCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: typeof Activity;
  label: string;
  value: number;
  hint: string;
  accent: string;
}) {
  const [displayed, setDisplayed] = useState(value);
  useEffect(() => {
    if (value === displayed) return;
    const start = displayed;
    const delta = value - start;
    const dur = 600;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      setDisplayed(Math.round(start + delta * p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="rounded-card bg-white dark:bg-[#1A2235] border border-brand-border dark:border-[#1E2D42] p-4"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-brand-muted">{label}</span>
        <Icon className={`h-4 w-4 ${accent}`} />
      </div>
      <div className="mt-2 text-3xl font-bold text-brand-dark dark:text-white tabular-nums">{displayed}</div>
      <div className="mt-1 text-xs text-brand-hint">{hint}</div>
    </motion.div>
  );
}

function PersonalTile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Activity;
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="rounded-card bg-gradient-to-br from-brand-teal-light to-white dark:from-[#0f3a3a] dark:to-[#1A2235] border border-brand-border dark:border-[#1E2D42] p-4">
      <div className="flex items-center gap-2 text-brand-teal">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <div className="mt-2 text-3xl font-bold text-brand-dark dark:text-white tabular-nums">{value}</div>
      <div className="mt-1 text-xs text-brand-muted">{hint}</div>
    </div>
  );
}

function WeeklyChart({ data }: { data: Array<{ day: string; report: number; scan: number; zeno: number }> }) {
  const max = Math.max(1, ...data.map((d) => d.report + d.scan + d.zeno));
  return (
    <div className="rounded-card bg-white dark:bg-[#1A2235] border border-brand-border dark:border-[#1E2D42] p-4">
      <div className="flex items-end gap-2 h-40">
        {data.map((d) => {
          const total = d.report + d.scan + d.zeno;
          const h = (total / max) * 100;
          const label = new Date(d.day).toLocaleDateString(undefined, { weekday: "short" });
          return (
            <div key={d.day} className="flex-1 flex flex-col items-center justify-end gap-1">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full rounded-t-md bg-gradient-to-t from-brand-teal to-brand-teal-mid relative overflow-hidden min-h-[2px]"
                title={`${total} actions`}
              >
                {d.zeno > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-brand-coral" style={{ height: `${(d.zeno / Math.max(1, total)) * 100}%` }} />
                )}
              </motion.div>
              <span className="text-[10px] text-brand-muted">{label}</span>
              <span className="text-[10px] font-semibold text-brand-dark dark:text-white">{total}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex gap-4 text-xs text-brand-muted">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-brand-teal" /> Reports</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-brand-teal-mid" /> Scans</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-brand-coral" /> Zeno</span>
      </div>
    </div>
  );
}
