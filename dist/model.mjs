export const ARRIVAL_DAY=18;
export const READY_BY_DAY=17;
export const MAX_TASKS_PER_DAY=2;
export const ADDRESS_TIMING_FIELDS=Object.freeze(['addressDay','addressLag','appointmentDay','internetLag','rebooked']);

export const INITIAL_PLAN = Object.freeze({
  housingDay:10,
  addressDay:null,
  addressLag:2,
  appointmentDay:13,
  internetDay:null,
  internetLag:2,
  bankDay:null,
  bankDependency:false,
  bankReviewed:false,
  rebooked:false
});

export const DATE_FIELDS = Object.freeze({
  housing:'housingDay',
  address:'addressDay',
  checkin:'appointmentDay',
  internet:'internetDay',
  bank:'bankDay'
});

export const TASKS = [
  {id:'documents',title:'Prepare ID documents',category:'Documents',kind:'complete',day:-1,x:24,y:86,icon:'file',description:'Keep the identification documents you chose for this move together, ready to reference.',note:'I have prepared the ID documents I want to use for this move.',source:'Your packing notes',sourceType:'Accepted scenario note'},
  {id:'housing',title:'Confirm your housing',category:'Housing',kind:'flexible',x:24,y:246,icon:'home',description:'Get written confirmation of your room and the address from your housing coordinator.',note:'I’ll put my address pack together once my room is confirmed.',source:'Your planning notes',sourceType:'Accepted scenario note'},
  {id:'travel',title:'Book your journey',category:'Travel',kind:'complete',day:0,x:24,y:406,icon:'plane',description:'Your journey from Tokyo to San Francisco is arranged for 18 October. This booking is independent of the preparation tasks.',note:'My travel booking is already arranged. I will arrive in San Francisco on 18 October.',source:'Your itinerary',sourceType:'Illustrative booking'},
  {id:'address',title:'Prepare address pack',category:'Documents',kind:'flexible',x:300,y:246,icon:'folder',description:'Gather your housing confirmation and prepared ID documents into one pack. Choose whether to complete it the same day or allow up to two calendar days.',note:'Once housing is confirmed, decide how much time I need to assemble my pack.',source:'Your planning notes',sourceType:'Accepted scenario note'},
  {id:'checkin',title:'Housing office check-in',category:'Appointment',kind:'fixed',x:576,y:86,icon:'calendar',description:'A sample online appointment with your housing coordinator. In this scenario, your address pack must be ready the previous day.',note:'Online check-in on 13 October. Please have the pack ready the day before.',source:'Housing coordinator’s note',sourceType:'Fictional appointment'},
  {id:'internet',title:'Arrange home internet',category:'Getting settled',kind:'flexible',x:576,y:246,icon:'wifi',description:'Compare internet arrangements using the address in your pack. The plan can place this work alongside another task when the readiness deadline requires it.',note:'I want to compare internet arrangements after my address pack is ready.',source:'Your planning notes',sourceType:'Accepted scenario note'},
  {id:'bank',title:'Compare local banking options',category:'Getting settled',kind:'flexible',x:300,y:406,icon:'bank',description:'Research fees, services, and broad availability before deciding where to open an account. Your confirmed address may affect which option is practical.',note:'AI first treated banking as independent. I challenged that assumption because branch proximity and the practical timing of account setup may depend on my confirmed address.',source:'Hayk’s critique of the AI plan',sourceType:'Reviewable design hypothesis'},
  {id:'ready',title:'Ready by 17 Oct',category:'Milestone',kind:'milestone',x:576,y:406,icon:'flag',description:'A fixed readiness deadline one day before arrival. The plan can change, but this date does not move.',note:'Finish by 17 October: leave three days after arranging internet and at least a day after check-in for final preparation.',source:'Your planning notes',sourceType:'Accepted scenario note'}
];

