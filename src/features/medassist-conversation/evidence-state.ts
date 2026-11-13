import type { Answer } from '../model-a-research/contracts';
import type { ProposalSource, PendingProposal } from './pending-proposal';
import type { NaturalVocabulary } from './natural';
import { languageConcepts } from './concepts';
import { reportClauses, reportsResolution } from './language-context';

export type ContextUpdate = {
 request_id:string; text:string; quote:string; evidence_id:string;
 kind:'reported_resolution'|'retraction_or_attribution';
 status:'unresolved'|'reconciled_by_confirmation';
 accepted_affected:boolean; held_sources:ProposalSource[]; reconciled_by?:string[];
};
/** Context changes are not new negative or UNKNOWN answers. */
export function contextUpdates(text:string, requestId:string, vocabulary:NaturalVocabulary, pending:PendingProposal|null, accepted:Answer[]):ContextUpdate[]{
 const allowed=new Set(vocabulary.items.map(i=>i.evidence_id));
 const known=new Set([...accepted,...(pending?.sources.flatMap(s=>s.proposal.observations)??[])].map(i=>i.evidence_id));
 const updates:ContextUpdate[]=[];
 for(const clause of reportClauses(text)){
  const retract=/^(?:actually[,\s]*)?(?:scratch that|i take that back|that was (?:my|another)\b)/i.test(clause.quote);
  if(!['current','historical_or_resolved'].includes(clause.context) &&
    !(clause.context==='other_person'&&/^that was (?:my|another)\b/i.test(clause.quote)))continue;
  const resolved=reportsResolution(clause.quote);
  if(!resolved&&!retract)continue;
  // Explicit old episodes must not silently cancel a separately current episode.
  if(/\b(?:last (?:year|week)|yesterday|childhood|used to)\b/i.test(clause.quote))continue;
  let ids=languageConcepts.filter(c=>allowed.has(c.evidence_id)&&c.pattern.test(clause.quote)).map(c=>c.evidence_id);
  if(!ids.length&&(retract||/^(?:it|they|that|this|those|these)\s+(?:has|have|is|are|stopped|resolved|went)/i.test(clause.quote)))ids=[...known];
  for(const id of ids.filter(id=>known.has(id))){
   if(updates.some(u=>u.evidence_id===id))continue;
   updates.push({request_id:requestId,text,quote:clause.quote,evidence_id:id,kind:resolved?'reported_resolution':'retraction_or_attribution',status:'unresolved',
    accepted_affected:accepted.some(a=>a.evidence_id===id),
    held_sources:pending?.sources.filter(s=>s.proposal.observations.some(o=>o.evidence_id===id))??[]});
  }
 }
 return updates;
}
export function holdPending(pending:PendingProposal|null, updates:ContextUpdate[]):PendingProposal|null{
 if(!pending||!updates.length)return pending;
 const ids=new Set(updates.map(u=>u.evidence_id));
 const trim=(s:ProposalSource):ProposalSource=>({...s,proposal:{...s.proposal,observations:s.proposal.observations.filter(o=>!ids.has(o.evidence_id))}});
 const sources=pending.sources.map(trim).filter(s=>s.proposal.observations.length);
 const alternative=pending.alternative?trim(pending.alternative):undefined;
 if(!sources.length&&!alternative?.proposal.observations.length)return null;
 return {sources,...(alternative?.proposal.observations.length?{alternative}:{})};
}
export function reconcilePendingUpdates(updates:ContextUpdate[], sources:ProposalSource[]):ContextUpdate[]{
 return updates.map(u=>{
  if(u.status!=='unresolved'||u.accepted_affected)return u;
  const confirmations=sources.filter(s=>s.requestId!==u.request_id&&!u.held_sources.some(held=>held.requestId===s.requestId)&&s.proposal.observations.some(o=>o.evidence_id===u.evidence_id&&o.state!=='contradiction'));
  return confirmations.length?{...u,status:'reconciled_by_confirmation' as const,reconciled_by:confirmations.map(s=>s.requestId)}:u;
 });
}
export const acceptedUpdateBlocked=(updates:ContextUpdate[])=>updates.some(u=>u.status==='unresolved'&&u.accepted_affected);
export function canConfirmPending(pending:PendingProposal|null,updates:ContextUpdate[]){
 return !!pending&&!pending.alternative&&!acceptedUpdateBlocked(updates)&&!pending.sources.some(s=>s.proposal.observations.some(o=>
  updates.some(u=>u.status==='unresolved'&&u.evidence_id===o.evidence_id&&u.held_sources.some(held=>held.requestId===s.requestId))));
}
export function currentEvidence<T extends {items:{evidence_id:string}[]}>(accepted:T, updates:ContextUpdate[]):T{
 const held=new Set(updates.filter(u=>u.status==='unresolved').map(u=>u.evidence_id));
 return {...accepted,items:accepted.items.filter(i=>!held.has(i.evidence_id))};
}
export function updateNotice(updates:ContextUpdate[]){
 const held=[...new Set(updates.filter(u=>u.status==='unresolved').map(u=>u.evidence_id))];
 if(!held.length)return null;
 const names=held.map(id=>languageConcepts.find(c=>c.evidence_id===id)?.canonical??'a symptom').join(', ');
 return 'Newer wording needs clarification for '+names+'. Earlier proposals are held out of current evidence; no absence was inferred. Original statements and accepted history are kept.'+
 (acceptedUpdateBlocked(updates)?' This session is blocked. Restart with clarified current details.':' Describe the current state explicitly to propose a replacement, or continue with unrelated details.');
}
