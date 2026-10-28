import {validateGoal} from './intellect.js';
import {coachSettingsFields,readCoachSettings,goalCoachPreview} from './coach-ui.js';
import {dateKey} from './periods.js';
import {getLanguage,localize} from './i18n.js';
const c=(ru,en)=>getLanguage()==='ru'?ru:en;
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
 const personal=g.kind==='distance'&&g.smart;
 return `<h1>${edit?c('Изменить цель','Edit goal'):c('Новая цель','New goal')}</h1><p class="muted">${c('Задай цель и настрой план под свою подготовку и доступное время.','Set a goal and tailor the plan to your preparation and available time.')}</p><form id="goal-editor-form" class="goal-editor-form"><div class="goal-editor-layout"><section class="stack"><h2>${c('Твоя цель','Your goal')}</h2><label>${c('Название','Name')}<input name="title" required maxlength="100" placeholder="${c('Мой месяц в седле','My month on the bike')}" value="${esc(g.title)}"></label><label>${c('Показатель','Metric')}<select name="kind" aria-label="${c('Показатель','Metric')}">${[['distance',c('Дистанция · км','Distance · km')],['duration',c('Время · часы','Time · hours')],['count',c('Количество поездок','Ride count')]].map(([key,label])=>`<option value="${key}" ${g.kind===key?'selected':''}>${label}</option>`).join('')}</select></label><label>${c('Цель','Target')}<input type="number" name="target" min="${g.kind==='count'?'1':'0.1'}" max="100000" step="${g.kind==='count'?'1':'0.1'}" required value="${esc(g.target)}"></label><div class="goal-dates"><label>${c('С','From')}<input type="date" name="from" value="${esc(g.from)}" required></label><label>${c('По','To')}<input type="date" name="to" value="${esc(g.to)}" required></label></div><label class="smart-option" ${g.kind==='distance'?'':'hidden'}><input type="checkbox" name="smart" ${g.smart?'checked':''} ${g.kind==='distance'?'':'disabled'}><span>${c('Умный план','Smart plan')}</span></label><p class="muted small" data-goal-preview></p></section><section class="stack" data-goal-coach ${personal?'':'hidden'}><h2>${c('Настройка Интеллекта','Set up Intellect')}</h2>${coachSettingsFields(s)}<div class="stack" data-coach-goal-range aria-live="polite"></div></section></div><p class="error small" data-goal-error role="alert"></p><div class="goal-editor-actions"><a class="button secondary" href="#${esc(returnTo)}">${c('Отмена','Cancel')}</a><button type="submit" class="button">${edit?c('Сохранить изменения','Save changes'):c('Создать цель','Create goal')}</button></div></form>`;
}
export function mountGoalEditor(root,{rides=[],onSave}){
 const form=root.querySelector('#goal-editor-form');if(!form)return;
 const update=()=>{
  const distance=form.elements.kind.value==='distance',personal=distance&&form.elements.smart.checked;
  form.elements.smart.disabled=!distance;form.elements.smart.closest('label').hidden=!distance;
  form.elements.target.step=distance||form.elements.kind.value==='duration'?'0.1':'1';form.elements.target.min=form.elements.target.step;
  const block=form.querySelector('[data-goal-coach]'),fields=form.querySelector('[data-coach-fields]'),output=form.querySelector('[data-coach-goal-range]'),preview=form.querySelector('[data-goal-preview]');block.hidden=!personal;fields.disabled=!personal;
  if(personal){try{const result=goalCoachPreview(form,rides);output.innerHTML=result.html;const suggest=output.querySelector('[data-coach-suggest]');if(suggest)suggest.onclick=()=>{form.elements.target.value=Math.max(1,Math.round((result.range.low+result.range.high)/2));update()};preview.textContent=c('План учитывает подготовку, доступное время, самочувствие, погоду и ветер. Недостающие километры не превращаются в долг нагрузки.','The plan accounts for preparation, time, well-being, weather and wind. Missing kilometres are not carried as load debt.')}catch{output.innerHTML=`<p class="muted small">${c('Заполни анкету подготовки и выбери дни: появится рекомендуемый диапазон километров.','Complete the questionnaire and choose your days to see a suggested distance range.')}</p>`;preview.textContent=''}}else{output.replaceChildren();preview.textContent=c('Факт рассчитан по импортированным FIT за указанный период.','Progress is based on FIT rides imported for the selected period.')}
  localize(output);
 };
 form.addEventListener('input',update);form.addEventListener('change',update);update();
 form.onsubmit=async event=>{
  event.preventDefault();const button=form.querySelector('[type=submit]'),error=form.querySelector('[data-goal-error]');error.textContent='';button.disabled=true;
  try{const f=new FormData(form),value=validateGoal({title:f.get('title'),kind:f.get('kind'),target:f.get('target'),from:f.get('from'),to:f.get('to'),smart:f.get('kind')==='distance'&&f.has('smart')}),settings=value.smart?readCoachSettings(form):null;await onSave({value,settings})}catch(e){error.textContent=e.message;localize(error)}finally{button.disabled=false}
 };
}
