import {INITIAL_PLAN,TASKS,DATE_FIELDS,ARRIVAL_DAY,READY_BY_DAY,MAX_TASKS_PER_DAY,calculate,edgesFor,impacts,connectedIds,addressTimingOptions,restoreAddressTimingChoice,dailyWorkload,formatDay,validatePlan} from './model.mjs';

const $=selector=>document.querySelector(selector);
const icons={
  home:'<path d="m3 10 9-7 9 7M5 9v11h14V9M9 20v-7h6v7"/>',
  file:'<path d="M14 3H5v18h14V8zM14 3v6h5M8 13h8M8 17h5"/>',
  folder:'<path d="M3 7V5h7l3 3h8v12H3z"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 11h18M7 15h3"/>',
  plane:'<path d="m3 10 7 2 5 9 2-1-1-9 5-5c3-3 0-6-3-3l-5 5-9-1z"/>',
  wifi:'<path d="M3 8a15 15 0 0 1 18 0M6 12a10 10 0 0 1 12 0M9 16a5 5 0 0 1 6 0"/><circle cx="12" cy="20" r=".8"/>',
  bank:'<path d="m3 8 9-5 9 5H3M5 10v8M10 10v8M15 10v8M20 10v8M3 21h18"/>',
  flag:'<path d="M5 21V3c5-3 8 3 14 0v10c-6 3-9-3-14 0"/>',
  spark:'<path d="m12 3 2.7 6.3L21 12l-6.3 2.7L12 21l-2.7-6.3L3 12l6.3-2.7z"/>',
  arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  undo:'<path d="m7 4-4 4 4 4M3 8h10a7 7 0 1 1 0 14"/>',
  close:'<path d="m6 6 12 12M6 18 18 6"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v1"/>',
  graph:'<rect x="3" y="9" width="6" height="6" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/><path d="M9 12h3V6h3M12 12v6h3"/>',
  edit:'<path d="m4 20 4.2-1 10.6-10.6a2.1 2.1 0 0 0-3-3L5.2 16zM14.5 6.5l3 3"/>',
  pin:'<path d="m8 3 8 0-1 6 3 3H6l3-3zM12 12v9"/>',
  link:'<path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.2M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.2-1.2"/>'
};

function icon(name,cls=''){
  return `<svg class="ui-icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]||icons.file}</svg>`;
}

const compactView=matchMedia('(max-width: 980px)');
const state={
  plan:{...INITIAL_PLAN},
  draft:null,
  selected:'housing',
  lastEdited:null,
  undo:null,
  addressTimingPending:false,
  addressTimingBase:null,
  selectedAddressLag:null,
  zoom:1,
  view:compactView.matches?'list':'map',
  focused:false
};

let toastTimer;
const current=()=>state.draft||state.plan;
const taskById=id=>TASKS.find(task=>task.id===id);
const clonePlan=plan=>({...plan});
const plansEqual=(a,b)=>Object.keys(INITIAL_PLAN).every(key=>a[key]===b[key]);
const editableTask=id=>Boolean(DATE_FIELDS[id]);
const canFollow=(id,plan=current())=>id==='address'||id==='internet'||(id==='bank'&&plan.bankDependency);
const canDrag=task=>task.kind==='flexible'&&editableTask(task.id);

function readinessLabel(schedule,plan){
  if(!schedule) return `Ready by ${formatDay(READY_BY_DAY)}`;
  if(schedule.ready.status==='planned') return plan?.rebooked?`Ready by ${formatDay(READY_BY_DAY)} if check-in is confirmed`:`Ready by ${formatDay(READY_BY_DAY)}`;
  if(schedule.ready.projectedDay) return `Would finish ${formatDay(schedule.ready.projectedDay)} · misses ${formatDay(READY_BY_DAY)}`;
  return `${formatDay(READY_BY_DAY)} deadline unresolved`;
}

function announce(message,visible=true){
  clearTimeout(toastTimer);
  $('#toast').innerHTML=`${icon('check')}<span>${message}</span>`;
  if(!visible){
    $('#toast').classList.remove('visible');
    return;
  }
  $('#toast').classList.add('visible');
  toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),5000);
}

function statusLabel(task,result,plan=current()){
  if(result.status==='complete') return 'Complete';
  if(result.status==='conflict'&&result.constraint==='deadline') return `Misses ${formatDay(READY_BY_DAY)} deadline`;
  if(result.status==='conflict') return 'Date conflict';
  if(result.status==='blocked') return task.id==='ready'?`${formatDay(READY_BY_DAY)} deadline at risk`:'Blocked by conflict';
  if(result.status==='review') return 'Design hypothesis · inactive';
  if(result.mode==='manual') return 'Pinned date';
  if(result.mode==='automatic') return 'Automatic';
  if(result.mode==='fixed') return plan.rebooked?'Rebooking needed':'Fixed appointment';
  if(result.mode==='source') return task.id==='bank'?'Independent':'Start date';
  if(result.mode==='deadline') return 'Fixed deadline';
  return 'Planned';
}

function statusMark(status){
  return status==='complete'?'✓':status==='conflict'?'!':status==='blocked'?'⊘':status==='review'?'◇':'○';
}

function modeName(mode){
  return {automatic:'Automatic',manual:'Set by you',source:'Source date',fixed:'Fixed',deadline:'Fixed deadline',completed:'Complete'}[mode]||'Planned';
}

