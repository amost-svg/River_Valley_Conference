import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ArbiterClient, normalizeGame, normalizeAssignment, assignmentStatus, providerDate, deduplicate, matchGame, scheduleConflicts, SCHOOL_IDS } from '../supabase/functions/_shared/arbiter.ts';
import { synchronize } from '../supabase/functions/_shared/arbiter-sync.ts';
import { createHandler } from '../supabase/functions/_shared/arbiter-handler.ts';
import { summarizeOfficiatingCoverage, normalizeAssignmentStatus } from '../client/src/lib/integrations.ts';
const provider={uniqueGameId:101,groupId:113166,fromDate:'2026-11-17T19:00:00',utcOffset:-6,lastModifiedDate:'2026-11-01T10:00:00',sportName:'Basketball',gender:'Girls',levelName:'Varsity',siteName:'Grant Park',statusId:1,teams:[{schoolId:8900,schoolName:'Grant Park',isHome:true},{schoolId:8753,schoolName:'Grace',isHome:false}]};
const assignment={uniqueGameId:101,uniqueSlotId:102,groupId:113166,officialId:7,officialFirstName:'Test',officialLastName:'Official',status:'Published',positionName:'Referee',officialEmail:'never-store@example.org',gameFee:100};
const game=normalizeGame(provider);
const snapshot={games:[{id:'canonical',sport_id:'sport',level:'Varsity',home_team_id:'gp',away_team_id:'gca',starts_at:'2026-11-18T01:00:00Z',status:'scheduled',location_text:'Grant Park'}],teams:[{id:'gp',school_id:'gp-school'},{id:'gca',school_id:'gca-school'}],schools:[{id:'gp-school',slug:'grant-park',name:'Grant Park'},{id:'gca-school',slug:'grace-christian-academy',name:'Grace'}],sports:[{id:'sport',name:'Basketball',gender_label:'Girls'}]};
test('verified ten-school map is unique',()=>{assert.equal(Object.keys(SCHOOL_IDS).length,10);assert.equal(new Set(Object.values(SCHOOL_IDS)).size,10);assert.equal(SCHOOL_IDS.central,4536);});
test('timestamps preserve offsets and never guess a naive modification timezone',()=>{assert.equal(game.starts_at,'2026-11-18T01:00:00.000Z');assert.equal(game.provider_updated_at,null);assert.equal(providerDate('2026-08-25T17:00:00',-6),'2026-08-25T23:00:00.000Z');assert.equal(providerDate('invalid'),null);});
test('published/pending is not accepted; unknown and negated statuses remain unknown',()=>{for(const s of ['Pending','Published','Notified'])assert.equal(assignmentStatus(s),'assigned');assert.equal(assignmentStatus('Accepted'),'accepted');assert.equal(assignmentStatus('Not Accepted'),'unknown');assert.equal(normalizeAssignmentStatus('Not Accepted'),'unknown');assert.equal(assignmentStatus('Accepted',true),'removed');});
test('assignment normalization strips financial/contact/private fields',()=>{const a=normalizeAssignment(assignment);assert.equal(a.normalized_status,'assigned');assert.ok(!JSON.stringify(a).includes('never-store'));assert.ok(!('gameFee'in a));assert.ok(!('assignedByID'in a));assert.equal(normalizeAssignment({...assignment,isDeleted:true}).normalized_status,'removed');});
test('duplicates are stable; conflicting equal versions fail closed',()=>{assert.equal(deduplicate([game,game],'external_game_id').length,1);assert.throws(()=>deduplicate([game,{...game,venue:'Different'}],'external_game_id'));});
test('exact match requires both school identities, gender, level, and home/away',()=>{assert.equal(matchGame(game,snapshot).state,'matched');assert.equal(matchGame({...game,gender:'Boys'},snapshot).state,'unmatched');assert.equal(matchGame({...game,level:'JV'},snapshot).state,'unmatched');const swap={...game,teams:game.teams.map((t:any)=>({...t,is_home:!t.is_home}))};assert.equal(matchGame(swap,snapshot).state,'suggested');});
test('time changes are suggestions; ambiguous doubleheaders and coops require review',()=>{assert.equal(matchGame({...game,starts_at:'2026-11-18T01:30:00Z'},snapshot).state,'suggested');assert.equal(matchGame(game,{...snapshot,games:[...snapshot.games,{...snapshot.games[0],id:'second'}]}).state,'unmatched');assert.equal(matchGame({...game,teams:game.teams.map((t:any)=>({...t,is_coop:true}))},snapshot).state,'unmatched');});
test('reviewed links win; conflicts preserve both values without modifying canonical games',()=>{assert.equal(matchGame(game,snapshot,[{external_game_id:'101',game_id:'reviewed',match_status:'matched',match_method:'manual'}]).game_id,'reviewed');const before=JSON.stringify(snapshot);const conflicts=scheduleConflicts({...game,starts_at:'2026-11-18T02:00:00Z',venue:'Other gym'},snapshot.games[0]);assert.equal(conflicts.length,2);assert.equal(JSON.stringify(snapshot),before);});
test('unknown crew size never becomes complete even with accepted officials',()=>{assert.equal(summarizeOfficiatingCoverage([{normalized_status:'accepted'},{normalized_status:'accepted'}],null).status,'partially_filled');assert.equal(summarizeOfficiatingCoverage([],null).status,'unknown');assert.equal(summarizeOfficiatingCoverage([{normalized_status:'declined'}],2).status,'attention_needed');});
const response=(p:unknown,status=200)=>new Response(JSON.stringify(p),{status,headers:{'Content-Type':'application/json'}});
test('GET retry refreshes expired token, respects 429, never allows arbitrary paths',async()=>{
 let tokens=0,gets=0;const calls:string[]=[];
 const transport=async(url:any,init:any)=>{calls.push(init.method);if(String(url).includes('/connect/token'))return response({access_token:`token${++tokens}`,expires_in:3600});gets++;return gets===1?response({},401):gets===2?response({},429):response([provider]);};
 const api=new ArbiterClient('test',transport as any,async()=>{});assert.equal((await api.get('/api/Game/GetGames')).rows.length,1);assert.equal(tokens,2);assert.deepEqual(calls,['POST','GET','POST','GET','GET']);await assert.rejects(()=>api.get('https://evil.example/'));});
