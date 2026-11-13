import test from 'node:test';
import assert from 'node:assert/strict';
import {identityFailureDiagnostic} from '../server/specialist/postgresRepository';
test('identity diagnostics expose bounded codes without secrets or actor data',()=>{
 const secret='private-connection-password-and-subject';
 const result=identityFailureDiagnostic(Object.assign(new Error('socket closed '+secret),{code:'08006'}),'current');
 assert.deepEqual(result,{event:'identity_repository_failure',operation:'current',sqlstate:'08006',errorType:'Error',connectionFailure:true});
 assert(!JSON.stringify(result).includes(secret));
 assert.equal(identityFailureDiagnostic({code:secret,name:secret,message:secret},'identity').sqlstate,'NO_SQLSTATE');
});
