import { ArbiterClient, type Row } from './arbiter.ts';
import { synchronize, type SyncDatabase } from './arbiter-sync.ts';
const headers = {'Content-Type':'application/json','Cache-Control':'no-store',
  'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-rvc-cron-secret',
  'Access-Control-Allow-Methods':'POST,OPTIONS'};
export function createHandler(env: (key:string)=>string|undefined, transport: typeof fetch=fetch) {
  const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
  return async (req:Request) => {
    if(req.method==='OPTIONS')return new Response('ok',{headers});
    if(req.method!=='POST')return json({error:'Method not allowed'},405);
    const url=env('SUPABASE_URL'),service=env('SUPABASE_SERVICE_ROLE_KEY'),anon=env('SUPABASE_ANON_KEY');
    if(!url||!service||!anon)return json({error:'Server configuration incomplete'},503);
    const authorization=req.headers.get('Authorization')||'';
    const cron=req.headers.get('x-rvc-cron-secret');
    let scheduled=false;
    if(cron){
      const configured=env('RVC_ARBITER_CRON_SECRET');
      if(configured)scheduled=cron===configured;
      else {
        const r=await transport(`${url}/rest/v1/rpc/arbiter_validate_cron`,{method:'POST',
          headers:{apikey:service,Authorization:`Bearer ${service}`,'Content-Type':'application/json'},
          body:JSON.stringify({p_secret:cron}),signal:AbortSignal.timeout(10_000)});
        scheduled=r.ok && await r.json()===true;
      }
    }
    if(cron && !scheduled)return json({error:'Unauthorized'},401);
    // Validate the caller with Auth, then recheck active membership in the database.
    // A claimed role in user_metadata or a decoded unverified JWT is never trusted.
    if(!scheduled) {
      if(!authorization.startsWith('Bearer '))return json({error:'Unauthorized'},401);
      const userResponse=await transport(`${url}/auth/v1/user`,{headers:{apikey:anon,Authorization:authorization},signal:AbortSignal.timeout(10_000)});
      if(!userResponse.ok)return json({error:'Unauthorized'},401);
      const user=await userResponse.json();
      const membership=await transport(`${url}/rest/v1/memberships?select=id&user_id=eq.${encodeURIComponent(user.id)}&role=eq.conference_admin&status=eq.active&limit=1`,{
        headers:{apikey:service,Authorization:`Bearer ${service}`},signal:AbortSignal.timeout(10_000)});
      if(!membership.ok)return json({error:'Authorization check unavailable'},503);
      if(!(await membership.json()).length)return json({error:'Conference administrator access required'},403);
    }
    const request=async(path:string,init:RequestInit={})=>{
      const r=await transport(`${url}/rest/v1/${path}`,{...init,signal:AbortSignal.timeout(25_000),headers:{apikey:service,Authorization:`Bearer ${service}`,'Content-Type':'application/json',...init.headers}});
      if(!r.ok)throw new Error(`RVC integration database request failed (${r.status})`);
      return r.status===204?undefined:r.json();
    };
    const db:SyncDatabase={
      select:async(table,query)=>{
        const out:Row[]=[];
        for(let offset=0;offset<100000;offset+=500){
          const rows=await request(`${table}?${query}&order=id.asc&offset=${offset}&limit=500`);
          out.push(...rows);if(rows.length<500)return out;
        }
        throw new Error('RVC query exceeded safe import limit');
      },
      rpc:(name,args)=>request(`rpc/${name}`,{method:'POST',body:JSON.stringify(args)}),
      patch:async(table,query,value)=>{await request(`${table}?${query}`,{method:'PATCH',body:JSON.stringify(value),headers:{Prefer:'return=minimal'}});},
    };
    try {
      const connections=await db.select('provider_connections',"select=id,configuration,sync_cursor,connection_status&provider_key=eq.arbiter&scope_kind=eq.conference&external_organization_id=eq.RiverValleyConference");
      const connection=connections[0];
      if(!connection || ['disabled','revoked'].includes(connection.connection_status))return json({error:'Arbiter connection disabled or unavailable'},409);
      if(scheduled && connection.configuration?.automation_enabled!==true)return json({error:'Automation remains disabled until pilot acceptance'},409);
      const secret=env('ARBITER_CLIENT_SECRET') || await db.rpc('arbiter_read_credential',{});
      if(typeof secret!=='string'||!secret)return json({error:'Arbiter server credential is not configured'},503);
      const result=await synchronize(db,new ArbiterClient(secret,transport),connection);
      return json(result);
    } catch {return json({error:'Synchronization failed; review Integration Center sync history.'},502);}
  };
}
