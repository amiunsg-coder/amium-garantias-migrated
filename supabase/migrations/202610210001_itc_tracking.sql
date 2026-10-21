-- Seguimiento compartido de conversaciones ITC entre Amiun y Toyota.
-- Este cambio agrega tablas nuevas y no modifica datos de las tablas existentes.
begin;

create table if not exists public.itc_cases (
  id text primary key,
  case_date date not null,
  priority text not null check (priority in ('A', 'B', 'C')),
  vin text not null,
  responsible text not null default 'Toyota' check (responsible in ('Amiun', 'Toyota')),
  status text not null default 'Activo' check (status in ('Activo', 'Cerrado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists public.itc_comments (
  id text primary key,
  itc_id text not null references public.itc_cases(id) on delete cascade,
  author_org text not null check (author_org in ('Amiun', 'Toyota')),
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_itc_cases_updated_at on public.itc_cases(updated_at desc);
create index if not exists idx_itc_cases_status on public.itc_cases(status);
create index if not exists idx_itc_comments_itc_id_created_at on public.itc_comments(itc_id, created_at asc);

alter table public.itc_cases enable row level security;
alter table public.itc_comments enable row level security;

drop policy if exists itc_cases_session_read on public.itc_cases;
drop policy if exists itc_cases_session_insert on public.itc_cases;
drop policy if exists itc_cases_session_update on public.itc_cases;
drop policy if exists itc_cases_session_delete on public.itc_cases;
drop policy if exists itc_comments_session_read on public.itc_comments;
drop policy if exists itc_comments_session_insert on public.itc_comments;
drop policy if exists itc_comments_session_update on public.itc_comments;
drop policy if exists itc_comments_session_delete on public.itc_comments;

create policy itc_cases_session_read on public.itc_cases
  for select to anon, authenticated
  using (public.is_app_session_user() or public.is_app_user());
create policy itc_cases_session_insert on public.itc_cases
  for insert to anon, authenticated
  with check (public.is_app_session_user() or public.is_app_user());
create policy itc_cases_session_update on public.itc_cases
  for update to anon, authenticated
  using (public.is_app_session_user() or public.is_app_user())
  with check (public.is_app_session_user() or public.is_app_user());
create policy itc_cases_session_delete on public.itc_cases
  for delete to anon, authenticated
  using (public.is_app_session_user() or public.is_app_user());

create policy itc_comments_session_read on public.itc_comments
  for select to anon, authenticated
  using (public.is_app_session_user() or public.is_app_user());
create policy itc_comments_session_insert on public.itc_comments
  for insert to anon, authenticated
  with check (public.is_app_session_user() or public.is_app_user());
create policy itc_comments_session_update on public.itc_comments
  for update to anon, authenticated
  using (public.is_app_session_user() or public.is_app_user())
  with check (public.is_app_session_user() or public.is_app_user());
create policy itc_comments_session_delete on public.itc_comments
  for delete to anon, authenticated
  using (public.is_app_session_user() or public.is_app_user());

grant select, insert, update, delete on public.itc_cases, public.itc_comments to anon, authenticated;

drop trigger if exists trg_itc_cases_updated_at on public.itc_cases;
create trigger trg_itc_cases_updated_at
  before update on public.itc_cases
  for each row execute function public.set_updated_at();

commit;