const validOptionalDay=value=>value===null||(Number.isInteger(value)&&value>=1&&value<=31);
const validLag=value=>Number.isInteger(value)&&value>=0&&value<=2;
const CHECKIN_LATEST_DAY=READY_BY_DAY-1;
const INTERNET_LATEST_DAY=READY_BY_DAY-3;
const SCHEDULED_TASK_IDS=['housing','address','checkin','internet','bank'];

export function validatePlan(plan){
  if(!plan||!Number.isInteger(plan.housingDay)||plan.housingDay<1||plan.housingDay>20) throw new Error('Choose a housing date from 1–20 October.');
  if(!Number.isInteger(plan.appointmentDay)||plan.appointmentDay<1||plan.appointmentDay>31) throw new Error('Appointment date must be in October.');
  if(!validLag(plan.addressLag)||!validLag(plan.internetLag)) throw new Error('Task timing must be 0, 1, or 2 calendar days.');
  for(const key of ['addressDay','internetDay','bankDay']) if(!validOptionalDay(plan[key])) throw new Error(`${key} must be null or an October date.`);
  if(typeof plan.bankDependency!=='boolean'||typeof plan.bankReviewed!=='boolean'||typeof plan.rebooked!=='boolean') throw new Error('Invalid plan state.');
  return plan;
}

export function edgesFor(plan){return [
  {from:'documents',to:'address',lag:0},
  {from:'housing',to:'address',lag:plan.addressLag},
  {from:'address',to:'checkin',lag:1},
  {from:'address',to:'internet',lag:plan.internetLag},
  {from:'address',to:'bank',lag:1,suggested:!plan.bankDependency,dismissed:plan.bankReviewed&&!plan.bankDependency},
  {from:'checkin',to:'ready',lag:1},
  {from:'internet',to:'ready',lag:3}
].filter(edge=>!edge.dismissed);}

function dependent(earliest,manualDay,latest=null){
  const chosen=manualDay??earliest;
  const dependencyConflict=chosen<earliest;
  const deadlineConflict=latest!==null&&chosen>latest;
  return {
    day:chosen,
    earliest,
    ...(latest===null?{}:{latest}),
    mode:manualDay===null?'automatic':'manual',
    status:dependencyConflict||deadlineConflict?'conflict':'planned',
    constraint:dependencyConflict?'dependency':deadlineConflict?'deadline':null
  };
}

export function calculate(plan){
  validatePlan(plan);
  const result={
    documents:{day:-1,status:'complete',mode:'completed'},
    travel:{day:0,status:'complete',mode:'completed'},
    housing:{day:plan.housingDay,status:'planned',mode:'source'}
  };

  const addressEarliest=plan.housingDay+plan.addressLag;
  result.address=dependent(addressEarliest,plan.addressDay);

  const addressUnavailable=['conflict','blocked'].includes(result.address.status);
  const checkinEarliest=(addressUnavailable?addressEarliest:result.address.day)+1;
  result.checkin={
    day:plan.appointmentDay,
    earliest:checkinEarliest,
    latest:CHECKIN_LATEST_DAY,
    mode:'fixed',
    status:addressUnavailable?'blocked':plan.appointmentDay<checkinEarliest||plan.appointmentDay>CHECKIN_LATEST_DAY?'conflict':'fixed',
    constraint:addressUnavailable?'dependency':plan.appointmentDay<checkinEarliest?'dependency':plan.appointmentDay>CHECKIN_LATEST_DAY?'deadline':null
  };

  const internetEarliest=(addressUnavailable?addressEarliest:result.address.day)+plan.internetLag;
  result.internet=addressUnavailable
    ?{day:plan.internetDay,earliest:internetEarliest,latest:INTERNET_LATEST_DAY,mode:plan.internetDay===null?'automatic':'manual',status:'blocked',constraint:'dependency'}
    :dependent(internetEarliest,plan.internetDay,INTERNET_LATEST_DAY);

  if(plan.bankDependency){
    const bankEarliest=(addressUnavailable?addressEarliest:result.address.day)+1;
    result.bank=addressUnavailable
      ?{day:plan.bankDay,earliest:bankEarliest,mode:plan.bankDay===null?'automatic':'manual',status:'blocked'}
      :dependent(bankEarliest,plan.bankDay);
  }else{
    result.bank={day:plan.bankDay??6,status:plan.bankReviewed?'planned':'review',mode:plan.bankDay===null?'source':'manual'};
  }

  const projectedDay=Number.isInteger(result.checkin.day)&&Number.isInteger(result.internet.day)
    ?Math.max(result.checkin.day+1,result.internet.day+3)
    :null;
  const readinessBlocked=['conflict','blocked'].includes(result.checkin.status)||['conflict','blocked'].includes(result.internet.status)||projectedDay===null||projectedDay>READY_BY_DAY;
  result.ready={day:READY_BY_DAY,projectedDay,latest:READY_BY_DAY,status:readinessBlocked?'blocked':'planned',mode:'deadline'};
  return result;
}

