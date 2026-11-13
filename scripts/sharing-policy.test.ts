import test from 'node:test';
import assert from 'node:assert/strict';
import {canReadSharedRevision,eligibleRecipient,type ReviewGrant,type CurrentSpecialist} from '../server/sharing/policy';
test('exact revision grant requires all current authorization dimensions; administrator identity is insufficient',()=>{
 const now=Date.parse('2026-11-08T00:00:00Z');
 const identity:CurrentSpecialist={subject:'specialist-a',state:'APPROVED',validUntil:'2026-11-09T00:00:00Z',directoryOptIn:true};
 const grant:ReviewGrant={patient:'patient-a',specialist:identity.subject,caseId:'case-a',revision:3,state:'active',consentActive:true,assignmentActive:true};
 const read=(actor:string,i=identity,g=grant,id='case-a',revision=3)=>canReadSharedRevision(actor,i,g,id,revision,now);
 assert(read(identity.subject));
 for(const actor of ['patient-a','patient-b','specialist-b','identity-administrator',''])assert.equal(read(actor),false);
 for(const state of ['SUBMITTED','PENDING_VERIFICATION','REJECTED','SUSPENDED','REVOKED','EXPIRED'])assert.equal(read(identity.subject,{...identity,state}),false);
 for(const validUntil of [null,'invalid','2026-11-08T00:00:00Z'])assert.equal(read(identity.subject,{...identity,validUntil}),false);
 for(const change of [{state:'withdrawn' as const},{state:'declined' as const},{consentActive:false},{assignmentActive:false},{patient:identity.subject}])assert.equal(read(identity.subject,identity,{...grant,...change}),false);
 assert.equal(read(identity.subject,identity,grant,'case-b'),false);
 assert.equal(read(identity.subject,identity,grant,'case-a',4),false);
 assert.equal(eligibleRecipient(identity,'patient-a',now),true);
 assert.equal(eligibleRecipient(identity,identity.subject,now),false);
 assert.equal(eligibleRecipient({...identity,directoryOptIn:false},'patient-a',now),false);
});
