import React,{useEffect,useRef,useState} from 'react';
import {M3Button} from '../../../components/material/core';
import type {GuidedCase} from './domain';
export function ReportExport({c,owner,edit}:{c:GuidedCase;owner:string;edit:()=>void}){
 const [url,setUrl]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[reveal,setReveal]=useState(false),[reduced,setReduced]=useState(false);
 const active=useRef<AbortController|null>(null),objectUrl=useRef('');
 useEffect(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)');const sync=()=>{setReduced(media.matches);if(media.matches)setReveal(false);};sync();media.addEventListener('change',sync);return()=>media.removeEventListener('change',sync);},[]);
 useEffect(()=>{setUrl('');setError('');setBusy(false);return()=>{active.current?.abort();if(objectUrl.current){URL.revokeObjectURL(objectUrl.current);objectUrl.current='';}};},[c.id,c.revision,owner]);
 const generate=async()=>{
  if(busy)return;const controller=new AbortController();active.current=controller;setBusy(true);setError('');
  try{const response=await fetch(`/api/account/adr-guided/${c.id}/pdf`,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-APIP-Account':owner},body:JSON.stringify({expectedRevision:c.revision}),signal:controller.signal});
   if(!response.ok){const data=await response.json();throw Error(({PDF_SELECT_ONE_SERIOUSNESS:'The official form requests one seriousness category. Please review your selected categories.',PDF_UNSUPPORTED_SCRIPT:'This PDF font does not support some characters in this case. Your saved text is preserved; export needs a supported-font implementation.',PDF_RUNTIME_DEPENDENCIES_MISSING:'The configured Python environment is missing the pinned PDF packages. Install server/adr/requirements-pdf.txt and set APIP_PDF_PYTHON to that interpreter, then retry.',REVISION_CONFLICT:'The case changed. Reopen its latest version and regenerate.'} as Record<string,string>)[data.error]||'The PDF could not be generated. Check the PDF runtime setup and retry.');}
   const blob=await response.blob();if(controller.signal.aborted)return;
   if(objectUrl.current)URL.revokeObjectURL(objectUrl.current);const next=URL.createObjectURL(blob);objectUrl.current=next;setUrl(next);setReveal(!reduced);
  }catch(e){if(!controller.signal.aborted)setError((e as Error).message);}finally{if(!controller.signal.aborted)setBusy(false);}
 };
 return <section aria-label="Official form export" className="adr-export"><h3>PvPI reporting form</h3><p>Generate the original Version 1.4 form from confirmed answers. Missing facts stay blank. Continuation pages are added only when confirmed details need extra space. Review before use. Nothing is submitted.</p>
 <div className="adr-actions"><M3Button disabled={busy} onClick={generate}>{url?'Regenerate PDF':'Generate official PDF'}</M3Button><M3Button variant="text" disabled={busy} onClick={edit}>Edit details</M3Button>{url&&<a className="adr-download" href={url} download={`APIP-PvPI-${c.id}-r${c.revision}.pdf`}>Download PDF</a>}</div>
 {busy&&<p role="status">Building your PDF…</p>}{error&&<p role="alert" className="adr-error">{error}</p>}
 {url&&<><p role="status">PDF ready · saved revision {c.revision}. Download is available now. PDF-only changes do not update your APIP case.</p>{reveal&&<M3Button variant="text" onClick={()=>setReveal(false)}>Skip animation</M3Button>}<div className={`adr-report-frame ${reveal?'revealing':''}`} onAnimationEnd={()=>setReveal(false)}><iframe src={url} title="Generated official PvPI form"/><div className="adr-report-scan" aria-hidden="true"><span>+</span></div></div><a href={url} target="_blank" rel="noopener">Open PDF in a separate viewer</a></>}
 </section>;
}
