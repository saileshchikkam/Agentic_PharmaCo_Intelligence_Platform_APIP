import {CompletionPanel} from './CompletionPanel';
import { accountClient, guidedAccountHeaders } from '../../account/client';
import React,{useEffect,useRef,useState} from 'react';
import {useAccount} from '../../account/AccountProvider';
import {followPreviewLink} from '../../access/navigation';
import {M3Button,M3TextField} from '../../../components/material/core';
import {addressedQuestions,questions,stages,missing,nextQuestion,chronology,type Field,type GuidedCase} from './domain';
import {AdrWorkspace as LegacyWorkspace} from '../AdrWorkspace';
import './guided.css';
import {questionCopy} from './questionCopy';
import {LiveFormPreview} from './LiveFormPreview';
import {ReportExport} from './ReportExport';
import {AdrLanding, type SavedReport} from './AdrLanding';
const allowLocalBrowserDemo = import.meta.env.DEV && accountClient?.kind !== 'supabase';
type Props={renderNavigation:(back:()=>void,label:string)=>React.ReactNode;onExit:()=>void;initialCaseId?:string};
export function GuidedWorkspace(props:Props){const {user,ready}=useAccount();const [legacy,setLegacy]=useState(false);
 if(legacy&&allowLocalBrowserDemo)return <><M3Button variant="text" onClick={()=>setLegacy(false)}>Return to guided reporting</M3Button><LegacyWorkspace {...props}/></>;
 if(!ready)return <p role="status">Checking your account…</p>;
 if(!user)return <section className="adr-guide"><h1>Prepare a suspected ADR report</h1><p>Use a fictional case. Sign in to save and resume your guided report.</p><a href="#/sign-in/patient?continue=adr-report" onClick={e=>followPreviewLink(e,'/sign-in/patient?continue=adr-report')}>Sign in to start</a>{allowLocalBrowserDemo&&<M3Button variant="text" onClick={()=>setLegacy(true)}>Open previous draft preview</M3Button>}</section>;
 return <Guide key={user.id} owner={user.id} {...props}/>;
}
type View={case:GuidedCase};
function Guide({owner,...props}:Props&{owner:string}){
 const {invalidateSession}=useAccount();
 const [c,setCase]=useState<GuidedCase|null>(null),[list,setList]=useState<SavedReport[] | null>(null),[intro,setIntro]=useState(true),[key,setKey]=useState<string|null>(null),[value,setValue]=useState(''),[dirty,setDirty]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[narrative,setNarrative]=useState('');
 const editing=useRef(false);
 const alive=useRef(true),lock=useRef(false),heading=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const pendingMutation = useRef<{ request: string; key: string }>();
 const request = async (path: string, body?: unknown) => {
  const payload = body === undefined ? undefined : JSON.stringify(body);
  let mutation: string | undefined;
  if (accountClient?.kind === 'supabase' && payload !== undefined) {
   const fingerprint = path + '\n' + payload;
   if (pendingMutation.current?.request !== fingerprint) {
    pendingMutation.current = { request: fingerprint, key: crypto.randomUUID() };
   }
   mutation = pendingMutation.current.key;
  }
  const send = async () => {
   let headers: Record<string, string>;
   try { headers = { ...await guidedAccountHeaders(owner), ...(mutation ? { 'Idempotency-Key': mutation } : {}) }; }
   catch {
    void invalidateSession(owner);
    throw Error('Your session has ended. Please sign in again.');
   }
   return fetch('/api/account/adr-guided' + path, {
    method: payload === undefined ? 'GET' : 'POST',
    credentials: 'same-origin',
    headers,
    body: payload,
    signal: AbortSignal.timeout(25000),
   });
  };
  let response: Response;
  try { response = await send(); } catch (error) {
   if (!mutation || !alive.current || (error instanceof Error && /session has ended/i.test(error.message))) throw error;
   response = await send();
  }
  const data = await response.json();
  if (mutation && (response.ok || response.status < 500 && response.status !== 429)) pendingMutation.current = undefined;
  if (!response.ok) {
   if (response.status === 401 || data.error === 'SIGN_IN_REQUIRED') {
    void invalidateSession(owner);
    throw Error('Your session has ended. Please sign in again.');
   }
   throw Error(data.error === 'REVISION_CONFLICT'
    ? 'This draft changed in another tab. Reopen the saved draft before editing; your current answer is still here.'
    : data.error || 'Request failed');
  }
  return data;
 };
 const run=async(work:()=>Promise<void>)=>{if(lock.current)return;lock.current=true;setBusy(true);setError('');try{await work();}catch(e){if(alive.current)setError((e as Error).message);}finally{lock.current=false;if(alive.current)setBusy(false);}};
 const loadDrafts=()=>run(async()=>{const data=await request('');if(alive.current)setList(data.cases);});
 useEffect(()=>{if(props.initialCaseId)void open(props.initialCaseId);else void loadDrafts();},[]);
 useEffect(()=>{const guard=(e:Event)=>{if(dirty&&!window.confirm('Leave this unsaved answer?'))e.preventDefault();};const unload=(e:BeforeUnloadEvent)=>{if(dirty){e.preventDefault();e.returnValue='';}};window.addEventListener('apip:before-navigate',guard);window.addEventListener('beforeunload',unload);return()=>{window.removeEventListener('apip:before-navigate',guard);window.removeEventListener('beforeunload',unload);};},[dirty]);
 const all=c?questions(c):[],field=all.find(f=>f.key===key),stage=field?.stage??5;
 const answered=c?addressedQuestions(all,c.values):0;
 const choose=(next:string|null,current=c)=>{if(dirty&&!window.confirm('Discard this unsaved answer?'))return;setKey(next);setValue(next?current?.values[next]?.value??'':'');setDirty(false);};
 useEffect(()=>{heading.current?.focus();},[key,intro]);
 const apply=(data:View,advance=false,after?:string)=>{
  if(!alive.current)return;
  setCase(data.case);
  setDirty(false);
  if(!advance)return;
  const fields=questions(data.case);
  const following=after?fields.slice(fields.findIndex(f=>f.key===after)+1).find(f=>!data.case.values[f.key])?.key:undefined;
  const next=editing.current?null:following??nextQuestion(data.case);
  editing.current=false;
  setKey(next);
  setValue(next?data.case.values[next]?.value??'':'');
 };
 const command=async(cmd:unknown,advance=false,after?:string)=>{if(!c)return;const data=await request(`/${c.id}/command`,{expectedRevision:c.revision,command:cmd});apply(data,advance,after);};
 const save=(unknown=false,advance=true)=>run(()=>command({type:'confirm',key,value:unknown?null:value},advance,key??undefined));
 const edit=(next:string)=>{editing.current=true;choose(next);};
 const start=()=>run(async()=>{const data:View=await request('',{fictionalOnly:true});if(alive.current){apply(data,true);setIntro(false);}});
 const open=(id:string)=>run(async()=>{const data:View=await request('/'+id);if(alive.current){apply(data,true);setIntro(false);}});
 return <div className="adr-guide">
 {props.renderNavigation(props.onExit,props.initialCaseId?'Back to report':'Back to dashboard')}
 {intro?<AdrLanding drafts={list} busy={busy} loadFailed={!!error} start={start} resume={open} retry={loadDrafts}/>:c&&<>
 <nav className="adr-stages" aria-label="Reporting stages">{stages.map((name,i)=><button key={name} disabled={busy} aria-current={stage===i?'step':undefined} onClick={()=>{editing.current=false;choose(i===5?null:all.find(f=>f.stage===i&&!c.values[f.key])?.key??all.find(f=>f.stage===i)?.key??null);}}><span>{i+1}</span>{name}</button>)}</nav>

 <div className="adr-intake-progress"><label>Intake progress: {answered} of {all.length} questions addressed <progress value={answered} max={all.length}/></label></div>
 <div className={field?'adr-columns adr-with-form':'adr-columns single'}><section className="adr-question" key={key??'review'} onKeyDown={event=>{
   if(!field || event.key!=='Enter' || event.nativeEvent.isComposing || event.repeat || event.altKey || event.shiftKey) return;
   const input=event.nativeEvent.composedPath()[0];
   const shortcut=event.ctrlKey||event.metaKey;
   if(!(input instanceof HTMLInputElement && !shortcut) && !(input instanceof HTMLTextAreaElement && shortcut)) return;
   event.preventDefault();
   if(!busy && value.trim()) void save();
 }}>
 {field?<><p className="adr-eyebrow">{stages[field.stage]} · {all.findIndex(f=>f.key===key)+1} of {all.length}</p><h2 tabIndex={-1} ref={heading}>{questionCopy(field)[0]}</h2><p>{questionCopy(field)[1]}</p><AdaptiveInput field={field} value={value} disabled={busy} onChange={v=>{setValue(v);setDirty(true);}}/>
 <div className="adr-actions"><M3Button variant="text" disabled={busy||all.findIndex(f=>f.key===key)===0} onClick={()=>choose(all[Math.max(0,all.findIndex(f=>f.key===key)-1)].key)}>Back</M3Button><M3Button disabled={busy||!value.trim()} onClick={()=>save()}>Continue</M3Button><M3Button variant="outlined" disabled={busy} onClick={()=>save(true)}>Unknown / not available</M3Button><M3Button variant="text" disabled={busy||!value.trim()} onClick={()=>save(false,false)}>Save progress</M3Button></div></>:<><h2 tabIndex={-1} ref={heading}>Review your report details</h2><p>{missing(c).length} minimum-checklist items still missing. This does not measure all optional fields or official form completeness.</p><DraftPreview c={c} edit={edit}/><ReportExport c={c} owner={owner} edit={()=>edit(all[0]?.key??'')}/></>}
 {!field&&chronology(c).map(w=><p role="alert" key={w}>{w}. Please review these dates.</p>)}
 {(!field||field.stage===3&&field.key.endsWith('.name'))&&<MedicationEntries c={c} busy={busy} add={kind=>run(async()=>{await command({type:'add_medication',kind},true);})}/>}
 {!field&&<details className="adr-description"><summary>Describe several details together (optional AI assistance)</summary><p>Suggestions need your confirmation. Manual answers always work.</p><M3TextField label="Describe your fictional experience" type="textarea" value={narrative} maxLength={4000} disabled={busy} onChange={e=>setNarrative(e.target.value)}/><M3Button disabled={busy||!narrative.trim()} onClick={()=>run(()=>command({type:'describe',text:narrative}))}>Find suggested details</M3Button><p role="status">{c.providerStatus==='manual_required'?'No model configured. Your description is saved; continue with the guided questions.':c.providerStatus==='unavailable_or_invalid'?'The model could not provide valid suggestions. Your description is saved.':c.providerStatus==='proposals_ready'?'Review each suggestion below.':''}</p></details>}
 <ConfirmationPanel c={c} busy={busy} decide={(proposalId,accept)=>run(()=>command({type:'proposal',proposalId,accept},true))}/>
 </section>{field&&<LiveFormPreview c={c} owner={owner}/>}</div>
 <CompletionPanel key={owner+c.id} owner={owner} id={c.id} revision={c.revision} correct={edit}/>
 </>}{busy&&<p role="status">Saving or checking your answer…</p>}{error&&<p className="adr-error" role="alert">{error}</p>}
 </div>;
}
export function AdaptiveInput({field,value,onChange,disabled}:{field:Field;value:string;onChange:(v:string)=>void;disabled:boolean}){
 if(field.options)return <div className="adr-options" role="group" aria-label={field.label}>{field.options.map(option=>{const multi=field.key==='seriousness',selected=multi?value.split('; ').includes(option):value===option;return <M3Button key={option} disabled={disabled} variant={selected?'tonal':'outlined'} ariaLabel={`${option}${selected?', selected':''}`} onClick={()=>{if(!multi)return onChange(option);let values=value?value.split('; '):[];values=selected?values.filter(v=>v!==option):[...values,option];if(option==='None reported')values=selected?[]:[option];else values=values.filter(v=>v!=='None reported');onChange(values.join('; '));}}>{option}{selected?' ✓':''}</M3Button>;})}</div>;
 if(field.type==='date')return <div className="adr-date"><input type="date" aria-label={field.label} value={value} disabled={disabled} onChange={e=>onChange(e.target.value)}/></div>;
 return <M3TextField label={field.label} type={field.type==='long'?'textarea':field.type==='number'?'number':'text'} value={value} onChange={e=>onChange(e.target.value)} disabled={disabled} maxLength={field.type==='long'?4000:200}/>;
}
export function DraftPreview({c,edit,readOnly=false}:{c:GuidedCase;edit:(key:string)=>void;readOnly?:boolean}) {
 const groups = [
  ['Patient', (f:Field)=>f.stage<=1],
  ['Reaction', (f:Field)=>f.stage===2],
  ['Suspected and other medicines', (f:Field)=>f.stage===3],
  ['Additional medical context', (f:Field)=>['history','investigations','additional'].includes(f.key)],
  ['Reporter information', (f:Field)=>f.stage===4&&!['history','investigations','additional'].includes(f.key)],
 ] as const;
 return <>{groups.map(([title,include])=>{
  const fields=questions(c).filter(include);
  const provided=fields.filter(f=>c.values[f.key]?.state==='provided');
  return <details key={title}><summary>{title} · {provided.length} answered</summary><dl>{fields.map(f=>
   <div key={f.key}><dt>{f.label}</dt><dd>{c.values[f.key]?.value??(c.values[f.key]?'Unknown / not available':'Unanswered')} {!readOnly&&<button onClick={()=>edit(f.key)} aria-label={`Edit ${f.label}`}>Edit</button>}</dd></div>
  )}</dl></details>;
 })}</>;
}
export function MedicationEntries({c,busy,add}:{c:GuidedCase;busy:boolean;add:(kind:'suspect'|'concomitant')=>void}){return <details><summary>Medicines ({c.medications.length})</summary><p>Each medicine has its own details. Maximum 20 entries.</p><M3Button variant="outlined" disabled={busy||c.medications.length>=20} onClick={()=>add('suspect')}>Add suspected medicine</M3Button><M3Button variant="text" disabled={busy||c.medications.length>=20} onClick={()=>add('concomitant')}>Add concomitant medicine</M3Button></details>;}
export function ConfirmationPanel({c,busy,decide}:{c:GuidedCase;busy:boolean;decide:(id:string,accept:boolean)=>void}){return <section aria-label="Unconfirmed suggestions">{c.proposals.map(p=><article className="adr-proposal" key={p.id}><strong>Unconfirmed suggestion</strong><p>{questions(c).find(f=>f.key===p.key)?.label}: {p.value}</p><blockquote>{p.quote}</blockquote>{p.conflict&&<p role="alert">This differs from your saved answer. Accepting will replace it in a new revision.</p>}<M3Button disabled={busy} onClick={()=>decide(p.id,true)}>Confirm suggestion</M3Button><M3Button variant="text" disabled={busy} onClick={()=>decide(p.id,false)}>Reject</M3Button></article>)}</section>;}
