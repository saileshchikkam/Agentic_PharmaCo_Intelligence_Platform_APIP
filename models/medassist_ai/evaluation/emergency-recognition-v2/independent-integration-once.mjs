import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createServer} from 'vite';
const {chromium}=await import(process.env.MEDASSIST_PLAYWRIGHT_MODULE || 'playwright');
const D='models/medassist_ai/evaluation/emergency-recognition-v2/';
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const freeze=JSON.parse(readFileSync(D+'implementation-freeze.json','utf8'));
function verify(){for(const [p,h]of Object.entries(freeze.files))if(hash(p)!==h)throw Error('IMPLEMENTATION_CHANGED '+p);for(const [p,h]of Object.entries(freeze.evaluation_inputs))if(hash(D+p)!==h)throw Error('GOLD_CHANGED '+p)}
verify();const out=D+'independent-integration-results.json',marker=D+'independent-integration-attempt.json';
if(existsSync(out)||existsSync(marker))throw Error('INTEGRATION_ALREADY_ATTEMPTED_NO_RERUN');
writeFileSync(marker,JSON.stringify({started_utc:new Date().toISOString(),attempt:1,viewport:{width:1440,height:900},local_mocked_transports:true})+'\n',{flag:'wx'});
const scenarios=JSON.parse(readFileSync(D+'integration-scenarios.json','utf8')).scenarios;
const vocabulary={schema_version:'medassist.natural-vocabulary.v1',fictional_only:true,items:[{evidence_id:'E_53',kind:'symptom',data_type:'B',question_en:'Describe fictional pain?',initial_allowed:true,possible_values:[],label:'Fictional pain'}],coverage:{symptom_fields:1,universal_coverage:false}};
const server=await createServer({root:process.cwd(),server:{host:'127.0.0.1',port:0}});let browser;const rows=[];
try{await server.listen();await server.watcher.close();browser=await chromium.launch({channel:'chrome',headless:true});
for(const sc of scenarios){const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});let page,pending=null,calls=0,interview=0,geoCallsBefore=0,navigationBodies=[],externalRequests=0;const errors=[];
const row={id:sc.id,category:sc.category,execution:'independent_browser_once',checks:[],observations:{},unverified_expected_keys:[],errors:[]};
const check=(name,expected,actual)=>row.checks.push({name,expected,actual,pass:expected===actual});
try{
 page=await context.newPage();page.setDefaultTimeout(5000);page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>{const u=new URL(r.request().url());if(!['127.0.0.1','localhost'].includes(u.hostname)){externalRequests++;return r.abort()}return r.fallback()});
 await page.addInitScript(()=>{window.__geoCalls=0;window.__grantLocation=false;Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition(ok,fail){window.__geoCalls++;if(window.__grantLocation)ok({coords:{latitude:13,longitude:80,accuracy:50},timestamp:Date.now()});else fail({code:1})}}});const f=window.fetch.bind(window);window.fetch=(input,opts)=>f(input,String(input).includes('/natural/extract')?{...opts,signal:undefined}:opts)});
 await page.route('**/api/research/model-a/language',r=>r.fulfill({json:{schema_version:'medassist.language-status.v2',configured:sc.given.provider!=='unavailable',provider:'groq-cloud',model:'fictional-local-mock',timeout_ms:1000}}));
 await page.route('**/api/research/model-a/natural/vocabulary',r=>r.fulfill(sc.given.provider==='unavailable'?{status:503,json:{error:'offline'}}:{json:vocabulary}));
 await page.route('**/api/research/model-a/natural/extract',r=>{calls++;if(['pending_then_timeout','pending_routine_request','pending_old_request'].includes(sc.given.provider)){pending=r;return new Promise(resolve=>{r.__release=resolve})}return r.fulfill({status:503,json:{error:'PROVIDER_UNAVAILABLE'}})});
 await page.route('**/api/research/model-a/natural/interview',r=>{interview++;return r.fulfill({status:503,json:{error:'UNEXPECTED_ROUTINE_CALL'}})});
 await page.route('**/api/research/medassist/navigation/emergency',r=>{const body=r.request().postDataJSON();navigationBodies.push(body);const loc=`${body.location.latitude.toFixed(3)},${body.location.longitude.toFixed(3)}`;const url=new URL('https://www.google.com/maps/search/');url.searchParams.set('api','1');url.searchParams.set('query',`hospital emergency departments near ${loc}`);return r.fulfill({json:{schema_version:'medassist.navigation-handoff.v1',status:'search_handoff',provider:'google_maps',url:url.toString(),facilities:[],verified_facility_provider:false,availability:'unknown',suitability:'not_verified',network_status:'external_search_not_checked',includes_symptoms:false}})});
 await page.goto(server.resolvedUrls.local[0]+'#/preview/medassist-conversation',{waitUntil:'domcontentloaded',timeout:60000});
 const box=()=>page.getByRole('textbox',{name:'Fictional symptom description',exact:true});await box().waitFor();
 if(sc.given.provider==='unavailable')await page.getByText('Question service offline',{exact:false}).waitFor();else await page.getByText('Ready to listen',{exact:false}).waitFor();
 const status=async()=>await page.getByRole('alert',{name:'Emergency help',exact:true}).count()?'escalate':await page.getByRole('alert',{name:'Safety clarification',exact:true}).count()?'clarify':'not_assessed';
 const settle=()=>page.waitForTimeout(120);
 if(['pending_then_timeout','pending_routine_request','pending_old_request'].includes(sc.given.provider)){await box().fill('I have stomach pain');await box().press('Enter');const end=Date.now()+5000;while(!pending&&Date.now()<end)await page.waitForTimeout(20);check('pending_provider_fixture_started',true,!!pending)}
 if(sc.given.session==='emergency_latched'){await page.getByRole('button',{name:'Emergency help',exact:true}).click();await settle();check('given_emergency_latched',true,(await status())==='escalate')}
 const callsBeforeEvents=calls;let initialStatus=null;
 for(const event of sc.events){
 if(event.type==='user_message'){
  if(await box().isDisabled()){await box().evaluate((el,text)=>{el.value=text;el.dispatchEvent(new Event('input',{bubbles:true}))},event.text);row.observations.disabled_composer_blocked_followup=true}else await box().fill(event.text);
  await settle();if(initialStatus===null)initialStatus=await status();
 }
 if(event.type==='provider_timeout'||event.type==='resolve_old_provider'){
  if(pending){const late=pending;pending=null;await late.fulfill(event.type==='provider_timeout'?{status:503,json:{error:'PROVIDER_TIMEOUT'}}:{json:{schema_version:'medassist.natural-extraction.v1',observations:[{evidence_id:'E_53',state:'confirmed',value:true,quote:'stomach pain'}],unmapped:[],instruction_attempt:false,...(event.payload_kind==='no_emergency_reassurance_and_routine_question'?{unsupported_reassurance:'No emergency; continue routine questions.'}:{})}});late.__release();await settle();row.observations.provider_completion_released=true;}
  else row.errors.push('No pending provider completion to release');
 }
 if(event.type==='explicit_fictional_restart'){await page.getByRole('button',{name:'Restart fictional interview',exact:true}).click();await settle();row.observations.status_after_explicit_restart=await status()}
 if(event.type==='request_nearby_help'){geoCallsBefore=await page.evaluate(()=>window.__geoCalls);check('automatic_location_access',false,geoCallsBefore>0)}
 if(event.type==='decline_location_consent'){await page.getByRole('button',{name:'Use my location',exact:true}).click();await page.getByText('Location permission was denied.',{exact:false}).waitFor();check('location_shared',false,navigationBodies.length>0)}
 if(event.type==='grant_location_consent'){await page.evaluate(()=>window.__grantLocation=true);await page.getByRole('button',{name:'Use my location',exact:true}).click();await page.getByText('Approximate device coordinates ready.',{exact:false}).waitFor();check('location_access_only_after_consent',true,geoCallsBefore===0&&(await page.evaluate(()=>window.__geoCalls))===1)}
 if(event.type==='navigation_handoff'){await page.getByRole('button',{name:'Prepare Maps search',exact:true}).click();await page.getByRole('link',{name:'Open Maps search',exact:true}).waitFor();row.observations.maps_link=await page.getByRole('link',{name:'Open Maps search',exact:true}).getAttribute('href');check('location_only_shared',true,navigationBodies.length===1&&Object.keys(navigationBodies[0]).sort().join(',')==='consent,location,schema_version')}
 }
 const final=await status();row.observations={...row.observations,initial_status:initialStatus,final_status:final,extraction_calls:calls,extraction_calls_after_events:calls-callsBeforeEvents,interview_calls:interview,external_network_requests:externalRequests,candidate_confirmation_visible:await page.getByRole('button',{name:'Confirm these details',exact:true}).count()>0,geolocation_calls:await page.evaluate(()=>window.__geoCalls),navigation_requests:navigationBodies,page_errors:errors};
 if(sc.expect.safety_action)check('safety_action',sc.expect.safety_action,final);
 if('routine_provider_required'in sc.expect)check('routine_provider_required',false,calls>0||interview>0);
 if('routine_question_visible'in sc.expect)check('routine_question_visible',false,row.observations.candidate_confirmation_visible||interview>0);
 if('old_response_rendered'in sc.expect)check('old_response_rendered',false,row.observations.candidate_confirmation_visible);
 if('stale_emergency_clearances'in sc.expect){if(initialStatus===sc.expect.safety_action||sc.id==='er2-i-11')check('stale_emergency_clearances',0,initialStatus==='escalate'&&final!=='escalate'?1:0);else row.unverified_expected_keys.push('stale_emergency_clearances: initial expected safety state never reached')}
 if('emergency_latch_cleared'in sc.expect)check('emergency_latch_cleared',false,initialStatus==='escalate'&&final!=='escalate');
 if('timeout_clears_emergency'in sc.expect)check('timeout_clears_emergency',false,initialStatus==='escalate'&&final!=='escalate');
 if('routine_provider_called_after_correction'in sc.expect)check('routine_provider_called_after_correction',false,calls>callsBeforeEvents||interview>0);
 if('routine_provider_called_before_resolution'in sc.expect)check('routine_provider_called_before_resolution',false,calls>callsBeforeEvents||interview>0);
 if('navigation_clears_emergency'in sc.expect)check('navigation_clears_emergency',false,final!=='escalate');
 if('emergency_service_option_visible'in sc.expect)check('emergency_service_option_visible',true,await page.getByRole('link',{name:'Call 112 in India',exact:true}).count()===1);
 if('provider_reassurance_visible'in sc.expect)check('provider_reassurance_visible',false,await page.getByText('No emergency; continue routine questions.',{exact:false}).count()>0);
 if('facility_suitability_claimed'in sc.expect)check('facility_suitability_claimed',false,!((await page.locator('.conversation-navigation').innerText()).includes('not a verified emergency facility')));
 if('old_emergency_evidence_carried_to_new_session'in sc.expect)row.unverified_expected_keys.push('old_emergency_evidence_carried_to_new_session: private evidence state not inspected');
 if('third_party_inserted_as_self_evidence'in sc.expect)row.unverified_expected_keys.push('third_party_inserted_as_self_evidence: no official Model A data/ledger opened or executed');
 if('subject'in sc.expect)row.unverified_expected_keys.push('subject: UI does not expose mention annotations; matcher result separately records subject coverage');
 if('diagnosis_visible'in sc.expect)row.unverified_expected_keys.push('diagnosis_visible: no validated semantic diagnosis-output classifier');
 if('explicit_fictional_restart_required'in sc.expect)check('explicit_fictional_restart_required',true,await box().isDisabled()&&final==='escalate');
 check('no_external_network_calls',true,externalRequests===0);check('no_page_errors',true,errors.length===0);
 }catch(e){row.errors.push(String(e?.stack||e))}finally{if(pending){try{await pending.fulfill({status:503,json:{error:'TEARDOWN'}});pending.__release()}catch{}}await context.close()}
 row.outcome=row.errors.length||row.checks.some(c=>!c.pass)?'fail':row.unverified_expected_keys.length?'partial_verified':'pass';rows.push(row)
}
}catch(e){rows.push({id:'harness','outcome':'error','error':String(e?.stack||e)})}finally{await browser?.close();await server.close();verify();const report={schema_version:'medassist.independent-integration-final.v1',attempt:1,fictional_only:true,clinical_validation:false,viewport:{width:1440,height:900},mocked_transports:true,cloud_inference_calls:0,official_model_a_data_opened:false,external_maps_opened:false,scenario_source_sha256:hash(D+'integration-scenarios.json'),implementation_hashes_verified_before_after:true,limitations:'One desktop viewport. Browser assertions prove only observed paths; private evidence mutation and unverified keys are not passed. Local synthetic vocabulary only. Primary-author three-width regression is separate evidence.',rows};writeFileSync(out,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({output:out,sha256:hash(out),rows:rows.map(r=>({id:r.id,outcome:r.outcome,failed_checks:r.checks?.filter(c=>!c.pass),errors:r.errors,unverified:r.unverified_expected_keys}))},null,2))}
