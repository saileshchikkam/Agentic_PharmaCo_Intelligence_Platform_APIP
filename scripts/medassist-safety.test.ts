import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { request as httpRequest } from 'node:http';
import { readFileSync } from 'node:fs';
import { evaluateStatement } from '../src/features/medassist-safety/safety';
import { mapsSearch, navigationHandoff, requestLocation, prepareNavigation } from '../src/features/medassist-safety/navigation';
import { registerModelADemo } from '../server/model-a-demo';
import type { NavigationRequest } from '../src/features/medassist-intelligence/governance';

const navigation = (): NavigationRequest => ({ schema_version:'medassist.navigation-request.v1',
  consent:{granted:true,purpose:'nearby_hospital_search',expires_at:Date.now()+60000},location:{latitude:0,longitude:0} });

test('shared provisional rules escalate explicit declarations but never emit a negative safety finding', () => {
  for (const text of ['I cannot breathe.', 'I can’t breathe', 'I need emergency help', 'I need an ambulance', 'This is a medical emergency']) {
    const r=evaluateStatement(text); assert.equal(r.status,'escalate'); assert.equal(r.suppress_ordinary_flow,true);
    assert.equal(r.suppress_self_care,true); assert.equal(r.clinical_validation,false); assert.equal(r.review_status,'provisional_unreviewed');
    assert.equal(r.model_b_status,'unable_to_assess'); assert.ok(r.guidance?.includes('In India'));
  }
  for(const text of ['cough', 'I can breathe', 'I do not need an ambulance', 'maybe fever', '']) {
    const r=evaluateStatement(text);assert.equal(r.status,'not_assessed');assert.equal(r.negative_safety_conclusion,false);assert.equal(r.guidance,null);
  }
});

test('location requires a user action, handles denial, stale/unavailable/invalid coordinates and preserves zero', async () => {
  const now=100000;let calls=0;
  const geo={getCurrentPosition(success:PositionCallback,_fail?:PositionErrorCallback|null,options?:PositionOptions){
    calls++;assert.equal(options?.maximumAge,0);assert.equal(options?.enableHighAccuracy,false);
    success({coords:{latitude:0,longitude:0,accuracy:5},timestamp:now} as GeolocationPosition);
  }};
  assert.equal(calls,0);const result=await requestLocation(geo,()=>now);assert.equal(calls,1);assert.equal(result.location.latitude,0);
  await assert.rejects(()=>requestLocation(undefined),/LOCATION_UNAVAILABLE/);
  await assert.rejects(()=>requestLocation({getCurrentPosition(_ok,fail){fail!({code:1} as GeolocationPositionError);}}),/LOCATION_PERMISSION_DENIED/);
  await assert.rejects(()=>requestLocation({getCurrentPosition(ok){ok({coords:{latitude:91,longitude:0,accuracy:1},timestamp:Date.now()} as GeolocationPosition);}}),/LOCATION_UNAVAILABLE/);
  await assert.rejects(()=>requestLocation({getCurrentPosition(ok){ok({coords:{latitude:0,longitude:0,accuracy:1},timestamp:0} as GeolocationPosition);}}),/LOCATION_UNAVAILABLE/);
});

test('Maps handoff has no fabricated results and transmits only short-lived location consent', async () => {
  const r=navigation(),value=navigationHandoff(r,true)!;
  assert.ok(value);assert.deepEqual(value.facilities,[]);assert.equal(value.suitability,'not_verified');
  assert.equal(new URL(value.url).hostname,'www.google.com');
  assert.equal(new URL(value.url).searchParams.get('query'),'hospital emergency departments near 0.000,0.000');
  assert.equal(navigationHandoff({...r,text:'cough'},true),null);
  assert.equal(navigationHandoff({...r,consent:{...r.consent,granted:false}},true),null);
  assert.equal(navigationHandoff({...r,consent:{...r.consent,expires_at:0}},true),null);
  let sent='';const output=await prepareNavigation(r,true,new AbortController().signal,(async(_u,init)=>{sent=String(init?.body);return Response.json(value);}) as typeof fetch);
  assert.equal(output.url,value.url);assert.deepEqual(JSON.parse(sent),r);assert.ok(!sent.includes('cough'));
  await assert.rejects(()=>prepareNavigation(r,true,new AbortController().signal,(async()=>{throw Error('offline');}) as typeof fetch));
  await assert.rejects(()=>prepareNavigation(r,true,new AbortController().signal,(async()=>Response.json({status:'unavailable'})) as typeof fetch),/INVALID_NAVIGATION_HANDOFF/);
  await assert.rejects(()=>prepareNavigation(r,true,new AbortController().signal,(async()=>Response.json({...value,facilities:[{name:'fabricated'}]})) as typeof fetch),/INVALID_NAVIGATION_HANDOFF/);
  assert.equal(mapsSearch('',true),null);assert.ok(mapsSearch('Chennai',false)?.includes('hospitals'));
});

