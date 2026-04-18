-- ============================================================
-- Migration 003: Tabela pipeline_stages + RLS + seed
-- ============================================================

create table if not exists public.pipeline_stages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  position    integer not null,
  -- DEFERRABLE: validação ao final da transação para permitir
  -- reordenação de múltiplas etapas sem violar unique intermediariamente
  constraint pipeline_stages_position_unique
    unique (position) deferrable initially deferred,
  color       text,             -- hex de 6 dígitos, ex: "#6366f1"
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Row Level Security
alter table public.pipeline_stages enable row level security;

-- SELECT: todos os usuários autenticados
create policy "pipeline_stages_select" on public.pipeline_stages
  for select using (auth.role() = 'authenticated');

-- INSERT: somente admin
create policy "pipeline_stages_insert" on public.pipeline_stages
  for insert with check (public.get_my_role() = 'admin');

-- UPDATE: somente admin
create policy "pipeline_stages_update" on public.pipeline_stages
  for update using (public.get_my_role() = 'admin');

-- DELETE: somente admin
-- O banco bloqueia automaticamente se houver oportunidades (ON DELETE RESTRICT em opportunities)
create policy "pipeline_stages_delete" on public.pipeline_stages
  for delete using (public.get_my_role() = 'admin');

-- Trigger updated_at
create trigger set_updated_at_pipeline_stages
  before update on public.pipeline_stages
  for each row execute procedure public.update_updated_at();

-- ============================================================
-- Seed: etapas padrão do funil
-- ============================================================
insert into public.pipeline_stages (name, position, color) values
  ('Prospecção',   1, '#6366f1'),
  ('Qualificação', 2, '#f59e0b'),
  ('Proposta',     3, '#3b82f6'),
  ('Negociação',   4, '#10b981');