function renderGraph(){
  const plan=current();
  const dates=calculate(plan);
  const baseline=calculate(state.plan);
  const edges=edgesFor(plan);
  const related=connectedIds(state.selected,plan);
  const changed=new Set(state.draft?impacts(state.plan,plan).map(task=>task.id):[]);

  const visibleEdges=edges.filter(edge=>!edge.suggested||state.selected==='bank');
  const paths=visibleEdges.map(edge=>{
    const from=taskById(edge.from),to=taskById(edge.to);
    let d;
    if(edge.from==='checkin'&&edge.to==='ready') d=`M${from.x+216} ${from.y+56}H824Q836 ${from.y+56} 836 ${from.y+70}V${to.y+40}Q836 ${to.y+56} 820 ${to.y+56}H${to.x+222}`;
    else if(from.x===to.x){const x=from.x+108;d=`M${x} ${from.y+112}V${to.y-8}`;}
    else {const sx=from.x+216,sy=from.y+56,ex=to.x-5,ey=to.y+56;d=`M${sx} ${sy}C${sx+38} ${sy} ${ex-38} ${ey} ${ex} ${ey}`;}
    const affected=(changed.has(edge.from)||changed.has(edge.to))&&!edge.suggested;
    const selected=edge.from===state.selected||edge.to===state.selected;
    return `<path d="${d}" class="${edge.suggested?'suggested':''} ${affected?'affected':''} ${selected?'selected-edge':''}" marker-end="url(#${edge.suggested?'arrow-dashed':affected?'arrow-active':'arrow-base'})"/>`;
  }).join('');

  const nodes=TASKS.map(task=>{
    const result=dates[task.id],base=baseline[task.id];
    const delta=result.day!==null&&base.day!==null?result.day-base.day:0;
    const editable=editableTask(task.id);
    const cue=editable?(result.mode==='manual'?`${icon('pin')} Pinned`:`${icon('edit')} Edit date`):icon(task.icon);
    return `<button id="node-${task.id}" data-task="${task.id}" class="task-node ${state.selected===task.id?'selected':''} ${result.status} mode-${result.mode} ${changed.has(task.id)?'changed':''} ${state.focused&&!related.has(task.id)?'unrelated':''}" style="left:${task.x}px;top:${task.y}px" aria-label="${task.title}, ${statusLabel(task,result,plan)}, ${formatDay(result.day)}${editable?', date editable':''}${state.selected===task.id?', selected':''}">
      <span class="node-meta"><span>${statusMark(result.status)}</span>${statusLabel(task,result,plan)}</span>
      <strong>${task.title}</strong>
      <span class="node-footer"><span class="node-date">${result.day===null?'Awaiting resolution':formatDay(result.day)}</span>${delta?`<span class="change-badge">${delta>0?'+':''}${delta}d</span>`:`<span class="edit-date-cue ${editable?'is-editable':''}">${cue}</span>`}</span>
    </button>`;
  }).join('');

  $('#graph-canvas').innerHTML=`<svg class="connections" viewBox="0 0 860 562" aria-hidden="true"><defs><marker id="arrow-base" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 7 4 0 8" fill="#aaaaaa" stroke="none"/></marker><marker id="arrow-active" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 7 4 0 8" fill="#4e8af7" stroke="none"/></marker><marker id="arrow-dashed" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 7 4 0 8" fill="#147eb3" stroke="none"/></marker></defs>${paths}</svg><div class="graph-stage-label" style="left:24px">01 <span>PREPARE</span></div><div class="graph-stage-label" style="left:300px">02 <span>PUT IT TOGETHER</span></div><div class="graph-stage-label" style="left:576px">03 <span>GET READY</span></div>${nodes}`;
  const legend=[];
  if(TASKS.some(task=>dates[task.id].mode==='manual')) legend.push('<span><i class="legend-pin"></i> Pinned</span>');
  if(TASKS.some(task=>dates[task.id].mode==='fixed')) legend.push('<span><i class="legend-fixed"></i> Fixed</span>');
  if(state.selected==='bank'&&!plan.bankReviewed) legend.push('<span><i class="legend-line dotted"></i> Design hypothesis · inactive</span>');
  $('.graph-legend').innerHTML=legend.join('');
  document.querySelectorAll('[data-task]').forEach(element=>element.onclick=()=>selectTask(element.dataset.task));

  $('#steps-list').innerHTML=TASKS.map(task=>{
    const result=dates[task.id],editable=editableTask(task.id);
    return `<button class="step-row ${state.selected===task.id?'is-selected':''}" data-list-task="${task.id}" aria-label="${task.title}, ${statusLabel(task,result,plan)}, ${formatDay(result.day)}${editable?', date editable':''}">${icon(task.icon)}<span><strong>${task.title}</strong><small>${statusLabel(task,result,plan)}</small></span><span class="row-date">${formatDay(result.day)}</span>${editable?icon('edit'):icon('arrow')}</button>`;
  }).join('');
  document.querySelectorAll('[data-list-task]').forEach(element=>element.onclick=()=>selectTask(element.dataset.listTask));
  fitGraph();
}

function selectTask(id){
  if(!taskById(id)) throw new Error('Unknown task.');
  state.selected=id;
  state.focused=true;
  render();
  if(innerWidth<=980) $('#inspector').scrollIntoView({behavior:'smooth',block:'start'});
}

function fitGraph(){
  const viewport=$('#graph-viewport');
  if(!viewport||viewport.hidden) return;
  const scale=Math.max(.78,Math.min(1.15,(viewport.clientWidth-28)/860))*state.zoom;
  $('#graph-canvas').style.zoom=scale;
  viewport.style.setProperty('--graph-height',`${562*scale+55}px`);
}

function plannedInputDay(task,result,plan){
  const field=DATE_FIELDS[task.id];
  if(!field) return null;
  return plan[field]??result.day??result.earliest??null;
}

function modeCard(task,result,plan){
  if(result.mode==='automatic') return `<div class="mode-line"><strong>Automatic</strong><span>Earliest valid date from its prerequisites.</span></div>`;
  if(result.mode==='manual') return `<div class="mode-line"><strong>Pinned</strong><span>Stays fixed when earlier dates change.</span>${canFollow(task.id,plan)?'<button class="mode-action" id="reset-automatic">Follow dependencies</button>':''}</div>`;
  if(result.mode==='fixed') return `<div class="mode-line"><strong>Fixed appointment</strong><span>Moves only when you request a new date.</span></div>`;
  if(result.mode==='source') return `<div class="mode-line"><strong>${task.id==='bank'?'Independent':'Start date'}</strong><span>Not controlled by an earlier step.</span></div>`;
  return '';
}

