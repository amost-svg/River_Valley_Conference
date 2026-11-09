import { fromZonedTime } from 'date-fns-tz';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { memberSelect } from '@/lib/rvcData';
import { coverageLabel, summarizeOfficiatingCoverage, type AssignmentStatusInput } from '@/lib/integrations';
type Row = Record<string, any>;
async function all(resource: string): Promise<Row[]> {
  const out:Row[]=[];
  for(let offset=0;offset<100000;offset+=500){const page=await memberSelect<Row[]>(`${resource}&order=id.asc&limit=500&offset=${offset}`);out.push(...page);if(page.length<500)return out;}
  throw new Error('Too many records; narrow the game window.');
}
const control='rounded border border-slate-300 bg-white p-2 text-sm';
export function integrationDate(value: string | null) {return value ? new Date(value).toLocaleString('en-US',{timeZone:'America/Chicago',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}) : 'Never';}
export default function OfficiatingGames({gameId}: {gameId?:string}) {
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const [from,setFrom]=useState(today),[to,setTo]=useState(''),[school,setSchool]=useState(''),[sport,setSport]=useState(''),[level,setLevel]=useState(''),[side,setSide]=useState(''),[status,setStatus]=useState(''),[coverage,setCoverage]=useState('');
  const {data,error,isLoading}=useQuery({queryKey:['rvc-officiating',gameId,from,to],queryFn:async()=>{
    const filter=gameId?`id=eq.${gameId}`:`starts_at=gte.${fromZonedTime(`${from}T00:00:00`,'America/Chicago').toISOString()}${to?`&starts_at=lte.${fromZonedTime(`${to}T23:59:59`,'America/Chicago').toISOString()}`:''}`;
    const [games,teams,schools,sports,links,assignments,conflicts]=await Promise.all([
      all(`games?select=id,starts_at,home_team_id,away_team_id,home_opponent_name,away_opponent_name,sport_id,level,status,location_text&${filter}`),
      all('teams?select=id,school_id,display_name'),all('schools?select=id,name'),all('sports?select=id,name,gender_label'),
      all(`provider_game_links?select=id,game_id,external_game_id,match_status,last_synced_at,expected_positions,metadata${gameId?`&game_id=eq.${gameId}`:''}`),
      all(`official_assignments?select=id,game_id,official_display_name,position,provider_status,normalized_status,is_deleted,last_synced_at${gameId?`&game_id=eq.${gameId}`:''}`),
      all(`integration_conflicts?select=id,game_id,field_name,canonical_value,provider_value&status=eq.open${gameId?`&game_id=eq.${gameId}`:''}`),
    ]);return {games,teams,schools,sports,links,assignments,conflicts};
  },staleTime:60_000});
  if(isLoading)return <p className="p-4 text-slate-600">Loading officiating information…</p>;
  if(error)return <p className="p-4 text-red-700">Officiating information unavailable: {error.message}</p>;
  if(!data)return null;
  const team=(id:string)=>data.teams.find(t=>t.id===id),schoolName=(id:string)=>data.schools.find(s=>s.id===id)?.name;
  const name=(id:string,opponent:string)=>team(id)?.display_name||schoolName(team(id)?.school_id)||opponent||'TBD';
  const rows=data.games.map(g=>{
    const link=data.links.find(l=>l.game_id===g.id&&l.match_status==='matched');
    const assignments=data.assignments.filter(a=>a.game_id===g.id);
    const summary=summarizeOfficiatingCoverage(assignments as AssignmentStatusInput[],link?.expected_positions??null);
    const unavailable=!link||link.metadata.assignment_access!=='visible_crew_size_unknown';
    const stale=!link?.last_synced_at||Date.now()-Date.parse(link.last_synced_at)>6*3600_000;
    return {g,link,assignments,summary,unavailable,stale};
  }).filter(({g,summary,unavailable,stale})=>{
    const home=team(g.home_team_id)?.school_id,away=team(g.away_team_id)?.school_id;
    return (!school||home===school||away===school)&&(!sport||g.sport_id===sport)&&(!level||g.level===level)&&(!status||g.status===status)&&
      (!side||!school||(side==='home'?home===school:away===school))&&
      (!coverage||(coverage==='unavailable'?unavailable:coverage==='stale'?stale:!unavailable&&summary.status===coverage));
  }).sort((a,b)=>Date.parse(a.g.starts_at)-Date.parse(b.g.starts_at));
  return <section className="space-y-4" aria-label="Arbiter officiating">
    <div><h2 className="text-xl font-bold text-slate-950">Game officiating</h2><p className="text-sm text-slate-600">Arbiter owns assignments. RVC owns the schedule. Crew size remains unknown unless verified.</p></div>
    {!gameId&&<div className="flex flex-wrap gap-2">
      <label className="text-sm">From <input className={control} aria-label="From date" type="date" value={from} onChange={e=>setFrom(e.target.value||today)}/></label>
      <label className="text-sm">Through <input className={control} aria-label="Through date" type="date" value={to} onChange={e=>setTo(e.target.value)}/></label>
      <select aria-label="School" className={control} value={school} onChange={e=>setSchool(e.target.value)}><option value="">All schools</option>{data.schools.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
      <select aria-label="Sport" className={control} value={sport} onChange={e=>setSport(e.target.value)}><option value="">All sports</option>{data.sports.map(s=><option key={s.id} value={s.id}>{s.gender_label} {s.name}</option>)}</select>
      <select aria-label="Level" className={control} value={level} onChange={e=>setLevel(e.target.value)}><option value="">All levels</option>{[...new Set(data.games.map(g=>g.level))].map(l=><option key={l}>{l}</option>)}</select>
      <select aria-label="Home or away" className={control} value={side} onChange={e=>setSide(e.target.value)} disabled={!school}><option value="">Home/away</option><option value="home">Home</option><option value="away">Away</option></select>
      <select aria-label="Game status" className={control} value={status} onChange={e=>setStatus(e.target.value)}><option value="">All game statuses</option>{[...new Set(data.games.map(g=>g.status))].map(s=><option key={s}>{s}</option>)}</select>
      <select aria-label="Coverage" className={control} value={coverage} onChange={e=>setCoverage(e.target.value)}><option value="">All coverage</option>{['unknown','open','partially_filled','filled_unconfirmed','confirmed','attention_needed','unavailable','stale'].map(s=><option key={s} value={s}>{s.replaceAll('_',' ')}</option>)}</select>
    </div>}
    <p className="text-sm text-slate-500">{rows.length} games · Times shown in Central Time</p>
    {rows.map(({g,link,assignments,summary,unavailable,stale})=><article key={g.id} className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold">{name(g.away_team_id,g.away_opponent_name)} at {name(g.home_team_id,g.home_opponent_name)}</h3><span className="text-sm">{g.status}</span></div>
      <p className="text-sm text-slate-600">{integrationDate(g.starts_at)} · {data.sports.find(s=>s.id===g.sport_id)?.name} · {g.level} · {g.location_text||'Venue unspecified'}</p>
      <p className="mt-2 font-medium">{unavailable?'Not available from Arbiter':summary.expectedPositions===null?'Visible assignments; crew size unknown':coverageLabel(summary.status)}{stale?' · Data stale or not synchronized':''}</p>
      {!unavailable&&<p className="text-sm">{summary.assignedCount} assigned · {summary.acceptedCount} accepted · {summary.declinedCount} declined · {summary.expectedPositions??'Unknown'} expected positions</p>}
      <p className="text-xs text-slate-500">Source: Arbiter · Last successful game refresh: {integrationDate(link?.last_synced_at)}{link?` · Group ${link.metadata.group_id}`:''}</p>
      {data.conflicts.filter(c=>c.game_id===g.id).map(c=><p key={c.id} className="mt-2 rounded bg-amber-50 p-2 text-sm text-amber-900">Review {c.field_name}: RVC {JSON.stringify(c.canonical_value)} / Arbiter {JSON.stringify(c.provider_value)}</p>)}
      {!unavailable&&!!assignments.length&&<details className="mt-3 text-sm"><summary className="cursor-pointer font-medium">Assignment details</summary><ul className="mt-2 space-y-1">{assignments.map(a=><li key={a.id}>{a.position||'Position unspecified'}: {a.official_display_name||'No official visible'} · {a.provider_status||'Unknown'}{a.is_deleted?' (removed)':''}</li>)}</ul></details>}
    </article>)}
  </section>;
}
