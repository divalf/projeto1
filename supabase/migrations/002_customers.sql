-- ============================================================
-- Migration 002: Tabela customers + RLS
-- ============================================================

create table if not exists public.customers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  company     text,
  email       text,             -- sem unique: emails genéricos podem repetir entre clientes
  phone       text,
  notes       text,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Row Level Security
alter table public.customers enable row level security;

-- SELECT: todos os usuários autenticados (clientes são compartilhados)
create policy "customers_select" on public.customers
  for select using (auth.role() = 'authenticated');

-- INSERT: todos os usuários autenticados
create policy "customers_insert" on public.customers
  for insert with check (auth.role() = 'authenticated');

-- UPDATE: quem criou + admin
-- Nota: created_by = null (usuário deletado) → somente admin pode editar
create policy "customers_update" on public.customers
  for update using (
    auth.uid() = created_by
    or public.get_my_role() = 'admin'
  );

-- DELETE: quem criou + admin
create policy "customers_delete" on public.customers
  for delete using (
    auth.uid() = created_by
    or public.get_my_role() = 'admin'
  );

-- Trigger updated_at
create trigger set_updated_at_customers
  before update on public.customers
  for each row execute procedure public.update_updated_at();
