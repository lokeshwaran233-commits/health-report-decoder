CREATE TABLE public.ultraguard_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_hash TEXT,
  surface TEXT NOT NULL CHECK (surface IN ('scan','lab','zeno')),
  sentinel TEXT NOT NULL,
  blocked_by_layer TEXT,
  violation_count INTEGER NOT NULL DEFAULT 0,
  downgrade_count INTEGER NOT NULL DEFAULT 0,
  approved_count INTEGER NOT NULL DEFAULT 0,
  rejected_count INTEGER NOT NULL DEFAULT 0,
  processing_ms INTEGER NOT NULL DEFAULT 0,
  pipeline_version TEXT NOT NULL,
  report JSONB NOT NULL,
  context_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ultraguard_audit_user_id_idx ON public.ultraguard_audit (user_id);
CREATE INDEX ultraguard_audit_created_at_idx ON public.ultraguard_audit (created_at DESC);
CREATE INDEX ultraguard_audit_surface_idx ON public.ultraguard_audit (surface);

GRANT SELECT ON public.ultraguard_audit TO authenticated;
GRANT ALL ON public.ultraguard_audit TO service_role;

ALTER TABLE public.ultraguard_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own audit rows"
  ON public.ultraguard_audit
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);