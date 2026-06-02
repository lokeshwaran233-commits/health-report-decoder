
CREATE OR REPLACE FUNCTION public.match_zeno_knowledge(
  query_embedding extensions.vector,
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
SECURITY INVOKER
SET search_path = public, extensions
AS $$
  SELECT id, source, title, content, category,
         1 - (embedding <=> query_embedding) AS similarity
  FROM public.zeno_knowledge
  WHERE embedding IS NOT NULL
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
