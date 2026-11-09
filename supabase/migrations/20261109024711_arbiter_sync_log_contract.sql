-- Preserve the existing sync_runs JSON-array logging contract.
create or replace function public.arbiter_begin_sync(p_connection uuid) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare v_run uuid; v_active uuid;
begin
  perform 1 from public.provider_connections where id=p_connection and provider_key='arbiter'
    and connection_status not in ('disabled','revoked') for update;
  if not found then raise exception 'Connection unavailable'; end if;
  -- Expired runs are failed, never mistaken for a successful checkpoint.
  update public.sync_runs set status='failed',completed_at=now(),error_count=1,
    log='[{"error":"Interrupted import; retrying retained checkpoint"}]'::jsonb
    where provider_connection_id=p_connection and status='running' and started_at < now()-interval '15 minutes';
  select id into v_active from public.sync_runs where provider_connection_id=p_connection and status='running' limit 1;
  if v_active is not null then return null; end if;
  insert into public.sync_runs(provider_connection_id,sync_kind,status,started_at)
    values(p_connection,'arbiter_read_only','running',now()) returning id into v_run;
  return v_run;
end $$;

create or replace function public.arbiter_apply_sync(p_connection uuid,p_run uuid,p_records jsonb,p_report jsonb,p_cursor jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare r jsonb; a jsonb; d jsonb; v_link uuid; v_game uuid; v_count integer:=0;
begin
  perform 1 from public.provider_connections where id=p_connection for update;
  perform 1 from public.sync_runs where id=p_run and provider_connection_id=p_connection
    and status='running' and started_at > now()-interval '15 minutes' for update;
  if not found then raise exception 'Expired sync fence'; end if;
  for r in select value from jsonb_array_elements(p_records) loop
    v_game := nullif(r->'match'->>'game_id','')::uuid;
    -- Never undo a reviewed mapping with a later heuristic suggestion.
    insert into public.provider_game_links(provider_connection_id,external_game_id,game_id,external_custom_id,
      match_status,match_method,provider_updated_at,last_synced_at,metadata)
    values(p_connection,r->>'external_game_id',v_game,r->>'custom_id',r->'match'->>'state',r->'match'->>'method',
      (r->>'provider_updated_at')::timestamptz,now(),r-'assignments'-'conflicts'-'match')
    on conflict(provider_connection_id,external_game_id) do update set
      game_id=excluded.game_id,match_status=excluded.match_status,match_method=excluded.match_method,
      external_custom_id=excluded.external_custom_id,provider_updated_at=excluded.provider_updated_at,
      last_synced_at=now(),metadata=excluded.metadata
    returning id into v_link;
    insert into public.provider_ingest_events(provider_connection_id,sync_run_id,event_kind,external_event_id,
      normalized_payload,processing_status,processed_at)
    values(p_connection,p_run,'arbiter_game',r->>'external_game_id'||':'||md5((r-'assignments'-'conflicts'-'match')::text),
      r-'assignments'-'conflicts'-'match','processed',now()) on conflict do nothing;
    if v_game is not null and r->'match'->>'state'='matched' then
      for a in select value from jsonb_array_elements(coalesce(r->'assignments','[]'::jsonb)) loop
        insert into public.official_assignments(provider_connection_id,provider_game_link_id,game_id,external_assignment_id,
          external_official_id,official_display_name,position,provider_status,normalized_status,is_deleted,
          provider_updated_at,status_changed_at,last_synced_at,metadata)
        values(p_connection,v_link,v_game,a->>'external_assignment_id',a->>'external_official_id',a->>'official_display_name',
          a->>'position',a->>'provider_status',a->>'normalized_status',(a->>'is_deleted')::boolean,
          (a->>'provider_updated_at')::timestamptz,(a->>'status_changed_at')::timestamptz,now(),
          jsonb_build_object('group_id',a->>'group_id','provider_updated_raw',a->>'provider_updated_raw'))
        on conflict(provider_connection_id,external_assignment_id) do update set
          provider_game_link_id=excluded.provider_game_link_id,game_id=excluded.game_id,
          external_official_id=excluded.external_official_id,official_display_name=excluded.official_display_name,
          position=excluded.position,provider_status=excluded.provider_status,normalized_status=excluded.normalized_status,
          is_deleted=excluded.is_deleted,provider_updated_at=excluded.provider_updated_at,
          status_changed_at=excluded.status_changed_at,last_synced_at=now(),metadata=excluded.metadata;
        insert into public.provider_ingest_events(provider_connection_id,sync_run_id,event_kind,external_event_id,
          normalized_payload,processing_status,processed_at)
        values(p_connection,p_run,'arbiter_assignment',a->>'external_assignment_id'||':'||md5(a::text),a,'processed',now())
          on conflict do nothing;
      end loop;
      for d in select value from jsonb_array_elements(coalesce(r->'conflicts','[]'::jsonb)) loop
        insert into public.integration_conflicts(provider_connection_id,game_id,conflict_type,field_name,canonical_value,provider_value,metadata)
        values(p_connection,v_game,'schedule_difference',d->>'field_name',d->'canonical_value',d->'provider_value',
          jsonb_build_object('external_game_id',r->>'external_game_id'))
        on conflict(provider_connection_id,game_id,field_name) where status='open' and game_id is not null
          do update set canonical_value=excluded.canonical_value,provider_value=excluded.provider_value,detected_at=now();
      end loop;
    end if;
    v_count:=v_count+1;
  end loop;
  update public.sync_runs set status='completed',completed_at=now(),updated_count=v_count,
    skipped_count=(p_report->>'unmatched')::integer,error_count=0,log=jsonb_build_array(p_report),cursor=p_cursor where id=p_run;
  update public.provider_connections set last_successful_sync_at=now(),last_error=null,
    connection_status=case when coalesce((p_report->>'authorization_gaps')::integer,0)>0 then 'degraded' else 'connected' end,
    sync_cursor=p_cursor where id=p_connection;
  return p_report;
end $$;
