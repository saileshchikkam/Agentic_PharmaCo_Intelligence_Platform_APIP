import {useEffect,useRef,useState} from 'react';
import type {MdDialog} from '@material/web/dialog/dialog';
import {M3Button,M3Checkbox,M3Select,M3TextField} from '../../components/material/core';
import {useAccount} from '../account/AccountProvider';
import {guidedAccountHeaders} from '../account/client';
import {navigatePreview} from '../access/navigation';
import {categories,type Application,type ProfessionalProfile} from '../../../server/specialist/domain';
import './specialist.css';

const empty:ProfessionalProfile={fullName:'',category:categories[0],qualification:'',registration:'',jurisdiction:'',organization:'',department:'',experience:'',specialization:''};
const labels:Record<keyof ProfessionalProfile,string>={fullName:'Full name',category:'Professional category',qualification:'Qualification (fictional)',registration:'Registration reference (fictional, optional)',jurisdiction:'Registration jurisdiction',organization:'Organization or institution (fictional)',department:'Department or professional role',experience:'Pharmacovigilance experience',specialization:'Relevant specialization'};
type Caps={specialistWorkspace:boolean;identityAdministration:boolean;authorizationVersion:string;validUntil?:string};
const friendly:Record<string,string>={SPECIALIST_SETUP_REQUIRED:'Specialist onboarding is not connected in this environment. The reviewed database migration and private administrator setup are required.',
 SPECIALIST_UNAVAILABLE:'Specialist services are unavailable. Your entered information is preserved. Please retry.',FORBIDDEN:'Your account is not authorized for identity administration.',
 SIGN_IN_REQUIRED:'Your session has ended. Sign in again.',ACCOUNT_CHANGED:'Your account changed. Reopen this workspace.',REVISION_CONFLICT:'This application changed. Refresh before making another decision.',
 INVALID_PROFILE:'Enter your name, fictional qualification and a permitted category. Each answer must be at most 300 characters.',
 SELF_APPROVAL_DENIED:'You cannot approve your own application.',INVALID_TRANSITION:'This action is unavailable for the current application state.',
 VERIFICATION_REQUIRED:'Record the independent synthetic evidence reference before approval.',INVALID_DECISION:'Check the decision reason and evidence reference.'};
