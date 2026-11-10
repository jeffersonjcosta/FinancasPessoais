-- Sincronização do app (celular <-> computador). Rodar UMA vez no SQL Editor do Supabase.
-- Guarda todos os dados de cada usuário num único documento JSON, visível só para ele.

create table if not exists public.user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.user_data enable row level security;

drop policy if exists "user_data: dono le" on public.user_data;
drop policy if exists "user_data: dono insere" on public.user_data;
drop policy if exists "user_data: dono atualiza" on public.user_data;

create policy "user_data: dono le" on public.user_data
  for select using (auth.uid() = user_id);
create policy "user_data: dono insere" on public.user_data
  for insert with check (auth.uid() = user_id);
create policy "user_data: dono atualiza" on public.user_data
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
