import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ARRIVAL_DAY,
  READY_BY_DAY,
  MAX_TASKS_PER_DAY,
  INITIAL_PLAN,
  calculate,
  edgesFor,
  connectedIds,
  addressTimingOptions,
  restoreAddressTimingChoice,
  dailyWorkload,
  recoveries,
  impacts,
  validatePlan
} from '../dist/model.mjs';

test('the baseline keeps arrival and readiness fixed while projecting completion',()=>{
  assert.equal(ARRIVAL_DAY,18);
  assert.equal(READY_BY_DAY,17);
  assert.equal(MAX_TASKS_PER_DAY,2);
  const schedule=calculate(INITIAL_PLAN);
  assert.equal(schedule.housing.day,10);
  assert.equal(schedule.address.day,12);
  assert.equal(schedule.checkin.day,13);
  assert.equal(schedule.checkin.latest,16);
  assert.equal(schedule.internet.day,14);
  assert.equal(schedule.internet.latest,14);
  assert.deepEqual(schedule.ready,{day:17,projectedDay:17,latest:17,status:'planned',mode:'deadline'});
});

test('dependency edges use the plan timing instead of fixed lags',()=>{
  const edges=edgesFor({...INITIAL_PLAN,addressLag:0,internetLag:1});
  assert.equal(edges.find(edge=>edge.from==='housing'&&edge.to==='address').lag,0);
  assert.equal(edges.find(edge=>edge.from==='address'&&edge.to==='internet').lag,1);
  assert.equal(edges.find(edge=>edge.from==='address'&&edge.to==='checkin').lag,1);
});

test('a two-day housing delay offers three feasible ways to keep the 17 October deadline',()=>{
  const draft={...INITIAL_PLAN,housingDay:12};
  const before={...draft};
  const options=addressTimingOptions(draft);
  assert.deepEqual(options.map(option=>option.lag),[0,1,2]);
  assert.deepEqual(options.map(option=>option.label),['Same day','1 day later','2 days later']);
  assert.deepEqual(options.map(option=>option.schedule.address.day),[12,13,14]);
  assert.deepEqual(options.map(option=>option.schedule.checkin.day),[13,14,15]);
  assert.deepEqual(options.map(option=>option.schedule.internet.day),[14,14,14]);
  assert.deepEqual(options.map(option=>option.plan.internetLag),[2,1,0]);
  assert.deepEqual(options.map(option=>option.schedule.ready.day),[17,17,17]);
  assert.deepEqual(options.map(option=>option.schedule.ready.projectedDay),[17,17,17]);
  assert.ok(options.every(option=>option.schedule.ready.status==='planned'));
  assert.deepEqual(options.map(option=>option.requiresRebooking),[false,true,true]);
  assert.deepEqual(options.map(option=>option.parallelDay),[12,14,14]);
  assert.deepEqual(options[0].parallelTasks,['Confirm your housing','Prepare address pack']);
  assert.deepEqual(options[1].parallelTasks,['Housing office check-in','Arrange home internet']);
  assert.deepEqual(options[2].parallelTasks,['Prepare address pack','Arrange home internet']);
  assert.deepEqual(options.map(option=>option.recommended),[true,false,false]);
  assert.ok(options.every(option=>option.maxTasksOnOneDay<=MAX_TASKS_PER_DAY));
  assert.deepEqual(draft,before);
});

test('address timing metadata compares rebooking against the supplied saved plan',()=>{
  const saved={...INITIAL_PLAN,appointmentDay:14,rebooked:true};
  const plan={...saved,housingDay:12};
  const options=addressTimingOptions(plan,saved);
  assert.equal(options[0].plan.appointmentDay,14);
  assert.equal(options[0].requiresRebooking,false);
  assert.equal(options[0].rebooking,null);
  assert.equal(options[1].plan.appointmentDay,14);
  assert.equal(options[1].requiresRebooking,false);
  assert.equal(options[2].plan.appointmentDay,15);
  assert.deepEqual(options[2].rebooking,{fromDay:14,toDay:15});
});

