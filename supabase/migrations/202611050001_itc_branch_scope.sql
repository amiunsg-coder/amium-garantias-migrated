-- Asociar cada seguimiento ITC a una sucursal para aplicar el alcance por usuario.
begin;

alter table public.itc_cases
  add column if not exists branch text not null default 'Santa Fe';

update public.itc_cases
set branch = 'Santa Fe'
where branch is null or btrim(branch) = '';

create index if not exists idx_itc_cases_branch on public.itc_cases(branch);

commit;