function addressTimingQuestion(plan){
  const options=addressTimingOptions(plan,state.plan);
  if(!options.length) return `<div class="timing-question"><span>NO FEASIBLE SCHEDULE</span><h3>These dates cannot protect ${formatDay(READY_BY_DAY)}</h3><p>Choose an earlier housing date or revise a pinned task before continuing.</p></div>`;
  return `<div class="timing-question" role="group" aria-labelledby="timing-title"><span>DECISION NEEDED</span><h3 id="timing-title">How much time do you need for the address pack?</h3><p>${formatDay(READY_BY_DAY)} is fixed. Each choice shows the work required to protect it.</p><div class="timing-options">${options.map(option=>{const dates=calculate(option.plan);const previouslyPreviewed=option.lag===state.selectedAddressLag;const appointment=option.requiresRebooking?`Request check-in for ${formatDay(dates.checkin.day)}`:option.plan.rebooked?`Keep the requested check-in on ${formatDay(dates.checkin.day)}`:`Keep check-in on ${formatDay(dates.checkin.day)}`;const internetTiming=option.plan.internetLag===0?'Internet starts the same day as the address pack':`Internet starts ${option.plan.internetLag} day${option.plan.internetLag===1?'':'s'} later`;const groupedTasks=option.parallelTasks.map(title=>title.replace('Confirm your housing','Housing').replace('Prepare address pack','Address pack').replace('Housing office check-in','Check-in').replace('Arrange home internet','Internet')).join(' + ');return `<button class="timing-option ${option.recommended?'recommended':''} ${previouslyPreviewed?'previously-previewed':''}" data-address-lag="${option.lag}"><span class="timing-option-top"><strong>${option.label}</strong><span class="timing-option-tags">${previouslyPreviewed?'<em class="last-previewed">Last previewed</em>':''}${option.recommended?'<em>Recommended</em>':''}</span></span><span class="timing-date">Address pack · ${formatDay(dates.address.day)}</span><small>${option.description}</small><span class="timing-assumption">${appointment} · ${internetTiming}</span>${option.parallelDay?`<span class="parallel-note">${formatDay(option.parallelDay)} · ${groupedTasks}</span>`:''}<span class="timing-result">${readinessLabel(dates,option.plan)} <b>Preview this plan →</b></span></button>`;}).join('')}</div></div>`;
}

function activeTimingSummary(plan){
  if(!state.draft||plan.housingDay===state.plan.housingDay||state.addressTimingPending) return '';
  const schedule=calculate(plan);
  const protectedDeadline=schedule.ready.status==='planned'&&schedule.ready.projectedDay<=READY_BY_DAY;
  const tasks=[['Confirm housing',schedule.housing.day],['Prepare address pack',schedule.address.day],['Housing check-in',schedule.checkin.day],['Arrange internet',schedule.internet.day]];
  const loads=tasks.filter(([,day])=>Number.isInteger(day)).reduce((map,[title,day])=>{(map[day]??=[]).push(title);return map;},{});
  const parallel=Object.entries(loads).find(([,items])=>items.length>1);
  const grouped=parallel?`<p><strong>${formatDay(Number(parallel[0]))} · ${parallel[1].length} tasks</strong><br>${parallel[1].join(' · ')}</p>`:'';
  const pendingConfirmation=protectedDeadline&&plan.rebooked;
  const compareAction=state.addressTimingBase&&state.selectedAddressLag!==null?'<button class="button button-outline timing-revisit" id="compare-address-timing-inline">Compare other options</button>':'';
  return `<div class="deadline-strategy ${protectedDeadline?'':'at-risk'}"><span>${!protectedDeadline?'DEADLINE AT RISK':pendingConfirmation?'PENDING CHECK-IN CONFIRMATION':'DEADLINE PROTECTED'}</span><strong>${readinessLabel(schedule,plan)}</strong>${grouped}<small>${protectedDeadline?(pendingConfirmation?`The requested check-in on ${formatDay(schedule.checkin.day)} is not confirmed yet.`:'The existing check-in stays unchanged.'):'Resolve the highlighted date before applying this plan.'}</small>${compareAction}</div>`;
}

function conflictMarkup(task,result,plan){
  if(result.status==='conflict'&&Number.isInteger(result.earliest)&&Number.isInteger(result.latest)&&result.earliest>result.latest) return `<div class="conflict-note">${icon('info')}<div><strong>No valid date remains</strong><p>${task.title} cannot start before ${formatDay(result.earliest)}, but it must finish by ${formatDay(result.latest)}. Adjust the address-pack timing first.</p><div class="conflict-actions"><button class="button button-outline" id="inspect-prerequisite">Review address pack</button></div></div></div>`;
  if(result.status==='conflict'&&result.constraint==='deadline') return `<div class="conflict-note">${icon('info')}<div><strong>This misses your ready-by deadline</strong><p>${task.title} must be complete by ${formatDay(result.latest)} to keep ${formatDay(READY_BY_DAY)} available for final preparation.</p><div class="conflict-actions"><button class="button button-outline" id="use-latest">Use ${formatDay(result.latest)}</button>${canFollow(task.id,plan)?'<button class="button button-quiet" id="conflict-reset">Reset to automatic</button>':''}</div></div></div>`;
  if(result.status==='conflict') return `<div class="conflict-note">${icon('info')}<div><strong>Date conflict</strong><p>You chose ${formatDay(result.day)}, but ${formatDay(result.earliest)} is the earliest valid date. Earlier steps were left unchanged.</p><div class="conflict-actions"><button class="button button-outline" id="use-earliest">Use ${formatDay(result.earliest)}</button>${canFollow(task.id,plan)?'<button class="button button-quiet" id="conflict-reset">Reset to automatic</button>':''}</div></div></div>`;
  if(result.status==='blocked') return `<div class="conflict-note">${icon('info')}<div><strong>${task.id==='ready'?`${formatDay(READY_BY_DAY)} deadline at risk`:'Blocked by an earlier conflict'}</strong><p>${task.id==='ready'?'A prerequisite misses the fixed readiness deadline. Adjust the highlighted task before applying this plan.':'Resolve the highlighted prerequisite before this date can be trusted.'}</p></div></div>`;
  return '';
}

function workloadMarkup(task,plan){
  const overload=dailyWorkload(plan).find(item=>item.day===calculate(plan)[task.id].day&&item.count>MAX_TASKS_PER_DAY);
  if(!overload) return '';
  return `<div class="workload-note">${icon('info')}<div><strong>${overload.count} tasks on ${formatDay(overload.day)}</strong><p>${overload.tasks.join(', ')}. Move one task so the day has no more than ${MAX_TASKS_PER_DAY}.</p></div></div>`;
}

