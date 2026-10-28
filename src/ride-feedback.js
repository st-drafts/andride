import {validateFeedback} from './coach.js';
import {date,clockTime} from './metrics.js';
import {getLanguage} from './i18n.js';

const copy=(ru,en)=>getLanguage()==='ru'?ru:en;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function importedFeedbackRides(results,rides){
 const byId=new Map(rides.map(r=>[r.id,r])),seen=new Set();
 return results.filter(r=>r.ok).flatMap(result=>(result.newRideIds||[]).flatMap(id=>{
  if(seen.has(id)||!byId.has(id))return [];seen.add(id);return [byId.get(id)];
 }));
}
export function rideFeedbackMarkup(ride,feedback=[],{afterImport=false}={}){
 const rating=feedback.find(f=>f.rideId===ride.id),known=Number.isFinite(rating?.rpe);
 const form=`<form class="ride-feedback-form" data-ride-feedback="${esc(ride.id)}"><label>${copy('Общая тяжесть поездки · RPE','Overall ride difficulty · RPE')}<input name="rpe" aria-label="${copy('Оценка тяжести поездки от 0 до 10','Ride difficulty rating from 0 to 10')}" type="number" inputmode="numeric" min="0" max="10" step="1" required value="${known?rating.rpe:''}" placeholder="0–10"></label><div class="spread muted small"><span>${copy('0 — без усилия','0 — no effort')}</span><span>${copy('10 — максимум','10 — maximum')}</span></div><p class="muted small">${copy('Оцени всю поездку, а не самый тяжёлый момент. Оценка помогает Интеллекту учитывать нагрузку; её можно добавить или изменить позже здесь, в поездке.','Rate the whole ride, not just its hardest moment. Your rating helps Intellect account for load; you can add or change it later here on the ride page.')}</p><p class="error small" data-feedback-error role="alert"></p><div class="row"><button class="button" type="submit">${known?copy('Обновить оценку','Update rating'):copy('Сохранить оценку','Save rating')}</button>${afterImport&&!known?`<button class="link-button" type="button" data-feedback-skip>${copy('Пропустить','Skip')}</button>`:''}</div></form>`;
 return `<details class="fold ride-feedback" ${afterImport&&!known?'open':''}><summary>${known?copy('Моя оценка поездки','My ride rating')+' · '+rating.rpe+'/10':copy('Оценить поездку','Rate this ride')}</summary><div class="stack">${known?`<p class="muted small">${copy('Оценка сохранена. При необходимости её можно изменить.','Rating saved. You can change it whenever needed.')}</p>`:''}${form}</div></details>`;
}
export function importedFeedbackMarkup(results,rides,feedback=[],skipped=new Set()){
 const imported=importedFeedbackRides(results,rides);if(!imported.length)return '';
 return `<section class="stack import-feedback"><h2>${copy('Как прошла поездка?','How did the ride feel?')}</h2><p class="muted small">${copy('FIT уже сохранён. Оценка необязательна: её можно добавить позже на странице поездки.','Your FIT is saved. Rating is optional: you can add it later on the ride page.')}</p>${imported.map(ride=>`<div class="card"><a class="import-feedback-ride" href="#ride/${esc(ride.id)}"><strong data-user-content>${esc(ride.customTitle||ride.name||date(ride.start))}</strong><span class="muted small">${date(ride.start)} · ${clockTime(ride.start)} →</span></a>${skipped.has(ride.id)&&!feedback.some(f=>f.rideId===ride.id)?`<p class="muted small">${copy('Оценка пропущена. Её можно добавить в поездке.','Rating skipped. You can add it on the ride page.')}</p>`:rideFeedbackMarkup(ride,feedback,{afterImport:true})}</div>`).join('')}</section>`;
}
export function mountRideFeedback(root,{onSave,onSkip=()=>{}}){
 for(const form of root.querySelectorAll('[data-ride-feedback]')){
  const buttons=[...form.querySelectorAll('button')],error=form.querySelector('[data-feedback-error]');
  form.onsubmit=async event=>{
   event.preventDefault();error.textContent='';buttons.forEach(b=>b.disabled=true);
   try{const value=validateFeedback({rideId:form.dataset.rideFeedback,rpe:new FormData(form).get('rpe')});await onSave(value)}catch(e){error.textContent=e.message}finally{buttons.forEach(b=>b.disabled=false)}
  };
  const skip=form.querySelector('[data-feedback-skip]');if(skip)skip.onclick=()=>onSkip(form.dataset.rideFeedback);
 }
}
