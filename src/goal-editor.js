import {isTrainingGoal,smartGoalKinds} from './training-goals.js';
import {trainingCopy as copy} from './training-copy.js';
import {message} from './copy.js';
import {validateGoal} from './intellect.js';
import {coachSettingsFields,readCoachSettings,goalCoachPreview} from './coach-ui.js';
import {dateKey,localDate,nextDay} from './periods.js';
import {localize,t} from './i18n.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
export function defaultGoal(now=Date.now()){
 const next=new Date(now);next.setMonth(next.getMonth()+1,1);const last=new Date(next.getFullYear(),next.getMonth()+1,0);
 return {title:'',kind:'distance',target:250,from:dateKey(next),to:dateKey(last),smart:true};
}
// Capture disabled questionnaire fields too, so switching goal kinds and a
// connectivity-triggered render cannot erase the work already entered.
export function captureGoalDraft(form){
 const value=name=>form.elements.namedItem(name)?.value??'';
 const checked=name=>form.elements.namedItem(name)?.checked===true;
 const draft={};for(const key of ['title','kind','target','from','to','coachFocus','coachLevel','coachWeekly','coachSession','coachComfortable'])draft[key]=value(key);
 for(const key of ['smart','coachIndoor','coachHistory'])draft[key]=checked(key);
 draft.coachDays=[...form.querySelectorAll('[name=coachDays]:checked')].map(el=>Number(el.value));return draft;
}
export function goalEditorMarkup({goal=null,settings=null,draft=null,returnTo='intellect',now=Date.now()}={}){
 const g={...(goal||defaultGoal(now)),...(draft||{})},edit=!!goal?.id;
 const s=draft?{focus:draft.coachFocus,level:draft.coachLevel,days:draft.coachDays,weeklyMinutes:draft.coachWeekly,sessionMinutes:draft.coachSession,comfortableMinutes:draft.coachComfortable,indoor:draft.coachIndoor,historyConfirmedOn:draft.coachHistory?dateKey(now):null}:settings;
 const personal=isTrainingGoal(g)&&(g.smart||g.kind==='event');
 return `<h1>${edit?message('m3d15542acc4a'):message('m8fe1d0f61a53')}</h1><p class="muted">${message('mb12caeb56486')}</p><form id="goal-editor-form" class="goal-editor-form"><div class="goal-editor-layout"><section class="stack"><h2>${message('m8aee07a727fe')}</h2><label>${message('me9de9447df93')}<input name="title" required maxlength="100" placeholder="${message('m2594ad83ff99')}" value="${esc(g.title)}"></label><label>${message('m490c933cca3b')}<select name="kind" aria-label="${message('m490c933cca3b')}">${[['distance',message('m34e33e3d6e94')],['duration',message('m0b2b90950984')],['count',message('m87083ab396d2')],['weekly-time',copy('weekly')],['event',copy('event')]].map(([key,label])=>`<option value="${key}" ${g.kind===key?'selected':''}>${label}</option>`).join('')}</select></label><label data-goal-target ${g.kind==='event'?'hidden':''}>${message('mbc76fd1369e8')}<input type="number" name="target" min="${g.kind==='count'?'1':'0.1'}" max="100000" step="${g.kind==='count'?'1':'0.1'}" ${g.kind==='event'?'disabled':'required'} value="${esc(g.target)}"></label><div class="goal-dates"><label>${message('ma167f7dbaff1')}<input type="date" name="from" value="${esc(g.from)}" required></label><label><span data-goal-end-label>${g.kind==='event'?copy('eventDate'):message('m910c29fe60f4')}</span><input type="date" name="to" value="${esc(g.to)}" required></label></div><label class="smart-option" ${isTrainingGoal(g)&&g.kind!=='event'?'':'hidden'}><input type="checkbox" name="smart" ${g.smart?'checked':''} ${isTrainingGoal(g)?'':'disabled'}><span>${message('mc7dea90ede9d')}</span></label><p class="muted small" data-goal-preview></p></section><section class="stack" data-goal-coach ${personal?'':'hidden'}><h2>${message('m97f93b3f8374')}</h2>${coachSettingsFields(s)}<div class="stack" data-coach-goal-range aria-live="polite"></div></section></div><p class="error small" data-goal-error role="alert"></p><div class="goal-editor-actions"><a class="button secondary" href="#${esc(returnTo)}">${message('m1f823de5eed5')}</a><button type="submit" class="button">${edit?message('mc6039d2c3bb7'):message('m53f1897cff95')}</button></div></form>${edit?`<section class="goal-editor-delete"><button type="button" class="link-button danger-text" data-remove-goal="${esc(goal.id)}">${t('Удалить цель')}</button></section>`:''}`;
}
export function mountGoalEditor(root,{rides=[],plans=[],onSave}){
 const form=root.querySelector('#goal-editor-form');if(!form)return;
 let saving=false,previousKind=form.elements.kind.value;const targets=new Map([[previousKind,form.elements.target.value]]);
 const update=()=>{
  const kind=form.elements.kind.value,supported=smartGoalKinds.includes(kind),personal=supported&&(kind==='event'||form.elements.smart.checked);
  if(previousKind!==kind){targets.set(previousKind,form.elements.target.value);form.elements.target.value=targets.get(kind)??({distance:250,duration:10,count:12,'weekly-time':6,event:1}[kind]);previousKind=kind}
  form.elements.smart.disabled=!supported;form.elements.smart.closest('label').hidden=!supported||kind==='event';
  const from=form.elements.from.value;form.elements.to.min=localDate(from)?from:'';form.elements.to.max=personal&&localDate(from)?nextDay(from,365):'';
  form.elements.target.step=kind==='count'?'1':'0.1';form.elements.target.min=form.elements.target.step;form.elements.target.max=kind==='weekly-time'?'168':'100000';form.elements.target.disabled=kind==='event';form.elements.target.required=kind!=='event';form.querySelector('[data-goal-target]').hidden=kind==='event';form.querySelector('[data-goal-end-label]').textContent=kind==='event'?copy('eventDate'):message('m910c29fe60f4');
  const block=form.querySelector('[data-goal-coach]'),fields=form.querySelector('[data-coach-fields]'),output=form.querySelector('[data-coach-goal-range]'),preview=form.querySelector('[data-goal-preview]');block.hidden=!personal;fields.disabled=!personal;
  if(personal){try{const result=goalCoachPreview(form,rides,Date.now(),plans);output.innerHTML=result.html;const suggest=output.querySelector('[data-coach-suggest]');if(suggest)suggest.onclick=()=>{form.elements.target.value=Math.max(1,Math.round((result.range.low+result.range.high)/2));update()};preview.textContent=kind==='event'?copy('eventHelp'):kind==='weekly-time'?copy('weeklyHelp',[form.elements.target.value]):message('m98af2d1198b9')}catch{output.innerHTML=`<p class="muted small">${message('m095da603a450')}</p>`;preview.textContent=''}}else{output.replaceChildren();preview.textContent=message('m8e005c7d8520')}
  localize(output);
 };
 form.addEventListener('input',update);form.addEventListener('change',update);update();
 form.onsubmit=async event=>{
  event.preventDefault();if(saving)return;saving=true;const button=form.querySelector('[type=submit]'),remove=root.querySelector('[data-remove-goal]'),error=form.querySelector('[data-goal-error]');error.textContent='';button.disabled=true;if(remove)remove.disabled=true;
  try{const f=new FormData(form),value=validateGoal({title:f.get('title'),kind:f.get('kind'),target:f.get('target'),from:f.get('from'),to:f.get('to'),smart:smartGoalKinds.includes(f.get('kind'))&&f.has('smart')}),settings=value.smart?readCoachSettings(form):null;await onSave({value,settings})}catch(e){error.textContent=e.message;localize(error)}finally{saving=false;button.disabled=false;if(remove)remove.disabled=false}
 };
}
