import test from 'node:test';
import assert from 'node:assert/strict';
import {readFictionalAge, readSourceSex, contextUnknown, requestsNavigation, assessmentStatus, welcome} from '../src/features/medassist-conversation/presentation';

test('fictional age is explicit and preserves zero/fractional source context',()=>{
  for(const [text,expected] of [['0',0],['35 years old',35],['0.5',0.5]] as const) assert.equal(readFictionalAge(text),expected);
  for(const text of ['unknown','adult','-1','35 and fever','35e2','Infinity','']) assert.equal(readFictionalAge(text),null);
});
test('source-sex context has no demographic defaults and cannot coerce unknown',()=>{
  assert.equal(readSourceSex('female'),'F');assert.equal(readSourceSex('M'),'M');
  for(const text of ['unknown','other','nonbinary','not sure','']) assert.equal(readSourceSex(text),null);
  assert.equal(contextUnknown('Not sure'),true); assert.equal(contextUnknown('F'),false);
});
test('navigation is an explicit user intent, never a symptom-to-specialty inference',()=>{
  for(const text of ['find care','Please find hospitals.','show nearby hospitals'])assert.equal(requestsNavigation(text),true);
  for(const text of ['fever','I have throat pain','no hospital','find an ENT because cough'])assert.equal(requestsNavigation(text),false);
});
test('assessment presenter cannot produce a severity class',()=>{
  assert.equal(assessmentStatus({started:false,finished:false,unavailable:false}),'Not assessed');
  assert.equal(assessmentStatus({started:true,finished:false,unavailable:false}),'Gathering information');
  for(const started of [true,false])for(const finished of [true,false])for(const unavailable of [true,false])
    assert.ok(['Not assessed','Gathering information','Unable to assess'].includes(assessmentStatus({started,finished,unavailable})));
  assert.equal(assessmentStatus({started:true,finished:true,unavailable:false}),'Unable to assess');
});
test('greeting is explicitly fictional and does not promise clinical assessment',()=>{
  assert.match(welcome,/fictional/);assert.match(welcome,/cannot diagnose, assess urgency/);
});
