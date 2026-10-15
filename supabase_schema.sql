-- AMIUN Garantias y Postventa
-- Esquema relacional base para migrar la web desde localStorage/app_state a Supabase.
-- Ejecutar en Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  display_name text not null,
  role text not null,
  initials text,
  allowed_views jsonb,
  permissions jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  normalized_name text generated always as (upper(trim(name))) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  plate text not null,
  vin text,
  sale_date date,
  km integer,
  normalized_plate text generated always as (upper(regexp_replace(plate, '\s+', '', 'g'))) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  client_id uuid references public.clients(id) on delete set null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  priority text not null default 'Normal',
  vor boolean not null default false,
  vor_status text,
  requested boolean not null default true,
  arrived boolean not null default false,
  request_date date,
  arrival_date date,
  appointment_date date,
  appointment_time time,
  first_conversation date,
  scheduled boolean not null default false,
  manual_status boolean not null default false,
  status text not null default 'PENDIENTE DE REPUESTO',
  comment text,
  observations text,
  cancel_reason text,
  cancelled_at timestamptz,
  released_status text,
  missing_reason text,
  separate_schedule_reason text,
  execution_status text,
  execution_date date,
  execution_time time,
  registry_order text,
  repair_date date,
  arrival_km integer,
  registry_responsible text,
  raw_payload jsonb not null default '{}'::jsonb,
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.case_parts (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  part_code text,
  part_description text,
  repair_time numeric(8,2),
  document_url text,
  deposit_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  appointment_date date not null,
  appointment_time time,
  first_conversation date,
  programmed boolean not null default false,
  separate_schedule_reason text,
  execution_status text,
  execution_date date,
  execution_time time,
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.parts_registry_records (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.cases(id) on delete set null,
  source text not null default 'manual',
  registry_date date not null default current_date,
  registry_order text,
  vin text,
  plate text,
  sale_date date,
  part_code text,
  part_description text,
  repair_order text,
  repair_date date,
  arrival_km integer,
  origin text,
  responsible text,
  deposit_status text,
  toyota10_alert_shown boolean not null default false,
  raw_payload jsonb not null default '{}'::jsonb,
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.cases(id) on delete set null,
  title text not null,
  category text not null default 'Seguimiento',
  priority text not null default 'Normal',
  reminder_date date not null,
  reminder_time time,
  responsible_user_id uuid references public.app_users(id) on delete set null,
  responsible_name text,
  recurrence text not null default 'once',
  recurrence_days jsonb not null default '[]'::jsonb,
  recurrence_end date,
  recurrence_month_day integer,
  lead_minutes integer not null default 0,
  status text not null default 'pending',
  occurrence_history jsonb not null default '[]'::jsonb,
  note text,
  last_alert_at timestamptz,
  snoozed_until timestamptz,
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.case_audit_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.cases(id) on delete set null,
  order_number text,
  actor_user_id uuid references public.app_users(id) on delete set null,
  actor_name text,
  action_type text not null,
  action_label text not null,
  field_name text,
  before_data jsonb,
  after_data jsonb,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.cases(id) on delete set null,
  notification_type text not null,
  recipient text not null,
  subject text,
  body text,
  status text not null default 'pending',
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

-- Compatibilidad temporal con la implementacion actual.
create table if not exists public.app_state (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- Una fila por orden. Es la fuente operativa utilizada por la web.
create table if not exists public.case_records (
  order_number text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'case_records'
  ) then
    alter publication supabase_realtime add table public.case_records;
  end if;
end $$;

create index if not exists idx_cases_status on public.cases(status);
create index if not exists idx_cases_request_date on public.cases(request_date);
create index if not exists idx_cases_arrival_date on public.cases(arrival_date);
create index if not exists idx_cases_appointment_date on public.cases(appointment_date);
create index if not exists idx_cases_vor on public.cases(vor);
create index if not exists idx_cases_vehicle_id on public.cases(vehicle_id);
create index if not exists idx_cases_client_id on public.cases(client_id);
create index if not exists idx_case_parts_case_id on public.case_parts(case_id);
create index if not exists idx_appointments_case_id on public.appointments(case_id);
create index if not exists idx_appointments_date on public.appointments(appointment_date);
create index if not exists idx_registry_date on public.parts_registry_records(registry_date);
create index if not exists idx_registry_case_id on public.parts_registry_records(case_id);
create index if not exists idx_reminders_date_status on public.reminders(reminder_date, status);
create index if not exists idx_audit_case_id on public.case_audit_events(case_id);
create index if not exists idx_notifications_case_id on public.notifications(case_id);
create index if not exists idx_case_records_updated_at on public.case_records(updated_at);
create unique index if not exists idx_clients_name_phone on public.clients(normalized_name, coalesce(phone, ''));
create unique index if not exists idx_vehicles_plate on public.vehicles(normalized_plate);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_app_users_updated_at on public.app_users;
create trigger trg_app_users_updated_at before update on public.app_users for each row execute function public.set_updated_at();

drop trigger if exists trg_clients_updated_at on public.clients;
create trigger trg_clients_updated_at before update on public.clients for each row execute function public.set_updated_at();

drop trigger if exists trg_vehicles_updated_at on public.vehicles;
create trigger trg_vehicles_updated_at before update on public.vehicles for each row execute function public.set_updated_at();

drop trigger if exists trg_cases_updated_at on public.cases;
create trigger trg_cases_updated_at before update on public.cases for each row execute function public.set_updated_at();

drop trigger if exists trg_case_parts_updated_at on public.case_parts;
create trigger trg_case_parts_updated_at before update on public.case_parts for each row execute function public.set_updated_at();

drop trigger if exists trg_appointments_updated_at on public.appointments;
create trigger trg_appointments_updated_at before update on public.appointments for each row execute function public.set_updated_at();

drop trigger if exists trg_registry_updated_at on public.parts_registry_records;
create trigger trg_registry_updated_at before update on public.parts_registry_records for each row execute function public.set_updated_at();

drop trigger if exists trg_reminders_updated_at on public.reminders;
create trigger trg_reminders_updated_at before update on public.reminders for each row execute function public.set_updated_at();

create or replace view public.case_list_view as
select
  c.id,
  c.order_number,
  v.vin,
  v.plate,
  cl.name as client,
  cl.phone,
  c.priority,
  c.vor,
  c.vor_status,
  c.requested,
  c.arrived,
  c.request_date,
  c.arrival_date,
  v.sale_date,
  v.km,
  c.appointment_date,
  c.appointment_time,
  c.first_conversation,
  c.scheduled,
  c.status,
  c.comment,
  c.observations,
  c.cancel_reason,
  c.released_status,
  c.missing_reason,
  c.separate_schedule_reason,
  c.execution_status,
  c.execution_date,
  c.execution_time,
  c.registry_order,
  c.repair_date,
  c.arrival_km,
  c.registry_responsible,
  cp.part_code,
  cp.part_description,
  cp.repair_time,
  cp.document_url,
  cp.deposit_status,
  c.created_at,
  c.updated_at
from public.cases c
left join public.vehicles v on v.id = c.vehicle_id
left join public.clients cl on cl.id = c.client_id
left join lateral (
  select *
  from public.case_parts p
  where p.case_id = c.id
  order by p.created_at asc
  limit 1
) cp on true;

create or replace view public.kpi_summary_view as
select
  count(*) filter (where status <> 'DADO DE BAJA') as base_datos,
  count(*) filter (where status <> 'DADO DE BAJA' and requested = true and arrived = false) as repuestos_sin_arribo,
  count(*) filter (where status <> 'DADO DE BAJA' and arrived = true and vor = false and coalesce(appointment_date::text, '') = '' and coalesce(appointment_time::text, '') = '' and status in ('PENDIENTE DE TURNO', 'REPROGRAMAR')) as pendiente_de_turno,
  count(*) filter (where status <> 'DADO DE BAJA' and appointment_date is not null and arrived = false) as turnos_sin_repuesto,
  count(*) filter (where status = 'DADO DE BAJA') as dados_de_baja,
  count(*) filter (where status <> 'DADO DE BAJA' and vor = true and arrived = true) as vor,
  count(*) filter (where status = 'REALIZADO') as realizados
from public.cases;

insert into public.app_users (username, display_name, role, initials, allowed_views)
values
  ('fneyra', 'Fneyra', 'Garantias', 'FN', null),
  ('tdeodatti', 'TDeodatti', 'Garantias', 'TD', null),
  ('orusso', 'ORusso', 'Gerencial', 'OR', null),
  ('cgavazzi', 'CGavazzi', 'Postventa', 'CG', null),
  ('fmagdalena', 'FMagdalena', 'Repuestos', 'FM', '["parts","missing-parts"]'::jsonb),
  ('mmontejo', 'MMontejo', 'Repuestos', 'MM', '["parts","missing-parts"]'::jsonb),
  ('ffranconi', 'FFranconi', 'Repuestos', 'FF', '["parts","missing-parts"]'::jsonb),
  ('fjorge', 'FJorge', 'Repuestos', 'FJ', '["parts","missing-parts"]'::jsonb),
  ('ndominguez', 'NDominguez', 'Citas', 'ND', '["dashboard","database","appointments"]'::jsonb),
  ('arojas', 'ARojas', 'Citas', 'AR', '["dashboard","database","appointments"]'::jsonb),
  ('mecanicos', 'Mecanicos', 'Registro de repuestos', 'MC', '["parts-registry"]'::jsonb)
on conflict (username) do update set
  display_name = excluded.display_name,
  role = excluded.role,
  initials = excluded.initials,
  allowed_views = excluded.allowed_views,
  updated_at = now();

alter table public.app_users enable row level security;
alter table public.clients enable row level security;
alter table public.vehicles enable row level security;
alter table public.cases enable row level security;
alter table public.case_parts enable row level security;
alter table public.appointments enable row level security;
alter table public.parts_registry_records enable row level security;
alter table public.reminders enable row level security;
alter table public.case_audit_events enable row level security;
alter table public.notifications enable row level security;
alter table public.app_state enable row level security;
alter table public.case_records enable row level security;

-- Politicas abiertas para anon/auth mientras la web no tenga login Supabase real.
-- Cuando se active Auth, conviene cambiarlas por permisos por usuario/rol.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'app_users',
    'clients',
    'vehicles',
    'cases',
    'case_parts',
    'appointments',
    'parts_registry_records',
    'reminders',
    'case_audit_events',
    'notifications',
    'app_state',
    'case_records'
  ]
  loop
    execute format('drop policy if exists "public_read_%1$s" on public.%1$I', table_name);
    execute format('drop policy if exists "public_insert_%1$s" on public.%1$I', table_name);
    execute format('drop policy if exists "public_update_%1$s" on public.%1$I', table_name);
    execute format('drop policy if exists "public_delete_%1$s" on public.%1$I', table_name);
    execute format('create policy "public_read_%1$s" on public.%1$I for select using (true)', table_name);
    execute format('create policy "public_insert_%1$s" on public.%1$I for insert with check (true)', table_name);
    execute format('create policy "public_update_%1$s" on public.%1$I for update using (true) with check (true)', table_name);
    execute format('create policy "public_delete_%1$s" on public.%1$I for delete using (true)', table_name);
  end loop;
end $$;
