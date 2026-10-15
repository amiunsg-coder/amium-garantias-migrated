-- Permite compartir la configuración de destinatarios de pedidos de repuestos.

begin;

drop policy if exists "app_state_public_insert" on public.app_state;
create policy "app_state_public_insert"
on public.app_state for insert
to anon, authenticated
with check (key in (
  'warranty-cases',
  'parts-registry-manual',
  'amiun-deleted-case-audit-v1',
  'parts-order-email-settings'
));

drop policy if exists "app_state_public_update" on public.app_state;
create policy "app_state_public_update"
on public.app_state for update
to anon, authenticated
using (key in (
  'warranty-cases',
  'parts-registry-manual',
  'amiun-deleted-case-audit-v1',
  'parts-order-email-settings'
))
with check (key in (
  'warranty-cases',
  'parts-registry-manual',
  'amiun-deleted-case-audit-v1',
  'parts-order-email-settings'
));

commit;
