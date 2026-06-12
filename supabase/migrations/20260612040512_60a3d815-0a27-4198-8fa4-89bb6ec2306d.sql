-- 1) Anonymous report usage (server-only)
CREATE TABLE public.anonymous_report_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL UNIQUE,
  reports_count integer NOT NULL DEFAULT 0,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.anonymous_report_usage TO service_role;
ALTER TABLE public.anonymous_report_usage ENABLE ROW LEVEL SECURITY;
-- No policies: server-only, accessed via supabaseAdmin

CREATE INDEX idx_anon_usage_ip ON public.anonymous_report_usage(ip_hash);

-- 2) Activity events for live tracking
CREATE TABLE public.activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  feature text NOT NULL CHECK (feature IN ('report', 'scan', 'zeno')),
  is_anonymous boolean NOT NULL DEFAULT false,
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.activity_events TO authenticated;
GRANT SELECT ON public.activity_events TO anon;
GRANT ALL ON public.activity_events TO service_role;

ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;

-- Signed-in users see their own events
CREATE POLICY "Users view own events" ON public.activity_events
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Everyone (anon + authenticated) can see recent anonymized events (last 24h)
-- This powers the global live activity feed
CREATE POLICY "Public anonymized recent feed" ON public.activity_events
  FOR SELECT TO anon, authenticated
  USING (created_at > now() - interval '24 hours');

CREATE INDEX idx_activity_user_time ON public.activity_events(user_id, created_at DESC);
CREATE INDEX idx_activity_time ON public.activity_events(created_at DESC);
CREATE INDEX idx_activity_feature_time ON public.activity_events(feature, created_at DESC);

-- Enable Realtime on activity_events
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_events;

-- updated_at trigger for anonymous_report_usage
CREATE TRIGGER update_anon_usage_updated_at
  BEFORE UPDATE ON public.anonymous_report_usage
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();