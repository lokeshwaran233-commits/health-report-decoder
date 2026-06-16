DROP POLICY IF EXISTS "auth read zeno_knowledge" ON public.zeno_knowledge;

REVOKE SELECT ON public.zeno_knowledge FROM authenticated;

CREATE OR REPLACE FUNCTION public.match_zeno_knowledge(query_embedding extensions.vector, match_count integer DEFAULT 5)
RETURNS TABLE(id uuid, source text, title text, content text, category text, similarity double precision)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
  SELECT id, source, title, content, category,
         1 - (embedding <=> query_embedding) AS similarity
  FROM public.zeno_knowledge
  WHERE embedding IS NOT NULL
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$function$;