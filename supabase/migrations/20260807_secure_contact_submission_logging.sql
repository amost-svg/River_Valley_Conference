create or replace function public.log_contact_submission(
  p_secret text,
  p_name text,
  p_email text,
  p_school text,
  p_subject text,
  p_message text
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_id uuid;
  v_expected_hash constant text := '9f87cf107a3a247ceab1fe220a94a53a34aad5f81652f6c647c10c7708379d54';
begin
  if encode(extensions.digest(coalesce(p_secret, ''), 'sha256'), 'hex') <> v_expected_hash then
    raise exception 'Unauthorized contact log request' using errcode = '42501';
  end if;

  if char_length(btrim(coalesce(p_name, ''))) < 2
     or char_length(btrim(p_name)) > 120
     or char_length(btrim(coalesce(p_email, ''))) < 3
     or char_length(btrim(p_email)) > 254
     or btrim(p_email) !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
     or char_length(btrim(coalesce(p_message, ''))) < 10
     or char_length(btrim(p_message)) > 4000
     or p_subject not in ('schedules','membership','rules','general','other')
     or char_length(btrim(coalesce(p_school, ''))) > 160 then
    raise exception 'Invalid contact submission' using errcode = '22023';
  end if;

  insert into public.contact_submissions (name, email, school, subject, message, status)
  values (
    btrim(p_name),
    lower(btrim(p_email)),
    nullif(btrim(coalesce(p_school, '')), ''),
    p_subject,
    btrim(p_message),
    'new'
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.log_contact_submission(text,text,text,text,text,text) from public;
grant execute on function public.log_contact_submission(text,text,text,text,text,text) to anon, authenticated;

drop policy if exists contacts_public_insert on public.contact_submissions;
