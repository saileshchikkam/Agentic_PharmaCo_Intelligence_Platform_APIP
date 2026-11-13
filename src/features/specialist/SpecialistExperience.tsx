import {AssignmentCount} from './SharingWorkspace';
import {FileText,ClipboardList,Sparkles,UserRound,ShieldCheck} from 'lucide-react';
import {M3Button,M3Select,M3TextField} from '../../components/material/core';
import {navigatePreview} from '../access/navigation';
import {categories,type Application,type ProfessionalProfile} from '../../../server/specialist/domain';
export type SpecialistView='entry'|'profile'|'home'|'reviews';
export type SpecialistCapabilities={specialistWorkspace:boolean;identityAdministration:boolean};
const fields:Record<keyof ProfessionalProfile,string>={fullName:'Full name',category:'Professional category',qualification:'Qualification',registration:'Professional registration reference (if applicable)',organization:'Organization or institution',department:'Department or professional role',jurisdiction:'Registration jurisdiction',experience:'Pharmacovigilance experience',specialization:'Specialization'};
export function verificationStatus(application:Application|null,authorized:boolean){
 const state=application?.state;
 if(state==='APPROVED'&&!authorized)return {label:'Review access unavailable',description:'Your professional authorization is not currently active. Contact the identity administrator.'};
 const text:Record<string,{label:string;description:string}>={
  DRAFT:{label:'Draft profile',description:'Save your details, then submit your profile for review.'},
  SUBMITTED:{label:'Awaiting verification',description:'Your profile has been submitted. Review access remains restricted until an administrator approves your application.'},
  PENDING_VERIFICATION:{label:'Verification in progress',description:'An administrator is reviewing your application. You can continue using your own reporting tools.'},
  APPROVED:{label:'Review access approved',description:'Your identity approval is active in this development environment. Case access still requires an authorized assignment.'},
  REJECTED:{label:'Application not approved',description:'Your application was not approved. See your application activity or contact the identity administrator. Resubmission is not currently available.'},
  SUSPENDED:{label:'Review access suspended',description:'Professional review access is suspended. Contact the identity administrator for information.'},
  REVOKED:{label:'Review access revoked',description:'Professional review access has been revoked. Your own reporting tools remain available.'},
  EXPIRED:{label:'Verification expired',description:'Your authorization has expired. An administrator must review and explicitly renew it.'},
 };
 return state?text[state]:{label:'Complete your profile',description:'Introduce your professional background to begin the verification process.'};
}
type Props={owner:string;view:SpecialistView;application:Application|null;profile:ProfessionalProfile;caps:SpecialistCapabilities|null;loaded:boolean;error:string;busy:boolean;dirty:boolean;onChange:(key:keyof ProfessionalProfile,value:string)=>void;onSave:()=>void;onSubmit:()=>void;onRetry:()=>void};
export function SpecialistExperience({owner,view,application,profile,caps,loaded,error,busy,dirty,onChange,onSave,onSubmit,onRetry}:Props){
 const status=verificationStatus(application,!!caps?.specialistWorkspace),editable=!application||application.state==='DRAFT';
 const dashboard=view==='home',reviews=view==='reviews';
 const field=(key:keyof ProfessionalProfile)=>key==='category'?<M3Select key={key} label={fields[key]} value={profile.category} disabled={!editable||busy} onChange={value=>onChange(key,value)} options={categories.map(value=>({value,label:value}))}/>:<M3TextField key={key} label={fields[key]} value={profile[key]} maxLength={300} readOnly={!editable} disabled={busy} required={key==='fullName'||key==='qualification'} onChange={e=>onChange(key,e.target.value)}/>;
 return <section className="specialist-workspace specialist-experience" aria-labelledby="specialist-title">
  <div className="specialist-topline"><span className="access-eyebrow">SPECIALIST WORKSPACE</span>
   {view==='profile'&&application&&application.state!=='DRAFT'?<M3Button variant="text" onClick={()=>navigatePreview('/specialist/home')}>Back to workspace</M3Button>:dashboard||reviews?<M3Button variant="text" onClick={()=>navigatePreview(reviews?'/specialist/home':'/specialist/profile')}>{reviews?'Back to workspace':'Professional profile'}</M3Button>:null}</div>
  <header className="specialist-intro"><h1 id="specialist-title" tabIndex={-1}>{dashboard?'Your Pharmacovigilance Workspace':reviews?'Pending Review Reports':'Your professional profile'}</h1>
   <p>{dashboard?'Report adverse drug reactions, manage your reports, and review assigned patient cases when authorized.':reviews?'A private workspace for reports assigned to you.':'Tell us about your professional background. Your details will be reviewed before professional access is granted.'}</p></header>
  {error&&<div className="specialist-notice" role="alert"><p>{error}</p><M3Button variant="outlined" disabled={busy} onClick={onRetry}>Retry connection</M3Button></div>}
  {!loaded?<p role="status">Loading your workspace…</p>:caps&&<>
   <div className="specialist-verification" role="status"><ShieldCheck size={22} aria-hidden="true"/><div><strong>{status.label}</strong><p>{status.description}</p></div></div>
   {dashboard&&application&&application.state!=='DRAFT'?<div className="specialist-service-grid" aria-label="Specialist services">
    <article className="specialist-service"><span className="specialist-service-icon"><Sparkles aria-hidden="true"/></span><h2>Medical Assistant AI</h2><p>Access the existing MedAssist workspace.</p><p className="specialist-card-detail">Explore the current support experience within its existing safety limits.</p><M3Button variant="outlined" onClick={()=>navigatePreview('/preview/medassist')}>Open MedAssist</M3Button></article>
    <article className="specialist-service"><span className="specialist-service-icon"><FileText aria-hidden="true"/></span><h2>ADR Reporting</h2><p>Create and manage ADR reports.</p><p className="specialist-card-detail">Resume your own reports, review saved revisions and download the original PvPI form.</p><M3Button variant="outlined" onClick={()=>navigatePreview('/patient/adr/cases')}>Open my reports</M3Button></article>
    <article className="specialist-service"><span className="specialist-service-icon"><ClipboardList aria-hidden="true"/></span><h2>Patient ADR Reviews</h2><p>Review assigned ADR cases.</p><p className="specialist-card-detail">{caps.specialistWorkspace?'Only reports explicitly shared and assigned to you are available.':'Review access requires current, active specialist approval.'}</p>{caps.specialistWorkspace&&<AssignmentCount owner={owner}/>}<M3Button variant="outlined" disabled={!caps.specialistWorkspace} onClick={()=>navigatePreview('/specialist/reviews')}>{caps.specialistWorkspace?'Open review inbox':'Review access restricted'}</M3Button></article>
   </div>:reviews?<section className="specialist-inbox"><ClipboardList size={40} aria-hidden="true"/><h2>{caps.specialistWorkspace?'Your review inbox is not connected yet':'Review access restricted'}</h2><p>{caps.specialistWorkspace?'Patient consent and assignment are required before a report can appear here. Case sharing is not enabled in this environment.':'Pending, expired, suspended or revoked accounts cannot review patient reports.'}</p><M3Button variant="outlined" onClick={()=>navigatePreview('/specialist/home')}>Return to workspace</M3Button></section>:<form className="specialist-profile specialist-profile-page" onSubmit={e=>{e.preventDefault();onSave();}}>
    <div className="specialist-form-heading"><UserRound size={24} aria-hidden="true"/><div><h2>Professional details</h2><p>{editable?'Use the details you want the reviewer to consider.':'Submitted details are read-only. Your application record is preserved.'}</p></div></div>
    <div className="specialist-fields">{(['fullName','category','qualification','registration','organization','department'] as (keyof ProfessionalProfile)[]).map(field)}</div>
    <details className="specialist-additional"><summary>Additional professional details <span>Optional</span></summary><div className="specialist-fields">{(['jurisdiction','experience','specialization'] as (keyof ProfessionalProfile)[]).map(field)}</div></details>
    {editable&&<div className="specialist-actions"><M3Button type="submit" disabled={busy||!profile.fullName.trim()||!profile.qualification.trim()}>Save profile</M3Button><M3Button variant="outlined" disabled={busy||dirty||!application} onClick={onSubmit}>Submit profile</M3Button><span className="specialist-save-hint" role="status">{dirty?'Unsaved changes':application?'Profile saved':'Save your profile before submitting.'}</span></div>}
    {!!application?.decisions.length&&<details className="specialist-additional"><summary>Application activity</summary><ol className="specialist-activity">{application.decisions.map(d=><li key={d.id}><strong>{d.action.replaceAll('_',' ')}</strong><p>{d.reason}</p><time>{new Date(d.at).toLocaleDateString()}</time></li>)}</ol></details>}
   </form>}
   {dashboard&&caps.identityAdministration&&<M3Button variant="text" onClick={()=>navigatePreview('/admin/specialist-applications')}>Identity administration</M3Button>}
  </>}
 </section>;
}
