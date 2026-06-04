
CREATE TABLE public.family_profiles (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         text NOT NULL CHECK (length(name) <= 30 AND length(name) > 0),
  age          int CHECK (age >= 0 AND age <= 150),
  gender       text CHECK (gender IN ('male','female','other','prefer_not_to_say')),
  relationship text CHECK (relationship IN ('self','father','mother','spouse','partner','son','daughter','sibling','grandparent','other')),
  avatar_color text NOT NULL DEFAULT 'teal' CHECK (avatar_color IN ('teal','amber','violet','rose','sky','slate')),
  is_primary   boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_profiles TO authenticated;
GRANT ALL ON public.family_profiles TO service_role;

ALTER TABLE public.family_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own family profiles"
  ON public.family_profiles FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE UNIQUE INDEX family_profiles_one_primary_per_user
  ON public.family_profiles (user_id) WHERE is_primary;

CREATE INDEX family_profiles_user_id_idx ON public.family_profiles (user_id);

CREATE TRIGGER family_profiles_updated_at
  BEFORE UPDATE ON public.family_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Link reports and scans to profiles (nullable for backwards compatibility)
ALTER TABLE public.reports
  ADD COLUMN profile_id uuid REFERENCES public.family_profiles(id) ON DELETE SET NULL;
CREATE INDEX reports_profile_id_idx ON public.reports (profile_id);

ALTER TABLE public.scan_results
  ADD COLUMN profile_id uuid REFERENCES public.family_profiles(id) ON DELETE SET NULL;
CREATE INDEX scan_results_profile_id_idx ON public.scan_results (profile_id);
