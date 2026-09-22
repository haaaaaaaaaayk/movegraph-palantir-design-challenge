export const INITIAL_PLAN = Object.freeze({housingDay:3, appointmentDay:8, bankDependency:false, bankReviewed:false, rebooked:false});
export const TASKS = [
  {id:'documents',title:'Prepare ID documents',category:'Documents',kind:'complete',day:-1,x:24,y:86,icon:'file',description:'Keep the identification documents you chose for this move together, ready to reference.',note:'I have prepared the ID documents I want to use for this move.',source:'Your packing notes',sourceType:'Accepted scenario note'},
  {id:'housing',title:'Confirm your housing',category:'Housing',kind:'flexible',x:24,y:246,icon:'home',description:'Get written confirmation of your room and the address from your housing coordinator.',note:'I’ll put my address pack together once my room is confirmed.',source:'Your planning notes',sourceType:'Accepted scenario note'},
  {id:'travel',title:'Book your journey',category:'Travel',kind:'complete',day:0,x:24,y:406,icon:'plane',description:'Your journey to Berlin is arranged for 18 October. This booking is independent of the preparation tasks.',note:'My travel booking is already arranged. I will arrive on 18 October.',source:'Your itinerary',sourceType:'Illustrative booking'},
  {id:'address',title:'Prepare address pack',category:'Documents',kind:'flexible',x:300,y:246,icon:'folder',description:'Gather your housing confirmation and prepared ID documents into one pack. You have allowed two calendar days.',note:'Once housing is confirmed, allow two days to assemble my pack.',source:'Your planning notes',sourceType:'Accepted scenario note'},
  {id:'checkin',title:'Housing office check-in',category:'Appointment',kind:'fixed',x:576,y:86,icon:'calendar',description:'A sample online appointment with your housing coordinator. In this scenario, your address pack must be ready the previous day.',note:'Online check-in on 8 October. Please have the pack ready the day before.',source:'Housing coordinator’s note',sourceType:'Fictional appointment'},
  {id:'internet',title:'Arrange home internet',category:'Getting settled',kind:'flexible',x:576,y:246,icon:'wifi',description:'Compare internet arrangements using the address in your pack. You have allocated two calendar days for this task.',note:'I want to compare internet arrangements after my address pack is ready.',source:'Your planning notes',sourceType:'Accepted scenario note'},
  {id:'bank',title:'Choose a local bank',category:'Getting settled',kind:'flexible',x:300,y:406,icon:'bank',description:'Compare your banking options. Whether this task needs your address pack is an assumption for you to review.',note:'Maybe I should wait for the address pack before comparing banks. Does this actually need to be a dependency?',source:'Suggested preparation order',sourceType:'Unverified planning assumption'},
  {id:'ready',title:'Ready for arrival',category:'Milestone',kind:'milestone',x:576,y:406,icon:'flag',description:'Your personal preparation milestone: check-in complete and internet arrangements made, with three days allowed for final checks.',note:'Leave three days after arranging internet, and at least a day after check-in, for final preparation.',source:'Your planning notes',sourceType:'Accepted scenario note'}
];
export function validatePlan(plan){
  if(!plan || !Number.isInteger(plan.housingDay) || plan.housingDay<1 || plan.housingDay>20) throw new Error('Choose a housing date from 1–20 October.');
  if(!Number.isInteger(plan.appointmentDay) || plan.appointmentDay<1 || plan.appointmentDay>31) throw new Error('Appointment date must be in October.');
  if(typeof plan.bankDependency!=='boolean' || typeof plan.bankReviewed!=='boolean' || typeof plan.rebooked!=='boolean') throw new Error('Invalid plan state.');
  return plan;
}
export function edgesFor(plan){return [
  {from:'documents',to:'address',lag:0}, {from:'housing',to:'address',lag:2},
  {from:'address',to:'checkin',lag:1}, {from:'address',to:'internet',lag:2},
  {from:'address',to:'bank',lag:1,suggested:!plan.bankDependency,dismissed:plan.bankReviewed&&!plan.bankDependency},
  {from:'checkin',to:'ready',lag:1}, {from:'internet',to:'ready',lag:3}
].filter(e=>!e.dismissed);}
export function calculate(plan){
  validatePlan(plan);
  const address=plan.housingDay+2,conflict=address+1>plan.appointmentDay,internet=address+2;
  const result={documents:{day:-1,status:'complete'},travel:{day:0,status:'complete'},housing:{day:plan.housingDay,status:'planned'},address:{day:address,status:'planned'},checkin:{day:plan.appointmentDay,status:conflict?'conflict':'fixed',earliest:address+1},internet:{day:internet,status:'planned'},bank:{day:plan.bankDependency?address+1:6,status:plan.bankReviewed?'planned':'review'},ready:{day:conflict?null:Math.max(plan.appointmentDay+1,internet+3),status:conflict?'blocked':'planned'}};
  if(result.ready.day>18) result.ready.status='late';return result;
}
export function impacts(before,after){const a=calculate(before),b=calculate(after);return TASKS.filter(t=>a[t.id].day!==b[t.id].day || a[t.id].status!==b[t.id].status).map(t=>({...t,before:a[t.id],after:b[t.id],delta:a[t.id].day!==null&&b[t.id].day!==null?b[t.id].day-a[t.id].day:null}));}
export function connectedIds(id,plan){const edges=edgesFor(plan),set=new Set([id]);function walk(node,direction){for(const e of edges){if(e[direction==='down'?'from':'to']===node){const next=e[direction==='down'?'to':'from'];if(!set.has(next)){set.add(next);walk(next,direction);}}}}walk(id,'down');walk(id,'up');return set;}
export function recoveries(draft){const schedule=calculate(draft),rebook={...draft,appointmentDay:Math.max(draft.appointmentDay,schedule.checkin.earliest),rebooked:schedule.checkin.earliest>draft.appointmentDay||draft.rebooked},earlier={...draft,housingDay:Math.max(1,Math.min(draft.housingDay,draft.appointmentDay-3))};return [{id:'rebook',title:'Move the check-in',label:'Keep the housing date',description:'Allow the preparation steps to finish, then use a later check-in slot.',assumption:`Assumes a check-in slot is available on ${formatDay(rebook.appointmentDay)}.`,plan:rebook},{id:'earlier',title:'Bring confirmation forward',label:'Keep the appointment',description:'Ask your coordinator for written housing confirmation in time to prepare your pack.',assumption:`Assumes your coordinator can confirm housing by ${formatDay(earlier.housingDay)}.`,plan:earlier}];}
export function formatDay(day,full=false){if(day===null)return 'Needs a new plan';const d=new Date(Date.UTC(2026,9,day));return d.toLocaleDateString('en-GB',{day:'2-digit',month:full?'long':'short',...(full?{year:'numeric'}:{}),timeZone:'UTC'});}