function impactDescription(change){
  if(change.after.status==='conflict'&&change.after.constraint==='deadline') return `Must finish by ${formatDay(change.after.latest)} to protect the deadline`;
  if(change.after.status==='conflict') return `Conflict · earliest ${formatDay(change.after.earliest)}`;
  if(change.after.status==='blocked') return `${formatDay(READY_BY_DAY)} deadline at risk`;
  if(change.beforeLag!==undefined&&change.beforeLag!==change.afterLag&&change.before.day===change.after.day){
    const before=change.beforeLag===0?'same day':`${change.beforeLag} day${change.beforeLag===1?'':'s'} after`;
    const after=change.afterLag===0?'same day':`${change.afterLag} day${change.afterLag===1?'':'s'} after`;
    return `Timing: ${before} → ${after}`;
  }
  if(change.before.day===change.after.day&&change.before.mode!==change.after.mode) return `${modeName(change.before.mode)} → ${modeName(change.after.mode)}`;
  return `${formatDay(change.before.day)} → ${formatDay(change.after.day)}`;
}

function renderInspector(){
  const task=taskById(state.selected),plan=current(),schedule=calculate(plan),result=schedule[task.id];
  const edges=edgesFor(plan),incoming=edges.filter(edge=>edge.to===task.id),outgoing=edges.filter(edge=>edge.from===task.id);
  const changes=state.draft?impacts(state.plan,plan):[];
  const inputDay=plannedInputDay(task,result,plan);
  const editable=editableTask(task.id)&&inputDay!==null;
  const maxDay=task.id==='housing'?20:31;
  const laterEffects=changes.filter(change=>change.id!==task.id);
  const dateLabel=result.mode==='fixed'?'Appointment date':result.mode==='deadline'?'Ready-by deadline':'Planned completion';

  const dateEditor=editable?`<div class="date-control"><label for="task-date">${dateLabel}</label><input id="task-date" type="date" min="2026-10-01" max="2026-10-${String(maxDay).padStart(2,'0')}" value="2026-10-${String(inputDay).padStart(2,'0')}" ${result.status==='blocked'&&result.day===null?'disabled':''}><p class="control-hint">Updates this step and its dependents.</p></div>${modeCard(task,result,plan)}`:`<div class="read-only-date"><span>${dateLabel}</span><strong class="${result.status==='conflict'?'text-danger':''}">${formatDay(result.day)}</strong></div>`;
  const impactList=state.draft&&!state.addressTimingPending?`<div class="detail-section impact-list"><h3>${laterEffects.length} OTHER ${laterEffects.length===1?'CHANGE':'CHANGES'} IN THIS PREVIEW</h3>${laterEffects.map(change=>`<button class="impact-item" data-impact="${change.id}"><span>${change.after.status==='conflict'?'!':change.after.status==='blocked'?'⊘':'↳'}</span><span><strong>${change.title}</strong><small>${impactDescription(change)}</small></span></button>`).join('')||'<p class="empty-small">This change does not move another date.</p>'}</div>`:'';
  const dependencies=incoming.length?`<div class="detail-section"><h3>DEPENDS ON</h3>${incoming.map(edge=>{const source=taskById(edge.from);const lag=edge.lag?`${edge.lag} calendar day${edge.lag>1?'s':''} after`:edge.from==='documents'?'Ready to use':'Same day';return `<button class="dependency-button" data-impact="${source.id}">${icon(source.icon)}<span>${source.title}${edge.suggested?'<small>Design hypothesis · inactive until accepted</small>':`<small>${lag}</small>`}</span>${icon('arrow')}</button>`;}).join('')}</div>`:'';
  const unlocks=outgoing.length?`<div class="detail-section"><h3>THIS CAN MOVE</h3>${outgoing.map(edge=>`<button class="unlock-item" data-impact="${edge.to}"><span>↳</span>${taskById(edge.to).title}${edge.suggested?'<span class="suggestion-tag">?</span>':''}</button>`).join('')}</div>`:!incoming.length?'<div class="detail-section"><h3>INDEPENDENT STEP</h3><p class="empty-small">Changes elsewhere do not move this task.</p></div>':'';
  const evidence=state.draft&&task.id!=='bank'?'':task.id==='bank'&&!plan.bankReviewed?`<div class="assumption-card"><span>Design hypothesis · inactive</span><p>The initial AI plan kept this task independent. I challenged that assumption because branch proximity and the practical timing of account setup may depend on my confirmed address.</p><div><button id="accept-link" class="button button-outline">Preview dependency</button><button id="dismiss-link" class="button button-quiet">Keep independent</button></div></div>`:`<details class="evidence-disclosure"><summary>Why this relationship?</summary><div class="evidence-card"><span>${task.source}</span><p>“${task.note}”</p><small>${task.sourceType}${task.id==='bank'&&plan.bankReviewed?plan.bankDependency?' · Address is a prerequisite':' · Kept independent':''}</small>${task.id==='bank'&&plan.bankReviewed?'<button class="button button-quiet" id="reopen-link">Review dependency again</button>':''}</div></details>`;
  const relationships=state.draft?'':`${dependencies}${unlocks}`;
  const bottom=task.kind==='complete'?'<p>Completed in this sample plan.</p>':task.kind==='milestone'?`<p>${formatDay(READY_BY_DAY)} is fixed. The planner checks whether the steps before it can meet that deadline.</p>`:'';
  const timing=state.addressTimingPending&&task.id==='housing'?addressTimingQuestion(plan):'';
  const strategy=task.id==='housing'?activeTimingSummary(plan):'';

  $('#inspector').innerHTML=`
    <h2>${task.title}</h2>
    <p class="detail-description">${task.description}</p>
    ${dateEditor}
    ${timing}
    ${strategy}
    ${conflictMarkup(task,result,plan)}
    ${workloadMarkup(task,plan)}
    ${impactList}
    ${relationships}
    ${evidence}
    ${bottom?`<div class="inspector-bottom">${bottom}</div>`:''}`;

  document.querySelectorAll('[data-impact]').forEach(element=>element.onclick=()=>selectTask(element.dataset.impact));
  $('#reset-automatic')?.addEventListener('click',()=>resetToAutomatic(task.id));
  $('#conflict-reset')?.addEventListener('click',()=>resetToAutomatic(task.id));
  $('#use-earliest')?.addEventListener('click',()=>setTaskDay(task.id,result.earliest));
  $('#use-latest')?.addEventListener('click',()=>setTaskDay(task.id,result.latest));
  $('#inspect-prerequisite')?.addEventListener('click',()=>selectTask('address'));
  $('#reopen-link')?.addEventListener('click',reopenLink);
  $('#accept-link')?.addEventListener('click',()=>reviewLink(true));
  $('#dismiss-link')?.addEventListener('click',()=>reviewLink(false));
  $('#compare-address-timing-inline')?.addEventListener('click',reopenAddressTiming);
  document.querySelectorAll('[data-address-lag]').forEach(element=>element.addEventListener('click',()=>applyAddressTiming(Number(element.dataset.addressLag))));
  $('#task-date')?.addEventListener('change',event=>{
    const input=event.target,match=/^2026-10-(\d{2})$/.exec(input.value),day=match?Number(match[1]):NaN;
    if(!Number.isInteger(day)||day<1||day>maxDay){
      input.value=`2026-10-${String(plannedInputDay(task,calculate(current())[task.id],current())).padStart(2,'0')}`;
      announce(`Choose a date between 1 and ${maxDay} October.`);
      return;
    }
    setTaskDay(task.id,day,'task-date');
  });
}

