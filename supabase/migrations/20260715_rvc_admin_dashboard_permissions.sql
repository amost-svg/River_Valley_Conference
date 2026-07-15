drop policy if exists school_contacts_scoped_insert on public.school_contacts;
create policy school_contacts_scoped_insert
on public.school_contacts
for insert
to authenticated
with check (
  private.has_conference_role(array['conference_admin']::public.app_role[])
  or (
    private.has_school_role(school_id,array['school_principal','athletic_director']::public.app_role[])
    and role in ('school_principal','athletic_director')
  )
);

create or replace function public.admin_user_directory()
returns table(
  user_id uuid,
  email text,
  full_name text,
  last_sign_in_at timestamptz,
  user_created_at timestamptz,
  email_confirmed_at timestamptz,
  membership_id uuid,
  school_id uuid,
  role public.app_role,
  membership_status public.membership_status
)
language plpgsql
security definer
set search_path='pg_catalog','public','auth'
as $$
begin
  if not private.has_conference_role(array['conference_admin']::public.app_role[]) then
    raise exception 'Conference administrator access is required.' using errcode='42501';
  end if;

  return query
  select
    u.id,
    coalesce(u.email,''),
    coalesce(p.full_name,u.raw_user_meta_data->>'full_name',''),
    u.last_sign_in_at,
    u.created_at,
    u.email_confirmed_at,
    m.id,
    m.school_id,
    m.role,
    m.status
  from auth.users u
  left join public.profiles p on p.id=u.id
  left join public.memberships m on m.user_id=u.id
  order by coalesce(p.full_name,u.email),m.created_at;
end;
$$;
revoke all on function public.admin_user_directory() from public;
grant execute on function public.admin_user_directory() to authenticated;
