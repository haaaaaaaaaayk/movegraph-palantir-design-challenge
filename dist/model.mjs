export const INITIAL_PLAN = Object.freeze({
  housingDay:3,
  addressDay:null,
  appointmentDay:8,
  internetDay:null,
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
  {id:'address',title:'Prepare address pack',category:'Documents',kind:'flexible',x:300,y:246,icon:'folder',description:'Gather your housing confirmation and prepared ID documents into one pack. You have allowed two calendar days.',note:'Once housing is confirmed, allow two days to assemble my pack.',source:'Your planning notes',sourceType:'Accepted scenario note'},
  {id:'checkin',title:'Housing office check-in',category:'Appointment',kind:'fixed',x:576,y:86,icon:'calendar',description:'A sample online appointment with your housing coordinator. In this scenario, your address pack must be ready the previous day.',note:'Online check-in on 8 October. Please have the pack ready the day before.',source:'Housing coordinator’s note',sourceType:'Fictional appointment'},
  {id:'internet',title:'Arrange home internet',category:'Getting settled',kind:'flexible',x:576,y:246,icon:'wifi',description:'Compare internet arrangements using the address in your pack. You have allocated two calendar days for this task.',note:'I want to compare internet arrangements after my address pack is ready.',source:'Your planning notes',sourceType:'Accepted scenario note'},
  {id:'bank',title:'Compare local banking options',category:'Getting settled',kind:'flexible',x:300,y:406,icon:'bank',description:'Research fees, services, and broad availability before deciding where to open an account. Your exact address might improve a nearby-branch comparison.',note:'I can compare providers before my address is final. The address may matter later if nearby branches influence my choice.',source:'AI-suggested dependency',sourceType:'Unverified planning suggestion'},
  {id:'ready',title:'Ready for arrival',category:'Milestone',kind:'milestone',x:576,y:406,icon:'flag',description:'Your personal preparation milestone: check-in complete and internet arrangements made, with three days allowed for final checks.',note:'Leave three days after arranging internet, and at least a day after check-in, for final preparation.',source:'Your planning notes',sourceType:'Accepted scenario note'}
];

const validOptionalDay=value=>value===null||(Number.isInteger(value)&&value>=1&&value<=31);

export function validatePlan(plan){
  if(!plan||!Number.isInteger(plan.housingDay)||plan.housingDay<1||plan.housingDay>20) throw new Error('Choose a housing date from 1–20 October.');
  if(!Number.isInteger(plan.appointmentDay)||plan.appointmentDay<1||plan.appointmentDay>31) throw new Error('Appointment date must be in October.');
  for(const key of ['addressDay','internetDay','bankDay']) if(!validOptionalDay(plan[key])) throw new Error(`${key} must be null or an October date.`);
  if(typeof plan.bankDependency!=='boolean'||typeof plan.bankReviewed!=='boolean'||typeof plan.rebooked!=='boolean') throw new Error('Invalid plan state.');
  return plan;
}

export function edgesFor(plan){return [
  {from:'documents',to:'address',lag:0},
  {from:'housing',to:'address',lag:2},
  {from:'address',to:'checkin',lag:1},
  {from:'address',to:'internet',lag:2},
  {from:'address',to:'bank',lag:1,suggested:!plan.bankDependency,dismissed:plan.bankReviewed&&!plan.bankDependency},
  {from:'checkin',to:'ready',lag:1},
  {from:'internet',to:'ready',lag:3}
].filter(edge=>!edge.dismissed);}

function dependent(earliest,manualDay){
  const chosen=manualDay??earliest;
  return {day:chosen,earliest,mode:manualDay===null?'automatic':'manual',status:chosen<earliest?'conflict':'planned'};
}

export function calculate(plan){
  validatePlan(plan);
  const result={
    documents:{day:-1,status:'complete',mode:'completed'},
    travel:{day:0,status:'complete',mode:'completed'},
    housing:{day:plan.housingDay,status:'planned',mode:'source'}
  };

  const addressEarliest=plan.housingDay+2;
  result.address=dependent(addressEarliest,plan.addressDay);

  const addressUnavailable=['conflict','blocked'].includes(result.address.status);
  const checkinEarliest=(addressUnavailable?addressEarliest:result.address.day)+1;
  result.checkin={
    day:plan.appointmentDay,
    earliest:checkinEarliest,
    mode:'fixed',
    status:addressUnavailable?'blocked':plan.appointmentDay<checkinEarliest?'conflict':'fixed'
  };

  const internetEarliest=(addressUnavailable?addressEarliest:result.address.day)+2;
  result.internet=addressUnavailable
    ?{day:plan.internetDay,earliest:internetEarliest,mode:plan.internetDay===null?'automatic':'manual',status:'blocked'}
    :dependent(internetEarliest,plan.internetDay);

  if(plan.bankDependency){
    const bankEarliest=(addressUnavailable?addressEarliest:result.address.day)+1;
    result.bank=addressUnavailable
      ?{day:plan.bankDay,earliest:bankEarliest,mode:plan.bankDay===null?'automatic':'manual',status:'blocked'}
      :dependent(bankEarliest,plan.bankDay);
  }else{
    result.bank={day:plan.bankDay??6,status:plan.bankReviewed?'planned':'review',mode:plan.bankDay===null?'source':'manual'};
  }

  const readinessBlocked=['conflict','blocked'].includes(result.checkin.status)||['conflict','blocked'].includes(result.internet.status);
  result.ready={day:readinessBlocked?null:Math.max(result.checkin.day+1,result.internet.day+3),status:readinessBlocked?'blocked':'planned',mode:'milestone'};
  if(result.ready.day>18) result.ready.status='late';
  return result;
}

export function impacts(before,after){
  const a=calculate(before),b=calculate(after);
  return TASKS.filter(task=>a[task.id].day!==b[task.id].day||a[task.id].status!==b[task.id].status||a[task.id].mode!==b[task.id].mode).map(task=>({
    ...task,
    before:a[task.id],
    after:b[task.id],
    delta:a[task.id].day!==null&&b[task.id].day!==null?b[task.id].day-a[task.id].day:null
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

export function recoveries(draft){
  const schedule=calculate(draft);
  if(schedule.checkin.status!=='conflict') return [];
  const rebook={...draft,appointmentDay:schedule.checkin.earliest,rebooked:true};
  const earlier={...draft};
  if(earlier.addressDay===null) earlier.housingDay=Math.max(1,Math.min(earlier.housingDay,earlier.appointmentDay-3));
  else earlier.addressDay=Math.max(schedule.address.earliest,earlier.appointmentDay-1);
  return [
    {id:'rebook',title:`Request check-in for ${formatDay(rebook.appointmentDay)}`,label:'Option A · keep earlier work',description:'Keep the planned preparation dates and request the first compatible check-in.',assumption:`Requires a new check-in slot on ${formatDay(rebook.appointmentDay)}.`,plan:rebook},
    {id:'earlier',title:earlier.addressDay===null?`Secure housing by ${formatDay(earlier.housingDay)}`:`Complete the address pack by ${formatDay(earlier.addressDay)}`,label:'Option B · keep the appointment',description:'Bring the controlling prerequisite forward enough to preserve the booked check-in.',assumption:'Requires the earlier prerequisite to be achievable.',plan:earlier}
  ].filter(option=>calculate(option.plan).checkin.status!=='conflict');
}

export function formatDay(day,full=false){
  if(day===null||day===undefined) return 'Needs a new plan';
  const date=new Date(Date.UTC(2026,9,day));
  return date.toLocaleDateString('en-GB',{day:'2-digit',month:full?'long':'short',...(full?{year:'numeric'}:{}),timeZone:'UTC'});
}
