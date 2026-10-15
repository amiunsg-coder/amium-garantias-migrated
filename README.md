# Amiun Garantías · Repositorio migrado

Aplicación web operativa para gestionar casos de garantía, repuestos, turnos y trazabilidad.

## Supabase

La aplicación apunta al proyecto nuevo de Supabase `tpwefamipnzzepwktquy` mediante la URL y la publishable key configuradas en `app.js`. El esquema versionado está en `supabase/migrations/202610150001_new_project_baseline.sql`.

No se incluyen en este repositorio exportaciones de clientes, backups, CSV/JSON con datos operativos, credenciales ni claves secretas. Los usuarios de Supabase Auth y los secretos de Gmail deben configurarse en el proyecto destino.

## Desarrollo local

Abrir `index.html` en un navegador moderno o servir el directorio con un servidor HTTP local. Para configurar valores locales, copiar `.env.example` a un archivo fuera del control de versiones y completar únicamente secretos del entorno.