test('reopening address timing restores choice-owned fields and preserves unrelated edits',()=>{
  const timingBase={...INITIAL_PLAN,housingDay:12};
  const selected=addressTimingOptions(timingBase)[1].plan;
  const current={...selected,internetDay:14,bankDay:15,bankDependency:true,bankReviewed:true};
  const restored=restoreAddressTimingChoice(current,timingBase);

  assert.equal(restored.housingDay,12);
  assert.equal(restored.addressDay,timingBase.addressDay);
  assert.equal(restored.addressLag,timingBase.addressLag);
  assert.equal(restored.appointmentDay,timingBase.appointmentDay);
  assert.equal(restored.internetLag,timingBase.internetLag);
  assert.equal(restored.rebooked,timingBase.rebooked);
  assert.equal(restored.internetDay,14);
  assert.equal(restored.bankDay,15);
  assert.equal(restored.bankDependency,true);
  assert.equal(restored.bankReviewed,true);
  assert.notEqual(restored,current);
  assert.equal(current.addressLag,1);
  assert.equal(current.appointmentDay,14);

  const nextChoice=addressTimingOptions(restored)[0].plan;
  assert.equal(nextChoice.housingDay,12);
  assert.equal(nextChoice.internetDay,14);
  assert.equal(nextChoice.bankDay,15);
  assert.equal(nextChoice.bankDependency,true);
  assert.equal(nextChoice.bankReviewed,true);
});

test('timing alternatives that cannot meet the deadline or capacity are omitted',()=>{
  assert.deepEqual(addressTimingOptions({...INITIAL_PLAN,housingDay:15}),[]);
  const bankPinnedToBusyDay={...INITIAL_PLAN,housingDay:12,bankDay:14};
  assert.deepEqual(addressTimingOptions(bankPinnedToBusyDay).map(option=>option.lag),[0]);
  assert.equal(Math.max(...dailyWorkload(addressTimingOptions(bankPinnedToBusyDay)[0].plan).map(item=>item.count)),2);
});

test('daily workload includes every active planning task',()=>{
  const workload=dailyWorkload({...INITIAL_PLAN,appointmentDay:14,bankDay:14});
  const busyDay=workload.find(item=>item.day===14);
  assert.equal(busyDay.count,3);
  assert.deepEqual(busyDay.taskIds,['checkin','internet','bank']);
});

test('check-in after 16 October is a deadline conflict and readiness remains fixed',()=>{
  const schedule=calculate({...INITIAL_PLAN,appointmentDay:17,rebooked:true});
  assert.equal(schedule.checkin.day,17);
  assert.equal(schedule.checkin.latest,16);
  assert.equal(schedule.checkin.status,'conflict');
  assert.equal(schedule.checkin.constraint,'deadline');
  assert.equal(schedule.ready.day,17);
  assert.equal(schedule.ready.projectedDay,18);
  assert.equal(schedule.ready.status,'blocked');
});

test('internet after 14 October is a deadline conflict and never moves readiness to 19 October',()=>{
  const schedule=calculate({...INITIAL_PLAN,internetDay:16});
  assert.equal(schedule.internet.day,16);
  assert.equal(schedule.internet.latest,14);
  assert.equal(schedule.internet.status,'conflict');
  assert.equal(schedule.internet.constraint,'deadline');
  assert.equal(schedule.ready.day,17);
  assert.equal(schedule.ready.projectedDay,19);
  assert.equal(schedule.ready.status,'blocked');
});

test('an impossible manual pin stays visible as a dependency conflict and blocks descendants',()=>{
  const schedule=calculate({...INITIAL_PLAN,addressDay:11});
  assert.equal(schedule.address.day,11);
  assert.equal(schedule.address.earliest,12);
  assert.equal(schedule.address.status,'conflict');
  assert.equal(schedule.address.constraint,'dependency');
  assert.equal(schedule.checkin.status,'blocked');
  assert.equal(schedule.internet.status,'blocked');
  assert.equal(schedule.ready.day,17);
  assert.equal(schedule.ready.projectedDay,null);
  assert.equal(schedule.ready.status,'blocked');
});

test('an upstream delay preserves a downstream pin and exposes dependency and deadline limits',()=>{
  const schedule=calculate({...INITIAL_PLAN,housingDay:11,internetDay:14,appointmentDay:14});
  assert.equal(schedule.address.day,13);
  assert.equal(schedule.internet.day,14);
  assert.equal(schedule.internet.earliest,15);
  assert.equal(schedule.internet.latest,14);
  assert.equal(schedule.internet.status,'conflict');
  assert.equal(schedule.internet.constraint,'dependency');
  assert.equal(schedule.checkin.status,'fixed');
  assert.equal(schedule.ready.status,'blocked');
});