function renderTimeline(){
  const plan=current(),schedule=calculate(plan),base=calculate(state.plan);
  const position=day=>Math.max(0,Math.min(100,(day-1)/30*100));
  const rows=TASKS.filter(task=>task.kind!=='complete').map(task=>{
    const result=schedule[task.id],before=base[task.id];
    const diff=Boolean(state.draft)&&(result.day!==before.day||result.mode!==before.mode||result.status!==before.status);
    const draggable=canDrag(task)&&result.day!==null;
    const point=result.day!==null?`<button class="time-point ${result.status} mode-${result.mode} ${diff?'shifted':''} ${draggable?'draggable-date':''}" data-point="${task.id}" style="left:${position(result.day)}%" aria-label="${task.title}, ${formatDay(result.day)}, ${modeName(result.mode)}${draggable?', drag to change or select for the date field':''}" title="${formatDay(result.day)} · ${modeName(result.mode)}"><span>${String(result.day).padStart(2,'0')}</span>${result.mode==='manual'?icon('pin'):''}</button>`:'<span class="blocked-timeline">Waiting for an earlier conflict</span>';
    return `<div class="timeline-row"><button class="timeline-label ${state.selected===task.id?'active':''}" data-timeline="${task.id}">${icon(task.icon)}<span>${task.title}<small>${statusLabel(task,result,plan)}</small></span></button><div class="time-grid">${diff&&before.day!==null?`<span class="ghost-date" style="left:${position(before.day)}%" aria-hidden="true"></span>`:''}${point}<span class="arrival-line" style="left:${position(ARRIVAL_DAY)}%" aria-hidden="true"></span></div></div>`;
  }).join('');
  $('.timeline-section').innerHTML=`<div class="timeline-heading"><strong>Timeline preview</strong><span><i class="ghost-key"></i> Saved &nbsp; <i class="new-key"></i> Preview</span></div><div class="timeline-ruler"><span>OCTOBER 2026</span><div>${[1,6,12,17,24,31].map(day=>`<span style="left:${position(day)}%">${String(day).padStart(2,'0')}</span>`).join('')}</div></div>${rows}<div class="timeline-footnote"><span>Drag a flexible date to adjust it.</span><span>Ready by ${formatDay(READY_BY_DAY)} · Arrival ${formatDay(ARRIVAL_DAY)}</span></div>`;
  document.querySelectorAll('[data-timeline]').forEach(element=>element.onclick=()=>selectTask(element.dataset.timeline));
  document.querySelectorAll('[data-point]').forEach(element=>{
    const task=taskById(element.dataset.point);
    if(canDrag(task)) bindDateDrag(element,task);
    else element.onclick=()=>selectTask(task.id);
  });
}

function bindDateDrag(element,task){
  element.addEventListener('pointerdown',event=>{
    if(event.button!==0) return;
    const rect=element.parentElement.getBoundingClientRect();
    const maxDay=task.id==='housing'?20:31;
    const startX=event.clientX;
    let day=calculate(current())[task.id].day,moved=false;
    element.setPointerCapture(event.pointerId);
    const move=pointerEvent=>{
      if(Math.abs(pointerEvent.clientX-startX)>3) moved=true;
      if(!moved) return;
      pointerEvent.preventDefault();
      day=Math.max(1,Math.min(maxDay,Math.round((pointerEvent.clientX-rect.left)/rect.width*30)+1));
      element.classList.add('dragging');
      element.style.left=`${(day-1)/30*100}%`;
      element.querySelector('span').textContent=String(day).padStart(2,'0');
    };
    const finish=()=>{
      element.removeEventListener('pointermove',move);
      element.removeEventListener('pointerup',finish);
      element.removeEventListener('pointercancel',cancel);
      if(moved){state.selected=task.id;setTaskDay(task.id,day);}else selectTask(task.id);
    };
    const cancel=()=>{element.removeEventListener('pointermove',move);element.removeEventListener('pointerup',finish);render();};
    element.addEventListener('pointermove',move);
    element.addEventListener('pointerup',finish,{once:true});
    element.addEventListener('pointercancel',cancel,{once:true});
  });
}

function draftSummary(changes){
  const change=changes.find(item=>item.id===state.lastEdited)||changes[0];
  if(!change) return 'No visible changes';
  if(change.id==='bank'&&state.draft?.bankReviewed) return state.draft.bankDependency?'Bank now follows the address pack':'Bank remains independent';
  if(change.before.day!==change.after.day) return `${change.title}: ${formatDay(change.before.day)} → ${formatDay(change.after.day)}`;
  return `${change.title}: ${modeName(change.before.mode)} → ${modeName(change.after.mode)}`;
}

