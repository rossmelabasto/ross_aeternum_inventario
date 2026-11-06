-- La opción "Enable automatic RLS" de Supabase crea esta función en public.
-- El asesor de seguridad avisa que anon/authenticated pueden llamarla por /rest/v1/rpc: se les quita el permiso.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
