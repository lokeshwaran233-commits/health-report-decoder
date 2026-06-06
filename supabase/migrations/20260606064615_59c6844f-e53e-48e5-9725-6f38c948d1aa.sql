-- 1. Extend reports table
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS clinical_engine_version text DEFAULT '1.0',
  ADD COLUMN IF NOT EXISTS evaluated_biomarkers     jsonb,
  ADD COLUMN IF NOT EXISTS pattern_evaluations      jsonb,
  ADD COLUMN IF NOT EXISTS priority_findings        jsonb,
  ADD COLUMN IF NOT EXISTS critical_alerts          jsonb,
  ADD COLUMN IF NOT EXISTS data_quality_warnings    jsonb,
  ADD COLUMN IF NOT EXISTS overall_clinical_score   int,
  ADD COLUMN IF NOT EXISTS guard_violations_count   int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS guard_had_critical       boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS extraction_raw           jsonb;

CREATE INDEX IF NOT EXISTS idx_reports_critical_alerts
  ON public.reports USING gin(critical_alerts);

CREATE INDEX IF NOT EXISTS idx_reports_pattern_evals
  ON public.reports USING gin(pattern_evaluations);

-- 2. biomarker_history
CREATE TABLE IF NOT EXISTS public.biomarker_history (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id      uuid REFERENCES public.family_profiles(id) ON DELETE SET NULL,
  report_id       uuid REFERENCES public.reports(id) ON DELETE CASCADE,
  biomarker_name  text NOT NULL,
  raw_name        text NOT NULL,
  value           numeric,
  unit            text,
  status          text,
  lab_ref_min     numeric,
  lab_ref_max     numeric,
  report_date     date,
  created_at      timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.biomarker_history TO authenticated;
GRANT ALL ON public.biomarker_history TO service_role;

ALTER TABLE public.biomarker_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own biomarker history"
  ON public.biomarker_history FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own biomarker history"
  ON public.biomarker_history FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own biomarker history"
  ON public.biomarker_history FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_biomarker_history_lookup
  ON public.biomarker_history(user_id, profile_id, biomarker_name, report_date);

-- 3. guard_violations_log
CREATE TABLE IF NOT EXISTS public.guard_violations_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id       uuid REFERENCES public.reports(id) ON DELETE CASCADE,
  violation_text  text,
  severity        text,
  engine_version  text DEFAULT '1.0',
  created_at      timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.guard_violations_log TO authenticated;
GRANT ALL ON public.guard_violations_log TO service_role;

ALTER TABLE public.guard_violations_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own guard violations via report"
  ON public.guard_violations_log FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = guard_violations_log.report_id
        AND r.user_id = auth.uid()
    )
  );
