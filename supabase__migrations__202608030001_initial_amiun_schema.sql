-- AMIUN Garantías - esquema inicial para Supabase/PostgreSQL
-- Ejecutar como migración o desde el SQL Editor de Supabase.

begin;

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tipos controlados
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.user_role as enum ('ADMINISTRADOR', 'OPERADOR', 'LECTURA');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.case_priority as enum ('URGENTE', 'ALTA', 'NORMAL', 'MEDIA', 'BAJA');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.case_status as enum (
    'PENDIENTE_DE_REPUESTO',
    'ARRIBO_PARCIAL',
    'PENDIENTE_DE_TURNO',
    'PROGRAMADO',
    'REPROGRAMAR',
    'TURNO_SIN_REPUESTO',
    'REALIZADO',
    'DADO_DE_BAJA'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.vor_status as enum ('NO_AVISADO', 'AVISADO', 'REALIZADO');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.appointment_status as enum ('PENDIENTE', 'PROGRAMADO', 'EJECUTADO', 'NO_EJECUTADO', 'CANCELADO');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.registry_origin as enum ('CON_TURNO', 'SIN_TURNO');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.deposit_status as enum ('SIN_CLASIFICAR', 'PERDIDA', 'TIRADA', 'DEPOSITO_INF', 'DEPOSITO_SUP', 'ENVIADO_A_TOYOTA');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.comment_area as enum ('GENERAL', 'REPUESTOS', 'TURNOS', 'EJECUCION', 'VOR', 'DEPOSITO');
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Organización, usuarios y vehículos
-- ---------------------------------------------------------------------------

create table if not exists public.dealerships (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.dealerships (id, name, code)
values ('00000000-0000-0000-0000-000000000001', 'Amiun Toyota', 'AMIUN')
on conflict (code) do nothing;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dealership_users (
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.user_role not null default 'OPERADOR',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (dealership_id, user_id)
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  full_name text not null,
  phone text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  vin text,
  plate text not null,
  sale_date date,
  initial_km integer check (initial_km is null or initial_km >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (dealership_id, plate),
  unique (dealership_id, vin)
);

-- ---------------------------------------------------------------------------
-- Registro maestro de garantías
-- ---------------------------------------------------------------------------

create table if not exists public.warranty_cases (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  order_number text not null,
  vehicle_id uuid not null references public.vehicles(id) on delete restrict,
  customer_id uuid references public.customers(id) on delete set null,
  request_date date not null,
  priority public.case_priority not null default 'NORMAL',
  status public.case_status not null default 'PENDIENTE_DE_REPUESTO',
  is_vor boolean not null default false,
  observations text,
  estimated_repair_minutes integer check (estimated_repair_minutes is null or estimated_repair_minutes >= 0),
  cancelled_at timestamptz,
  cancellation_reason text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (dealership_id, order_number),
  check (
    (status <> 'DADO_DE_BAJA')
    or (cancelled_at is not null and nullif(btrim(cancellation_reason), '') is not null)
  )
);

create table if not exists public.parts_requests (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  case_id uuid not null references public.warranty_cases(id) on delete cascade,
  part_code text,
  description text not null default 'Sin especificar',
  quantity integer not null default 1 check (quantity > 0),
  requested_at date not null,
  arrived boolean not null default false,
  arrived_at timestamptz,
  arrival_confirmed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((arrived = false and arrived_at is null) or (arrived = true and arrived_at is not null))
);

create table if not exists public.case_comments (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  case_id uuid not null references public.warranty_cases(id) on delete cascade,
  area public.comment_area not null default 'GENERAL',
  comment text not null check (nullif(btrim(comment), '') is not null),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  case_id uuid not null references public.warranty_cases(id) on delete cascade,
  first_conversation_at date,
  scheduled_date date,
  scheduled_time time,
  status public.appointment_status not null default 'PENDIENTE',
  separate_schedule_reason text,
  programmed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    status not in ('PROGRAMADO', 'EJECUTADO', 'NO_EJECUTADO')
    or (scheduled_date is not null and scheduled_time is not null)
  )
);

create unique index if not exists appointments_one_active_per_case
on public.appointments(case_id)
where status in ('PENDIENTE', 'PROGRAMADO');

create table if not exists public.appointment_executions (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  case_id uuid not null references public.warranty_cases(id) on delete cascade,
  execution_date date not null,
  execution_time time,
  result public.appointment_status not null check (result in ('EJECUTADO', 'NO_EJECUTADO')),
  notes text,
  recorded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.vor_followups (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  case_id uuid not null unique references public.warranty_cases(id) on delete cascade,
  status public.vor_status not null default 'NO_AVISADO',
  notified_at timestamptz,
  completed_at timestamptz,
  notes text,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.parts_registry (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  case_id uuid references public.warranty_cases(id) on delete set null,
  appointment_id uuid references public.appointments(id) on delete set null,
  origin public.registry_origin not null,
  appointment_date date not null,
  vin text,
  plate text not null,
  sale_date date,
  part_code text,
  part_description text not null default 'Sin especificar',
  repair_order_number text not null,
  repair_date date,
  arrival_km integer check (arrival_km is null or arrival_km >= 0),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (dealership_id, repair_order_number)
);

create table if not exists public.deposit_records (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  registry_id uuid not null unique references public.parts_registry(id) on delete cascade,
  status public.deposit_status not null default 'SIN_CLASIFICAR',
  notes text,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deposit_status_history (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  deposit_record_id uuid not null references public.deposit_records(id) on delete cascade,
  previous_status public.deposit_status,
  new_status public.deposit_status not null,
  notes text,
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now()
);

create table if not exists public.case_documents (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  case_id uuid not null references public.warranty_cases(id) on delete cascade,
  storage_path text not null unique,
  file_name text not null,
  mime_type text,
  file_size bigint check (file_size is null or file_size >= 0),
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.case_status_history (
  id bigint generated always as identity primary key,
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  case_id uuid not null references public.warranty_cases(id) on delete cascade,
  previous_status public.case_status,
  new_status public.case_status not null,
  reason text,
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  dealership_id uuid,
  table_name text not null,
  record_id text not null,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  old_data jsonb,
  new_data jsonb,
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Índices operativos
-- ---------------------------------------------------------------------------

create index if not exists warranty_cases_dealership_status_idx on public.warranty_cases(dealership_id, status);
create index if not exists warranty_cases_vehicle_idx on public.warranty_cases(vehicle_id);
create index if not exists warranty_cases_request_date_idx on public.warranty_cases(request_date);
create index if not exists parts_requests_case_idx on public.parts_requests(case_id);
create index if not exists parts_requests_pending_idx on public.parts_requests(dealership_id, requested_at) where arrived = false;
create index if not exists appointments_date_idx on public.appointments(dealership_id, scheduled_date, scheduled_time);
create index if not exists appointments_case_idx on public.appointments(case_id);
create index if not exists executions_date_idx on public.appointment_executions(dealership_id, execution_date);
create index if not exists registry_date_idx on public.parts_registry(dealership_id, appointment_date);
create index if not exists deposit_status_idx on public.deposit_records(dealership_id, status);
create index if not exists comments_case_idx on public.case_comments(case_id, created_at desc);
create index if not exists history_case_idx on public.case_status_history(case_id, changed_at desc);

-- ---------------------------------------------------------------------------
-- Funciones y disparadores
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.business_days_between(start_date date, end_date date)
returns integer
language sql
immutable
parallel safe
as $$
  select case
    when start_date is null or end_date is null then 0
    when end_date >= start_date then (
      select count(*)::integer
      from generate_series(start_date + 1, end_date, interval '1 day') day_value
      where extract(isodow from day_value) between 1 and 5
    )
    else -(
      select count(*)::integer
      from generate_series(end_date + 1, start_date, interval '1 day') day_value
      where extract(isodow from day_value) between 1 and 5
    )
  end;
$$;

create or replace function public.current_user_has_dealership(target_dealership uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.dealership_users du
    where du.dealership_id = target_dealership
      and du.user_id = (select auth.uid())
      and du.active = true
  );
$$;

create or replace function public.current_user_is_admin(target_dealership uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.dealership_users du
    where du.dealership_id = target_dealership
      and du.user_id = (select auth.uid())
      and du.active = true
      and du.role = 'ADMINISTRADOR'
  );
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.track_case_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or old.status is distinct from new.status then
    insert into public.case_status_history (
      dealership_id, case_id, previous_status, new_status, reason, changed_by
    ) values (
      new.dealership_id,
      new.id,
      case when tg_op = 'INSERT' then null else old.status end,
      new.status,
      case when new.status = 'DADO_DE_BAJA' then new.cancellation_reason else null end,
      coalesce(new.updated_by, new.created_by, (select auth.uid()))
    );
  end if;
  return new;
end;
$$;

drop trigger if exists warranty_case_status_history on public.warranty_cases;
create trigger warranty_case_status_history
after insert or update of status on public.warranty_cases
for each row execute function public.track_case_status();

create or replace function public.track_deposit_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or old.status is distinct from new.status then
    insert into public.deposit_status_history (
      dealership_id, deposit_record_id, previous_status, new_status, notes, changed_by
    ) values (
      new.dealership_id,
      new.id,
      case when tg_op = 'INSERT' then null else old.status end,
      new.status,
      new.notes,
      coalesce(new.updated_by, (select auth.uid()))
    );
  end if;
  return new;
end;
$$;

drop trigger if exists deposit_status_audit on public.deposit_records;
create trigger deposit_status_audit
after insert or update of status on public.deposit_records
for each row execute function public.track_deposit_status();

create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  old_row jsonb;
  new_row jsonb;
  target_dealership uuid;
  target_id text;
begin
  old_row := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end;
  new_row := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end;
  target_dealership := coalesce((new_row ->> 'dealership_id')::uuid, (old_row ->> 'dealership_id')::uuid);
  target_id := coalesce(new_row ->> 'id', old_row ->> 'id');
  insert into public.audit_log (dealership_id, table_name, record_id, action, old_data, new_data, changed_by)
  values (target_dealership, tg_table_name, target_id, tg_op, old_row, new_row, (select auth.uid()));
  return coalesce(new, old);
end;
$$;

do $$
declare
  table_item text;
begin
  foreach table_item in array array[
    'warranty_cases', 'parts_requests', 'case_comments', 'appointments',
    'appointment_executions', 'vor_followups', 'parts_registry', 'deposit_records'
  ] loop
    execute format('drop trigger if exists %I on public.%I', 'audit_' || table_item, table_item);
    execute format(
      'create trigger %I after insert or update or delete on public.%I for each row execute function public.audit_row_change()',
      'audit_' || table_item,
      table_item
    );
  end loop;
end;
$$;

do $$
declare
  table_item text;
begin
  foreach table_item in array array[
    'dealerships', 'profiles', 'customers', 'vehicles', 'warranty_cases',
    'parts_requests', 'case_comments', 'appointments', 'vor_followups',
    'parts_registry', 'deposit_records'
  ] loop
    execute format('drop trigger if exists %I on public.%I', 'set_updated_at_' || table_item, table_item);
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      'set_updated_at_' || table_item,
      table_item
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Vistas equivalentes a las secciones de la aplicación
-- ---------------------------------------------------------------------------

create or replace view public.v_case_operational
with (security_invoker = true)
as
select
  wc.id as case_id,
  wc.dealership_id,
  wc.order_number,
  v.vin,
  v.plate,
  v.sale_date,
  v.initial_km,
  c.full_name as customer_name,
  c.phone,
  wc.request_date,
  wc.priority,
  wc.status,
  wc.is_vor,
  wc.observations,
  wc.estimated_repair_minutes,
  pr.id as part_request_id,
  pr.part_code,
  pr.description as part_description,
  pr.quantity,
  pr.arrived,
  pr.arrived_at,
  public.business_days_between(pr.requested_at, coalesce(pr.arrived_at::date, current_date)) as part_wait_business_days,
  a.id as appointment_id,
  a.first_conversation_at,
  a.scheduled_date,
  a.scheduled_time,
  a.status as appointment_status,
  case when pr.arrived_at is null then null else public.business_days_between(pr.arrived_at::date, current_date) end as arrival_age_business_days,
  vf.status as vor_followup_status,
  wc.cancellation_reason,
  wc.created_at,
  wc.updated_at
from public.warranty_cases wc
join public.vehicles v on v.id = wc.vehicle_id
left join public.customers c on c.id = wc.customer_id
left join lateral (
  select request.*
  from public.parts_requests request
  where request.case_id = wc.id
  order by request.created_at
  limit 1
) pr on true
left join lateral (
  select appointment.*
  from public.appointments appointment
  where appointment.case_id = wc.id
  order by appointment.created_at desc
  limit 1
) a on true
left join public.vor_followups vf on vf.case_id = wc.id;

create or replace view public.v_repuestos
with (security_invoker = true)
as
select * from public.v_case_operational
where status <> 'DADO_DE_BAJA';

create or replace view public.v_turnos
with (security_invoker = true)
as
select * from public.v_case_operational
where arrived = true
  and is_vor = false
  and status <> 'DADO_DE_BAJA';

create or replace view public.v_turnos_sin_repuestos
with (security_invoker = true)
as
select * from public.v_case_operational
where status = 'TURNO_SIN_REPUESTO';

create or replace view public.v_vor
with (security_invoker = true)
as
select * from public.v_case_operational
where is_vor = true
  and arrived = true
  and status <> 'DADO_DE_BAJA';

create or replace view public.v_dados_de_baja
with (security_invoker = true)
as
select * from public.v_case_operational
where status = 'DADO_DE_BAJA';

create or replace view public.v_resumen_repuestos
with (security_invoker = true)
as
select *,
  case
    when part_wait_business_days between 0 and 7 then '0 a 7 días'
    when part_wait_business_days between 8 and 14 then '8 a 14 días'
    when part_wait_business_days between 15 and 21 then '15 a 21 días'
    else '22+ días'
  end as age_range
from public.v_case_operational
where arrived = false
  and status not in ('DADO_DE_BAJA', 'REALIZADO');

create or replace view public.v_resumen_turnos
with (security_invoker = true)
as
select *,
  case
    when arrival_age_business_days between 0 and 7 then '0 a 7 días'
    when arrival_age_business_days between 8 and 14 then '8 a 14 días'
    when arrival_age_business_days between 15 and 21 then '15 a 21 días'
    else '22+ días'
  end as age_range
from public.v_case_operational
where arrived = true
  and is_vor = false
  and status in ('PENDIENTE_DE_TURNO', 'REPROGRAMAR', 'ARRIBO_PARCIAL');

create or replace view public.v_registro_repuestos
with (security_invoker = true)
as
select
  rr.*,
  dr.status as deposit_status,
  dr.notes as deposit_notes,
  public.business_days_between(rr.repair_date, current_date) as deposit_age_business_days
from public.parts_registry rr
left join public.deposit_records dr on dr.registry_id = rr.id;

-- ---------------------------------------------------------------------------
-- Seguridad RLS
-- ---------------------------------------------------------------------------

alter table public.dealerships enable row level security;
alter table public.profiles enable row level security;
alter table public.dealership_users enable row level security;
alter table public.customers enable row level security;
alter table public.vehicles enable row level security;
alter table public.warranty_cases enable row level security;
alter table public.parts_requests enable row level security;
alter table public.case_comments enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_executions enable row level security;
alter table public.vor_followups enable row level security;
alter table public.parts_registry enable row level security;
alter table public.deposit_records enable row level security;
alter table public.deposit_status_history enable row level security;
alter table public.case_documents enable row level security;
alter table public.case_status_history enable row level security;
alter table public.audit_log enable row level security;

drop policy if exists "profiles_read_own" on public.profiles;
create policy "profiles_read_own" on public.profiles for select to authenticated
using (id = (select auth.uid()));

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "dealerships_member_read" on public.dealerships;
create policy "dealerships_member_read" on public.dealerships for select to authenticated
using (public.current_user_has_dealership(id));

drop policy if exists "dealership_users_member_read" on public.dealership_users;
create policy "dealership_users_member_read" on public.dealership_users for select to authenticated
using (public.current_user_has_dealership(dealership_id));

drop policy if exists "dealership_users_admin_write" on public.dealership_users;
create policy "dealership_users_admin_write" on public.dealership_users for all to authenticated
using (public.current_user_is_admin(dealership_id))
with check (public.current_user_is_admin(dealership_id));

do $$
declare
  table_item text;
begin
  foreach table_item in array array[
    'customers', 'vehicles', 'warranty_cases', 'parts_requests', 'case_comments',
    'appointments', 'appointment_executions', 'vor_followups', 'parts_registry',
    'deposit_records', 'deposit_status_history', 'case_documents', 'case_status_history'
  ] loop
    execute format('drop policy if exists %I on public.%I', table_item || '_member_read', table_item);
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.current_user_has_dealership(dealership_id))',
      table_item || '_member_read',
      table_item
    );
    execute format('drop policy if exists %I on public.%I', table_item || '_member_insert', table_item);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (public.current_user_has_dealership(dealership_id))',
      table_item || '_member_insert',
      table_item
    );
    execute format('drop policy if exists %I on public.%I', table_item || '_member_update', table_item);
    execute format(
      'create policy %I on public.%I for update to authenticated using (public.current_user_has_dealership(dealership_id)) with check (public.current_user_has_dealership(dealership_id))',
      table_item || '_member_update',
      table_item
    );
    execute format('drop policy if exists %I on public.%I', table_item || '_admin_delete', table_item);
    execute format(
      'create policy %I on public.%I for delete to authenticated using (public.current_user_is_admin(dealership_id))',
      table_item || '_admin_delete',
      table_item
    );
  end loop;
end;
$$;

drop policy if exists "audit_member_read" on public.audit_log;
create policy "audit_member_read" on public.audit_log for select to authenticated
using (public.current_user_has_dealership(dealership_id));

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant select on public.v_case_operational, public.v_repuestos, public.v_turnos,
  public.v_turnos_sin_repuestos, public.v_vor, public.v_dados_de_baja,
  public.v_resumen_repuestos, public.v_resumen_turnos, public.v_registro_repuestos
to authenticated;

revoke insert, update, delete on public.audit_log from authenticated, anon;
revoke insert, update, delete on public.case_status_history from authenticated, anon;
revoke insert, update, delete on public.deposit_status_history from authenticated, anon;

commit;