test('403 and assignment 404 are unavailable; only documented GetGames 404 is empty',async()=>{
 for(const code of [403,404]){const api=new ArbiterClient('test',(async(url:any)=>String(url).includes('/connect/token')?response({access_token:'t',expires_in:3600}):response({},code)) as any);assert.equal((await api.get('/api/Assignment/GetAssignments')).state,'unavailable');assert.equal((await api.get('/api/Game/GetGames')).state,code===404?'empty':'unavailable');}
});
test('unexpected paging envelope fails rather than committing a partial snapshot',async()=>{const api=new ArbiterClient('test',(async(url:any)=>String(url).includes('/connect/token')?response({access_token:'t',expires_in:3600}):response({items:[provider],nextPage:2})) as any);await assert.rejects(()=>api.get('/api/Game/GetGames'),/response shape/);});
test('handler denies anonymous and school role callers before reading secrets or calling Arbiter',async()=>{
 const env=(k:string)=>({SUPABASE_URL:'https://rvc.example',SUPABASE_SERVICE_ROLE_KEY:'server',SUPABASE_ANON_KEY:'public'} as any)[k];let calls=0;
 const handler=createHandler(env,(async(url:any)=>{calls++;return String(url).includes('/auth/v1/user')?response({id:'school-user'}):response([]);}) as any);
 assert.equal((await handler(new Request('https://example',{method:'POST'}))).status,401);assert.equal(calls,0);
 assert.equal((await handler(new Request('https://example',{method:'POST',headers:{Authorization:'Bearer user'}}))).status,403);assert.equal(calls,2);
});
test('successful sync advances checkpoint only through atomic RPC; omission does not delete assignments',async()=>{
 const calls:any[]=[];const schools=Object.keys(SCHOOL_IDS).map(slug=>({slug,id:slug}));
 const db={select:async(table:string)=>table==='schools'?schools:[],rpc:async(name:string,args:any)=>{calls.push({name,args});return name==='arbiter_begin_sync'?'run':args.p_report;},patch:async()=>{throw Error('unexpected patch');}};
 const api={get:async(path:string)=>({state:'available',status:200,rows:path==='/api/Game/GetGames'?[provider,provider]:path==='/api/Assignment/GetAssignments'?[assignment]:[]})};
 const result=await synchronize(db,api as any,{id:'connection'},new Date('2026-11-08T12:00:00Z'));assert.equal(result.retrieved,1);assert.equal(calls[1].name,'arbiter_apply_sync');assert.equal(calls[1].args.p_cursor.completed_at,'2026-11-08T12:00:00.000Z');assert.equal(calls[1].args.p_records[0].assignments.length,1);assert.ok(!JSON.stringify(calls).includes('never-store'));
});
test('failure retains checkpoint and writes a failed sync; overlapping lease does no work',async()=>{
 const patches:any[]=[];let begun=false;const db={select:async()=>[],rpc:async()=>begun?null:(begun=true,'run'),patch:async(table:string,query:string,value:any)=>{patches.push({table,value});}};
 const api={get:async()=>{throw Error('Arbiter transport failure');}};
 await assert.rejects(()=>synchronize(db,api as any,{id:'connection'}));assert.equal(patches[0].value.status,'failed');assert.ok(!patches.some(p=>'sync_cursor'in p.value));assert.equal((await synchronize(db,api as any,{id:'connection'})).state,'already_running');
});
