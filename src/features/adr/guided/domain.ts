// Provisional intake fields from ADR-1A requirements; NOT an official PDF mapping.
export type Field = { key: string; label: string; stage: number; type?: 'date'|'long'|'number'; options?: string[]; required?: boolean };
const group = (stage: number, entries: [string,string,Field['type']?,string[]?,boolean?][]): Field[] => entries.map(([key,label,type,options,required])=>({key,label,stage,type,options,required}));
export const fields: Field[] = [
 ...group(0,[['caseType','Is this an initial or follow-up report?',undefined,['Initial','Follow-up'],true],['followUp','Previous report reference']]),
 ...group(1,[['initials','Patient initials',undefined,undefined,true],['age','Age at reaction onset (years)','number'],['dob','Date of birth','date'],['gender','Gender',undefined,['Female','Male','Other']],['weight','Weight (kg)','number'],['registration','Registration number']]),
 ...group(2,[['reaction','What reaction or event was noticed?','long',undefined,true],['reactionStart','When did it start?','date'],['reactionStop','When did it stop?','date'],['management','Describe what happened and any management','long'],['seriousness','Reported seriousness (select all that apply)',undefined,['Death','Life threatening','Hospitalization / prolonged hospitalization','Disability','Congenital anomaly','Other medically important condition','None reported']],['outcome','Reported outcome',undefined,['Recovered','Recovering','Not recovered','Fatal','Recovered with sequelae']]]),
 ...group(4,[['history','Relevant medical history','long'],['investigations','Relevant investigations','long'],['reporterName','Reporter name',undefined,undefined,true],['address','Reporter address','long'],['pin','PIN code'],['email','Email'],['phone','Phone'],['occupation','Occupation'],['reportDate','Report date','date'],['signature','Signature status',undefined,['Not signed','Will sign after printing']],['additional','Additional information','long']])
];
export const medicationFields = group(3,[['name','Brand / generic name',undefined,undefined,true],['manufacturer','Manufacturer'],['batch','Batch / lot'],['expiry','Expiry date','date'],['dose','Dose'],['route','Route'],['frequency','Frequency'],['start','Therapy start','date'],['stop','Therapy stop','date'],['indication','Indication'],['action','Action after the reaction'],['rechallenge','What happened after reintroduction?','long']]);
export type Value = { state:'provided'|'unknown'; value:string|null; confirmedAt:string; source:'manual'|'proposal'; statementId:string };
export type Proposal = { id:string; key:string; value:string; quote:string; conflict:boolean };
export type GuidedCase = { schemaVersion:1; id:string; revision:number; fictionalOnly:true; updatedAt:string; values:Record<string,Value>; medications:{id:string;kind:'suspect'|'concomitant'}[]; statements:{id:string;text:string;at:string}[]; proposals:Proposal[]; providerStatus:string };
export const stages = ['Getting started','Patient','Reaction','Medicines','Context & reporter','Review'];
export function questions(c:GuidedCase):Field[] {
 return [...fields.filter(f=>f.key!=='followUp'||c.values.caseType?.value==='Follow-up'),...c.medications.flatMap(m=>medicationFields.filter(f=>m.kind==='suspect'||['name','dose','route','frequency','start','stop','indication'].includes(f.key)).map(f=>({...f,key:`med.${m.id}.${f.key}`,label:`${m.kind==='suspect'?'Suspected':'Concomitant'} medicine · ${f.label}`})))].sort((a,b)=>a.stage-b.stage);
}
export function addressedQuestions(fields: Field[], values: GuidedCase['values']): number {
 return fields.filter(({ key }) => values[key]?.state === 'provided' || values[key]?.state === 'unknown').length;
}
export function missing(c:GuidedCase) { return questions(c).filter(f=>f.required&&c.values[f.key]?.state!=='provided').map(f=>f.key).concat(c.medications.some(m=>m.kind==='suspect')?[]:['suspectMedicine']); }
export function nextQuestion(c:GuidedCase) { return questions(c).find(f=>!c.values[f.key])?.key??null; }
export function validateValue(f:Field,value:unknown):value is string|null {
 if(value===null)return true;
 if(typeof value!=='string'||!value.trim()||value.length>(f.type==='long'?4000:200))return false;
 if(f.options&&! (f.key==='seriousness'?value.split('; ').every(x=>f.options!.includes(x)):f.options.includes(value)))return false;
 if(f.key==='seriousness'&&value.includes('None reported')&&value!=='None reported')return false;
 if(f.type==='number'&&(!/^\d+(\.\d+)?$/.test(value)||Number(value)>(f.key==='age'?130:600)))return false;
 if(f.type==='date'&&(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value))return false;
 return true;
}
export function chronology(c:GuidedCase):string[] {
 const pairs=[['reactionStart','reactionStop'],...c.medications.map(m=>[`med.${m.id}.start`,`med.${m.id}.stop`])];
 return pairs.filter(([a,b])=>c.values[a]?.value&&c.values[b]?.value&&c.values[a].value!>c.values[b].value!).map(([a])=>`Stop precedes start: ${a}`);
}