function render(){
  const focused=document.activeElement;
  const focusId=focused?.id;
  const focusAttributes=['data-task','data-list-task','data-impact','data-timeline','data-point'];
  const focusKey=focusAttributes.find(key=>focused?.hasAttribute(key));
  const focusValue=focusKey?focused.getAttribute(focusKey):null;
  const plan=current(),schedule=calculate(plan),changes=state.draft?impacts(state.plan,plan):[];
  const issues=TASKS.filter(task=>schedule[task.id].status==='conflict');
  const overloads=dailyWorkload(plan).filter(item=>item.count>MAX_TASKS_PER_DAY);
  const pending=state.addressTimingPending&&Boolean(state.draft);
  const canCompareTiming=Boolean(state.draft&&state.addressTimingBase&&state.selectedAddressLag!==null&&!pending);
  const deadlineAtRisk=schedule.ready.status==='blocked';
  const confirmationPending=schedule.ready.status==='planned'&&plan.rebooked;

  $('#plan-health').textContent=pending?'Decision needed':deadlineAtRisk?`Cannot meet ${formatDay(READY_BY_DAY)} with these dates`:issues.length?'Resolve the date conflict':overloads.length?'Daily workload is too high':confirmationPending?'Pending check-in confirmation':state.draft?(changes.length?'Deadline protected':'No change yet'):state.undo?'Plan updated':'On track';
  $('#plan-summary').textContent=pending?`Choose how much time the address pack needs · ${formatDay(READY_BY_DAY)} stays fixed`:deadlineAtRisk?`${issues.map(task=>task.title).join(', ')} · adjust before applying`:issues.length?`${issues.map(task=>task.title).join(', ')} · readiness is unchanged`:overloads.length?`${overloads[0].count} tasks on ${formatDay(overloads[0].day)} · limit ${MAX_TASKS_PER_DAY}`:confirmationPending?`Ready by ${formatDay(READY_BY_DAY)} if check-in on ${formatDay(schedule.checkin.day)} is confirmed`:`Ready by ${formatDay(READY_BY_DAY)} · arrival ${formatDay(ARRIVAL_DAY)}`;
  $('.plan-overview').classList.toggle('warning',Boolean(issues.length||overloads.length)&&!pending);
  $('.plan-overview').classList.toggle('decision',pending);
  $('#undo-button').hidden=!state.undo;
  $('#simulation-banner').hidden=!state.draft;
  $('#compare-address-timing').hidden=!canCompareTiming;
  if(state.draft){
    $('#simulation-caption').textContent=pending?`Housing moved to ${formatDay(plan.housingDay)} · protect ${formatDay(READY_BY_DAY)}`:draftSummary(changes);
    $('#banner-compare').textContent=pending?'Choose address timing':deadlineAtRisk?'Fix deadline issue':issues.length?'Fix date conflict':overloads.length?'Fix daily workload':'Review change';
    $('#banner-compare').disabled=!changes.length;
  }

  $('.view-title').textContent=state.view==='map'?'Dependency map':'Plan steps';
  $('.graph-direction-hint').hidden=state.view!=='map';
  renderGraph();
  renderInspector();
  renderTimeline();
  $('.timeline-section').hidden=!state.draft;
  $('#steps-list').hidden=state.view!=='list';
  $('#graph-viewport').hidden=state.view!=='map';
  if(state.view==='map') fitGraph();
  const restore=focusId?document.getElementById(focusId):focusKey?document.querySelector(`[${focusKey}="${focusValue}"]`):null;
  if(restore&&!restore.hidden) restore.focus({preventScroll:true});
  else if(focusId==='accept-link'||focusId==='dismiss-link') $('#node-bank')?.focus({preventScroll:true});
}

function setTaskDay(id,day,restoreId){
  const field=DATE_FIELDS[id],task=taskById(id);
  if(!field||!Number.isInteger(day)||day<1||day>(id==='housing'?20:31)) throw new Error('Choose a valid October date.');
  const before=calculate(current())[id];
  let draft=clonePlan(state.draft||state.plan);
  if(!state.draft&&(id==='housing'||id==='checkin')&&draft[field]===day) return;
  if(id==='housing'&&state.addressTimingBase) draft=restoreAddressTimingChoice(draft,state.addressTimingBase);
  draft[field]=day;
  if(id==='housing'){
    state.addressTimingPending=day!==state.plan.housingDay;
    state.selectedAddressLag=null;
    if(state.addressTimingPending){
      state.addressTimingBase=clonePlan(draft);
    }else{
      for(const key of ['addressLag','internetLag','appointmentDay','rebooked']) draft[key]=state.plan[key];
      state.addressTimingBase=null;
    }
  }
  if((id==='address'||id==='checkin')&&state.selectedAddressLag!==null){
    state.addressTimingBase=null;
    state.selectedAddressLag=null;
  }
  if(id==='checkin') draft.rebooked=day!==state.plan.appointmentDay||state.plan.rebooked;
  validatePlan(draft);
  state.draft=plansEqual(draft,state.plan)?null:draft;
  state.selected=id;
  state.lastEdited=id;
  state.focused=true;
  render();
  if(restoreId) document.getElementById(restoreId)?.focus({preventScroll:true});
  const after=calculate(draft)[id],downstream=impacts(state.plan,draft).filter(change=>change.id!==id).length;
  announce(`${task.title}: ${formatDay(before.day)} to ${formatDay(after.day)}. ${downstream} other ${downstream===1?'step':'steps'} changed.`,false);
}

function applyAddressTiming(lag){
  if(!state.draft||!state.addressTimingPending) return;
  const timingBase=state.addressTimingBase?restoreAddressTimingChoice(state.draft,state.addressTimingBase):state.draft;
  const option=addressTimingOptions(timingBase,state.plan).find(item=>item.lag===lag);
  if(!option){
    announce(`That timing cannot protect the ${formatDay(READY_BY_DAY)} deadline.`);
    return;
  }
  state.draft=clonePlan(option.plan);
  state.addressTimingPending=false;
  state.addressTimingBase=clonePlan(timingBase);
  state.selectedAddressLag=lag;
  state.selected='housing';
  state.lastEdited='housing';
  state.focused=true;
  render();
  $('#compare-address-timing-inline')?.focus({preventScroll:true});
  announce(option.plan.rebooked?`${option.label} previewed. Ready by ${formatDay(READY_BY_DAY)} if check-in on ${formatDay(option.schedule.checkin.day)} is confirmed.`:`${option.label} previewed. Ready by ${formatDay(READY_BY_DAY)} remains protected.`);
}

