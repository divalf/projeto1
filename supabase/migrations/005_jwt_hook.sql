-- ============================================================
-- Migration 005: JWT Custom Claim Hook
-- ============================================================
-- Injeta o role do usuário como custom claim no JWT.
-- Isso permite que o proxy leia session.user.app_metadata.role
-- sem fazer query ao banco em cada request.
--
-- Configuração no Supabase Dashboard:
--   Authentication → Hooks → Customize Access Token (JWT) Hook
--   → selecionar a função: public.custom_claims
--
-- Leitura no proxy.ts:
--   const role = user.app_metadata?.role ?? 'vendedor'
-- ============================================================

create or replace function public.custom_claims()
returns jsonb
language sql
stable
security definer
as $$
  select jsonb_build_object('role', role)
  from public.profiles
  where id = auth.uid()
$$;
