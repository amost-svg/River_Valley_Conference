-- Complete the public-contact, private-storage, cooperative-program, and
-- school-scoped game-management foundations used by the RVC operations portal.

revoke all on table public.contact_submissions from anon, authenticated;
grant insert on table public.contact_submissions to anon, authenticated;
grant select, update, delete on table public.contact_submissions to authenticated;

drop policy if exists contacts_public_insert on public.contact_submissions;
create policy contacts_public_insert
on public.contact_submissions
for insert
to anon, authenticated
with check (
  char_length(btrim(name)) between 2 and 120
  and char_length(btrim(email)) between 3 and 254
  and btrim(email) ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  and (school is null or char_length(btrim(school)) <= 160)
  and subject in ('schedules', 'membership', 'rules', 'general', 'other')
  and char_length(btrim(message)) between 10 and 4000
  and status = 'new'
  and reviewed_at is null
  and reviewed_by is null
);

drop policy if exists rvc_documents_read on storage.objects;
create policy rvc_documents_read
on storage.objects
for select
to authenticated
using (
  bucket_id = 'conference-documents'
  and private.has_conference_role(array[
    'conference_admin',
    'conference_official',
    'school_principal',
    'athletic_director',
    'press_editor'
  ]::public.app_role[])
  and exists (
    select 1
    from public.conference_documents d
    where d.storage_path = storage.objects.name
      and d.status = 'published'
  )
);

drop policy if exists rvc_school_logos_insert on storage.objects;
create policy rvc_school_logos_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'school-logos'
  and (
    private.has_conference_role(array['conference_admin']::public.app_role[])
    or exists (
      select 1
      from public.schools s
      where s.slug = (storage.foldername(storage.objects.name))[1]
        and private.has_school_role(
          s.id,
          array['school_principal', 'athletic_director']::public.app_role[]
        )
    )
  )
);

drop policy if exists rvc_school_logos_update on storage.objects;
create policy rvc_school_logos_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'school-logos'
  and (
    private.has_conference_role(array['conference_admin']::public.app_role[])
    or exists (
      select 1
      from public.schools s
      where s.slug = (storage.foldername(storage.objects.name))[1]
        and private.has_school_role(
          s.id,
          array['school_principal', 'athletic_director']::public.app_role[]
        )
    )
  )
)
with check (
  bucket_id = 'school-logos'
  and (
    private.has_conference_role(array['conference_admin']::public.app_role[])
    or exists (
      select 1
      from public.schools s
      where s.slug = (storage.foldername(storage.objects.name))[1]
        and private.has_school_role(
          s.id,
          array['school_principal', 'athletic_director']::public.app_role[]
        )
    )
  )
);

drop policy if exists rvc_school_logos_delete on storage.objects;
create policy rvc_school_logos_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'school-logos'
  and (
    private.has_conference_role(array['conference_admin']::public.app_role[])
    or exists (
      select 1
      from public.schools s
      where s.slug = (storage.foldername(storage.objects.name))[1]
        and private.has_school_role(
          s.id,
          array['school_principal', 'athletic_director']::public.app_role[]
        )
    )
  )
);

drop policy if exists rvc_schedule_imports_insert on storage.objects;
create policy rvc_schedule_imports_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'schedule-imports'
  and (
    private.has_conference_role(
      array['conference_admin', 'conference_official']::public.app_role[]
    )
    or exists (
      select 1
      from public.schools s
      where s.slug = (storage.foldername(storage.objects.name))[1]
        and private.has_school_role(
          s.id,
          array['school_principal', 'athletic_director']::public.app_role[]
        )
    )
  )
);

drop policy if exists rvc_schedule_imports_read on storage.objects;
create policy rvc_schedule_imports_read
on storage.objects
for select
to authenticated
using (
  bucket_id = 'schedule-imports'
  and (
    private.has_conference_role(
      array['conference_admin', 'conference_official']::public.app_role[]
    )
    or exists (
      select 1
      from public.schools s
      where s.slug = (storage.foldername(storage.objects.name))[1]
        and private.has_school_role(
          s.id,
          array['school_principal', 'athletic_director']::public.app_role[]
        )
    )
  )
);

drop policy if exists rvc_schedule_imports_update on storage.objects;
create policy rvc_schedule_imports_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'schedule-imports'
  and (
    private.has_conference_role(
      array['conference_admin', 'conference_official']::public.app_role[]
    )
    or exists (
      select 1
      from public.schools s
      where s.slug = (storage.foldername(storage.objects.name))[1]
        and private.has_school_role(
          s.id,
          array['school_principal', 'athletic_director']::public.app_role[]
        )
    )
  )
)
with check (
  bucket_id = 'schedule-imports'
  and (
    private.has_conference_role(
      array['conference_admin', 'conference_official']::public.app_role[]
    )
    or exists (
      select 1
      from public.schools s
      where s.slug = (storage.foldername(storage.objects.name))[1]
        and private.has_school_role(
          s.id,
          array['school_principal', 'athletic_director']::public.app_role[]
        )
    )
  )
);