function reopenAddressTiming(){
  if(!state.draft||!state.addressTimingBase||state.selectedAddressLag===null) return false;
  state.draft=restoreAddressTimingChoice(state.draft,state.addressTimingBase);
  state.addressTimingBase=clonePlan(state.draft);
  state.addressTimingPending=true;
  state.selected='housing';
  state.lastEdited='housing';
  state.focused=true;
  render();
  const lastChoice=document.querySelector(`[data-address-lag="${state.selectedAddressLag}"]`);
  document.querySelector('.timing-question')?.scrollIntoView({behavior:'smooth',block:'nearest'});
  lastChoice?.focus({preventScroll:true});
  announce(`Timing options reopened. Housing stays on ${formatDay(state.draft.housingDay)}.`);
  return true;
}

function resetToAutomatic(id){
  if(!canFollow(id)) return;
  const draft=clonePlan(state.draft||state.plan);
  draft[DATE_FIELDS[id]]=null;
  state.draft=plansEqual(draft,state.plan)?null:draft;
  state.selected=id;
  state.lastEdited=id;
  render();
  announce(`${taskById(id).title} follows its dependencies again.`,false);
}

function discardPreview(){
  state.draft=null;
  state.lastEdited=null;
  state.addressTimingPending=false;
  state.addressTimingBase=null;
  state.selectedAddressLag=null;
  render();
  announce('Preview discarded. Your saved plan is unchanged.');
}

function reviewLink(accepted){
  const draft=clonePlan(state.draft||state.plan);
  draft.bankDependency=accepted;
  draft.bankReviewed=true;
  state.draft=draft;
  state.selected='bank';
  state.lastEdited='bank';
  render();
  announce(accepted?'Dependency previewed. Banking now follows the address pack.':'Banking research remains independent.');
}

function reopenLink(){
  const draft=clonePlan(state.draft||state.plan);
  draft.bankDependency=false;
  draft.bankReviewed=false;
  state.draft=draft;
  state.selected='bank';
  state.lastEdited='bank';
  render();
  $('#accept-link')?.focus({preventScroll:true});
  announce('Address prerequisite reopened as an inactive design hypothesis.');
}

function undo(){
  if(!state.undo) return;
  state.plan=clonePlan(state.undo);
  state.undo=null;
  state.draft=null;
  state.addressTimingPending=false;
  state.addressTimingBase=null;
  state.selectedAddressLag=null;
  const focusTask=state.lastEdited||'housing';
  state.selected=focusTask;
  render();
  (state.view==='list'?document.querySelector(`[data-list-task="${focusTask}"]`):$(`#node-${focusTask}`))?.focus({preventScroll:true});
  announce('Previous plan restored.');
}

function showDialog(html){
  const root=$('#overlay-root');
  root.innerHTML=`<dialog class="dialog" aria-labelledby="dialog-title"><button class="dialog-close icon-button" aria-label="Close dialog">${icon('close')}</button>${html}</dialog>`;
  const dialog=root.querySelector('dialog');
  dialog.showModal();
  dialog.querySelector('.dialog-close').onclick=()=>dialog.close();
  dialog.addEventListener('click',event=>{
    if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom) dialog.close();}
  });
  return dialog;
}

function reviewValue(change,side,optionPlan){
  const result=change[side];
  if(change.id==='bank'&&change.before.day===change.after.day&&(change.before.status!==change.after.status||change.before.mode!==change.after.mode)){
    if(side==='before'&&change.before.status==='review') return 'Suggestion pending';
    if(side==='after') return optionPlan.bankDependency?'Follows address pack':'Independent';
  }
  const lag=side==='before'?change.beforeLag:change.afterLag;
  if(lag!==undefined&&change.beforeLag!==change.afterLag){
    const timing=lag===0?'same day':`${lag} day${lag===1?'':'s'} after`;
    return `${formatDay(result.day)} · ${timing}`;
  }
  if(change.id==='ready') return `${formatDay(READY_BY_DAY)} · ${result.status==='planned'?'protected':'at risk'}`;
  const mode=result.mode==='manual'?' · set by you':result.mode==='automatic'?' · automatic':'';
  return `${formatDay(result.day)}${mode}`;
}

function openComparison(){
  if(!state.draft) return;
  const schedule=calculate(state.draft);
  const issues=TASKS.filter(task=>schedule[task.id].status==='conflict');
  if(issues.length){
    selectTask(issues[0].id);
    announce(schedule.ready.status==='blocked'?`Resolve the highlighted issue to protect ${formatDay(READY_BY_DAY)}.`:'Resolve the highlighted date conflict before applying this plan.');
    return;
  }
  const overload=dailyWorkload(state.draft).find(item=>item.count>MAX_TASKS_PER_DAY);
  if(overload){
    const target=overload.taskIds.includes(state.lastEdited)?state.lastEdited:overload.taskIds.at(-1);
    selectTask(target);
    announce(`Move one task from ${formatDay(overload.day)} before applying this plan.`);
    return;
  }
  const optionPlan=clonePlan(state.draft);
  const changes=impacts(state.plan,optionPlan),dates=calculate(optionPlan);
  const dialog=showDialog(`<div class="dialog-kicker">REVIEW CHANGES</div><h2 id="dialog-title">Apply this plan?</h2><div id="change-review"><div class="change-review-title"><strong>${changes.length} ${changes.length===1?'step':'steps'} will change</strong><span>BEFORE <span>→</span> AFTER</span></div>${changes.map(change=>`<div class="review-row"><span>${change.title}</span><span><del>${reviewValue(change,'before',optionPlan)}</del>${icon('arrow')}<strong>${reviewValue(change,'after',optionPlan)}</strong></span></div>`).join('')||'<p class="empty-small">No visible dates will change.</p>'}</div><p class="decision-note">This updates the demo only. A requested appointment remains unconfirmed until the external booking changes.</p><div class="dialog-footer"><span id="apply-summary">${readinessLabel(dates,optionPlan)}</span><button class="button button-primary" id="apply-plan">Apply this plan ${icon('arrow')}</button></div>`);

  $('#apply-plan').onclick=()=>{
    if(dates.ready.status!=='planned'||dates.ready.projectedDay>READY_BY_DAY||dailyWorkload(optionPlan).some(item=>item.count>MAX_TASKS_PER_DAY)){
      announce(`This plan cannot protect ${formatDay(READY_BY_DAY)}.`);
      return;
    }
    state.undo=clonePlan(state.plan);
    state.plan=clonePlan(optionPlan);
    state.draft=null;
    state.addressTimingPending=false;
    state.addressTimingBase=null;
    state.selectedAddressLag=null;
    dialog.close();
    render();
    $('#undo-button').focus({preventScroll:true});
    announce(optionPlan.rebooked?`Plan updated. Ready by ${formatDay(READY_BY_DAY)} if check-in on ${formatDay(dates.checkin.day)} is confirmed.`:`Plan updated. Ready by ${formatDay(READY_BY_DAY)} remains protected.`);
  };
}

