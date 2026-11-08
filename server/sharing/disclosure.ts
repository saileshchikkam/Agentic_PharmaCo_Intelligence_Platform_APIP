import {createHash} from 'node:crypto';
import {missing,questions,chronology,type GuidedCase} from '../../src/features/adr/guided/domain';
import {sharingPolicyVersion} from './policy';

const personal=new Set(['initials','age','dob','gender','weight','reporterName','address','pin','email','phone','occupation']);
export type Disclosure={policyVersion:string;caseId:string;revision:number;fields:{key:string;label:string;state:'provided'|'unknown';value:string|null;personal:boolean}[];statements:string[];warnings:string[];pdfNotice:string;digest:string};
// Fail closed if the saved payload cannot be faithfully described. Never turn a
// consent projection into an edited replacement for the immutable original PDF.
export function prepareDisclosure(c:GuidedCase):Disclosure{
 if(c.fictionalOnly!==true||!Number.isSafeInteger(c.revision)||c.revision<1)throw Error('SAVED_FICTIONAL_REVISION_REQUIRED');
 if(missing(c).length)throw Error('INTAKE_INCOMPLETE');
 const known=new Map(questions(c).map(f=>[f.key,f]));
 const fields:Disclosure['fields']=[];
 for(const [key,value] of Object.entries(c.values)){
  const f=known.get(key);
  if(!f||!value.confirmedAt||!['provided','unknown'].includes(value.state))throw Error('DISCLOSURE_MISMATCH');
  if(value.state==='provided'&&(typeof value.value!=='string'||!value.value.trim()))throw Error('DISCLOSURE_MISMATCH');
  if(value.state==='unknown'&&value.value!==null)throw Error('DISCLOSURE_MISMATCH');
  // Reserved registration identifiers must not reach a sharing continuation.
  if(key==='registration'&&value.state==='provided')throw Error('RESERVED_FIELD_REQUIRES_CORRECTION');
  fields.push({key,label:f.label,state:value.state,value:value.value,personal:personal.has(key)});
 }
 fields.sort((a,b)=>a.key.localeCompare(b.key,'en'));
 const content={policyVersion:sharingPolicyVersion,caseId:c.id,revision:c.revision,fields,
  statements:c.statements.map(s=>s.text),warnings:chronology(c),
  pdfNotice:'The assigned specialist may preview the original PvPI form for this exact saved revision, including disclosed personal/contact information and continuation pages. Preview transfers PDF bytes; copying cannot be prevented and delivered copies cannot be recalled. No separate specialist download action is enabled.'};
 return {...content,digest:createHash('sha256').update(JSON.stringify(content)).digest('hex')};
}
