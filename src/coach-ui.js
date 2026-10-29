import {rideNoun} from './copy-counts.js';
import {message} from './copy.js';
import {sleepPickerMarkup,mountSleepPickers} from './sleep-picker.js';
import {historyInsight} from './history-insight.js';
import {coachPlan,goalDistanceRange,validateCoachSettings,validateCheckin,coachEvidence} from './coach.js';
import {planningWeatherSnapshot} from './weather.js';
import {num,date} from './metrics.js';
import {dateKey,localDate} from './periods.js';
import {locale} from './i18n.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const minutes=n=>new Intl.NumberFormat(locale(),{style:'unit',unit:'minute',unitDisplay:'short',maximumFractionDigits:0}).format(n);
const rideWord=rideNoun;
const focus=s=>s.focus==='speed'?message('m252bc681f5ce'):message('me1cc2a8cdd5b');
const days=()=>Array.from({length:7},(_,i)=>new Intl.DateTimeFormat(locale(),{weekday:'short'}).format(new Date(2026,9,19+i)));
const reasonCopy={"easy-base": "m63834457a03a", "history-limited": "ma18c1c3ce1a0", "return": "m20f824969096", "load-increase": "m878b8661addc", "wellbeing-reduced": "m5032058c1a58", "wellbeing-rest": "m9e933eb98b1f", "checkin-missing": "md29ebfdb0e3c", "long-session": "mda964c399ff0", "regularity": "ma0d2df55d4e4", "after-hard": "md036a1de47bc", "speed-session": "m2f5dbf9f6ef8", "speed-week": "m86dd7f192e8d", "speed-base": "ma680f7bdd632", "goal-high": "m2e0e8074cf93", "goal-low": "m03e5fd1953be", "goal-done": "m51009a04d1f9", "recorded": "mf7fd7e27a849", "unavailable": "mecedba11a520", "rest-spacing": "m71ecdf8d86b4", "indoor": "m4062d3f7ce11", "weather-rest": "mc8e9d4a9b946", "weather-adjusted": "ma928faf5e196", "weather-missing": "m1a5291a2814c", "weather-stale": "m4c57fae3d4cb", "weather-partial": "m7ec591196eb8", "wind-strong": "mdf97567c4b51", "gusts-strong": "m36f110992360", "wind": "m4008b4416128", "gusts": "m1982f8eb56b4", "heat-strong": "m8110eb20cfbb", "heat": "m70d175390a18", "rain": "m58cf0b0383ef", "storm-ice": "m5dc46a86c83b", "expired": "m65bb108e6477"};
const reason=id=>reasonCopy[id]?message(reasonCopy[id]):id;
const types={"rest": "md429f9dcd0ac", "recorded": "mf463071cd959", "endurance": "m7158ff6fd3cf", "long": "ma98852a4b64e", "recovery": "mf29808792ad0", "intervals": "mac9557a2aeb4"};
const type=r=>types[r.type]?message(types[r.type]):'';
export function coachSettingsFields(settings=null){
 const s=settings||{days:[1,3,5],weeklyMinutes:120,sessionMinutes:60,comfortableMinutes:30,focus:'endurance'};
 return `<fieldset class="coach-fields" data-coach-fields><legend>${message('mea3ee7e420b5')}</legend><label>${message('m6041d69737aa')}<select name="coachFocus" aria-label="${message('m6041d69737aa')}"><option value="endurance" ${s.focus!=='speed'?'selected':''}>${message('me1cc2a8cdd5b')}</option><option value="speed" ${s.focus==='speed'?'selected':''}>${message('m252bc681f5ce')}</option></select></label><label>${message('mb76d445f09ce')}<select name="coachLevel" aria-label="${message('mb76d445f09ce')}" required><option value="">${message('m8cff9835a4a0')}</option>${[['beginner',message('m088f25614b06')],['returning',message('m845ce19e1f88')],['regular',message('m73f160c15ed8')]].map(([v,label])=>`<option value="${v}" ${s.level===v?'selected':''}>${label}</option>`).join('')}</select></label><div class="coach-form-grid"><label>${message('m6bb64cdf6e70')}<input name="coachWeekly" type="number" min="30" max="1200" required value="${esc(s.weeklyMinutes)}"></label><label>${message('m401bae009ea8')}<input name="coachSession" type="number" min="15" max="300" required value="${esc(s.sessionMinutes)}"></label></div><label>${message('m58125946cd20')}<input name="coachComfortable" type="number" min="15" max="300" required value="${esc(s.comfortableMinutes)}"></label><div class="stack"><span>${message('md071eff22c1d')}</span><div class="coach-day-options">${days().map((label,i)=>`<label><input type="checkbox" name="coachDays" value="${i}" ${s.days.includes(i)?'checked':''}><span>${label}</span></label>`).join('')}</div></div><label class="coach-check"><input type="checkbox" name="coachIndoor" ${s.indoor?'checked':''}>${message('mbf14a79548ba')}</label><label class="coach-check"><input type="checkbox" name="coachHistory" ${s.historyConfirmedOn&&s.historyConfirmedOn>=dateKey(Date.now()-7*86400000)?'checked':''}>${message('m658fafaafeae')}</label><p class="muted small">${message('m18cdc77324b8')}</p></fieldset>`;
}
export function readCoachSettings(form,now=Date.now()){
 const f=new FormData(form);return validateCoachSettings({enabled:true,focus:f.get('coachFocus'),level:f.get('coachLevel'),days:f.getAll('coachDays').map(Number),weeklyMinutes:f.get('coachWeekly'),sessionMinutes:f.get('coachSession'),comfortableMinutes:f.get('coachComfortable'),indoor:f.has('coachIndoor'),historyConfirmedOn:f.has('coachHistory')?dateKey(now):null},now);
}
function rangeMarkup(range,target){
 const high=Math.max(range.high,target,1),left=range.low/high*100,width=(range.high-range.low)/high*100;
 return `<div class="coach-goal-range"><div class="spread"><span class="muted small">${message('m572b0da33f75')}</span><strong>${num(range.low,0)}–${num(range.high,0)} ${message('m0e987caf8587')}</strong></div><div class="coach-range-track" role="img" aria-label="${esc(message('m1ea42e60cb8e')+' '+num(range.low,0)+'–'+num(range.high,0)+'; '+message('m242659f74ed6')+' '+num(target,0))}"><i style="left:${left}%;width:${width}%"></i><b style="left:${Math.min(99,target/high*100)}%"></b></div><div class="spread muted small"><span>${message('md3636111ecda')}</span><span>${message('mb6d8f2b99ddf')}</span></div></div>`;
}
export function goalCoachPreview(form,rides,now=Date.now()){
 const f=new FormData(form),settings=readCoachSettings(form,now),range=goalDistanceRange({from:f.get('from'),to:f.get('to')},rides,settings,now);if(!range)return {html:`<p>${message('me486aba6ff1c')}</p>`,range:null};
 const target=Number(f.get('target'))||0;
 return {range,html:`${rangeMarkup(range,target)}<p class="muted small">${range.speedSource==='history'?message('mb43671b2ae5e'):message('mfe615614d459')}</p>${target>range.high?`<p class="coach-warning">${reason('goal-high')}</p>`:''}<button type="button" class="pill" data-coach-suggest>${message('m38e0fa3b39d0')}</button>`};
}
function steps(row){
 if(row.rest||row.hasRide)return '';
 const interval=row.type==='intervals',parts=interval?[[10,'easy',message('m87944a8d3c72')],[3,'work','1 / 3'],[3,'easy',message('m756c2987c77d')],[3,'work','2 / 3'],[3,'easy',message('m756c2987c77d')],[3,'work','3 / 3'],[row.minutes-25,'easy',message('m7bda7027ce38')]]:[[5,'easy',message('m87944a8d3c72')],[row.minutes-10,'steady',message('ma7be2cb3cef6')],[5,'easy',message('m7bda7027ce38')]];
 return `<div class="coach-workout"><div class="coach-workout-track" role="img" aria-label="${esc(parts.map(([n,,label])=>label+' '+minutes(n)).join(', '))}">${parts.map(([n,k])=>`<i class="${k}" style="flex:${n}"></i>`).join('')}</div><div class="coach-step-list">${parts.map(([n,k,label])=>`<div><i class="${k}"></i><span>${label}</span><strong>${minutes(n)}</strong></div>`).join('')}</div><p class="muted small">${interval?message('m3fd9740f76e3'):row.type==='recovery'?message('me9ee69f4d7eb'):message('m636e4aaa3ad9')}</p></div>`;
}
function weatherMarkup(row){const w=row.weather.data;return `<div class="coach-weather-grid">${[[message('ma251c13acb98'),w&&Number.isFinite(w.high)?num(w.low,0)+'…'+num(w.high,0)+'°C':'—'],[message('m19e3dea25972'),w?num(w.wind,0)+' '+message('m8ea493a8b131'):'—'],[message('mc38251ff7fec'),w?num(w.gusts,0)+' '+message('m8ea493a8b131'):'—']].map(([label,v])=>`<div><small>${label}</small><strong>${v}</strong></div>`).join('')}</div>`}
const distance=r=>r.indoor?message('m01ba7ac27485'):r.kmLow!==null?`${num(r.kmLow)}–${num(r.kmHigh)} ${message('m44a6ca4483b6')}`:'';
export function coachOverviewMarkup(model){const row=model?.rows.find(r=>r.current);if(!row)return '';return `<p class="goal-story overview-today"><strong>${message('mb59f84f2479f')} · ${type(row)}${row.minutes?' · '+minutes(row.minutes):''}</strong>${row.minutes?' · '+distance(row):''}. <a href="#intellect" class="accent">${message('mbc7301985e79')} →</a></p>`}
function coachWeekStripMarkup(model,{linked=false}={}){
 const sessions=model.rows.filter(r=>r.minutes>0).length,max=Math.max(1,...model.rows.map(r=>r.minutes));
 return `<div class="spread"><h2>${message('m0c5748076de2')}</h2><span class="muted small">${minutes(model.minutes)} · ${sessions} ${rideWord(sessions)}</span></div><div class="coach-week-strip">${model.rows.map(r=>{
  const content=`<small>${new Intl.DateTimeFormat(locale(),{weekday:'short'}).format(localDate(r.date))}</small><span class="coach-day-bar"><i style="height:${r.minutes?Math.max(8,r.minutes/max*56):2}px"></i></span><strong>${r.hasRide?'✓':r.minutes||'—'}</strong><small>${r.hasRide?message('m09c719afee5d'):r.minutes?message('m9c8e165d7166'):message('m22693f5e21e6')}</small>`;
  const cls=`coach-week-day ${r.type==='intervals'?'is-work':''}`,label=`${date(r.date+'T12:00')} · ${type(r)}${r.minutes?' · '+minutes(r.minutes):''}`;
  return linked?`<a href="#intellect/${r.date}" class="${cls}" aria-label="${esc(label)}">${content}</a>`:`<button type="button" data-coach-day="${r.date}" class="${cls}" aria-label="${esc(label)}">${content}</button>`;
 }).join('')}</div>${!model.rows.length?`<p class="muted small">${message('m9539c2036d0a')}</p>`:''}`;
}
export function coachUpcomingMarkup(model,{hasGoal=false}={}){
 if(!model)return `<section class="stack coach-schedule overview-upcoming"><h2>${message('m0c5748076de2')}</h2><p class="muted small">${message('mbeec46c72949')}</p><button type="button" class="link-button" data-action="${hasGoal?'coach-setup':'add-goal'}">${message('m2ee9d17b1efc')} →</button></section>`;
 return `<section class="stack coach-schedule overview-upcoming">${coachWeekStripMarkup(model,{linked:true})}</section>`;
}
export function coachHistoryMarkup(rides,{now=Date.now(),icon=()=>''}={}){
 const h=historyInsight(rides,now),trend=h.trend;
 if(!h.count)return `<p class="goal-story overview-coach-insight">${icon('progress')} ${message('ma8ddf62fb21f')}</p>`;
 const km='<strong>'+num((h.distance||0)/1000)+'</strong>',change=trend?'<strong>'+num(Math.abs(trend.change),0)+'</strong>':'';
 const summary=h.distance===null?message('m80f25651728d'):h.distanceCount<h.count?message('mf723fdd73204',[km]):message('m54d383e84816',[km]);
 let detail='';
 if(trend){
  if(trend.kind==='volume'&&trend.metric==='distance')detail=trend.change>0?message('m2abde231891e',[trend.days,change]):message('meae91e49371d',[trend.days,change]);
  else if(trend.kind==='volume')detail=trend.change>0?message('m5ce658944550',[trend.days,change]):message('m14ea2aa00072',[trend.days,change]);
  else if(trend.kind==='regularity')detail=message('mc7b2b5fb581c',[trend.recentDays,trend.days,trend.earlyDays]);
  else detail=trend.metric==='distance'?message('mc4917dd63a1d',[change,trend.days]):message('m78736315e783',[change,trend.days]);
 }else detail=`${h.longest>0?message('m36284ecafe69',[num(h.longest/1000)])+' ':''}${message('mbf1c5cd0d98d')}`;
 return `<p class="goal-story overview-coach-insight" aria-label="${message('m935b6b9df684')}">${icon('rides')} ${summary} ${icon('progress')} ${detail}</p>`;
}
const evidenceCopy={"distribution": ["mb44d7914487e", "m49d523dd719d"], "wellbeing": ["m8783e62916ef", "m690b6b9f80a2"], "rpe": ["ma17938d630c8", "m6c03eb059227"], "heat": ["mde9dee22522b", "m3f56c291323e"]};
export function coachSection({goal,state,rides,profile={},now=Date.now()}){
 const model=coachPlan({goal,state,rides,profile,weather:planningWeatherSnapshot(now),now});
 if(!model)return {model:null,html:`<section class="card"><h2>${message('md6be2d3139eb')}</h2><p>${message('m697124e423b6')}</p><button class="link-button" data-action="${goal?'coach-setup':'add-goal'}">${message('m2ee9d17b1efc')} →</button></section>`};
 const h=model.history,today=dateKey(now),checkin=model.checkin,fitMinutes=h.weeks.reduce((s,x)=>s+x,0);
 const settings=`<details class="fold"><summary>${message('m481276dadbb5')}</summary><form id="coach-settings-form">${coachSettingsFields(state.settings)}<p class="error small" data-coach-error role="alert"></p><button class="button">${message('mcebd79c08c05')}</button></form></details>`;
 const wellness=`<details class="fold coach-checkin" ${!checkin?'open':''}><summary>${message('mce9be216b83c')}${checkin?' · ✓':''}</summary><form id="coach-checkin-form"><p class="muted small">${message('m7b158e53af36')}</p>${sleepPickerMarkup(checkin?.sleepHours)}<div class="coach-wellness-scales">${[['sleepQuality',message('m20de1beaecf7'),message('m23a4c935ecc5'),message('meae270f23950')],['fatigue',message('m59a8a2513013'),message('m4d508daa1b56'),message('m1df939993e74')],['stress',message('m0acc16995292'),message('m7fe59fb24c35'),message('m31f29c2c5fed')]].map(([key,label,low,high])=>wellnessSliderMarkup(key,label,low,high,checkin?.[key])).join('')}</div><p class="error small" data-coach-error role="alert"></p><button class="button">${message('m4f63e471555d')}</button></form></details>`;
 const goalCard=`<section class="card coach-goal"><div class="spread"><h2 data-user-content>${esc(goal.title)}</h2><span class="badge">${focus(state.settings)}</span></div><p>${date(goal.from+'T12:00')} — ${date(goal.to+'T12:00')}</p><div class="metrics"><div class="metric"><small>${message('mdbd1ea2cf469')}</small><strong>${num(model.range.completed,0)}</strong></div><div class="metric"><small>${message('m493ab087080f')}</small><strong>${num(model.remaining,0)}</strong></div></div><progress value="${Math.min(goal.target,model.range.completed)}" max="${goal.target}" aria-label="${message('m197641e5ad7e')}"></progress><p>${message('m255b32331a4d')}: <strong>${num(goal.target,0)} ${message('m0e987caf8587')}</strong></p>${rangeMarkup(model.range,goal.target)}${model.notes.includes('goal-high')?`<p class="coach-warning">${reason('goal-high')}</p>`:''}<button class="link-button" data-edit-goal="${esc(goal.id)}">${message('m178123946b33')} →</button></section>`;
 const maxWeek=Math.max(1,...h.weeks),history=`<section class="stack coach-history"><div class="spread"><h2>${message('mef7c144ed7cf')}</h2><span class="muted small">${h.established?message('mc519bfe23983'):message('md55b5c5ca98c')}</span></div><div class="coach-history-bars" role="img" aria-label="${esc(message('m8a00daba4ee7')+': '+h.weeks.slice().reverse().map(n=>num(n,0)).join(', '))}">${h.weeks.slice().reverse().map((n,i)=>`<div><strong>${num(n,0)}</strong><i style="height:${Math.max(2,n/maxWeek*64)}px"></i><small>${i===3?message('m6a6b49c0f52b'):'−'+(4-i)+' '+message('m73c8af37a446')}</small></div>`).join('')}</div><div class="coach-facts"><span>${num(fitMinutes,0)} ${message('m88ea9b2a87cd')}</span><span>${num(h.count,0)} ${rideNoun(h.count)}</span><span>${h.rpeCount?num(h.rpeLoad,0)+' '+message('m4a4e7db8c12d')+' '+h.rpeCount+' '+message('ma39fe2266ee6'):message('m39e659e55a43')}</span></div></section>`;
 const week=`<section class="stack coach-schedule">${coachWeekStripMarkup(model)}<div class="stack">${model.rows.map(r=>`<details class="fold coach-session" id="coach-${r.date}" ${r.current?'open':''}><summary><span><small class="muted">${r.current?message('mb59f84f2479f'):date(r.date+'T12:00')}</small><strong>${type(r)}${r.indoor?' · '+message('me79850d72af0'):''}</strong></span><span>${r.hasRide?num(r.actual)+' '+message('m0e987caf8587'):r.minutes?minutes(r.minutes):'—'}</span></summary><div class="stack">${r.minutes?`<p>${distance(r)}</p>${steps(r)}`:''}${weatherMarkup(r)}<ul class="coach-reasons">${[...new Set(r.reasons)].map(id=>`<li>${reason(id)}</li>`).join('')}</ul>${!r.current&&r.minutes?`<p class="muted small">${message('medb0edbe6759')}</p>`:''}</div></details>`).join('')}</div></section>`;

 const method=`<details class="fold"><summary>${message('m7075d5790da4')}</summary><div class="stack"><ul class="coach-reasons">${model.notes.map(id=>`<li>${reason(id)}</li>`).join('')}</ul><p class="muted small">${message('m4506816d44f6')}</p>${coachEvidence.map(e=>`<div class="coach-source"><a class="link-button" href="${e.url}" target="_blank" rel="noreferrer">${e.title} ↗</a><p>${message(evidenceCopy[e.id][0])}</p><small class="muted">${message(evidenceCopy[e.id][1])}</small></div>`).join('')}<p class="muted small">${message('m91f2172c7fec')}</p></div></details>`;
 const weatherState=`<section class="stack coach-weather-status" data-plan-weather><div class="spread"><h2>${message('mc870ef2664ba')}</h2><a class="link-button" href="#athlete">${message('m6ba0941e83dc')} →</a></div><p class="muted small"><span data-user-content>${esc(model.weather.city||message('m18f3387fd551'))}</span> · ${model.weather.status==='fresh'?message('m393f80597a3b'):model.weather.status==='stale'?message('m2cb6153a6fe5'):message('m7875b4da469b')}${model.weather.at?' · '+new Date(model.weather.at).toLocaleString(locale(),{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):''}</p><p class="muted small">${message('mabf8418882af')}</p></section>`;
 return {model,html:`<div class="coach-dashboard"><div class="stack">${goalCard}${wellness}${settings}${history}</div><div class="stack">${week}${weatherState}${method}</div></div>`};
}
export function mountCoach(root,{state,onSave,now=Date.now(),openDay=null}){
 const stopSleepPickers=mountSleepPickers(root);
 let scrollFrame;
 if(/^\d{4}-\d{2}-\d{2}$/.test(openDay||'')){const item=root.querySelector('#coach-'+openDay);if(item){item.open=true;scrollFrame=requestAnimationFrame(()=>{if(item.isConnected)item.scrollIntoView({block:'start'})})}}
 for(const input of root.querySelectorAll('[data-wellness-slider]'))input.oninput=()=>{const output=input.closest('.coach-slider-field').querySelector('output');output.textContent=input.value+' / 5';input.setAttribute('aria-valuetext',input.value+' / 5')};
 for(const button of root.querySelectorAll('[data-coach-day]'))button.onclick=()=>{const item=root.querySelector('#coach-'+button.dataset.coachDay);if(item){item.open=true;item.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'})}};
 const bind=(id,read)=>{const form=root.querySelector(id);if(form)form.onsubmit=async event=>{event.preventDefault();const button=form.querySelector('button[type=submit],button:not([type])');try{if(button)button.disabled=true;const updated=read(form);await onSave(updated)}catch(e){const out=form.querySelector('[data-coach-error]');if(out)out.textContent=e.message}finally{if(button)button.disabled=false}}};
 bind('#coach-settings-form',form=>({...state,settings:readCoachSettings(form,now)}));
 bind('#coach-checkin-form',form=>{const entry=validateCheckin({date:dateKey(now),...Object.fromEntries(new FormData(form))},now);return {...state,checkins:[...state.checkins.filter(x=>x.date!==entry.date),entry].slice(-730)}});
 return ()=>{stopSleepPickers();if(scrollFrame!==undefined)cancelAnimationFrame(scrollFrame)};
}

export function wellnessSliderMarkup(key,label,low,high,value){
 const selected=Number.isFinite(value)?Math.max(1,Math.min(5,Math.round(value))):3,id='wellness-'+key;
 return `<div class="coach-slider-field"><div class="spread"><label for="${esc(id)}">${esc(label)}</label><output for="${esc(id)}">${selected} / 5</output></div><input id="${esc(id)}" name="${esc(key)}" type="range" min="1" max="5" step="1" value="${selected}" aria-valuetext="${selected} / 5" data-wellness-slider><div class="spread muted small"><span>1 · ${esc(low)}</span><span>5 · ${esc(high)}</span></div></div>`;
}
