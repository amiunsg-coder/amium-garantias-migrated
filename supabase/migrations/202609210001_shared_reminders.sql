-- Independent rows prevent changes to one reminder overwriting another.
-- Deleted reminders remain as tombstones to prevent stale browser reimports.
begin;
drop policy if exists "shared_reminders_read" on public.app_state;
drop policy if exists "shared_reminders_insert" on public.app_state;
drop policy if exists "shared_reminders_update" on public.app_state;
create policy "shared_reminders_read" on public.app_state
for select to anon, authenticated
using (key like 'operational-reminder:%');
create policy "shared_reminders_insert" on public.app_state
for insert to anon, authenticated
with check (key like 'operational-reminder:%');
create policy "shared_reminders_update" on public.app_state
for update to anon, authenticated
using (key like 'operational-reminder:%')
with check (key like 'operational-reminder:%');
commit;
