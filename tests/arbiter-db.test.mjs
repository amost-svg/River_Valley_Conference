import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
const db=new PGlite();
await db.exec(`
create role anon;create role authenticated;create role service_role bypassrls;
create schema auth;create schema private;create schema vault;
create type public.app_role as enum ('conference_admin','conference_official','school_principal','athletic_director');
create type public.sync_status as enum ('queued','running','completed','failed');
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
create function auth.role() returns text language sql stable as $$ select current_setting('request.jwt.claim.role',true) $$;
create table public.memberships(id uuid primary key default gen_random_uuid(),user_id uuid,role app_role,status text,school_id uuid);
create table public.schools(id uuid primary key default gen_random_uuid(),name text);
create table public.games(id uuid primary key default gen_random_uuid(),owner_school_id uuid,status text,starts_at timestamptz);
create table public.calendar_sources(id uuid primary key default gen_random_uuid(),school_id uuid);
create table public.sync_runs(id uuid primary key default gen_random_uuid(),calendar_source_id uuid,import_batch_id uuid,status sync_status default 'queued',started_at timestamptz,completed_at timestamptz,inserted_count integer default 0,updated_count integer default 0,skipped_count integer default 0,error_count integer default 0,log jsonb default '[]' check(jsonb_typeof(log)='array'),created_at timestamptz default now());
create table vault.decrypted_secrets(name text,decrypted_secret text);
create function private.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now();return new;end $$;
create function private.has_conference_role(required_roles app_role[]) returns boolean language sql stable security definer set search_path=pg_catalog,public as $$select exists(select 1 from public.memberships m where m.user_id=auth.uid() and m.status='active' and m.role=any(required_roles))$$;
create function private.has_school_role(school uuid,required_roles app_role[]) returns boolean language sql stable security definer set search_path=pg_catalog,public as $$select exists(select 1 from public.memberships m where m.user_id=auth.uid() and m.status='active' and m.school_id=school and m.role=any(required_roles))$$;
create function private.user_can_manage_game(target_game_id uuid) returns boolean language sql stable security definer set search_path=pg_catalog,public as $$select private.has_conference_role(array['conference_admin','conference_official']::app_role[]) or exists(select 1 from public.games g where g.id=target_game_id and private.has_school_role(g.owner_school_id,array['school_principal','athletic_director']::app_role[]))$$;
grant usage on schema public,auth,private to anon,authenticated,service_role;
grant select on public.memberships to authenticated;
`);
await db.exec(readFileSync('supabase/migrations/20260908_integration_foundation.sql','utf8'));
await db.exec(readFileSync('supabase/migrations/20261109023059_arbiter_read_only_sync.sql','utf8'));
for(const f of (await import('node:fs')).readdirSync('supabase/migrations').filter(f=>(f.includes('arbiter_sync_log_contract')||f.includes('arbiter_reject_stale_versions'))))await db.exec(readFileSync('supabase/migrations/'+f,'utf8'));
console.log('Migration SQL compiled in PostgreSQL');
const assert=(v,m)=>{if(!v)throw Error(m);console.log('PASS',m);};
const q=async sql=>(await db.query(sql)).rows;
const rights=await q(`select has_function_privilege('anon','public.arbiter_read_credential()','EXECUTE') anon_secret,has_function_privilege('authenticated','public.arbiter_read_credential()','EXECUTE') member_secret,has_function_privilege('authenticated','public.arbiter_apply_sync(uuid,uuid,jsonb,jsonb,jsonb)','EXECUTE') member_import,has_table_privilege('authenticated','official_assignments','UPDATE') member_write`);
assert(Object.values(rights[0]).every(v=>v===false),'public/member cannot read credential, execute imports, or mutate assignments');
const connection=(await q(`select id from provider_connections where provider_key='arbiter'`))[0].id;
const school=(await q(`insert into schools(name) values('Grace') returning id`))[0].id;
const game=(await q(`insert into games(owner_school_id,status,starts_at) values('${school}','scheduled','2026-11-18T01:00Z') returning id`))[0].id;
const users=['00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000003'];
await db.exec(`insert into auth.users values ${users.map(u=>`('${u}')`).join(',')};insert into memberships(user_id,role,status,school_id) values('${users[0]}','conference_admin','active',null),('${users[1]}','athletic_director','active','${school}'),('${users[2]}','athletic_director','active',gen_random_uuid());`);
const record={external_game_id:'101',group_id:'113166',custom_id:null,provider_updated_at:null,provider_updated_raw:'2026-11-01T00:00',match:{game_id:game,state:'matched',method:'exact'},assignment_access:'visible_crew_size_unknown',assignments:[{external_assignment_id:'102',group_id:'113166',official_display_name:'Test Official',provider_status:'Published',normalized_status:'assigned',is_deleted:false}],conflicts:[{field_name:'starts_at',canonical_value:'2026-11-18T01:00Z',provider_value:'2026-11-18T02:00Z'}]};
for(let i=0;i<2;i++){
 const run=(await q(`select arbiter_begin_sync('${connection}') as id`))[0].id;
 assert(!!run,'acquired import fence');
 assert((await q(`select arbiter_begin_sync('${connection}') as id`))[0].id===null,'overlapping run blocked');
 await db.query('select arbiter_apply_sync($1,$2,$3,$4,$5)',[connection,run,JSON.stringify([record]),JSON.stringify({unmatched:0,authorization_gaps:0}),JSON.stringify({completed_at:'2026-11-09T00:00Z'})]);
}
assert((await q('select count(*)::int n from official_assignments'))[0].n===1,'repeated imports do not duplicate assignments');
assert((await q('select count(*)::int n from provider_game_links'))[0].n===1,'repeated imports do not duplicate game links');
assert((await q('select count(*)::int n from integration_conflicts'))[0].n===1,'repeated mismatches create one open field conflict');
assert((await q('select count(*)::int n from provider_ingest_events'))[0].n===2,'ingest versions are idempotent');
assert((await q(`select starts_at::text from games where id='${game}'`))[0].starts_at.startsWith('2026-11-18 01:00'),'canonical game preserved');
for(let i=0;i<3;i++){
 await db.exec(`set role authenticated;set request.jwt.claim.sub='${users[i]}';`);
 const n=(await q('select count(*)::int n from official_assignments'))[0].n;
 assert(n===(i<2?1:0),['conference admin sees assignments','own-school AD sees assignments','other-school AD cannot read assignments'][i]);
 try{await db.exec(`select arbiter_read_credential()`);throw Error('Secret readable!');}catch(e){assert(!e.message.includes('Secret readable'),'credential execution blocked');}
 await db.exec('reset role;');
}
await db.exec('set role anon;');
try{await q('select * from official_assignments');throw Error('Public readable!');}catch(e){assert(!e.message.includes('Public readable'),'anonymous cannot query assignments');}
await db.exec('reset role;');
console.log('Database checks completed');await db.close();
