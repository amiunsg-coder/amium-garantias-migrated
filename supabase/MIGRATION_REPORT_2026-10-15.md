# Migración Supabase — 2026-10-15

## Proyecto nuevo

- Organización: Amiun Work (`olizltgmowtitttfjayi`)
- Proyecto: `amium-garantias-migrated`
- ID: `tpwefamipnzzepwktquy`
- URL: `https://tpwefamipnzzepwktquy.supabase.co`
- Región confirmada en el panel: Canada Central (`ca-central-1`)
- El ID es distinto del proyecto origen `ehnasodogbaeagdlcleq`.

## Copia aplicada

- Migración versionada: `supabase/migrations/202610150001_new_project_baseline.sql`
- Tablas creadas: `app_users`, `clients`, `vehicles`, `cases`, `case_parts`, `appointments`, `parts_registry_records`, `reminders`, `case_audit_events`, `notifications`, `app_state`, `case_records`.
- Datos copiados: 194 filas en `case_records` desde `recovery-case-records.json` mediante `case_records_migrated.csv`.
- Usuarios operativos copiados como configuración (`app_users`): 11 filas. No se copiaron contraseñas ni usuarios de Auth.
- Relaciones: 19 claves foráneas verificadas.
- Índices: 32 índices verificados.
- Vistas: `case_list_view`, `kpi_summary_view`.
- Funciones SQL: `set_updated_at`, `is_app_user`.
- Función Edge `notify-new-case`: el código sigue versionado en `supabase/functions/notify-new-case/index.ts`, pero no se desplegó automáticamente porque requiere configurar secretos nuevos de Gmail en el proyecto destino; no se copiaron secretos del origen.
- Triggers: 10 triggers `trg_*_updated_at` verificados.
- Realtime: `case_records` agregado a `supabase_realtime`.

## Seguridad

- RLS habilitado en las 12 tablas públicas.
- 48 políticas RLS configuradas.
- Las políticas requieren un usuario autenticado vinculado por `app_users.auth_user_id`; no se usaron políticas anónimas de CRUD para datos operativos.
- Las vistas fueron ajustadas a `security_invoker=true`.
- Auth del proyecto nuevo está vacío: el panel confirma “No users in your project”. Esto evita copiar usuarios o credenciales del origen. Antes de usar la aplicación con datos remotos hay que crear usuarios Auth nuevos y vincular sus UUID a `app_users.auth_user_id`.

## Storage

- El panel del proyecto nuevo no muestra buckets creados.
- El respaldo del origen no reporta buckets ni archivos (`File storage 0 / 1 GB`); se mantuvo esa configuración equivalente.

## Variables nuevas de frontend

- `AMIUN_SUPABASE_URL=https://tpwefamipnzzepwktquy.supabase.co`
- `AMIUN_SUPABASE_PUBLISHABLE_KEY=sb_publishable_hnFyb4IBvYaMiGpXcQ7Reg_kINVPX64`
- `AMIUN_NEW_CASE_NOTIFICATION_ENDPOINT=https://tpwefamipnzzepwktquy.supabase.co/functions/v1/notify-new-case`
- La service role/secret key no se incluyó en el frontend ni en el repositorio.

## Validaciones realizadas

- Proyecto nuevo visible como `Healthy` en el panel.
- `case_records`: 194 registros.
- RLS: 12 tablas habilitadas.
- Vistas: las 2 vistas esperadas.
- Relaciones, índices, funciones y triggers verificados con consultas SQL del proyecto nuevo.
- Auth: proyecto nuevo sin usuarios; no se tocaron usuarios del origen.
- Storage: sin buckets; no se subieron archivos.
- Se ejecutó `node --check app.js` correctamente.
- Se revisó el repositorio para eliminar referencias de frontend al host del proyecto origen.

## Rendimiento y tráfico saliente

- Se conserva Realtime para actualizaciones de `case_records`.
- La sincronización periódica de respaldo usa intervalos largos y consultas incrementales por `updated_at`, con selección explícita de columnas y paginación/rangos donde corresponde.
- Se evita descargar payloads completos para los sondeos de firma y se limita la respuesta de lecturas operativas.

## Confirmación de aislamiento

El proyecto `ehnasodogbaeagdlcleq` no fue transferido, borrado, pausado, reiniciado ni modificado. No se reutilizaron sus claves API. Todas las operaciones de creación, esquema, importación y validación se realizaron sobre `tpwefamipnzzepwktquy`.