async function request(owner:string,path:string,signal:AbortSignal,body?:unknown,key?:string){
 const prefix=import.meta.env.VITE_APIP_IDENTITY_FIXTURE==='1'?'/api/account/identity-fixture':'/api';
 const response=await fetch(prefix+path,{method:body===undefined?'GET':'POST',credentials:'same-origin',cache:'no-store',
  headers:{...await guidedAccountHeaders(owner),...(key?{'Idempotency-Key':key}:{})},body:body===undefined?undefined:JSON.stringify(body),signal});
 const data=await response.json();if(!response.ok)throw Error(friendly[data.error]??'Unable to complete this action. Please retry.');return data;
}
export function SpecialistWorkspace({admin=false,id}:{admin?:boolean;id?:string}){
 const {user,ready}=useAccount();
 useEffect(()=>{if(ready&&!user){sessionStorage.setItem('apip.account.return',admin?'/admin/specialist-applications':'/specialist');navigatePreview('/sign-in/specialist',{replace:true});}},[ready,user?.id,admin]);
 if(!ready||!user)return <p role="status">Checking your account…</p>;
 return <IdentityWorkspace key={`${user.id}/${admin}/${id??''}`} owner={user.id} email={user.email??''} admin={admin} id={id}/>;
}
function IdentityWorkspace({owner,email,admin,id}:{owner:string;email:string;admin:boolean;id?:string}){
 const [caps,setCaps]=useState<Caps|null>(null),[application,setApplication]=useState<Application|null>(null),[list,setList]=useState<Application[]>([]);
 const [profile,setProfile]=useState(empty),[error,setError]=useState(''),[busy,setBusy]=useState(false),[loaded,setLoaded]=useState(false),[filter,setFilter]=useState('SUBMITTED');
 const [reason,setReason]=useState(''),[evidence,setEvidence]=useState(''),[action,setAction]=useState(''),[affirm,setAffirm]=useState(false),[dirty,setDirty]=useState(false);
 const dialog=useRef<MdDialog>(null),alive=useRef(true),lock=useRef(false),generation=useRef(0),pending=useRef<{body:string;key:string}>();
 useEffect(()=>{const element=dialog.current;const cancel=(event:Event)=>{if(lock.current)event.preventDefault();};
  element?.addEventListener('cancel',cancel);return()=>element?.removeEventListener('cancel',cancel);},[]);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 async function refresh(){
  const sequence=++generation.current;
  const controller=new AbortController();
  try{
   const c=await request(owner,'/account/capabilities',AbortSignal.any([controller.signal,AbortSignal.timeout(12000)]));
   if(!alive.current||sequence!==generation.current)return;setCaps(c);
   if(admin){
    if(!c.identityAdministration)throw Error(friendly.FORBIDDEN);
    const value=await request(owner,id?`/admin/specialist-applications/${id}`:`/admin/specialist-applications?limit=25${filter?'&state='+filter:''}`,controller.signal);
    if(!alive.current||sequence!==generation.current)return;if(id){setApplication(value.application);setProfile(value.application?.profile??empty);}else setList(value.applications);
   }else{
    const value=await request(owner,'/specialist/applications/current',controller.signal);
    if(!alive.current||sequence!==generation.current)return;setApplication(value.application);if(!dirty)setProfile(value.application?.profile??empty);
   }
   setError('');setLoaded(true);
  }catch(e){if(alive.current&&sequence===generation.current){setCaps(null);setList([]);setApplication(null);setError((e as Error).message);setLoaded(true);}}
 }
 useEffect(()=>{void refresh();},[owner,admin,id,filter]);
 useEffect(()=>{
  const changed=()=>{if(!document.hidden&&!lock.current&&!dirty)void refresh();};
  const timer=setInterval(changed,15000);window.addEventListener('focus',changed);document.addEventListener('visibilitychange',changed);
  return()=>{clearInterval(timer);window.removeEventListener('focus',changed);document.removeEventListener('visibilitychange',changed);};
 },[owner,admin,id,filter,dirty]);
 useEffect(()=>{
  const guard=(e:Event)=>{if(dirty&&!confirm('Leave this unsaved professional profile?'))e.preventDefault();};
  const unload=(e:BeforeUnloadEvent)=>{if(dirty){e.preventDefault();e.returnValue='';}};
  window.addEventListener('apip:before-navigate',guard);window.addEventListener('beforeunload',unload);
  return()=>{window.removeEventListener('apip:before-navigate',guard);window.removeEventListener('beforeunload',unload);};
 },[dirty]);
 async function mutate(path:string,body:unknown){
  if(lock.current)return;lock.current=true;setBusy(true);setError('');
  const fingerprint=JSON.stringify([path,body]);if(pending.current?.body!==fingerprint)pending.current={body:fingerprint,key:crypto.randomUUID()};
  try{
   const result=await request(owner,path,AbortSignal.timeout(15000),body,pending.current.key);
   if(!alive.current)return;
   pending.current=undefined;setApplication(result.application);setProfile(result.application.profile);setDirty(false);dialog.current?.close();
   const c=await request(owner,'/account/capabilities',AbortSignal.timeout(12000));if(alive.current)setCaps(c);
  }catch(e){if(alive.current)setError((e as Error).message);}finally{lock.current=false;if(alive.current)setBusy(false);}
 }
 const approve=()=>{
  if(!application)return;
  void mutate(`/admin/specialist-applications/${application.id}/decisions`,{expectedVersion:application.version,
   command:{action,reason,evidenceReference:evidence,policyVersion:'private-fictional-3b-v1'}});
 };
 return <section className="specialist-workspace" aria-labelledby="specialist-title">
  {import.meta.env.VITE_APIP_IDENTITY_FIXTURE==='1'&&<p className="specialist-notice" role="note">Disposable PostgreSQL fixture · local synthetic authentication. This is not hosted Supabase verification or a real professional approval.</p>}
  <p className="access-eyebrow">APIP · PRIVATE FICTIONAL PROTOTYPE</p><h1 id="specialist-title" tabIndex={-1}>{admin?'Identity administration':'Your specialist workspace'}</h1>
  <p>{admin?'Review fictional applications and manage identity permissions. This console contains no patient reports.':'Build your professional profile and follow your application. Registration does not grant specialist privileges.'}</p>
  <nav className="specialist-nav" aria-label="Identity workspace"><M3Button variant="text" onClick={()=>navigatePreview('/specialist')}>Overview & profile</M3Button>
   {caps?.identityAdministration&&<M3Button variant="text" onClick={()=>navigatePreview('/admin/specialist-applications')}>Identity administration</M3Button>}
   <M3Button variant="text" onClick={()=>navigatePreview('/account/profile')}>Account settings</M3Button></nav>
  {error&&<div className="specialist-notice" role="alert"><p>{error}</p><M3Button variant="outlined" onClick={()=>void refresh()} disabled={busy}>Retry connection</M3Button></div>}
  {!loaded&&<p role="status">Loading your current authorization…</p>}
  {loaded&&caps&&(!admin||caps.identityAdministration)&&<>
   {admin&&!id?<><h2>Specialist applications</h2><M3Select label="Application status" value={filter} onChange={setFilter} options={[
    {value:'',label:'All submitted applications'},...['SUBMITTED','PENDING_VERIFICATION','APPROVED','REJECTED','SUSPENDED','REVOKED','EXPIRED'].map(value=>({value,label:value.replaceAll('_',' ')}))]}/>
    {!list.length?<p>No applications match this status.</p>:<ul className="specialist-list">{list.map(a=><li key={a.id}><h3>{a.profile.fullName}</h3><p>{a.profile.category} · {a.state.replaceAll('_',' ')}</p><p>Saved version {a.version}</p>
     <M3Button variant="outlined" onClick={()=>navigatePreview('/admin/specialist-applications/'+a.id)}>Review application</M3Button></li>)}</ul>}
    {list.length===25&&<p>Showing the first 25 applications. Use the status filter to narrow the list.</p>}
   </>:<>
    <section className="specialist-status" aria-label="Authorization status"><h2>{application?.state.replaceAll('_',' ')??'Start your application'}</h2>
     <p>{application?.state==='APPROVED'?'Fictional prototype authorization only. This is not verification of real-world credentials.':application?.state==='DRAFT'?'Your draft is editable and has not been submitted.':application?.state==='SUBMITTED'||application?.state==='PENDING_VERIFICATION'?'An independent administrator must review your synthetic qualifications. You have no professional permissions yet.':application?.state==='REJECTED'?'The administrator rejected this application. Appeals and resubmission are not enabled.':application?.state==='EXPIRED'?'Your 30-day authorization expired. Only an authorized administrator can explicitly renew it.':application?.state==='REVOKED'||application?.state==='SUSPENDED'?'Professional authorization is unavailable. Existing sign-in does not retain specialist privileges.':'Use synthetic professional details only. Do not upload identity documents.'}</p>
     {application?.validUntil&&<p>Authorization end: {new Date(application.validUntil).toLocaleString()}</p>}
     {application&&<p>Saved version {application.version}</p>}</section>
    {!admin&&<p>Signed-in account: {email}. Account authentication is separate from professional authorization.</p>}
    <form className="specialist-profile" onSubmit={e=>{e.preventDefault();if(!application)void mutate('/specialist/applications',{profile});else void mutate(`/specialist/applications/${application.id}/commands`,{expectedVersion:application.version,command:{type:'save_draft',profile}});}}>
     <h2>Professional profile</h2><p>Applicant-provided information · not independently verified.</p><div className="specialist-fields">
      {(Object.keys(labels) as (keyof ProfessionalProfile)[]).map(key=>key==='category'?<M3Select key={key} label={labels[key]} value={profile.category} disabled={admin||!!application&&application.state!=='DRAFT'||busy}
       onChange={value=>{setProfile(old=>({...old,category:value}));setDirty(true);}} options={categories.map(value=>({value,label:value}))}/>:<M3TextField key={key} label={labels[key]} value={(admin?application?.profile:profile)?.[key]??''} maxLength={300}
        readOnly={admin||!!application&&application.state!=='DRAFT'} disabled={busy} onChange={e=>{setProfile(old=>({...old,[key]:e.target.value}));setDirty(true);}}/>)}</div>
     {!admin&&(!application||application.state==='DRAFT')&&<div className="specialist-actions"><M3Button type="submit" disabled={busy||!profile.fullName.trim()||!profile.qualification.trim()}>{application?'Save draft':'Create application draft'}</M3Button>
      {application&&<M3Button variant="outlined" disabled={busy||dirty} onClick={()=>void mutate(`/specialist/applications/${application.id}/commands`,{expectedVersion:application.version,command:{type:'submit'}})}>Submit application</M3Button>}</div>}
    </form>
    {admin&&application&&<section><h2>Independent identity review</h2><p>Check synthetic qualifications and organization information. No patient-case privileges result from this decision.</p>
     {application.owner===owner?<p>Self-approval and decisions on your own application are prohibited.</p>:<div className="specialist-actions">{(application.state==='SUBMITTED'?['begin_verification','reject']:application.state==='PENDING_VERIFICATION'?['approve','reject']:application.state==='APPROVED'?['suspend','revoke']:application.state==='SUSPENDED'?['revoke']:application.state==='EXPIRED'?['renew']:[]).map(value=>
      <M3Button key={value} variant="outlined" disabled={busy} onClick={()=>{setAction(value);setAffirm(false);setReason('');setEvidence('');void dialog.current?.show();}}>{value.replaceAll('_',' ')}</M3Button>)}</div>}
     {['REVOKED','REJECTED'].includes(application.state)&&<p>Reinstatement and appeals are not enabled by the approved prototype policy.</p>}</section>}
    {application&&<section><h2>Authorization history</h2>{!application.decisions.length?<p>No administrator decisions have been recorded.</p>:<ol>{application.decisions.map(d=><li key={d.id}><strong>{d.action.replaceAll('_',' ')}</strong><p>{d.reason}</p><p>Synthetic evidence: {d.evidenceReference||'Not recorded'}</p><time>{new Date(d.at).toLocaleString()}</time></li>)}</ol>}</section>}
    {!admin&&<section><h2>Workspace modules</h2><p>{caps.specialistWorkspace?'Your specialist identity is currently authorized.':'Specialist functionality requires current, unexpired administrator authorization.'}</p>
     <ul><li>My assigned reviews — unavailable until Phase 3C</li><li>Review queue — unavailable until Phase 3C</li><li>Safety analytics — planned Phase 3E</li><li>Evidence intelligence — planned Phase 3F</li></ul><p>No patient records are requested or displayed in this workspace.</p></section>}
   </>}
  </>}
  <md-dialog class="specialist-dialog" ref={dialog} quick={matchMedia('(prefers-reduced-motion: reduce)').matches||undefined} aria-label={`Confirm ${action.replaceAll('_',' ')}`}>
   <div slot="headline">Confirm {action.replaceAll('_',' ')}</div><div slot="content">
   <p>Application {application?.id.slice(0,8)} · version {application?.version}. This changes prototype identity authorization only.</p>
   <M3TextField label="Decision reason" value={reason} maxLength={300} onChange={e=>setReason(e.target.value)} disabled={busy}/>
   <M3TextField label="Synthetic verification evidence reference" value={evidence} maxLength={200} onChange={e=>setEvidence(e.target.value)} disabled={busy}/>
   <M3Checkbox label="I independently reviewed this fictional application and confirm this decision" checked={affirm} onChange={setAffirm}/>
   {error&&<p role="alert">{error}</p>}</div>
   <div slot="actions" className="specialist-actions"><M3Button variant="text" disabled={busy} onClick={()=>void dialog.current?.close()}>Cancel</M3Button>
    <M3Button disabled={busy||!affirm||!reason.trim()||(['approve','renew'].includes(action)&&!evidence.trim())} onClick={approve}>Confirm decision</M3Button></div>
  </md-dialog>
 </section>;
}
