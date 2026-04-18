-- ============================================================
-- Migration 004: Tabela opportunities + RLS
-- ============================================================

create table if not exists public.opportunities (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  value       numeric(12,2),                    -- nullable: prospect sem valor definido
  currency    text not null default 'BRL',      -- MVP: moeda única BRL
  customer_id uuid references public.customers(id) on delete set null,
  stage_id    uuid references public.pipeline_stages(id) on delete restrict not null,
  owner_id    uuid references public.profiles(id) on delete restrict not null,
  status      text not null default 'open'
                check (status in ('open', 'won', 'lost', 'archived')),
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- Regra de preenchimento:
  --   Ganho/Perdido → closed_at = now(), archived_at = null
  --   Arquivar      → archived_at = now(), closed_at = null
  closed_at   timestamptz,
  archived_at timestamptz
);

-- Row Level Security
alter table public.opportunities enable row level security;

-- SELECT: vendedor vê apenas as próprias; gestor/admin veem todas
create policy "opportunities_select" on public.opportunities
  for select using (
    auth.uid() = owner_id
    or public.get_my_role() in ('gestor', 'admin')
  );

-- INSERT: todos os usuários autenticados
create policy "opportunities_insert" on public.opportunities
  for insert with check (auth.role() = 'authenticated');

-- UPDATE: owner + gestor + admin
-- Gestor pode editar para reatribuir/corrigir, mas não deletar
create policy "opportunities_update" on public.opportunities
  for update using (
    auth.uid() = owner_id
    or public.get_my_role() in ('gestor', 'admin')
  );

-- DELETE: owner + admin (gestor não pode deletar)
create policy "opportunities_delete" on public.opportunities
  for delete using (
    auth.uid() = owner_id
    or public.get_my_role() = 'admin'
  );

-- Trigger updated_at
create trigger set_updated_at_opportunities
  before update on public.opportunities
  for each row execute procedure public.update_updated_at();
