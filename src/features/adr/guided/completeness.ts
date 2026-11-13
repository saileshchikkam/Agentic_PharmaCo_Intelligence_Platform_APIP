import {questions,validateValue,type GuidedCase} from './domain';
export type CompletionItem={key:string;label:string;step:number};
export function patientCompleteness(c:GuidedCase){
 const fields=questions(c),completedRequired:CompletionItem[]=[],missingRequired:CompletionItem[]=[],invalidValues:CompletionItem[]=[];
 const item=(key:string,label=fields.find(f=>f.key===key)?.label??key):CompletionItem=>({key,label,step:fields.find(f=>f.key===key)?.stage??3});
 const provided=(key:string)=>{const v=c.values[key];return v?.state==='provided'&&!!v.confirmedAt&&Number.isFinite(Date.parse(v.confirmedAt))&&typeof v.value==='string'&&!!v.value.trim();};
 const valid=(key:string)=>{const f=fields.find(f=>f.key===key);return provided(key)&&!!f&&validateValue(f,c.values[key].value);};
 for(const f of fields){if(c.values[f.key]?.state==='provided'&&(!provided(f.key)||!validateValue(f,c.values[f.key].value)))invalidValues.push(item(f.key));}
 const require=(key:string,ok:boolean,label?:string)=>{(ok?completedRequired:missingRequired).push(item(key,label));};
 const initials=c.values.initials?.value??'';
 const validInitials=valid('initials')&&/^[\p{L}\p{M} .'-]{1,12}$/u.test(initials)&&initials.trim().split(/[ .'-]+/).every(s=>Array.from(s).length<=3);
 if(provided('initials')&&!validInitials)invalidValues.push(item('initials','Enter patient initials, not a full name'));
 require('initials',validInitials);
 require('age',valid('age')||valid('dob'),'Age at reaction onset or date of birth');
 require('reaction',valid('reaction'));require('reactionStart',valid('reactionStart'));
 const medicines=c.medications.filter(m=>m.kind==='suspect');const medicine=medicines.find(m=>valid(`med.${m.id}.name`));
 require(medicine?`med.${medicine.id}.name`:medicines[0]?`med.${medicines[0].id}.name`:'suspectMedicine',!!medicine,'At least one named suspected medicine');
 require('reporterName',valid('reporterName'));
 const contact=valid('address')||(valid('email')&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.values.email.value!))||(valid('phone')&&/^\+?[0-9 ()-]{7,24}$/.test(c.values.phone.value!)&&c.values.phone.value!.replace(/\D/g,'').length>=7&&c.values.phone.value!.replace(/\D/g,'').length<=15);
 require('email',contact,'Reporter contact: email, phone or address');
 for(const [start,stop] of [['reactionStart','reactionStop'],...c.medications.map(m=>[`med.${m.id}.start`,`med.${m.id}.stop`])])if(valid(start)&&valid(stop)&&c.values[start].value!>c.values[stop].value!)invalidValues.push(item(stop,'Stop date precedes start date'));
 const requiredKeys=new Set([...completedRequired,...missingRequired].map(x=>x.key));
 const optionalUnknownFields=fields.filter(f=>!requiredKeys.has(f.key)&&c.values[f.key]?.state==='unknown'&&c.values[f.key]?.confirmedAt).map(f=>item(f.key));
 return {ready:missingRequired.length===0&&invalidValues.length===0,revision:c.revision,completedRequired,missingRequired,invalidValues,optionalUnknownFields};
}
