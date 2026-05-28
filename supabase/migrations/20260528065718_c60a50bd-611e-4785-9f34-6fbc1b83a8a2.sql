
CREATE TABLE public.scan_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  modality text NOT NULL,
  body_region text,
  clinical_context text,
  image_quality text,
  professional_output jsonb NOT NULL,
  layman_output jsonb NOT NULL,
  critical_alerts jsonb,
  indeterminate jsonb,
  cannot_assess jsonb,
  urgency text,
  ai_confidence_note text,
  language text DEFAULT 'en'
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.scan_results TO authenticated;
GRANT ALL ON public.scan_results TO service_role;

ALTER TABLE public.scan_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own scan_results select" ON public.scan_results
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own scan_results insert" ON public.scan_results
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own scan_results update" ON public.scan_results
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own scan_results delete" ON public.scan_results
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX scan_results_user_created_idx ON public.scan_results (user_id, created_at DESC);
