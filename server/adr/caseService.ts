import { randomUUID } from 'node:crypto';
import { questions, validateValue, type GuidedCase } from '../../src/features/adr/guided/domain';
import { checkedProposals, type IntakeProvider } from './provider';

export const exact=(v:any,keys:string[])=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join()===keys.sort().join();
export async function applyCaseCommand(c: GuidedCase, cmd: any, provider: IntakeProvider | null) {
  let valid = false;
  if(exact(cmd,['type','key','value'])&&cmd.type==='confirm'){
   const f=questions(c).find(f=>f.key===cmd.key);if(f&&validateValue(f,cmd.value)){
    const id=randomUUID(),at=new Date().toISOString();c.statements.push({id,text:cmd.value??'Unknown / not available',at});c.values[f.key]={state:cmd.value===null?'unknown':'provided',value:cmd.value,confirmedAt:at,source:'manual',statementId:id};c.proposals=[];valid=true;
   }
  }else if(exact(cmd,['type','kind'])&&cmd.type==='add_medication'&&['suspect','concomitant'].includes(cmd.kind)&&c.medications.length<20){c.medications.push({id:randomUUID(),kind:cmd.kind});c.proposals=[];valid=true;
  }else if(exact(cmd,['type','text'])&&cmd.type==='describe'&&typeof cmd.text==='string'&&cmd.text.trim()&&cmd.text.length<=4000){

   c.statements.push({id:randomUUID(),text:cmd.text,at:new Date().toISOString()});c.proposals=[];c.providerStatus='manual_required';
   if(provider){try{c.proposals=checkedProposals(await provider(cmd.text,c),cmd.text,c).map(p=>({...p,id:randomUUID()}));c.providerStatus='proposals_ready';}catch{c.providerStatus='unavailable_or_invalid';}}
   valid=true;
  }else if(exact(cmd,['type','proposalId','accept'])&&cmd.type==='proposal'&&typeof cmd.accept==='boolean'){
   const p=c.proposals.find(p=>p.id===cmd.proposalId);if(p){if(cmd.accept){c.values[p.key]={state:'provided',value:p.value,confirmedAt:new Date().toISOString(),source:'proposal',statementId:c.statements[c.statements.length-1].id};}c.proposals=c.proposals.filter(x=>x.id!==p.id);valid=true;}
  }
  if (!valid) throw Error('INVALID_COMMAND');
}
