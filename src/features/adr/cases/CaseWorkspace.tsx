import { useEffect, useRef, useState, type FormEvent } from 'react';
import { M3Button, M3Select, M3TextField } from '../../../components/material/core';
import { guidedAccountHeaders } from '../../account/client';
import { navigatePreview } from '../../access/navigation';
import { DraftPreview } from '../guided/GuidedWorkspace';
import { LiveFormPreview } from '../guided/LiveFormPreview';
import type { GuidedCase } from '../guided/domain';
import { defaultFilters, type CaseFilters, type CasePage, type RevisionDescriptor, type CaseCard } from './contracts';
import '../guided/guided.css';
import './cases.css';

const listPath='/patient/adr/cases';
const date=(value:string)=>new Intl.DateTimeFormat(undefined,{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));
const messages:Record<string,string>={NOT_FOUND:'This report is unavailable in your account.',SIGN_IN_REQUIRED:'Please sign in again to open your reports.',
  ACCOUNT_CHANGED:'Your account changed. Reopen My ADR Reports.',INVALID_CURSOR:'This results page has expired. Return to the first page.',
  INVALID_FILTER:'Check the filters and date range.',PDF_BUSY:'The form service is busy. Please retry.'};
async function request(owner:string,path:string,signal:AbortSignal){
  const response=await fetch('/api/account/adr-cases'+path,{headers:await guidedAccountHeaders(owner),credentials:'same-origin',cache:'no-store',signal});
  const data=await response.json();
  if(!response.ok)throw Error(messages[data.error]??'Your reports could not be loaded. Please retry.');
  return data;
}
function useResource<T>(owner:string,path:string){
  const [data,setData]=useState<T|null>(null),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
  useEffect(()=>{
    const controller=new AbortController();setData(null);setError('');
    void request(owner,path,AbortSignal.any([controller.signal,AbortSignal.timeout(20000)]))
      .then(value=>{if(!controller.signal.aborted)setData(value);},e=>{if(!controller.signal.aborted)setError(e.message);});
    return()=>controller.abort();
  },[owner,path,attempt]);
  return {data,error,retry:()=>setAttempt(n=>n+1)};
}
function Notice({error,retry}:{error:string;retry:()=>void}){
  return error?<div role="alert"><p>{error}</p><M3Button variant="outlined" onClick={retry}>Retry</M3Button></div>:<p role="status">Loading your saved reports…</p>;
}
function Select({label,value,values,onChange}:{label:string;value:string;values:[string,string][];onChange:(s:string)=>void}){
  return <M3Select label={label} value={value} onChange={onChange} options={values.map(([value,label])=>({value,label}))}/>;
}
function Card({c}:{c:CaseCard}){
  return <li className="adr-case-card"><div><p className="adr-eyebrow">PRIVATE REPORT · {c.caseType??'Type not provided'}</p>
    <h2>Report {c.id.slice(0,8)}</h2><p>{c.medicines.join(' · ')||'Medicine not confirmed'}</p></div>
    <dl><div><dt>Status</dt><dd>Draft{c.intakeComplete?' · intake checklist complete':''}</dd></div>
      <div><dt>Saved revision</dt><dd>{c.revision}</dd></div><div><dt>Created</dt><dd>{date(c.createdAt)}</dd></div>
      <div><dt>Updated</dt><dd>{date(c.updatedAt)}</dd></div></dl>
    <div className="adr-actions"><M3Button onClick={()=>navigatePreview(`${listPath}/${c.id}`)}>View report</M3Button>
      <M3Button variant="outlined" onClick={()=>navigatePreview(`/preview/adr-report?case=${c.id}`)}>Continue reporting</M3Button>
      <M3Button variant="text" onClick={()=>navigatePreview(`${listPath}/${c.id}/history`)}>View history</M3Button></div></li>;
}
export function CaseWorkspace({owner,id,revision,history=false}:{owner:string;id?:string;revision?:number;history?:boolean}){
  return id?<CaseDetail key={`${owner}/${id}/${revision??'latest'}/${history}`} owner={owner} id={id} revision={revision} history={history}/>:<CaseList owner={owner}/>;
}
function CaseList({owner}:{owner:string}){
  const initial=window.history.state?.adrCaseFilters;
  const [filters,setFilters]=useState<CaseFilters>(()=>initial?.owner===owner?{...defaultFilters,...initial.filters}:defaultFilters);
  const [applied,setApplied]=useState(filters),[cursor,setCursor]=useState(''),[trail,setTrail]=useState<string[]>([]);
  const params=new URLSearchParams(Object.entries(applied).map(([k,v])=>[k,String(v)]));
  if(cursor)params.set('cursor',cursor);
  const {data,error,retry}=useResource<CasePage>(owner,'?'+params);
  const heading=useRef<HTMLHeadingElement>(null);
  useEffect(()=>{heading.current?.focus();},[cursor]);
  const change=(key:keyof CaseFilters,value:string)=>setFilters(old=>({...old,[key]:value}));
  const apply=(e:FormEvent)=>{e.preventDefault();setApplied(filters);setCursor('');setTrail([]);
    window.history.replaceState({...window.history.state,adrCaseFilters:{owner,filters}},'');};
  return <section className="adr-cases" aria-labelledby="adr-cases-title"><div className="adr-cases-heading">
    <div><p className="adr-eyebrow">YOUR PRIVATE REPORTS</p><h1 id="adr-cases-title" tabIndex={-1} ref={heading}>My ADR Reports</h1>
      <p>Continue reporting, check saved versions and download your original PvPI form.</p></div>
    <M3Button onClick={()=>navigatePreview('/preview/adr-report')}>Create new ADR report</M3Button></div>
    <p className="adr-case-note">Fictional details only. Drafts stay private. Downloading a form does not submit it for review or to the government.</p>
    <form className="adr-case-filters" onSubmit={apply} aria-label="Filter your reports">
      <M3TextField label="Search case reference or medicine" type="search" value={filters.q} maxLength={100} onChange={e=>change('q',e.target.value)}/>
      <M3TextField label="Medicine name" value={filters.medicine} maxLength={100} onChange={e=>change('medicine',e.target.value)}/>
      <Select label="Intake status" value={filters.status} onChange={v=>change('status',v)} values={[
        ['all','All drafts'],['draft','Checklist incomplete'],['intake_complete','Checklist complete']]}/>
      <Select label="Report type" value={filters.caseType} onChange={v=>change('caseType',v)} values={[
        ['all','All types'],['Initial','Initial'],['Follow-up','Follow-up']]}/>
      <details className="adr-case-more"><summary>Date and sort options</summary><div className="adr-case-filter-grid">
        <Select label="Filter date" value={filters.dateField} onChange={v=>change('dateField',v)} values={[
          ['updated','Last updated'],['created','Created'],['reported','Confirmed report date']]}/>
        <label>From<input type="date" value={filters.from} onChange={e=>change('from',e.target.value)}/></label>
        <label>To<input type="date" value={filters.to} onChange={e=>change('to',e.target.value)}/></label>
        <Select label="Sort by" value={filters.sort} onChange={v=>change('sort',v)} values={[
          ['updated','Last updated'],['created','Created']]}/>
        <Select label="Order" value={filters.direction} onChange={v=>change('direction',v)} values={[
          ['desc','Newest first'],['asc','Oldest first']]}/></div></details>
      <div className="adr-actions"><M3Button type="submit">Apply filters</M3Button><M3Button variant="text" onClick={()=>{
        setFilters(defaultFilters);setApplied(defaultFilters);setCursor('');setTrail([]);
        window.history.replaceState({...window.history.state,adrCaseFilters:undefined},'');}}>Clear filters</M3Button></div>
    </form>
    {!data?<><Notice error={error} retry={retry}/>{error&&cursor&&<M3Button variant="text" onClick={()=>{setCursor('');setTrail([]);}}>Return to first page</M3Button>}</>:<><p role="status">{data.cases.length} reports on this page</p>
      {!data.cases.length?<div className="adr-case-empty"><h2>{applied.q||applied.medicine||applied.status!=='all'||applied.caseType!=='all'||applied.from||applied.to?'No reports match these filters':'No saved reports yet'}</h2><p>Change the filters or create a fictional ADR report to get started.</p></div>
        :<ul className="adr-case-list">{data.cases.map(c=><Card key={c.id} c={c}/>)}</ul>}
      <nav className="adr-actions" aria-label="Report result pages"><M3Button variant="outlined" disabled={!trail.length} onClick={()=>{
        setCursor(trail.at(-1)!);setTrail(trail.slice(0,-1));}}>Previous page</M3Button>
        <M3Button variant="outlined" disabled={!data.nextCursor} onClick={()=>{setTrail([...trail,cursor]);setCursor(data.nextCursor!);}}>Next page</M3Button></nav></>}
  </section>;
}
function CaseDetail({owner,id,revision,history}:{owner:string;id:string;revision?:number;history:boolean}){
  const path=`/${id}${revision?`/revisions/${revision}`:''}`;
  const {data,error,retry}=useResource<{case:GuidedCase;summary?:CaseCard;savedAt?:string}>(owner,path);
  const [before,setBefore]=useState(501),[trail,setTrail]=useState<number[]>([]);
  const versions=useResource<{versions:RevisionDescriptor[];nextBefore:number|null}>(owner,`/${id}/revisions?limit=10&before=${before}`);
  if(!data)return <Notice error={error} retry={retry}/>;
  const c=data.case;
  return <section className="adr-cases"><p className="adr-eyebrow">PRIVATE · {revision?'READ-ONLY SAVED VERSION':'DRAFT'}</p>
    <h1 tabIndex={-1}>Report {id.slice(0,8)}{history?' · revision history':''}</h1>
    <p>Saved revision {c.revision} · {date(data.savedAt??c.updatedAt)}</p>
    {data.summary&&<p>Created {date(data.summary.createdAt)} · {data.summary.medicines.join(' · ')||'Medicine not confirmed'}</p>}
    <p>{revision?'This is an immutable saved version. Editing opens the latest report; it cannot overwrite this version.':'Patient draft. Specialist review and sharing are not enabled.'}</p>
    <div className="adr-actions"><M3Button onClick={()=>navigatePreview(`/preview/adr-report?case=${id}`)}>Edit latest report</M3Button>
      <M3Button variant="outlined" onClick={()=>navigatePreview(`${listPath}/${id}/history`)}>Revision history</M3Button>
      <M3Button variant="text" onClick={()=>navigatePreview(listPath)}>My ADR Reports</M3Button></div>
    {history?<section aria-label="Saved revisions"><h2>Revision history</h2>
      {!versions.data?<Notice error={versions.error} retry={versions.retry}/>:<><ol className="adr-revision-list">{versions.data.versions.map(v=><li key={v.revision}>
        <M3Button variant="text" onClick={()=>navigatePreview(`${listPath}/${id}/revisions/${v.revision}`)}>View revision {v.revision}</M3Button><time>{date(v.savedAt)}</time></li>)}</ol>
        <div className="adr-actions"><M3Button variant="outlined" disabled={!trail.length} onClick={()=>{setBefore(trail.at(-1)!);setTrail(trail.slice(0,-1));}}>Newer revisions</M3Button>
          <M3Button variant="outlined" disabled={!versions.data.nextBefore} onClick={()=>{setTrail([...trail,before]);setBefore(versions.data!.nextBefore!);}}>Older revisions</M3Button></div></>}
    </section>:<div className="adr-columns adr-with-form"><section className="adr-question" aria-label="Saved confirmed answers">
      <h2>{revision?'Saved answers':'Latest saved answers'}</h2><DraftPreview c={c} edit={()=>{}} readOnly/>
      <details><summary>Original statements and provenance</summary><p>Statements are preserved separately from confirmed answers. Suggestions are not confirmed facts.</p>
        {c.statements.map(s=><blockquote key={s.id}>{s.text}<footer>{date(s.at)}</footer></blockquote>)}
        <dl>{Object.entries(c.values).map(([key,v])=><div key={key}><dt>{key}</dt><dd>{v.state} · {v.source} · statement {v.statementId} · {date(v.confirmedAt)}</dd></div>)}</dl>
        {!!c.proposals.length&&<section aria-label="Saved unconfirmed suggestions"><h3>Unconfirmed suggestions</h3>
          <p>These are not confirmed facts and are excluded from PDF values.</p>{c.proposals.map(p=><article key={p.id}>
            <h4>{p.key}</h4><p>{p.value}</p><blockquote>{p.quote}</blockquote>{p.conflict&&<p>Conflicts with a saved answer.</p>}
          </article>)}</section>}
      </details></section><LiveFormPreview c={c} owner={owner} historical={!!revision}/></div>}
    <details className="adr-case-policy"><summary>Case management availability</summary><p>Ready confirmation, archive, restore and deletion requests await policy approval (P01, P08, P09, P17). No records are erased or shared here.</p></details>
  </section>;
}
