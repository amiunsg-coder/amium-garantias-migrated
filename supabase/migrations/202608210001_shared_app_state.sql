-- Estado compartido simple para la WebApp AMIUN Garantias.
-- Permite que la version estatica sincronice los casos entre navegadores.

begin;

create table if not exists public.app_state (
  key text primary key,
  value jsonb not null default 'null'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

drop policy if exists "app_state_public_read" on public.app_state;
create policy "app_state_public_read"
on public.app_state for select
to anon, authenticated
using (true);

drop policy if exists "app_state_public_insert" on public.app_state;
create policy "app_state_public_insert"
on public.app_state for insert
to anon, authenticated
with check (key in ('warranty-cases', 'parts-registry-manual', 'amiun-deleted-case-audit-v1'));

drop policy if exists "app_state_public_update" on public.app_state;
create policy "app_state_public_update"
on public.app_state for update
to anon, authenticated
using (key in ('warranty-cases', 'parts-registry-manual', 'amiun-deleted-case-audit-v1'))
with check (key in ('warranty-cases', 'parts-registry-manual', 'amiun-deleted-case-audit-v1'));

grant select, insert, update on public.app_state to anon, authenticated;

drop trigger if exists set_updated_at_app_state on public.app_state;
create trigger set_updated_at_app_state
before update on public.app_state
for each row execute function public.set_updated_at();

commit;
