begin;

-- Permite a un administrador restablecer la contraseña de un usuario de la
-- aplicación sin exponer hashes ni contraseñas al navegador.
create or replace function public.list_app_users_for_password_reset()
returns table(username text, display_name text, role text, active boolean)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_admin public.app_users%rowtype;
begin
  select * into v_admin
    from public.app_users
   where id = public.current_app_user_id()
     and active = true;

  if v_admin.id is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if lower(coalesce(v_admin.username, '')) <> 'fneyra'
     and lower(coalesce(v_admin.role, '')) not in ('admin', 'administrador', 'gerencial') then
    raise exception 'admin_required' using errcode = '42501';
  end if;

  return query
    select u.username, u.display_name, u.role, u.active
      from public.app_users u
     order by lower(u.display_name), lower(u.username);
end;
$$;

create or replace function public.admin_reset_app_password(
  p_target_username text,
  p_new_password text
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_admin public.app_users%rowtype;
  v_target_id uuid;
begin
  select * into v_admin
    from public.app_users
   where id = public.current_app_user_id()
     and active = true;

  if v_admin.id is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if lower(coalesce(v_admin.username, '')) <> 'fneyra'
     and lower(coalesce(v_admin.role, '')) not in ('admin', 'administrador', 'gerencial') then
    raise exception 'admin_required' using errcode = '42501';
  end if;

  if length(coalesce(p_new_password, '')) < 4 then
    raise exception 'password_too_short' using errcode = '22023';
  end if;

  select id into v_target_id
    from public.app_users
   where lower(username) = lower(trim(p_target_username))
     and active = true;

  if v_target_id is null then
    raise exception 'target_user_not_found' using errcode = '22023';
  end if;

  update public.app_users
     set password_hash = crypt(p_new_password, gen_salt('bf')),
         updated_at = now()
   where id = v_target_id;

  return true;
end;
$$;

revoke all on function public.list_app_users_for_password_reset() from public;
revoke all on function public.admin_reset_app_password(text, text) from public;
grant execute on function public.list_app_users_for_password_reset() to anon, authenticated;
grant execute on function public.admin_reset_app_password(text, text) to anon, authenticated;

commit;