test('removing a pin returns a task to its automatic timing',()=>{
  assert.equal(calculate({...INITIAL_PLAN,internetDay:13}).internet.mode,'manual');
  const automatic=calculate({...INITIAL_PLAN,internetDay:null});
  assert.equal(automatic.internet.day,14);
  assert.equal(automatic.internet.mode,'automatic');
  assert.equal(automatic.ready.status,'planned');
});

test('suggested dependencies change banking only after acceptance',()=>{
  const delayed={...INITIAL_PLAN,housingDay:12,addressLag:0};
  assert.equal(calculate(delayed).bank.day,6);
  assert.equal(calculate({...delayed,bankDependency:true,bankReviewed:true}).bank.day,13);
  assert.equal(edgesFor({...delayed,bankReviewed:true}).some(edge=>edge.to==='bank'),false);
});

test('unaccepted suggestions do not look active from another task',()=>{
  assert.equal(connectedIds('address',INITIAL_PLAN).has('bank'),false);
  assert.equal(connectedIds('bank',INITIAL_PLAN).has('address'),true);
  assert.equal(connectedIds('address',{...INITIAL_PLAN,bankDependency:true,bankReviewed:true}).has('bank'),true);
});

test('recovery plans resolve conflicts without returning a post-deadline plan',()=>{
  const draft={...INITIAL_PLAN,housingDay:12};
  const original={...draft};
  const options=recoveries(draft);
  assert.deepEqual(options.map(option=>option.lag),[0,1,2]);
  for(const option of options){
    const schedule=calculate(option.plan);
    assert.equal(schedule.ready.day,17);
    assert.equal(schedule.ready.projectedDay,17);
    assert.equal(schedule.ready.status,'planned');
    assert.ok(schedule.checkin.day<=schedule.checkin.latest);
    assert.ok(schedule.internet.day<=schedule.internet.latest);
  }
  assert.deepEqual(draft,original);
  assert.deepEqual(recoveries(INITIAL_PLAN),[]);
});

test('recovery comparisons use the current saved appointment and preserve manual pins',()=>{
  const saved={...INITIAL_PLAN,appointmentDay:14,rebooked:true,internetDay:14};
  const draft={...saved,housingDay:12};
  const options=recoveries(draft,saved);
  assert.equal(options[0].plan.appointmentDay,14);
  assert.equal(options[0].requiresRebooking,false);
  assert.ok(options.every(option=>option.plan.internetDay===14));
});

test('impacts includes earliest and projected changes when visible dates stay fixed',()=>{
  const faster={...INITIAL_PLAN,addressLag:0};
  const changes=impacts(INITIAL_PLAN,faster);
  const address=changes.find(change=>change.id==='address');
  assert.equal(address.before.earliest,12);
  assert.equal(address.after.earliest,10);
  assert.equal(address.beforeLag,2);
  assert.equal(address.afterLag,0);
  const readiness=changes.find(change=>change.id==='ready');
  assert.equal(readiness.before.day,17);
  assert.equal(readiness.after.day,17);
  assert.equal(readiness.before.projectedDay,17);
  assert.equal(readiness.after.projectedDay,15);
  assert.equal(readiness.projectedDelta,-2);
});

test('impacts exposes a compressed internet turnaround even when its pinned date is unchanged',()=>{
  const before={...INITIAL_PLAN,internetDay:14,internetLag:2};
  const after={...before,internetLag:1};
  const internet=impacts(before,after).find(change=>change.id==='internet');
  assert.equal(internet.before.day,14);
  assert.equal(internet.after.day,14);
  assert.equal(internet.beforeLag,2);
  assert.equal(internet.afterLag,1);
});

test('mode changes still count as impacts when dates stay the same',()=>{
  const changes=impacts(INITIAL_PLAN,{...INITIAL_PLAN,internetDay:14});
  assert.ok(changes.some(change=>change.id==='internet'&&change.before.mode==='automatic'&&change.after.mode==='manual'));
});

test('invalid dates, timing lags, and state values are rejected at the model boundary',()=>{
  for(const day of [0,21,1.5,NaN,'10']) assert.throws(()=>validatePlan({...INITIAL_PLAN,housingDay:day}));
  for(const day of [0,32,1.5,'14']) assert.throws(()=>validatePlan({...INITIAL_PLAN,internetDay:day}));
  for(const lag of [-1,3,1.5,NaN,'1']){
    assert.throws(()=>validatePlan({...INITIAL_PLAN,addressLag:lag}));
    assert.throws(()=>validatePlan({...INITIAL_PLAN,internetLag:lag}));
  }
  assert.throws(()=>validatePlan({...INITIAL_PLAN,rebooked:'yes'}));
});