export function impacts(before,after){
  const a=calculate(before),b=calculate(after);
  const lagFor=(task,plan)=>task.id==='address'?plan.addressLag:task.id==='internet'?plan.internetLag:undefined;
  return TASKS.filter(task=>{
    const beforeResult=a[task.id],afterResult=b[task.id];
    return beforeResult.day!==afterResult.day
      ||beforeResult.status!==afterResult.status
      ||beforeResult.mode!==afterResult.mode
      ||beforeResult.earliest!==afterResult.earliest
      ||beforeResult.latest!==afterResult.latest
      ||beforeResult.projectedDay!==afterResult.projectedDay
      ||lagFor(task,before)!==lagFor(task,after);
  }).map(task=>({
    ...task,
    before:a[task.id],
    after:b[task.id],
    ...(lagFor(task,before)===undefined?{}:{beforeLag:lagFor(task,before),afterLag:lagFor(task,after)}),
    delta:a[task.id].day!==null&&b[task.id].day!==null?b[task.id].day-a[task.id].day:null,
    projectedDelta:Number.isInteger(a[task.id].projectedDay)&&Number.isInteger(b[task.id].projectedDay)?b[task.id].projectedDay-a[task.id].projectedDay:null
  }));
}

export function connectedIds(id,plan){
  const edges=edgesFor(plan).filter(edge=>!edge.suggested||id==='bank'),set=new Set([id]);
  function walk(node,direction){
    for(const edge of edges){
      if(edge[direction==='down'?'from':'to']===node){
        const next=edge[direction==='down'?'to':'from'];
        if(!set.has(next)){set.add(next);walk(next,direction);}
      }
    }
  }
  walk(id,'down');walk(id,'up');return set;
}

function workloadFromSchedule(schedule){
  const tasksByDay=new Map();
  for(const id of SCHEDULED_TASK_IDS){
    const day=schedule[id].day;
    if(!Number.isInteger(day)) continue;
    if(!tasksByDay.has(day)) tasksByDay.set(day,[]);
    tasksByDay.get(day).push(id);
  }
  return [...tasksByDay.entries()]
    .map(([day,taskIds])=>({day,taskIds,tasks:taskIds.map(id=>TASKS.find(task=>task.id===id).title),count:taskIds.length}))
    .sort((a,b)=>a.day-b.day);
}

export function dailyWorkload(plan){
  return workloadFromSchedule(calculate(plan));
}

