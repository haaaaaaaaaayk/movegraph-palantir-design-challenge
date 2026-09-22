import test from 'node:test';
import assert from 'node:assert/strict';
import {INITIAL_PLAN,calculate,edgesFor,recoveries,impacts,validatePlan} from '../dist/model.mjs';

test('a housing delay propagates through dependent dates but preserves fixed and independent steps',()=>{
  const original=calculate(INITIAL_PLAN), delayed=calculate({...INITIAL_PLAN,housingDay:10});
  assert.equal(delayed.address.day,12);
  assert.equal(delayed.internet.day,14);
  assert.equal(delayed.checkin.day,8);
  assert.equal(delayed.checkin.status,'conflict');
  assert.equal(delayed.ready.day,null);
  assert.equal(delayed.ready.status,'blocked');
  for(const id of ['documents','travel','bank']) assert.deepEqual(delayed[id],original[id]);
});
test('suggested dependencies change dates only after acceptance',()=>{
  const draft={...INITIAL_PLAN,housingDay:10};
  assert.equal(calculate(draft).bank.day,6);
  assert.equal(calculate({...draft,bankDependency:true,bankReviewed:true}).bank.day,13);
  assert.equal(edgesFor({...draft,bankReviewed:true}).some(e=>e.to==='bank'),false);
});
test('both recovery options resolve the fixed appointment conflict without mutating the draft',()=>{
  const draft={...INITIAL_PLAN,housingDay:10};
  const original={...draft};
  const [rebook,earlier]=recoveries(draft);
  assert.equal(rebook.plan.appointmentDay,13);
  assert.equal(calculate(rebook.plan).ready.day,17);
  assert.equal(earlier.plan.appointmentDay,8);
  assert.equal(earlier.plan.housingDay,5);
  assert.equal(calculate(earlier.plan).ready.day,12);
  assert.deepEqual(draft,original);
  for(const option of [rebook,earlier]) assert.equal(calculate(option.plan).checkin.status,'fixed');
});
test('the last allowed housing date produces an honest late milestone',()=>{
  const [rebook]=recoveries({...INITIAL_PLAN,housingDay:20});
  assert.equal(calculate(rebook.plan).ready.day,27);
  assert.equal(calculate(rebook.plan).ready.status,'late');
});
test('a missed prerequisite is an impact even when an appointment date cannot move',()=>{
  const changes=impacts(INITIAL_PLAN,{...INITIAL_PLAN,housingDay:10});
  assert.deepEqual(changes.map(x=>x.id),['housing','address','checkin','internet','ready']);
  assert.equal(changes.find(x=>x.id==='checkin').delta,0);
});
test('invalid and fractional dates are rejected at the scheduling boundary',()=>{
  for(const day of [0,21,1.5,NaN,'10']) assert.throws(()=>validatePlan({...INITIAL_PLAN,housingDay:day}));
});
test('an earlier housing date uses the same dependency lags as a delay',()=>{
  const earlier=calculate({...INITIAL_PLAN,housingDay:1});
  assert.equal(earlier.address.day,3);
  assert.equal(earlier.internet.day,5);
  assert.equal(earlier.checkin.day,8);
  assert.equal(earlier.ready.day,9);
});
