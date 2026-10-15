# Supabase del proyecto migrado

La migración principal es `migrations/202610150001_new_project_baseline.sql`.

Incluye tablas, relaciones, índices, vistas, funciones, triggers y RLS para el proyecto nuevo. Las claves secretas y los usuarios de Auth se configuran directamente en Supabase y no se guardan en GitHub.

## Función de notificaciones

`functions/notify-new-case/index.ts` requiere secretos nuevos de Gmail en el proyecto destino. No se copiaron secretos del proyecto origen.
