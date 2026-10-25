/** Page-memory bookkeeping, not medical inference. Never supplies evidence values. */
export type FailureKind = 'unsupported' | 'mapping' | 'duplicate' | 'invalid_output' | 'timeout' | 'provider' | 'quota';
const operational = (kind: FailureKind) => ['invalid_output','timeout','provider','quota'].includes(kind);
function facts(text: string) {
  return new Set(text.toLowerCase().replace(/head\s*ache/g,'headache').replace(/abdominal|belly/g,'stomach')
    .replace(/\b(?:i|have|has|am|a|an|the|my|that|it|is|started|ago|please)\b/g,' ')
    .replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(Boolean));
}
export function conceptKey(text: string, phase: string) {
  const t=text.toLowerCase();
  const concept=/\bhead\s*ache\b/.test(t)?'head-pain':/\b(?:stomach|abdominal|belly)\b.*\bpain\b|\bpain\b.*\b(?:stomach|abdomen|belly)\b/.test(t)?'stomach-pain':null;
  return phase+':'+(concept??[...facts(text)].sort().join(' '));
}
type Entry = { attempts:number; kind:FailureKind; facts:Set<string>; terminalShown:boolean };
export class ClarificationTracker {
  private entries=new Map<string,Entry>();
  check(text:string,phase:string,retry=false):{blocked:boolean;message:string|null} {
    const key=conceptKey(text,phase),entry=this.entries.get(key);
    if(!entry)return {blocked:false,message:null};
    const repeated=[...facts(text)].every(f=>entry.facts.has(f));
    if(entry.attempts<2 && (!repeated || retry&&operational(entry.kind)))return {blocked:false,message:null};
    entry.attempts=Math.min(2,entry.attempts+1);
    if(entry.terminalShown)return {blocked:true,message:null};
    entry.terminalShown=true;
    return {blocked:true,message:operational(entry.kind)
      ? 'This is still a language-service problem. You do not need to rephrase the same symptoms. Your words are kept; try again later, restart, or ask to find care.'
      : 'I have already kept those details. This demo cannot reliably turn them into a supported answer, so I will not ask you to repeat them. You can describe a different symptom, restart, or ask to find care.'};
  }
  fail(text:string,phase:string,kind:FailureKind) {
    const key=conceptKey(text,phase),old=this.entries.get(key);
    const entry:Entry={attempts:Math.min(2,(old?.attempts??0)+1),kind,facts:new Set([...(old?.facts??[]),...facts(text)]),terminalShown:false};
    this.entries.set(key,entry);
    if(entry.attempts>=2){entry.terminalShown=true;return operational(kind)
      ? 'The language service still cannot complete this message. No answers were guessed. Please try later, restart, or ask to find care; repeating the same wording will not help.'
      : 'I cannot reliably map these details within this demo’s supported scope. Your original words are kept. You can describe a different symptom, restart, or ask to find care.';}
    return ({duplicate:'Those details are already recorded. For the current question, choose a shown answer or Not sure. I will not infer an extra answer from repeated wording.',
      unsupported:'I have kept your description, but cannot map it to a supported answer. You can add one new detail or ask to find care.',
      mapping:'I recognize a supported symptom, but could not form a validated answer from that wording. Please clarify once; nothing has been accepted.',
      invalid_output:'The language service returned an answer that failed validation. Nothing was accepted. You can retry once.',
      timeout:'The language service took too long. Your words are kept and accepted answers are unchanged. You can retry once.',
      quota:'The language service is temporarily limited. Your words are kept; wait before retrying. Rephrasing will not resolve a service limit.',
      provider:'The language service is unavailable. Your words are kept; this is not a symptom-coverage finding. You can retry later.'})[kind];
  }
  canRetry(text:string,phase:string){const e=this.entries.get(conceptKey(text,phase));return !!e&&operational(e.kind)&&e.attempts<2;}
  clear(text:string,phase:string){this.entries.delete(conceptKey(text,phase));}
  reset(){this.entries.clear();}
  snapshot(){return [...this.entries].map(([concept,e])=>({concept,attempts:e.attempts,reason:e.kind,terminal:e.terminalShown}));}
}
