import {INITIAL_PLAN,TASKS,DATE_FIELDS,calculate,edgesFor,impacts,connectedIds,recoveries,formatDay,validatePlan} from './model.mjs';

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

const compactView=matchMedia('(max-width: 760px)');
const state={
  plan:{...INITIAL_PLAN},
  draft:null,
  selected:'housing',
  lastEdited:null,
  undo:null,
  choice:null,
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

function bufferLabel(day){
  if(day===null||day===undefined) return 'Ready date unresolved';
  const delta=18-day;
  if(delta===0) return 'Ready on arrival day';
  if(delta>0) return `${delta}-day buffer before arrival`;
  return `${Math.abs(delta)} day${Math.abs(delta)===1?'':'s'} after arrival`;
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
  if(result.status==='conflict') return 'Date conflict';
  if(result.status==='blocked') return 'Blocked by conflict';
  if(result.status==='late') return 'After arrival';
  if(result.status==='review') return 'Suggested · inactive';
  if(result.mode==='manual') return 'Pinned date';
  if(result.mode==='automatic') return 'Automatic';
  if(result.mode==='fixed') return plan.rebooked?'Rebooking needed':'Fixed appointment';
  if(result.mode==='source') return task.id==='bank'?'Independent':'Start date';
  if(result.mode==='milestone') return 'Calculated';
  return 'Planned';
}

function statusMark(status){
  return status==='complete'?'✓':status==='conflict'||status==='late'?'!':status==='blocked'?'⊘':status==='review'?'◇':'○';
}

function modeName(mode){
  return {automatic:'Automatic',manual:'Set by you',source:'Source date',fixed:'Fixed',milestone:'Calculated',completed:'Complete'}[mode]||'Planned';
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
  if(state.selected==='bank'&&!plan.bankReviewed) legend.push('<span><i class="legend-line dotted"></i> Suggested · inactive</span>');
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
  if(innerWidth<=760) $('#inspector').scrollIntoView({behavior:'smooth',block:'start'});
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

function conflictMarkup(task,result,plan){
  if(result.status==='conflict') return `<div class="conflict-note">${icon('info')}<div><strong>Date conflict</strong><p>You chose ${formatDay(result.day)}, but ${formatDay(result.earliest)} is the earliest valid date. Earlier steps were left unchanged.</p><div class="conflict-actions"><button class="button button-outline" id="use-earliest">Use ${formatDay(result.earliest)}</button>${canFollow(task.id,plan)?'<button class="button button-quiet" id="conflict-reset">Reset to automatic</button>':''}</div></div></div>`;
  if(result.status==='blocked') return `<div class="conflict-note">${icon('info')}<div><strong>Blocked by an earlier conflict</strong><p>Resolve the highlighted prerequisite before this date can be trusted.</p></div></div>`;
  return '';
}

function renderInspector(){
  const task=taskById(state.selected),plan=current(),schedule=calculate(plan),result=schedule[task.id];
  const edges=edgesFor(plan),incoming=edges.filter(edge=>edge.to===task.id),outgoing=edges.filter(edge=>edge.from===task.id);
  const changes=state.draft?impacts(state.plan,plan):[];
  const inputDay=plannedInputDay(task,result,plan);
  const editable=editableTask(task.id)&&inputDay!==null;
  const maxDay=task.id==='housing'?20:31;
  const laterEffects=changes.filter(change=>change.id!==task.id);
  const dateLabel=result.mode==='fixed'?'Appointment date':result.mode==='milestone'?'Calculated readiness':'Planned completion';

  const dateEditor=editable?`<div class="date-control"><label for="task-date">${dateLabel}</label><input id="task-date" type="date" min="2026-10-01" max="2026-10-${String(maxDay).padStart(2,'0')}" value="2026-10-${String(inputDay).padStart(2,'0')}" ${result.status==='blocked'&&result.day===null?'disabled':''}><p class="control-hint">Updates this step and its dependents.</p></div>${modeCard(task,result,plan)}`:`<div class="read-only-date"><span>${dateLabel}</span><strong class="${result.status==='conflict'?'text-danger':''}">${formatDay(result.day)}</strong></div>`;
  const impactList=state.draft?`<div class="detail-section impact-list"><h3>${laterEffects.length} OTHER ${laterEffects.length===1?'CHANGE':'CHANGES'} IN THIS PREVIEW</h3>${laterEffects.map(change=>`<button class="impact-item" data-impact="${change.id}"><span>${change.after.status==='conflict'?'!':change.after.status==='blocked'?'⊘':'↳'}</span><span><strong>${change.title}</strong><small>${change.after.status==='conflict'?`Conflict · earliest ${formatDay(change.after.earliest)}`:change.after.status==='blocked'?'Blocked until the earlier conflict is resolved':`${formatDay(change.before.day)} → ${formatDay(change.after.day)}`}</small></span></button>`).join('')||'<p class="empty-small">This change does not move another date.</p>'}</div>`:'';
  const dependencies=incoming.length?`<div class="detail-section"><h3>DEPENDS ON</h3>${incoming.map(edge=>{const source=taskById(edge.from);return `<button class="dependency-button" data-impact="${source.id}">${icon(source.icon)}<span>${source.title}${edge.suggested?'<small>Suggested · inactive until accepted</small>':`<small>${edge.lag?`${edge.lag} calendar day${edge.lag>1?'s':''} after`:'Ready to use'}</small>`}</span>${icon('arrow')}</button>`;}).join('')}</div>`:'';
  const unlocks=outgoing.length?`<div class="detail-section"><h3>THIS CAN MOVE</h3>${outgoing.map(edge=>`<button class="unlock-item" data-impact="${edge.to}"><span>↳</span>${taskById(edge.to).title}${edge.suggested?'<span class="suggestion-tag">?</span>':''}</button>`).join('')}</div>`:!incoming.length?'<div class="detail-section"><h3>INDEPENDENT STEP</h3><p class="empty-small">Changes elsewhere do not move this task.</p></div>':'';
  const evidence=state.draft&&task.id!=='bank'?'':task.id==='bank'&&!plan.bankReviewed?`<div class="assumption-card"><span>Suggested link · inactive</span><p>This task is independent, so ${formatDay(result.day)} is valid. Your address could improve a nearby-branch comparison.</p><div><button id="accept-link" class="button button-outline">Preview dependency</button><button id="dismiss-link" class="button button-quiet">Keep independent</button></div></div>`:`<details class="evidence-disclosure"><summary>Why this relationship?</summary><div class="evidence-card"><span>${task.source}</span><p>“${task.note}”</p><small>${task.sourceType}${task.id==='bank'&&plan.bankReviewed?plan.bankDependency?' · Address is a prerequisite':' · Kept independent':''}</small>${task.id==='bank'&&plan.bankReviewed?'<button class="button button-quiet" id="reopen-link">Review dependency again</button>':''}</div></details>`;
  const relationships=state.draft?'':`${dependencies}${unlocks}`;
  const bottom=task.kind==='complete'?'<p>Completed in this sample plan.</p>':task.kind==='milestone'?'<p>Calculated from the steps before it.</p>':'';

  $('#inspector').innerHTML=`
    <h2>${task.title}</h2>
    <p class="detail-description">${task.description}</p>
    ${dateEditor}
    ${conflictMarkup(task,result,plan)}
    ${impactList}
    ${relationships}
    ${evidence}
    ${bottom?`<div class="inspector-bottom">${bottom}</div>`:''}`;

  document.querySelectorAll('[data-impact]').forEach(element=>element.onclick=()=>selectTask(element.dataset.impact));
  $('#reset-automatic')?.addEventListener('click',()=>resetToAutomatic(task.id));
  $('#conflict-reset')?.addEventListener('click',()=>resetToAutomatic(task.id));
  $('#use-earliest')?.addEventListener('click',()=>setTaskDay(task.id,result.earliest));
  $('#reopen-link')?.addEventListener('click',reopenLink);
  $('#accept-link')?.addEventListener('click',()=>reviewLink(true));
  $('#dismiss-link')?.addEventListener('click',()=>reviewLink(false));
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
    return `<div class="timeline-row"><button class="timeline-label ${state.selected===task.id?'active':''}" data-timeline="${task.id}">${icon(task.icon)}<span>${task.title}<small>${statusLabel(task,result,plan)}</small></span></button><div class="time-grid">${diff&&before.day!==null?`<span class="ghost-date" style="left:${position(before.day)}%" aria-hidden="true"></span>`:''}${point}<span class="arrival-line" style="left:${position(18)}%" aria-hidden="true"></span></div></div>`;
  }).join('');
  $('.timeline-section').innerHTML=`<div class="timeline-heading"><strong>Timeline preview</strong><span><i class="ghost-key"></i> Saved &nbsp; <i class="new-key"></i> Preview</span></div><div class="timeline-ruler"><span>OCTOBER 2026</span><div>${[1,6,12,18,24,31].map(day=>`<span style="left:${position(day)}%">${String(day).padStart(2,'0')}</span>`).join('')}</div></div>${rows}<div class="timeline-footnote"><span>Drag a flexible date to adjust it.</span><span>Arrival: 18 Oct</span></div>`;
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
  const conflicts=TASKS.filter(task=>schedule[task.id].status==='conflict');
  const late=schedule.ready.status==='late',readyDay=schedule.ready.day;

  $('#plan-health').textContent=conflicts.length?`${conflicts.length} date conflict${conflicts.length===1?'':'s'}`:late?'Plan finishes after arrival':state.draft?(changes.length?'Preview ready':'No change yet'):state.undo?'Plan updated':'On track';
  $('#plan-summary').textContent=conflicts.length?`${conflicts.map(task=>task.title).join(', ')} · earlier steps stayed put`:late?`Ready ${formatDay(readyDay)} · ${bufferLabel(readyDay)}`:`Ready ${formatDay(readyDay)} · ${bufferLabel(readyDay)}`;
  $('.plan-overview').classList.toggle('warning',Boolean(conflicts.length)||late);
  $('#undo-button').hidden=!state.undo;
  $('#simulation-banner').hidden=!state.draft;
  if(state.draft){
    $('#simulation-caption').textContent=draftSummary(changes);
    $('#banner-compare').textContent=conflicts.length?(conflicts.length===1&&conflicts[0].id==='checkin'?'Compare recovery plans':'Go to conflict'):'Review change';
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
  const draft=clonePlan(state.draft||state.plan);
  if(!state.draft&&(id==='housing'||id==='checkin')&&draft[field]===day) return;
  draft[field]=day;
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
  announce('Address prerequisite reopened as an inactive suggestion.');
}

function undo(){
  if(!state.undo) return;
  state.plan=clonePlan(state.undo);
  state.undo=null;
  state.draft=null;
  const focusTask=state.lastEdited||'housing';
  state.selected=focusTask;
  render();
  (state.view==='list'?document.querySelector(`[data-list-task="${focusTask}"]`):$(`#node-${focusTask}`))?.focus({preventScroll:true});
  announce('Previous plan restored.');
}

function showDialog(html,wide=false){
  const root=$('#overlay-root');
  root.innerHTML=`<dialog class="dialog ${wide?'dialog-wide':''}" aria-labelledby="dialog-title"><button class="dialog-close icon-button" aria-label="Close dialog">${icon('close')}</button>${html}</dialog>`;
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
  const mode=result.mode==='manual'?' · set by you':result.mode==='automatic'?' · automatic':'';
  return `${formatDay(result.day)}${mode}`;
}

function openComparison(){
  if(!state.draft) return;
  const schedule=calculate(state.draft);
  const conflicts=TASKS.filter(task=>schedule[task.id].status==='conflict');
  if(conflicts.length&&!(conflicts.length===1&&conflicts[0].id==='checkin')){
    selectTask(conflicts[0].id);
    announce('Resolve the highlighted date conflict before applying the plan.');
    return;
  }
  const conflicted=conflicts.length===1;
  const options=conflicted?recoveries(state.draft):[{id:'keep',title:'Apply the preview',label:'Updated plan',description:'Keep the dates and dependency modes shown in the preview.',assumption:'Updates this demo plan only.',plan:clonePlan(state.draft)}];
  state.choice=conflicted?null:'keep';
  const recoveryMarkup=conflicted?`<p class="dialog-intro">Choose how to resolve the appointment without moving an earlier date silently.</p><div class="recovery-options">${options.map(option=>{const dates=calculate(option.plan);return `<label class="recovery-option"><input type="radio" name="recovery" value="${option.id}"><span class="option-topline"><span>${option.label}</span><span class="radio-mark"></span></span><strong>${option.title}</strong><p>${option.description}</p><div class="outcome-chip ${dates.ready.day>18?'late':''}">${bufferLabel(dates.ready.day)}</div><dl><div><dt>Housing confirmed</dt><dd>${formatDay(dates.housing.day)}</dd></div><div><dt>Office check-in</dt><dd>${formatDay(dates.checkin.day)}</dd></div><div><dt>Ready</dt><dd class="${dates.ready.day>18?'text-danger':'text-green'}">${formatDay(dates.ready.day)}</dd></div></dl><div class="option-assumption">${icon('info')}<span>${option.assumption}</span></div></label>`;}).join('')}</div>`:'';
  const dialog=showDialog(`<div class="dialog-kicker">${conflicted?'CHOOSE A RESPONSE':'REVIEW CHANGES'}</div><h2 id="dialog-title">${conflicted?'Resolve the fixed appointment':'Apply this plan?'}</h2>${recoveryMarkup}<div id="change-review"></div><p class="decision-note">This updates the demo only. It does not change a booking or contact anyone.</p><div class="dialog-footer"><span id="apply-summary">${conflicted?'Select an option to continue.':''}</span><button class="button button-primary" id="apply-plan" ${conflicted?'disabled':''}>${conflicted?'Choose an option':'Apply plan'}</button></div>`,conflicted);

  const update=()=>{
    const option=options.find(item=>item.id===state.choice);
    dialog.querySelectorAll('.recovery-option').forEach(element=>element.classList.toggle('chosen',element.querySelector('input').value===state.choice));
    if(!option){
      $('#change-review').innerHTML='<div class="comparison-prompt">Choose an option above to see its exact changes.</div>';
      $('#apply-plan').disabled=true;
      return;
    }
    const changes=impacts(state.plan,option.plan),dates=calculate(option.plan);
    $('#change-review').innerHTML=`<div class="change-review-title"><strong>${changes.length} ${changes.length===1?'step':'steps'} will change</strong><span>BEFORE <span>→</span> AFTER</span></div>${changes.map(change=>`<div class="review-row"><span>${change.title}</span><span><del>${reviewValue(change,'before',option.plan)}</del>${icon('arrow')}<strong>${reviewValue(change,'after',option.plan)}</strong></span></div>`).join('')||'<p class="empty-small">No visible dates will change.</p>'}`;
    $('#apply-summary').textContent=bufferLabel(dates.ready.day);
    $('#apply-plan').disabled=false;
    $('#apply-plan').innerHTML=`Apply ${conflicted?(state.choice==='rebook'?'option A':'option B'):'this plan'} ${icon('arrow')}`;
  };
  dialog.querySelectorAll('[name="recovery"]').forEach(element=>element.onchange=()=>{state.choice=element.value;update();});
  $('#apply-plan').onclick=()=>{
    const option=options.find(item=>item.id===state.choice);
    if(!option) return;
    const ready=calculate(option.plan).ready.day;
    state.undo=clonePlan(state.plan);
    state.plan=clonePlan(option.plan);
    state.draft=null;
    dialog.close();
    render();
    $('#undo-button').focus({preventScroll:true});
    announce(`Plan updated. ${bufferLabel(ready)}.`);
  };
  update();
}

function showAbout(){
  showDialog(`<div class="dialog-kicker">${icon('graph')} WHY THIS TOOL</div><h2 id="dialog-title">Seven cities taught me to stop treating a move like a checklist.</h2><p class="dialog-intro">A list shows what is due. A dependency map shows what will move, what will stay put, and where a person still needs to decide.</p><div class="about-facts"><p><strong>Personal starting point.</strong> This tool comes from Hayk’s experience living in seven cities over four years. The Tokyo-to-San Francisco dates and notes are an illustrative scenario, not official relocation requirements.</p><p><strong>Interaction rule.</strong> Edit any flexible step directly. Dates flow forward to dependent steps, never backward. A date set by you becomes a boundary; if an upstream delay makes it impossible, the planner preserves your intent and surfaces the conflict.</p><p><strong>Design judgment.</strong> Fixed commitments never move silently. AI-suggested links remain inactive until a person reviews and applies them, and every applied plan can be undone.</p><p><strong>How AI contributed.</strong> AI helped structure the sample scenario, surface edge cases, and critique the interaction. The dates shown here come from visible local rules; no live model or external booking is connected.</p></div><button class="button button-primary" id="about-done">Back to the plan ${icon('arrow')}</button>`);
  $('#about-done').onclick=()=>document.querySelector('dialog').close();
}

$('.surface-toolbar').innerHTML=`<div class="view-title">Dependency map</div><div class="graph-direction-hint">Arrows show active dependencies.</div>`;
$('#graph-viewport').insertAdjacentHTML('afterend','<div id="steps-list" class="steps-list" hidden></div>');
$('.workspace').insertAdjacentHTML('beforebegin',`<div id="simulation-banner" class="simulation-banner" hidden><div>${icon('edit')}<strong>UNSAVED CHANGE</strong><span id="simulation-caption"></span></div><div><button class="button button-quiet" id="discard-simulation">Reset preview</button><button class="button button-primary" id="banner-compare">Review change</button></div></div>`);

$('#about-button').onclick=showAbout;
$('#undo-button').onclick=undo;
$('#discard-simulation').onclick=discardPreview;
$('#banner-compare').onclick=()=>{
  const schedule=calculate(current()),conflicts=TASKS.filter(task=>schedule[task.id].status==='conflict');
  if(conflicts.length&&!(conflicts.length===1&&conflicts[0].id==='checkin')) selectTask(conflicts[0].id);
  else openComparison();
};
compactView.addEventListener('change',event=>{state.view=event.matches?'list':'map';render();});
window.addEventListener('resize',fitGraph);
render();

const context=document.modelContext;
if(context?.registerTool){
  const controller=new AbortController();
  const snapshot=()=>({plan:clonePlan(state.plan),preview:state.draft?clonePlan(state.draft):null,selectedTask:state.selected,schedule:calculate(current())});
  const definitions=[
    {name:'read_move_plan',title:'Read move plan',description:'Read the saved plan, staged preview, date modes, and calculated schedule.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute:()=>snapshot()},
    {name:'stage_task_date',title:'Change a move step date',description:'Stage an October 2026 completion date for an editable move step. The change flows only to descendants.',inputSchema:{type:'object',properties:{taskId:{type:'string',enum:Object.keys(DATE_FIELDS)},day:{type:'integer',minimum:1,maximum:31}},required:['taskId','day'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>{if(!input||Object.keys(input).some(key=>!['taskId','day'].includes(key))||!DATE_FIELDS[input.taskId]||!Number.isInteger(input.day)) throw new Error('Provide an editable taskId and an integer October day.');setTaskDay(input.taskId,input.day);return snapshot();}},
    {name:'inspect_move_step',title:'Inspect a move step',description:'Select a step and show its date mode, dependencies, and evidence.',inputSchema:{type:'object',properties:{taskId:{type:'string',enum:TASKS.map(task=>task.id)}},required:['taskId'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>{if(!input||Object.keys(input).some(key=>key!=='taskId')) throw new Error('Provide a taskId.');selectTask(input.taskId);return snapshot();}},
    {name:'reset_task_to_dependencies',title:'Reset a task to automatic',description:'Remove a manual date from an eligible task so it follows its dependencies again.',inputSchema:{type:'object',properties:{taskId:{type:'string',enum:['address','internet','bank']}},required:['taskId'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>{if(!input||!canFollow(input.taskId)) throw new Error('Choose a task that can follow dependencies.');resetToAutomatic(input.taskId);return snapshot();}},
    {name:'discard_move_preview',title:'Discard move preview',description:'Discard staged date and dependency changes.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:()=>{discardPreview();return snapshot();}}
  ];
  for(const tool of definitions){try{Promise.resolve(context.registerTool(tool,{signal:controller.signal})).catch(()=>{});}catch{}}
  window.addEventListener('pagehide',()=>controller.abort(),{once:true});
}
