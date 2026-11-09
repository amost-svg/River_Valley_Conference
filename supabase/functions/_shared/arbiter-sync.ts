import { ArbiterClient, SCHOOL_IDS, GROUP_IDS, normalizeGame, normalizeAssignment, deduplicate,
  matchGame, scheduleConflicts, type Row } from './arbiter.ts';
/** Narrow database port: canonical datasets are selectable; all provider mutations
 * go through the transaction fenced by sync_runs. */
export interface SyncDatabase {
  select(table: string, query: string): Promise<Row[]>;
  rpc(name: string, args: Row): Promise<any>;
  patch(table: string, query: string, value: Row): Promise<void>;
}
export async function synchronize(db: SyncDatabase, api: ArbiterClient, connection: Row, now = new Date()): Promise<Row> {
  const run = await db.rpc('arbiter_begin_sync',{p_connection:connection.id});
  if (!run) return { state:'already_running' };
  try {
    const start = new Date(now.getTime()-30*86400_000).toISOString();
    const end = new Date(now.getTime()+210*86400_000).toISOString();
    // A bounded rolling reconciliation is intentional: naive provider modification
    // timestamps are not a proven UTC watermark. Cursor advances only on atomic success.
    const params = {SchoolIds:Object.values(SCHOOL_IDS),DateFilter:'Range',GameStartDate:start,GameEndDate:end,IncludePendingInformation:false};
    const gamesResult = await api.get('/api/Game/GetGames',{...params,IncludeDeletedGames:true});
    if (gamesResult.state==='unavailable') throw new Error('Arbiter school schedules unavailable');
    const assignmentResult = await api.get('/api/Assignment/GetAssignments',{...params,IncludeDeletedAssignments:true});
    const {SchoolIds:_schoolIds,...groupParams}=params;
    const groupGames=await api.get('/api/Game/GetGames',{...groupParams,GroupIds:GROUP_IDS,IncludeDeletedGames:true});
    const groupAssignments=await api.get('/api/Assignment/GetAssignments',{...groupParams,GroupIds:GROUP_IDS,IncludeDeletedAssignments:true});
    const groupsResult = await api.get('/api/Group');
    // Query groups separately to establish access without importing thousands of unrelated games.
    const groups = groupsResult.rows.filter(g=>GROUP_IDS.includes(g.groupId)).map(g=>({id:g.groupId,name:g.name}));
    const assignments = deduplicate([...assignmentResult.rows,...groupAssignments.rows].map(normalizeAssignment),'external_assignment_id');
    const [games,teams,schools,sports,links] = await Promise.all([
      db.select('games','select=id,sport_id,level,home_team_id,away_team_id,home_opponent_name,away_opponent_name,starts_at,status,location_text,external_source,external_event_id'),
      db.select('teams','select=id,school_id,sport_id,level,cooperative_program_id'),
      db.select('schools','select=id,slug,name'),db.select('sports','select=id,name,gender_label'),
      db.select('provider_game_links',`select=id,game_id,external_game_id,match_status,match_method,metadata&provider_connection_id=eq.${connection.id}`),
    ]);
    for (const slug of Object.keys(SCHOOL_IDS)) if(schools.filter(s=>s.slug===slug).length!==1) throw new Error(`School mapping unresolved: ${slug}`);
    const records = deduplicate([...gamesResult.rows,...groupGames.rows.filter(g=>g.teams?.some((t:Row)=>Object.values(SCHOOL_IDS).includes(t.schoolId)))].map(normalizeGame),'external_game_id');
    // Record explicit tombstones for earlier linked games outside the rolling game window.
    const deletedResult = await api.get('/api/Game/DeletedGames',{fromDate:connection.sync_cursor?.completed_at || start,toDate:now.toISOString()});
    for (const tombstone of deletedResult.rows) {
      const old=links.find(l=>l.external_game_id===String(tombstone.uniqueGameId));
      if(old && !records.some(r=>r.external_game_id===old.external_game_id)) records.push({...old.metadata,external_game_id:old.external_game_id,deleted:true});
    }
    const relevant = new Set(records.map(r=>r.external_game_id));
    const visibleAssignments = assignments.filter(a=>relevant.has(a.external_game_id));
    for(let i=0;i<records.length;i++) {
      let g=records[i];
      const prior=links.find(l=>l.external_game_id===g.external_game_id);
      if(prior && prior.metadata?.provider_updated_raw>g.provider_updated_raw && !g.deleted){g={...prior.metadata};records[i]=g;}

      const old=links.find(l=>l.external_game_id===g.external_game_id);
      g.match=matchGame(g,{games,teams,schools,sports},links);
      if(g.match.state==='suggested'){g.suggested_game_id=g.match.game_id;g.match.game_id=null;}
      g.assignment_access=assignmentResult.state==='unavailable'?'unavailable':'visible_crew_size_unknown';
      g.assignments=visibleAssignments.filter(a=>a.external_game_id===g.external_game_id);
      if(!g.assignments.length)g.assignment_access='no_visible_records';
      // Preserve operator review provenance across provider refreshes.
      if(old?.metadata?.reviewed_by) {g.reviewed_by=old.metadata.reviewed_by;g.reviewed_at=old.metadata.reviewed_at;}
      const canonical=games.find(c=>c.id===g.match.game_id);
      g.conflicts=canonical && g.match.state==='matched'?scheduleConflicts(g,canonical,teams,schools):[];
    }
    // Multiple external games claiming one canonical identity require review.
    const claims=new Map<string,number>();
    for(const g of records)if(g.match.state==='matched')claims.set(g.match.game_id,(claims.get(g.match.game_id)||0)+1);
    for(const g of records)if(g.match.state==='matched' && claims.get(g.match.game_id)!==1){g.suggested_game_id=g.match.game_id;g.match={game_id:null,method:null,state:'unmatched'};g.conflicts=[];}
    const report = { retrieved:records.length, matched:records.filter(r=>r.match.state==='matched').length,
      suggested:records.filter(r=>r.match.state==='suggested').length,unmatched:records.filter(r=>r.match.state==='unmatched').length,
      conflicts:records.filter(r=>r.conflicts.length).length,assignments:visibleAssignments.length,
      authorization_gaps:(assignmentResult.state==='unavailable'?1:0)+(groupAssignments.state==='unavailable'?1:0),
      group_games_http:groupGames.status,group_assignments_http:groupAssignments.status,assignment_http:assignmentResult.status,deleted_http:deletedResult.status,
      deleted_state:deletedResult.state,groups,school_ids:SCHOOL_IDS,
      window:{start,end},mode:'rolling_reconciliation',timestamp_semantics:'provider_offset_preserved; naive modification time not used as UTC watermark' };
    return await db.rpc('arbiter_apply_sync',{p_connection:connection.id,p_run:run,p_records:records,p_report:report,p_cursor:{completed_at:now.toISOString(),window_start:start,window_end:end}});
  } catch(e) {
    // Never log vendor response bodies, tokens, request headers, or credentials.
    const error = e instanceof Error ? e.message.slice(0,300) : 'Arbiter synchronization failed';
    await db.patch('sync_runs',`id=eq.${run}&status=eq.running`,{status:'failed',completed_at:new Date().toISOString(),error_count:1,log:[{error}]});
    await db.patch('provider_connections',`id=eq.${connection.id}`,{connection_status:'degraded',last_error_at:new Date().toISOString(),last_error:error});
    throw new Error(error);
  }
}