export function addressTimingOptions(plan,savedPlan=INITIAL_PLAN){
  validatePlan(plan);
  validatePlan(savedPlan);
  const labels=['Same day','1 day later','2 days later'];
  const candidates=[0,1,2].map(lag=>{
    const addressDay=plan.housingDay+lag;
    const preferredAppointment=Math.min(plan.appointmentDay,CHECKIN_LATEST_DAY);
    const appointmentDay=Math.max(addressDay+1,preferredAppointment);
    const availableInternetLag=INTERNET_LATEST_DAY-addressDay;
    const internetLag=Math.max(0,Math.min(plan.internetLag,availableInternetLag));
    const candidate={
      ...plan,
      addressDay:null,
      addressLag:lag,
      appointmentDay,
      internetDay:plan.internetDay,
      internetLag,
      rebooked:appointmentDay!==savedPlan.appointmentDay||savedPlan.rebooked
    };
    const schedule=calculate(candidate);
    const workload=workloadFromSchedule(schedule);
    const parallelDays=workload
      .filter(item=>item.count>1)
      .map(({day,taskIds,tasks})=>({day,taskIds,tasks}))
      .sort((a,b)=>b.taskIds.length-a.taskIds.length||a.day-b.day);
    const primaryParallel=parallelDays[0]||{day:null,taskIds:[],tasks:[]};
    const maxTasksOnOneDay=Math.max(0,...workload.map(item=>item.count));
    const requiresRebooking=appointmentDay!==savedPlan.appointmentDay;
    const feasible=schedule.ready.status==='planned'
      &&schedule.ready.projectedDay<=READY_BY_DAY
      &&['address','checkin','internet','bank'].every(id=>!['conflict','blocked'].includes(schedule[id].status))
      &&maxTasksOnOneDay<=MAX_TASKS_PER_DAY;
    const parallelSummary=primaryParallel.tasks.length
      ?`${primaryParallel.tasks.join(' and ')} share ${formatDay(primaryParallel.day)}.`
      :'No day contains more than one task.';
    return {
      id:`address-lag-${lag}`,
      lag,
      label:labels[lag],
      title:`Prepare the address pack on ${formatDay(schedule.address.day)}`,
      description:`Check-in is ${formatDay(schedule.checkin.day)}, internet is ${formatDay(schedule.internet.day)}, and the plan ${requiresRebooking?'is ready by':'remains ready by'} ${formatDay(READY_BY_DAY)}${requiresRebooking?' if the requested slot is confirmed':''}.`,
      assumption:`${requiresRebooking?`Request a new check-in slot on ${formatDay(appointmentDay)}. `:''}${parallelSummary}`,
      plan:candidate,
      schedule,
      parallelDay:primaryParallel.day,
      parallelTasks:primaryParallel.tasks,
      parallelTaskIds:primaryParallel.taskIds,
      parallelDays,
      maxTasksOnOneDay,
      requiresRebooking,
      rebooking:requiresRebooking?{fromDay:savedPlan.appointmentDay,toDay:appointmentDay}:null,
      feasible,
      recommended:false
    };
  }).filter(option=>option.feasible);
  const preferred=candidates.find(option=>option.lag===0)||candidates[0];
  return candidates.map(option=>({...option,recommended:option.id===preferred?.id}));
}

export function restoreAddressTimingChoice(plan,timingBase){
  validatePlan(plan);
  validatePlan(timingBase);
  return ADDRESS_TIMING_FIELDS.reduce((restored,key)=>{
    restored[key]=timingBase[key];
    return restored;
  },{...plan});
}

export function recoveries(draft,savedPlan=INITIAL_PLAN){
  const schedule=calculate(draft);
  const needsRecovery=schedule.ready.status==='blocked'||['address','checkin','internet'].some(id=>['conflict','blocked'].includes(schedule[id].status));
  if(!needsRecovery) return [];
  return addressTimingOptions(draft,savedPlan).filter(option=>{
    const dates=calculate(option.plan);
    return dates.ready.status==='planned'&&dates.ready.projectedDay<=READY_BY_DAY;
  });
}

export function formatDay(day,full=false){
  if(day===null||day===undefined) return 'Needs a new plan';
  const date=new Date(Date.UTC(2026,9,day));
  return date.toLocaleDateString('en-GB',{day:'2-digit',month:full?'long':'short',...(full?{year:'numeric'}:{}),timeZone:'UTC'});
}