drop policy if exists rvc_schedule_imports_delete on storage.objects;
create policy rvc_schedule_imports_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'schedule-imports'
  and (
    private.has_conference_role(array['conference_admin']::public.app_role[])
    or exists (
      select 1
      from public.schools s
      where s.slug = (storage.foldername(storage.objects.name))[1]
        and private.has_school_role(
          s.id,
          array['school_principal', 'athletic_director']::public.app_role[]
        )
    )
  )
);

create or replace function private.game_involves_school(
  target_game_id uuid,
  target_school_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.games g
    where g.id = target_game_id
      and (
        g.owner_school_id = target_school_id
        or exists (
          select 1
          from public.teams t
          where t.id in (g.home_team_id, g.away_team_id)
            and t.school_id = target_school_id
        )
        or exists (
          select 1
          from public.team_schools ts
          where ts.team_id in (g.home_team_id, g.away_team_id)
            and ts.school_id = target_school_id
        )
      )
  );
$$;

create or replace function private.user_can_manage_game(target_game_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    private.has_conference_role(
      array['conference_admin', 'conference_official']::public.app_role[]
    )
    or exists (
      select 1
      from public.memberships m
      where m.user_id = auth.uid()
        and m.status = 'active'
        and m.role in ('school_principal', 'athletic_director')
        and private.game_involves_school(target_game_id, m.school_id)
    );
$$;

do $$
declare
  active_season_id uuid;
  girls_basketball_id uuid;
  coop_id uuid;
  gsw_school_id uuid;
  tri_point_school_id uuid;
  coop_team_id uuid;
begin
  select id into strict active_season_id
  from public.seasons
  where name = '2026-27';

  select id into strict girls_basketball_id
  from public.sports
  where slug = 'girls-basketball';

  select id into strict gsw_school_id
  from public.schools
  where slug = 'gardner-south-wilmington';

  select id into strict tri_point_school_id
  from public.schools
  where slug = 'tri-point';

  select id into strict coop_id
  from public.cooperative_programs
  where season_id = active_season_id
    and sport_id = girls_basketball_id
    and status = 'approved';

  select id into strict coop_team_id
  from public.teams
  where season_id = active_season_id
    and sport_id = girls_basketball_id
    and school_id = gsw_school_id
    and level = 'Varsity';

  update public.teams
  set display_name = 'Tri-Point/GSW',
      cooperative_program_id = coop_id,
      is_active = true,
      conference_eligible = true,
      tournament_eligible = true,
      updated_at = now()
  where id = coop_team_id;

  insert into public.team_schools(team_id, school_id, role)
  values (coop_team_id, tri_point_school_id, 'member')
  on conflict (team_id, school_id)
  do update set role = excluded.role;

  update public.teams
  set is_active = false,
      conference_eligible = false,
      tournament_eligible = false,
      updated_at = now()
  where season_id = active_season_id
    and sport_id = girls_basketball_id
    and school_id = tri_point_school_id
    and level = 'Varsity';
end;
$$;

insert into public.conference_officials(
  full_name,
  position,
  school_id,
  starts_on,
  is_active,
  display_order
)
select officer.full_name,
       officer.position,
       s.id,
       date '2026-07-01',
       true,
       officer.display_order
from (
  values
    ('Aaron Most', 'President', 'grace-christian-academy', 10),
    ('Mike Meyer', 'Vice President', 'beecher', 20),
    ('Ben O''Brien', 'Secretary-Treasurer', 'st-anne', 30),
    ('David Harris', 'Athletic Directors Chair', 'central', 40)
) as officer(full_name, position, school_slug, display_order)
join public.schools s on s.slug = officer.school_slug
where not exists (
  select 1
  from public.conference_officials current_officer
  where current_officer.full_name = officer.full_name
    and current_officer.starts_on = date '2026-07-01'
);

update public.data_quality_issues
set status = 'resolved',
    resolution_note = 'Conference correspondence and the approved co-op letter establish one Tri-Point/GSW team using GSW''s conference schedule. The GSW team record is now the active co-op team; the separate Tri-Point entry is archived.',
    resolved_at = now(),
    updated_at = now()
where issue_code = 'COOP_SCHEDULE_CONFLICT'
  and entity_id = '2026-27-girls-basketball'
  and status = 'open';

update public.data_quality_issues
set severity = 'warning',
    description = 'Thirty balanced 2026-27 conference soccer games are publishable after removing self-matchups and exact duplicates. Two extra same-home matchup rows remain held for athletic-director confirmation: Beecher at St. Anne on August 27 and St. Anne at Illinois Lutheran on September 3.',
    resolution_note = 'Invalid self-matchups and exact duplicates are excluded. Keep this issue open until athletic directors confirm or remove the two extra matchup dates.',
    updated_at = now()
where issue_code = 'INVALID_MASTER_ROWS'
  and entity_id = '2026-27-boys-soccer';
