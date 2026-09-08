-- Phase 1: provider-neutral sports data integration foundation.
--
-- This migration is intentionally additive. Existing games, results, calendar sources,
-- and standings remain authoritative and unchanged. External systems attach to RVC
-- records through explicit mappings rather than overwriting canonical data.

create table if not exists public.integration_providers (
  provider_key text primary key,
  display_name text not null,
  category text not null check (category in ('officiating', 'scoring_stats', 'publishing', 'scheduling', 'other')),
  direction text not null default 'inbound' check (direction in ('inbound', 'outbound', 'bidirectional')),
  description text,
  capabilities jsonb not null default '{}'::jsonb,
  documentation_url text,
  is_active boolean not null default true,
  display_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (provider_key ~ '^[a-z0-9][a-z0-9_-]*$')
);

comment on table public.integration_providers is
  'Catalog of approved external sports-data providers. No credentials or secrets belong in this table.';

create table if not exists public.provider_connections (
  id uuid primary key default gen_random_uuid(),
  provider_key text not null references public.integration_providers(provider_key) on update cascade,
  name text not null,
  school_id uuid references public.schools(id) on delete cascade,
  scope_kind text not null default 'conference' check (scope_kind in ('conference', 'school', 'assigning_group', 'organization')),
  external_organization_id text,
  external_group_id text,
  connection_status text not null default 'planned' check (connection_status in ('planned', 'pending_auth', 'connected', 'degraded', 'disabled', 'revoked')),
  configuration jsonb not null default '{}'::jsonb,
  sync_cursor jsonb not null default '{}'::jsonb,
  last_successful_sync_at timestamptz,
  last_error_at timestamptz,
  last_error text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((scope_kind = 'school' and school_id is not null) or scope_kind <> 'school')
);

comment on table public.provider_connections is
  'Configured RVC connections to external providers. configuration must contain only non-secret metadata; credentials belong in server-side secrets/Vault.';

create table if not exists public.provider_game_links (
  id uuid primary key default gen_random_uuid(),
  provider_connection_id uuid not null references public.provider_connections(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  external_game_id text not null,
  external_custom_id text,
  external_url text,
  match_status text not null default 'unmatched' check (match_status in ('unmatched', 'suggested', 'matched', 'conflict', 'ignored')),
  match_method text check (match_method is null or match_method in ('manual', 'custom_id', 'exact', 'heuristic', 'import')),
  match_confidence numeric(5,4) check (match_confidence is null or (match_confidence >= 0 and match_confidence <= 1)),
  expected_positions integer check (expected_positions is null or expected_positions >= 0),
  provider_updated_at timestamptz,
  last_synced_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider_connection_id, external_game_id),
  unique (provider_connection_id, game_id)
);

