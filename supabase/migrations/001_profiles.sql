-- ============================================================
-- Migration 001: Tabela profiles + trigger + RLS
-- ============================================================

-- Tabela criada PRIMEIRO (get_my_role depende dela)
create table if not exists public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  full_name   text,
  email       text unique not null,
  role        text not null default 'vendedor'
                check (role in ('admin', 'gestor', 'vendedor')),
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Função auxiliar criada DEPOIS da tabela
create or replace function public.get_my_role()
returns text
language sql
stable
security definer
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- Row Level Security
alter table public.profiles enable row level security;

create policy "profiles_select" on public.profiles
  for select using (
    auth.uid() = id
    or public.get_my_role() = 'admin'
  );

create policy "profiles_insert" on public.profiles
  for insert with check (false);

create policy "profiles_update" on public.profiles
  for update using (
    auth.uid() = id
    or public.get_my_role() = 'admin'
  );

create policy "profiles_delete" on public.profiles
  for delete using (public.get_my_role() = 'admin');

-- ============================================================
-- Trigger: criar profile ao aceitar convite
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  if new.email is null then
    return new;
  end if;

  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Trigger: atualizar updated_at
-- ============================================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at_profiles
  before update on public.profiles
  for each row execute procedure public.update_updated_at();
