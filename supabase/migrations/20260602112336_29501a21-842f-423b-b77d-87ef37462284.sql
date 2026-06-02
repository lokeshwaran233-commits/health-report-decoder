
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- ===== zeno_conversations =====
CREATE TABLE public.zeno_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  report_id UUID NULL,
  mode TEXT NOT NULL DEFAULT 'simple',
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  summary TEXT NULL,
  emergency_detected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.zeno_conversations TO authenticated;
GRANT ALL ON public.zeno_conversations TO service_role;

ALTER TABLE public.zeno_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own zeno_conversations select" ON public.zeno_conversations
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own zeno_conversations insert" ON public.zeno_conversations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own zeno_conversations update" ON public.zeno_conversations
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own zeno_conversations delete" ON public.zeno_conversations
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_zeno_conv_user ON public.zeno_conversations(user_id, updated_at DESC);

-- ===== zeno_knowledge =====
CREATE TABLE public.zeno_knowledge (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NULL,
  embedding vector(768),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.zeno_knowledge TO authenticated;
GRANT ALL ON public.zeno_knowledge TO service_role;

ALTER TABLE public.zeno_knowledge ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read zeno_knowledge" ON public.zeno_knowledge
  FOR SELECT TO authenticated USING (true);

CREATE INDEX idx_zeno_knowledge_embedding ON public.zeno_knowledge
  USING hnsw (embedding vector_cosine_ops);

-- Match function
CREATE OR REPLACE FUNCTION public.match_zeno_knowledge(
  query_embedding vector(768),
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  source TEXT,
  title TEXT,
  content TEXT,
  category TEXT,
  similarity FLOAT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, source, title, content, category,
         1 - (embedding <=> query_embedding) AS similarity
  FROM public.zeno_knowledge
  WHERE embedding IS NOT NULL
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ===== share_tokens public read =====
GRANT SELECT ON public.share_tokens TO anon;

CREATE POLICY "share_tokens public read valid" ON public.share_tokens
  FOR SELECT TO anon
  USING (expires_at > now() AND accessed_count < max_accesses);

-- ===== Storage policies for lab-reports bucket (folder-scoped) =====
CREATE POLICY "lab-reports own select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'lab-reports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "lab-reports own insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'lab-reports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "lab-reports own update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'lab-reports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "lab-reports own delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'lab-reports' AND auth.uid()::text = (storage.foldername(name))[1]);

-- updated_at trigger function (idempotent)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER update_zeno_conv_updated_at
  BEFORE UPDATE ON public.zeno_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
