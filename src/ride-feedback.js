import {message} from './copy.js';
import {validateFeedback} from './coach.js';
import {date,clockTime} from './metrics.js';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function importedFeedbackRides(results,rides){
 const byId=new Map(rides.map(r=>[r.id,r])),seen=new Set();
 return results.filter(r=>r.ok).flatMap(result=>(result.newRideIds||[]).flatMap(id=>{
  if(seen.has(id)||!byId.has(id))return [];seen.add(id);return [byId.get(id)];
 }));
}
export function rideFeedbackMarkup(ride,feedback=[],{afterImport=false}={}){
 const rating=feedback.find(f=>f.rideId===ride.id),known=Number.isFinite(rating?.rpe);
 const selected=known?rating.rpe:5;
 const form=`<form class="ride-feedback-form" data-ride-feedback="${esc(ride.id)}"><div class="coach-slider-field"><div class="spread"><span>${message('m67310d55915b')}</span><output>${selected} / 10</output></div><input name="rpe" aria-label="${message('m9796f2762666')}" type="range" min="0" max="10" step="1" value="${selected}" aria-valuetext="${selected} / 10" data-feedback-slider></div><div class="spread muted small"><span>${message('m6e0c5f12d117')}</span><span>${message('m2653fcf2e45a')}</span></div><p class="muted small">${message('me9bd64ea8922')}</p><p class="error small" data-feedback-error role="alert"></p><div class="row"><button class="button" type="submit">${known?message('ma2e89360deb0'):message('mc5beaa607e51')}</button>${afterImport&&!known?`<button class="link-button" type="button" data-feedback-skip>${message('m90b1d59c52ca')}</button>`:''}</div></form>`;
 return `<details class="fold ride-feedback" ${afterImport&&!known?'open':''}><summary>${known?message('m07860aaef002')+' · '+rating.rpe+'/10':message('m754cfabb0ab7')}</summary><div class="stack">${known?`<p class="muted small">${message('me2d393872ec0')}</p>`:''}${form}</div></details>`;
}
export function importedFeedbackMarkup(results,rides,feedback=[],skipped=new Set()){
 const imported=importedFeedbackRides(results,rides);if(!imported.length)return '';
 return `<section class="stack import-feedback"><h2>${message('md6c516f16e93')}</h2><p class="muted small">${message('m8ffe9965b94d')}</p>${imported.map(ride=>`<div class="card"><a class="import-feedback-ride" href="#ride/${esc(ride.id)}"><strong data-user-content>${esc(ride.customTitle||ride.name||date(ride.start))}</strong><span class="muted small">${date(ride.start)} · ${clockTime(ride.start)} →</span></a>${skipped.has(ride.id)&&!feedback.some(f=>f.rideId===ride.id)?`<p class="muted small">${message('m31df3177911f')}</p>`:rideFeedbackMarkup(ride,feedback,{afterImport:true})}</div>`).join('')}</section>`;
}
export function mountRideFeedback(root,{onSave,onSkip=()=>{}}){
 for(const form of root.querySelectorAll('[data-ride-feedback]')){
  const buttons=[...form.querySelectorAll('button')],error=form.querySelector('[data-feedback-error]'),slider=form.querySelector('[data-feedback-slider]');
  if(slider)slider.oninput=()=>{slider.closest('.coach-slider-field').querySelector('output').textContent=slider.value+' / 10';slider.setAttribute('aria-valuetext',slider.value+' / 10')};
  form.onsubmit=async event=>{
   event.preventDefault();error.textContent='';buttons.forEach(b=>b.disabled=true);
   try{const value=validateFeedback({rideId:form.dataset.rideFeedback,rpe:new FormData(form).get('rpe')});await onSave(value)}catch(e){error.textContent=e.message}finally{buttons.forEach(b=>b.disabled=false)}
  };
  const skip=form.querySelector('[data-feedback-skip]');if(skip)skip.onclick=()=>onSkip(form.dataset.rideFeedback);
 }
}
