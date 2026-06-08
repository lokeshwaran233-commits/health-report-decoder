
REVOKE EXECUTE ON FUNCTION public.ensure_user_entitlements() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_user_entitlements() TO service_role;
