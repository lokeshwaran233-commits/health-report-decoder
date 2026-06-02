
-- Move vector extension out of public (best practice)
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION vector SET SCHEMA extensions;

-- Restrict match function to authenticated users only
REVOKE EXECUTE ON FUNCTION public.match_zeno_knowledge(extensions.vector, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.match_zeno_knowledge(extensions.vector, INT) TO authenticated, service_role;