function showAbout(){
  showDialog(`<div class="dialog-kicker">${icon('graph')} WHY THIS TOOL</div><h2 id="dialog-title">Seven cities taught me to stop treating a move like a checklist.</h2><p class="dialog-intro">A list shows what is due. A dependency map shows what will move, what must stay fixed, and where a person still needs to decide.</p><div class="about-facts"><p><strong>Personal starting point.</strong> This tool comes from Hayk’s experience living in seven cities over four years. The Tokyo-to-San Francisco dates and notes are an illustrative scenario, not official relocation requirements.</p><p><strong>Constraint hierarchy.</strong> Readiness on 17 October is a hard deadline. Arrival on 18 October is fixed context. Task spacing is a preference that can be compressed only after the person reviews the added workload.</p><p><strong>Interaction rule.</strong> Changes flow forward, never backward. The planner can group at most two tasks on one day, but it never moves an appointment silently or offers a plan that misses readiness.</p><p><strong>How AI contributed.</strong> AI helped structure the scenario, generate recovery alternatives, surface edge cases, and critique the interaction. It first treated banking as independent; Hayk challenged that assumption and made the possible address relationship reviewable. The dates shown here come from visible local rules; no live model or external booking is connected.</p></div><button class="button button-primary" id="about-done">Back to the plan ${icon('arrow')}</button>`);
  $('#about-done').onclick=()=>document.querySelector('dialog').close();
}

$('.surface-toolbar').innerHTML=`<div class="view-title">Dependency map</div><div class="graph-direction-hint">Arrows show active dependencies.</div>`;
$('#graph-viewport').insertAdjacentHTML('afterend','<div id="steps-list" class="steps-list" hidden></div>');
$('.workspace').insertAdjacentHTML('beforebegin',`<div id="simulation-banner" class="simulation-banner" hidden><div>${icon('edit')}<strong>UNSAVED CHANGE</strong><span id="simulation-caption"></span></div><div><button class="button button-quiet" id="discard-simulation">Reset preview</button><button class="button button-quiet" id="compare-address-timing" hidden>Compare other options</button><button class="button button-primary" id="banner-compare">Review change</button></div></div>`);

$('#about-button').onclick=showAbout;
$('#undo-button').onclick=undo;
$('#discard-simulation').onclick=discardPreview;
$('#compare-address-timing').onclick=reopenAddressTiming;
$('#banner-compare').onclick=()=>{
  if(state.addressTimingPending){
    selectTask('housing');
    document.querySelector('.timing-question')?.scrollIntoView({behavior:'smooth',block:'nearest'});
    return;
  }
  openComparison();
};
compactView.addEventListener('change',event=>{state.view=event.matches?'list':'map';render();});
window.addEventListener('resize',fitGraph);
render();

const context=document.modelContext;
if(context?.registerTool){
  const controller=new AbortController();
  const snapshot=()=>({plan:clonePlan(state.plan),preview:state.draft?clonePlan(state.draft):null,addressTimingPending:state.addressTimingPending,selectedAddressLag:state.selectedAddressLag,selectedTask:state.selected,schedule:calculate(current())});
  const definitions=[
    {name:'read_move_plan',title:'Read move plan',description:'Read the saved plan, staged preview, date modes, and calculated schedule.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute:()=>snapshot()},
    {name:'stage_task_date',title:'Change a move step date',description:'Stage an October 2026 completion date for an editable move step. The change flows only to descendants.',inputSchema:{type:'object',properties:{taskId:{type:'string',enum:Object.keys(DATE_FIELDS)},day:{type:'integer',minimum:1,maximum:31}},required:['taskId','day'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>{if(!input||Object.keys(input).some(key=>!['taskId','day'].includes(key))||!DATE_FIELDS[input.taskId]||!Number.isInteger(input.day)) throw new Error('Provide an editable taskId and an integer October day.');setTaskDay(input.taskId,input.day);return snapshot();}},
    {name:'stage_address_timing',title:'Choose address-pack timing',description:`After changing Housing, preview a same-day, one-day, or two-day address-pack plan that can meet ${formatDay(READY_BY_DAY)} and exposes any check-in request.`,inputSchema:{type:'object',properties:{lagDays:{type:'integer',enum:[0,1,2]}},required:['lagDays'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>{if(!input||Object.keys(input).some(key=>key!=='lagDays')||![0,1,2].includes(input.lagDays)) throw new Error('Choose lagDays 0, 1, or 2.');applyAddressTiming(input.lagDays);return snapshot();}},
    {name:'reopen_address_timing',title:'Compare address-pack timing options',description:'Return a staged Housing change to its three address-pack timing choices without changing the saved plan.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:()=>{if(!reopenAddressTiming()) throw new Error('Choose an address-pack timing option before reopening the comparison.');return snapshot();}},
    {name:'inspect_move_step',title:'Inspect a move step',description:'Select a step and show its date mode, dependencies, and evidence.',inputSchema:{type:'object',properties:{taskId:{type:'string',enum:TASKS.map(task=>task.id)}},required:['taskId'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>{if(!input||Object.keys(input).some(key=>key!=='taskId')) throw new Error('Provide a taskId.');selectTask(input.taskId);return snapshot();}},
    {name:'reset_task_to_dependencies',title:'Reset a task to automatic',description:'Remove a manual date from an eligible task so it follows its dependencies again.',inputSchema:{type:'object',properties:{taskId:{type:'string',enum:['address','internet','bank']}},required:['taskId'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>{if(!input||!canFollow(input.taskId)) throw new Error('Choose a task that can follow dependencies.');resetToAutomatic(input.taskId);return snapshot();}},
    {name:'discard_move_preview',title:'Discard move preview',description:'Discard staged date and dependency changes.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:()=>{discardPreview();return snapshot();}}
  ];
  for(const tool of definitions){try{Promise.resolve(context.registerTool(tool,{signal:controller.signal})).catch(()=>{});}catch{}}
  window.addEventListener('pagehide',()=>controller.abort(),{once:true});
}
