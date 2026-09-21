import test from 'node:test';
import assert from 'node:assert/strict';
import {INITIAL_PLAN,calculate,edgesFor,connectedIds,recoveries,impacts,validatePlan} from '../dist/model.mjs';

test('automatic dates flow forward from housing while fixed and independent dates stay put',()=>{
  const delayed=calculate({...INITIAL_PLAN,housingDay:10});
  assert.equal(delayed.address.day,12);
  assert.equal(delayed.address.mode,'automatic');
  assert.equal(delayed.internet.day,14);
  assert.equal(delayed.checkin.day,8);
  assert.equal(delayed.checkin.status,'conflict');
  assert.equal(delayed.bank.day,6);
  assert.equal(delayed.ready.day,null);
});

test('pinning a later flexible step changes only that step and its descendants',()=>{
  const original=calculate(INITIAL_PLAN);
  const pinned=calculate({...INITIAL_PLAN,internetDay:14});
  for(const id of ['housing','address','checkin','bank']) assert.equal(pinned[id].day,original[id].day);
  assert.equal(pinned.internet.day,14);
  assert.equal(pinned.internet.mode,'manual');
  assert.equal(pinned.ready.day,17);
});

test('a manual pin forms a boundary against upstream changes',()=>{
  const plan={...INITIAL_PLAN,addressDay:12,housingDay:5};
  const schedule=calculate(plan);
  assert.equal(schedule.housing.day,5);
  assert.equal(schedule.address.day,12);
  assert.equal(schedule.address.mode,'manual');
  assert.equal(schedule.internet.day,14);
});

test('an impossible manual pin stays visible as a conflict and blocks descendants',()=>{
  const schedule=calculate({...INITIAL_PLAN,internetDay:6});
  assert.equal(schedule.internet.day,6);
  assert.equal(schedule.internet.earliest,7);
  assert.equal(schedule.internet.status,'conflict');
  assert.equal(schedule.ready.day,null);
  assert.equal(schedule.ready.status,'blocked');
});

test('an upstream delay preserves a downstream pin and exposes the new conflict',()=>{
  const schedule=calculate({...INITIAL_PLAN,housingDay:4,internetDay:7});
  assert.equal(schedule.housing.day,4);
  assert.equal(schedule.address.day,6);
  assert.equal(schedule.internet.day,7);
  assert.equal(schedule.internet.earliest,8);
  assert.equal(schedule.internet.status,'conflict');
  assert.equal(schedule.ready.status,'blocked');
});

test('removing a pin returns a step to its earliest automatic date',()=>{
  assert.equal(calculate({...INITIAL_PLAN,internetDay:14}).internet.day,14);
  const automatic=calculate({...INITIAL_PLAN,internetDay:null});
  assert.equal(automatic.internet.day,7);
  assert.equal(automatic.internet.mode,'automatic');
});

test('suggested dependencies change dates only after acceptance',()=>{
  const delayed={...INITIAL_PLAN,housingDay:10};
  assert.equal(calculate(delayed).bank.day,6);
  assert.equal(calculate({...delayed,bankDependency:true,bankReviewed:true}).bank.day,13);
  assert.equal(edgesFor({...delayed,bankReviewed:true}).some(edge=>edge.to==='bank'),false);
});

test('inactive suggestions do not look active from another task',()=>{
  assert.equal(connectedIds('address',INITIAL_PLAN).has('bank'),false);
  assert.equal(connectedIds('bank',INITIAL_PLAN).has('address'),true);
  assert.equal(connectedIds('address',{...INITIAL_PLAN,bankDependency:true,bankReviewed:true}).has('bank'),true);
});

test('both fixed-appointment recovery options resolve the conflict',()=>{
  const draft={...INITIAL_PLAN,housingDay:10};
  const original={...draft};
  const [rebook,earlier]=recoveries(draft);
  assert.equal(rebook.plan.appointmentDay,13);
  assert.equal(calculate(rebook.plan).ready.day,17);
  assert.equal(earlier.plan.appointmentDay,8);
  assert.equal(earlier.plan.housingDay,5);
  assert.equal(calculate(earlier.plan).ready.day,12);
  assert.deepEqual(draft,original);
});

test('mode changes count as impacts even when the visible date stays the same',()=>{
  const changes=impacts(INITIAL_PLAN,{...INITIAL_PLAN,internetDay:7});
  assert.deepEqual(changes.map(change=>change.id),['internet']);
  assert.equal(changes[0].before.mode,'automatic');
  assert.equal(changes[0].after.mode,'manual');
});

test('invalid and fractional dates are rejected at the scheduling boundary',()=>{
  for(const day of [0,21,1.5,NaN,'10']) assert.throws(()=>validatePlan({...INITIAL_PLAN,housingDay:day}));
  for(const day of [0,32,1.5,'14']) assert.throws(()=>validatePlan({...INITIAL_PLAN,internetDay:day}));
});
