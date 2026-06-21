REVOKE ALL ON public.share_tokens FROM anon, authenticated;
REVOKE ALL ON public.zeno_knowledge FROM anon, authenticated;
GRANT ALL ON public.share_tokens TO service_role;
GRANT ALL ON public.zeno_knowledge TO service_role;
COMMENT ON TABLE public.share_tokens IS 'Service-role only. Accessed exclusively via supabaseAdmin in server functions. RLS enabled with no policies = deny-all to client roles.';
COMMENT ON TABLE public.zeno_knowledge IS 'Service-role only. Queried via SECURITY DEFINER RPC match_zeno_knowledge. RLS enabled with no policies = deny-all to client roles.';