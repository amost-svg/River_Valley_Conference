import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { memberSelect, refreshArbiter, rpc } from '@/lib/rvcData';
import { integrationDate } from './OfficiatingGames';
type Row=Record<string,any>;
export default function ArbiterAdministration(){
  const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[page,setPage]=useState(0),[choices,setChoices]=useState<Record<string,string>>({});
  const {data,error,refetch}=useQuery({queryKey:['arbiter-admin',page],queryFn:async()=>{
    const [connections,queue,games,runs,teams,schools,sports]=await Promise.all([
      memberSelect<Row[]>('provider_connections?select=id,configuration,last_successful_sync_at,last_error&provider_key=eq.arbiter&scope_kind=eq.conference'),
      memberSelect<Row[]>(`provider_game_links?select=id,game_id,external_game_id,match_status,metadata&match_status=in.(suggested,unmatched)&order=external_game_id.asc&limit=25&offset=${page*25}`),
      memberSelect<Row[]>('games?select=id,starts_at,location_text,home_opponent_name,away_opponent_name,home_team_id,away_team_id,sport_id,level&order=starts_at.desc&limit=1000'),
      memberSelect<Row[]>('sync_runs?select=id,status,log,completed_at,started_at,error_count&sync_kind=eq.arbiter_read_only&order=created_at.desc&limit=5'),
      memberSelect<Row[]>('teams?select=id,school_id,display_name&limit=1000'),
      memberSelect<Row[]>('schools?select=id,name&limit=1000'),
      memberSelect<Row[]>('sports?select=id,name,gender_label&limit=1000'),
    ]);return {connections,queue,games,teams,schools,sports,runs:runs.map((r):Row=>({...r,log:Array.isArray(r.log)?r.log[0]||{}:r.log}))};
  }});
  const run=async(action:()=>Promise<unknown>)=>{setBusy(true);setMessage('');try{await action();await refetch();setMessage('Completed. Reviewed mappings receive assignment data on the next refresh.');}catch(e){setMessage(e instanceof Error?e.message:'Action failed');}finally{setBusy(false);}};
  const gameLabel=(g:Row)=>{
    const teamName=(id:string,opponent:string)=>{const t=data?.teams.find(t=>t.id===id);return t?.display_name||data?.schools.find(s=>s.id===t?.school_id)?.name||opponent||'TBD';};
    const sport=data?.sports.find(s=>s.id===g.sport_id);
    return `${integrationDate(g.starts_at)} · ${teamName(g.away_team_id,g.away_opponent_name)} at ${teamName(g.home_team_id,g.home_opponent_name)} · ${sport?.gender_label||''} ${sport?.name||''} · ${g.level} · ${g.location_text||'Venue TBD'}`;
  };
  const last=data?.runs.find(r=>r.status==='completed');
  return <section className="space-y-4 rounded-xl border bg-white p-5">
    <div className="flex flex-wrap justify-between gap-3"><div><h2 className="text-xl font-bold">Arbiter operations</h2><p className="text-sm text-slate-600">Read-only provider access. Mapping decisions never change the RVC schedule.</p></div><Button disabled={busy||!data?.connections.length} onClick={()=>void run(refreshArbiter)}>{busy?'Working…':'Refresh Arbiter'}</Button></div>
    <Link href="/admin/officiating" className="font-medium text-conference-navy underline">View schedules and officiating</Link>
    {error&&<p role="alert" className="text-red-700">{error.message}</p>}{message&&<p role="status" className="text-sm">{message}</p>}
    {!data?.connections.length&&<p>No live Arbiter connection is configured.</p>}
    {data?.connections.map(c=><div key={c.id} className="text-sm"><p>Last successful sync: {integrationDate(c.last_successful_sync_at)} · Automation {c.configuration.automation_enabled?'enabled':'disabled pending pilot acceptance'}</p>{c.last_error&&<p className="text-red-700">{c.last_error}</p>}<div className="mt-2 flex flex-wrap gap-2">{Object.entries(c.configuration.school_ids||{}).map(([name,id])=><span key={name} className="rounded bg-slate-100 px-2 py-1">{name.replaceAll('-',' ')}: {String(id)}</span>)}</div><p className="mt-2">Authorized group accounts: {(c.configuration.group_ids||[]).join(', ')}. School-scoped queries may expose additional groups.</p></div>)}
    {last&&<div className="rounded bg-slate-50 p-3 text-sm"><p>{last.log.retrieved} retrieved · {last.log.matched} matched · {last.log.suggested} suggested · {last.log.unmatched} unmatched · {last.log.conflicts} in conflict · {last.log.assignments} visible assignments</p><p>Assignment response: HTTP {last.log.assignment_http} · Deleted-game response: HTTP {last.log.deleted_http} ({last.log.deleted_state})</p><p>Refresh mode: {last.log.mode}. Crew sizes have not been verified.</p></div>}
    {data&&data.runs.slice(0,3).length===3&&data.runs.slice(0,3).every(r=>r.status==='failed')&&<p role="alert" className="rounded bg-red-50 p-3 text-red-800">Three consecutive synchronization failures. Conference administrator attention required.</p>}
    <details><summary className="cursor-pointer font-medium">Recent sync health</summary>{data?.runs.map(r=><p className="mt-2 text-sm" key={r.id}>{integrationDate(r.started_at)}: {r.status}{r.log.error?` · ${r.log.error}`:''}</p>)}</details>
    <h3 className="font-semibold">Pending game mappings</h3><p className="text-sm text-slate-600">Check teams, sport, level, date, and home/away before approving. Cooperative and tournament games require particular care.</p>
    {data?.queue.map(l=><div key={l.id} className="space-y-2 rounded border p-3 text-sm"><p className="font-medium">Arbiter {l.external_game_id} · {l.match_status}</p><p>{l.metadata.teams?.map((t:Row)=>t.name).join(' / ')} · {l.metadata.sport} · {l.metadata.gender} · {l.metadata.level} ({l.metadata.level_alias})</p><p>Provider local time {l.metadata.provider_local_time} ({l.metadata.timezone}, offset {l.metadata.utc_offset}) · {l.metadata.venue}</p>
      <select className="w-full rounded border p-2" aria-label={`Canonical game for ${l.external_game_id}`} value={choices[l.id]??l.game_id??l.metadata.suggested_game_id??''} onChange={e=>setChoices({...choices,[l.id]:e.target.value})}><option value="">Select canonical RVC game</option>{data.games.map(g=><option key={g.id} value={g.id}>{gameLabel(g)}</option>)}</select>
      <div className="flex gap-2"><Button size="sm" disabled={busy||!(choices[l.id]??l.game_id??l.metadata.suggested_game_id)} onClick={()=>void run(()=>rpc('arbiter_review_mapping',{p_link:l.id,p_game:choices[l.id]??l.game_id??l.metadata.suggested_game_id,p_ignore:false}))}>Approve mapping</Button><Button size="sm" variant="outline" disabled={busy} onClick={()=>void run(()=>rpc('arbiter_review_mapping',{p_link:l.id,p_game:null,p_ignore:true}))}>Ignore</Button></div>
    </div>)}
    {data&&!data.queue.length&&<p className="text-sm text-slate-500">No pending records on this page.</p>}
    <div className="flex items-center gap-3"><Button variant="outline" disabled={page===0||busy} onClick={()=>setPage(page-1)}>Previous</Button><span className="text-sm">Page {page+1}</span><Button variant="outline" disabled={(data?.queue.length??0)<25||busy} onClick={()=>setPage(page+1)}>Next</Button></div>
  </section>;
}