create table if not exists public.provider_ingest_events (
  id uuid primary key default gen_random_uuid(),
  provider_connection_id uuid not null references public.provider_connections(id) on delete cascade,
  sync_run_id uuid references public.sync_runs(id) on delete set null,
  event_kind text not null,
  external_event_id text,
  raw_payload jsonb not null default '{}'::jsonb,
  normalized_payload jsonb not null default '{}'::jsonb,
  processing_status text not null default 'received' check (processing_status in ('received', 'processed', 'ignored', 'error')),
  error_message text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.provider_ingest_events is
  'Immutable-ish intake/audit records for provider payloads. Keep these internal; payloads may contain operational or personal information.';

create table if not exists public.official_assignments (
  id uuid primary key default gen_random_uuid(),
  provider_connection_id uuid not null references public.provider_connections(id) on delete cascade,
  provider_game_link_id uuid references public.provider_game_links(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  external_assignment_id text not null,
  external_official_id text,
  official_display_name text,
  position text,
  provider_status text,
  normalized_status text not null default 'unknown' check (normalized_status in ('unknown', 'open', 'assigned', 'accepted', 'declined', 'removed')),
  is_required boolean not null default true,
  is_deleted boolean not null default false,
  status_changed_at timestamptz,
  provider_updated_at timestamptz,
  last_synced_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider_connection_id, external_assignment_id)
);

create table if not exists public.integration_conflicts (
  id uuid primary key default gen_random_uuid(),
  provider_connection_id uuid not null references public.provider_connections(id) on delete cascade,
  game_id uuid references public.games(id) on delete cascade,
  conflict_type text not null,
  field_name text,
  canonical_value jsonb,
  provider_value jsonb,
  status text not null default 'open' check (status in ('open', 'resolved_keep_rvc', 'resolved_accept_provider', 'dismissed')),
  detected_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  resolution_note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Reuse the platform's existing sync-run ledger rather than introducing a parallel log.
alter table public.sync_runs
  add column if not exists provider_connection_id uuid references public.provider_connections(id) on delete set null,
  add column if not exists sync_kind text,
  add column if not exists cursor jsonb not null default '{}'::jsonb;

create index if not exists provider_connections_provider_idx on public.provider_connections(provider_key);
create index if not exists provider_connections_school_idx on public.provider_connections(school_id) where school_id is not null;
create index if not exists provider_game_links_game_idx on public.provider_game_links(game_id);
create index if not exists provider_game_links_status_idx on public.provider_game_links(match_status);
create index if not exists provider_ingest_events_connection_received_idx on public.provider_ingest_events(provider_connection_id, received_at desc);
create index if not exists provider_ingest_events_sync_run_idx on public.provider_ingest_events(sync_run_id) where sync_run_id is not null;
create index if not exists official_assignments_game_idx on public.official_assignments(game_id);
create index if not exists official_assignments_connection_idx on public.official_assignments(provider_connection_id);
create index if not exists official_assignments_status_idx on public.official_assignments(normalized_status) where not is_deleted;
create index if not exists integration_conflicts_open_idx on public.integration_conflicts(status, detected_at desc) where status = 'open';
create index if not exists integration_conflicts_game_idx on public.integration_conflicts(game_id) where game_id is not null;
create index if not exists sync_runs_provider_connection_id_idx on public.sync_runs(provider_connection_id) where provider_connection_id is not null;

-- Keep updated_at trustworthy without requiring each adapter to remember it.
drop trigger if exists integration_providers_set_updated_at on public.integration_providers;
create trigger integration_providers_set_updated_at
before update on public.integration_providers
for each row execute function private.set_updated_at();

drop trigger if exists provider_connections_set_updated_at on public.provider_connections;
create trigger provider_connections_set_updated_at
before update on public.provider_connections
for each row execute function private.set_updated_at();

drop trigger if exists provider_game_links_set_updated_at on public.provider_game_links;
create trigger provider_game_links_set_updated_at
before update on public.provider_game_links
for each row execute function private.set_updated_at();

drop trigger if exists official_assignments_set_updated_at on public.official_assignments;
create trigger official_assignments_set_updated_at
before update on public.official_assignments
for each row execute function private.set_updated_at();

drop trigger if exists integration_conflicts_set_updated_at on public.integration_conflicts;
create trigger integration_conflicts_set_updated_at
before update on public.integration_conflicts
for each row execute function private.set_updated_at();

-- Provider catalog. Capabilities describe direction/intent, not implementation promises.
insert into public.integration_providers (
  provider_key, display_name, category, direction, description, capabilities, documentation_url, display_order
)
values
  (
    'arbiter', 'ArbiterSports', 'officiating', 'inbound',
    'Official-assignment provider. Phase 2 begins read-only with games, assignments, changes, and deletions.',
    '{"games_read":true,"assignments_read":true,"incremental_sync":true,"schedule_write_future":true}'::jsonb,
    'https://partner.arbitersports.com', 10
  ),
  (
    'horizon', 'HorizonWebRef', 'officiating', 'bidirectional',
    'Official-assignment provider with OAuth organization access; begin read-only and evaluate schedule publishing later.',
    '{"games_read":true,"assignments_read":true,"oauth":true,"schedule_write_future":true}'::jsonb,
    'https://helpcenter.horizonwebref.com', 20
  ),
  (
    'maxpreps', 'MaxPreps', 'publishing', 'outbound',
    'Downstream schedule/result publication and IHSA reporting destination, pending approved partner workflow.',
    '{"schedule_publish":true,"result_publish":true,"corrections":true}'::jsonb,
    'https://www.maxpreps.com/utility/stat_import/', 30
  ),
  (
    'gamechanger', 'GameChanger', 'scoring_stats', 'inbound',
    'Potential source for completed-game scoring and statistics where teams use GameChanger.',
    '{"results_read_future":true,"stats_read_future":true}'::jsonb,
    'https://gc.com', 40
  ),
  (
    'hudl', 'Hudl', 'scoring_stats', 'inbound',
    'Potential source for game/stat exports and future approved data integrations.',
    '{"results_read_future":true,"stats_read_future":true}'::jsonb,
    'https://www.hudl.com', 50
  )
on conflict (provider_key) do update
set display_name = excluded.display_name,
    category = excluded.category,
    direction = excluded.direction,
    description = excluded.description,
    capabilities = excluded.capabilities,
    documentation_url = excluded.documentation_url,
    display_order = excluded.display_order,
    is_active = true,
    updated_at = now();

-- Normalize officiating coverage without exposing provider-specific terminology to the UI.
create or replace view public.game_officiating_status
with (security_invoker = true)
as
select
  pgl.game_id,
  pgl.provider_connection_id,
  pc.provider_key,
  ip.display_name as provider_name,
  pgl.external_game_id,
  pgl.match_status,
  pgl.expected_positions,
  (count(oa.id) filter (where not oa.is_deleted))::integer as slot_count,
  (count(oa.id) filter (where not oa.is_deleted and oa.normalized_status in ('assigned', 'accepted')))::integer as assigned_count,
  (count(oa.id) filter (where not oa.is_deleted and oa.normalized_status = 'accepted'))::integer as accepted_count,
  (count(oa.id) filter (where not oa.is_deleted and oa.normalized_status = 'declined'))::integer as declined_count,
  max(oa.provider_updated_at) as last_provider_update_at,
  case
    when (count(oa.id) filter (where not oa.is_deleted and oa.normalized_status = 'declined')) > 0 then 'attention_needed'
    when pgl.expected_positions is not null
      and pgl.expected_positions > 0
      and (count(oa.id) filter (where not oa.is_deleted and oa.normalized_status = 'accepted')) >= pgl.expected_positions then 'confirmed'
    when pgl.expected_positions is not null
      and pgl.expected_positions > 0
      and (count(oa.id) filter (where not oa.is_deleted and oa.normalized_status in ('assigned', 'accepted'))) >= pgl.expected_positions then 'filled_unconfirmed'
    when (count(oa.id) filter (where not oa.is_deleted and oa.normalized_status in ('assigned', 'accepted'))) > 0 then 'partially_filled'
    when pgl.expected_positions is not null and pgl.expected_positions > 0 then 'open'
    else 'unknown'
  end as normalized_coverage_status
from public.provider_game_links pgl
join public.provider_connections pc on pc.id = pgl.provider_connection_id
join public.integration_providers ip on ip.provider_key = pc.provider_key
left join public.official_assignments oa
  on oa.provider_connection_id = pgl.provider_connection_id
 and oa.game_id = pgl.game_id
where pgl.match_status = 'matched'
group by
  pgl.game_id,
  pgl.provider_connection_id,
  pc.provider_key,
  ip.display_name,
  pgl.external_game_id,
  pgl.match_status,
  pgl.expected_positions;

-- Data API privileges. RLS remains the authorization boundary for signed-in users.
revoke all on table public.integration_providers from anon, authenticated;
revoke all on table public.provider_connections from anon, authenticated;
revoke all on table public.provider_game_links from anon, authenticated;
revoke all on table public.provider_ingest_events from anon, authenticated;
revoke all on table public.official_assignments from anon, authenticated;
revoke all on table public.integration_conflicts from anon, authenticated;

grant select, insert, update, delete on table public.integration_providers to authenticated;
grant select, insert, update, delete on table public.provider_connections to authenticated;
grant select, insert, update, delete on table public.provider_game_links to authenticated;
grant select on table public.provider_ingest_events to authenticated;
grant select, insert, update, delete on table public.official_assignments to authenticated;
grant select, update on table public.integration_conflicts to authenticated;
grant select on table public.game_officiating_status to authenticated;

alter table public.integration_providers enable row level security;
alter table public.provider_connections enable row level security;
alter table public.provider_game_links enable row level security;
alter table public.provider_ingest_events enable row level security;
alter table public.official_assignments enable row level security;
alter table public.integration_conflicts enable row level security;

drop policy if exists integration_providers_member_read on public.integration_providers;
create policy integration_providers_member_read
on public.integration_providers
for select
to authenticated
using (
  exists (
    select 1 from public.memberships m
    where m.user_id = (select auth.uid())
      and m.status = 'active'
  )
);

drop policy if exists integration_providers_admin_write on public.integration_providers;
create policy integration_providers_admin_write
on public.integration_providers
for all
to authenticated
using (private.has_conference_role(array['conference_admin']::public.app_role[]))
with check (private.has_conference_role(array['conference_admin']::public.app_role[]));

drop policy if exists provider_connections_member_read on public.provider_connections;
create policy provider_connections_member_read
on public.provider_connections
for select
to authenticated
using (
  private.has_conference_role(array['conference_admin', 'conference_official']::public.app_role[])
  or exists (
    select 1 from public.memberships m
    where m.user_id = (select auth.uid())
      and m.status = 'active'
      and (
        provider_connections.school_id is null
        or m.school_id = provider_connections.school_id
      )
  )
);

drop policy if exists provider_connections_admin_write on public.provider_connections;
create policy provider_connections_admin_write
on public.provider_connections
for all
to authenticated
using (private.has_conference_role(array['conference_admin']::public.app_role[]))
with check (private.has_conference_role(array['conference_admin']::public.app_role[]));

drop policy if exists provider_game_links_scoped_read on public.provider_game_links;
create policy provider_game_links_scoped_read
on public.provider_game_links
for select
to authenticated
using (private.user_can_manage_game(game_id));

drop policy if exists provider_game_links_conference_write on public.provider_game_links;
create policy provider_game_links_conference_write
on public.provider_game_links
for all
to authenticated
using (private.has_conference_role(array['conference_admin', 'conference_official']::public.app_role[]))
with check (private.has_conference_role(array['conference_admin', 'conference_official']::public.app_role[]));

drop policy if exists provider_ingest_events_conference_read on public.provider_ingest_events;
create policy provider_ingest_events_conference_read
on public.provider_ingest_events
for select
to authenticated
using (private.has_conference_role(array['conference_admin', 'conference_official']::public.app_role[]));

drop policy if exists official_assignments_scoped_read on public.official_assignments;
create policy official_assignments_scoped_read
on public.official_assignments
for select
to authenticated
using (private.user_can_manage_game(game_id));

drop policy if exists official_assignments_conference_write on public.official_assignments;
create policy official_assignments_conference_write
on public.official_assignments
for all
to authenticated
using (private.has_conference_role(array['conference_admin', 'conference_official']::public.app_role[]))
with check (private.has_conference_role(array['conference_admin', 'conference_official']::public.app_role[]));

drop policy if exists integration_conflicts_scoped_read on public.integration_conflicts;
create policy integration_conflicts_scoped_read
on public.integration_conflicts
for select
to authenticated
using (
  private.has_conference_role(array['conference_admin', 'conference_official']::public.app_role[])
  or (game_id is not null and private.user_can_manage_game(game_id))
);

drop policy if exists integration_conflicts_conference_update on public.integration_conflicts;
create policy integration_conflicts_conference_update
on public.integration_conflicts
for update
to authenticated
using (private.has_conference_role(array['conference_admin', 'conference_official']::public.app_role[]))
with check (private.has_conference_role(array['conference_admin', 'conference_official']::public.app_role[]));

-- Extend the existing sync-run read policy to understand provider connections.
drop policy if exists sync_runs_scoped_read on public.sync_runs;
create policy sync_runs_scoped_read
on public.sync_runs
for select
to authenticated
using (
  private.has_conference_role(array['conference_admin', 'conference_official']::public.app_role[])
  or exists (
    select 1
    from public.calendar_sources c
    where c.id = sync_runs.calendar_source_id
      and c.school_id is not null
      and private.has_school_role(c.school_id, array['school_principal', 'athletic_director']::public.app_role[])
  )
  or exists (
    select 1
    from public.provider_connections pc
    where pc.id = sync_runs.provider_connection_id
      and pc.school_id is not null
      and private.has_school_role(pc.school_id, array['school_principal', 'athletic_director']::public.app_role[])
  )
);