async function endpoint(mode:'development'|'production', callback:(send:(path:string,body:unknown,origin?:string)=>Promise<{status:number;body:any}>)=>Promise<void>, modelEnabled=true) {
  const app=express();registerModelADemo(app,{mode,host:'127.0.0.1',port:3000,legacyAgentsEnabled:false},
    {enabled:modelEnabled,token:modelEnabled?'fictional-token-123456789012345678901234567890':''});
  const server=await new Promise<ReturnType<typeof app.listen>>(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
  try {const port=(server.address() as {port:number}).port;
    await callback((path,body,origin='http://127.0.0.1:3000')=>new Promise((resolve,reject)=>{
      const r=httpRequest({hostname:'127.0.0.1',port,path,method:'POST',headers:{Host:'127.0.0.1:3000',Origin:origin,'Content-Type':'application/json'}},response=>{
        let raw='';response.on('data',b=>raw+=b);response.on('end',()=>{let body:unknown=raw;try{body=JSON.parse(raw);}catch{}resolve({status:response.statusCode!,body});});
      });r.on('error',reject);r.end(JSON.stringify(body));
    }));
  } finally {await new Promise<void>(resolve=>server.close(()=>resolve()));}
}
test('loopback safety endpoints and extraction guard work independently of model providers', async () => {
  await endpoint('development',async send=>{
    const safety=await send('/api/research/medassist/safety',{schema_version:'medassist.safety-request.v1',text:'I cannot breathe'});
    assert.equal(safety.status,200);assert.equal(safety.body.status,'escalate');
    const extraction=await send('/api/research/model-a/extract',{schema_version:'medassist.extract-request.v1',fictional_only:true,text:'I cannot breathe'});
    assert.equal(extraction.status,409);assert.equal(extraction.body.error,'SAFETY_ESCALATION');
    const maps=await send('/api/research/medassist/navigation/emergency',navigation());assert.equal(maps.status,200);assert.deepEqual(maps.body.facilities,[]);
    assert.equal((await send('/api/research/medassist/safety',{schema_version:'medassist.safety-request.v1',text:'I need help'},'https://other.example')).status,403);
    assert.equal((await send('/api/research/medassist/navigation/hospital',{...navigation(),text:'not allowed'})).status,422);
  });
  await endpoint('production',async send=>assert.equal((await send('/api/research/medassist/safety',{})).status,404));
});
test('safety remains available without a Model A enable flag or private token',async()=>{
  await endpoint('development',async send=>{
    const r=await send('/api/research/medassist/safety',{schema_version:'medassist.safety-request.v1',text:'I need emergency help'});
    assert.equal(r.status,200);assert.equal(r.body.status,'escalate');
    assert.equal((await send('/api/research/model-a/interview',{})).status,404);
  },false);
});
test('chat checks safety before availability or model work and invalidates pending results',()=>{
  const s=readFileSync('src/features/medassist-conversation/MedAssistConversation.tsx','utf8');
  const compact=s.replace(/\s+/g,'');
  assert.ok(compact.indexOf('if(escalate(text)')>=0 && compact.indexOf('if(escalate(text)')<compact.indexOf('||busy||pendingRetry'));
  assert.match(compact,/safetyLatch\.current=true;generation\.current\+\+;abort\.current\?\.abort\(\)/);
  assert.match(compact,/if\(safetyLatch\.current\|\|inFlight\.current\)return/);
  assert.match(s,/!emergency && result &&/);assert.match(s,/role="alert" aria-label="Emergency help"/);
  assert.doesNotMatch(s,/localStorage|sessionStorage|console\./);
});
