import {locale,t} from './i18n.js';
import {numberHaptic} from './haptics.js';

const minutesPerHour=60,maxHours=14,defaultHours=8;
const toMinutes=value=>Math.round((Number.isFinite(value)?Math.max(0,Math.min(maxHours,value)):defaultHours)*minutesPerHour);
const parts=value=>{const total=toMinutes(value);return [Math.floor(total/minutesPerHour),total%minutesPerHour]};
const digits=(value,index)=>String(value).padStart(index===1?2:1,'0');
const unitFormat=(index,display='long')=>new Intl.NumberFormat(locale(),{style:'unit',unit:index===0?'hour':'minute',unitDisplay:display});
const escape=value=>String(value).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));

export function sleepDurationLabel(value){
 const [hours,minutes]=parts(value);
 return new Intl.ListFormat(locale(),{style:'short',type:'unit'}).format([unitFormat(0,'short').format(hours),unitFormat(1,'short').format(minutes)]);
}

export function sleepPickerMarkup(value,questionId='sleep-hours-label'){
 const [hours,minutes]=parts(value);
 const wheel=(index,selected,max)=>{
  const format=unitFormat(index),unit=format.formatToParts(0).find(part=>part.type==='unit').value;
  return `<div class="sleep-wheel" id="${escape(questionId)}-wheel-${index}" data-sleep-wheel="${index}" role="slider" tabindex="${max?0:-1}" aria-label="${escape(unit)}" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${selected}" aria-valuetext="${escape(format.format(selected))}" aria-orientation="vertical" aria-disabled="${max===0}">${Array.from({length:index===0?maxHours+1:minutesPerHour},(_,position)=>`<span data-sleep-index="${position}" class="${position===selected?'is-selected':''}" aria-hidden="true">${digits(position,index)}</span>`).join('')}</div>`;
 };
 const stored=Number.isFinite(value)&&value>=0&&value<=maxHours?value:(hours*minutesPerHour+minutes)/minutesPerHour;
 return `<div class="sleep-picker" data-sleep-picker role="group" aria-labelledby="${escape(questionId)}">
  <input type="hidden" name="sleepHours" value="${stored}">
  ${wheel(0,hours,maxHours)}<span class="sleep-picker-colon" aria-hidden="true">:</span>${wheel(1,minutes,hours===maxHours?0:59)}
  <span class="sleep-picker-unit" aria-hidden="true">${escape(t('ч'))}</span><span class="sleep-picker-unit" aria-hidden="true">${escape(t('мин'))}</span>
 </div>`;
}

export function mountSleepPickers(root){
 const cleanup=[];
 for(const field of root.querySelectorAll('[data-sleep-picker]')){
  const input=field.querySelector('input'),wheels=[...field.querySelectorAll('[data-sleep-wheel]')];
  const selected=parts(Number(input.value)),formats=wheels.map((_,index)=>unitFormat(index));
  const maximum=index=>index===0?maxHours:selected[0]===maxHours?0:59;
  const rowHeight=wheel=>wheel.firstElementChild.getBoundingClientRect().height;
  const rowHeights=wheels.map(rowHeight);
  const align=index=>{wheels[index].scrollTop=selected[index]*rowHeights[index]};
  const paintValue=(index,previous)=>{
   const wheel=wheels[index],value=selected[index];
   wheel.children[previous].classList.remove('is-selected');
   wheel.children[value].classList.add('is-selected');
   wheel.setAttribute('aria-valuenow',value);
   wheel.setAttribute('aria-valuetext',formats[index].format(value));
  };
  const update=(index,next,haptic)=>{
   const previous=selected[index],value=Math.max(0,Math.min(maximum(index),next));
   if(previous===value)return;
   selected[index]=value;
   paintValue(index,previous);
   if(index===0&&(previous===maxHours||value===maxHours)){
    const minuteWheel=wheels[1],max=maximum(1);
    minuteWheel.setAttribute('aria-valuemax',max);
    minuteWheel.setAttribute('aria-disabled',max===0);
    minuteWheel.tabIndex=max?0:-1;
    if(!max&&selected[1]){
     const previousMinutes=selected[1];
     selected[1]=0;
     paintValue(1,previousMinutes);
     align(1);
    }
   }
   input.value=String((selected[0]*minutesPerHour+selected[1])/minutesPerHour);
   input.dispatchEvent(new Event('input',{bubbles:true}));
   if(haptic)numberHaptic();
  };
  const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(()=>wheels.forEach((wheel,index)=>{
   const height=rowHeight(wheel);
   if(height!==rowHeights[index]){
    rowHeights[index]=height;
    align(index);
   }
  }));
  wheels.forEach((wheel,index)=>{
   const choose=(next,haptic)=>{update(index,next,haptic);align(index)};
   wheel.addEventListener('scroll',event=>{
    const height=rowHeights[index];
    if(height)update(index,Math.round(wheel.scrollTop/height),event.isTrusted);
   });
   wheel.addEventListener('click',event=>{
    const item=event.target.closest('[data-sleep-index]');
    if(item)choose(Number(item.dataset.sleepIndex),event.isTrusted);
   });
   wheel.addEventListener('keydown',event=>{
    const value=selected[index];
    const next={ArrowLeft:value-1,ArrowDown:value-1,ArrowRight:value+1,ArrowUp:value+1,Home:0,End:maximum(index),PageUp:value+5,PageDown:value-5}[event.key];
    if(next===undefined)return;
    event.preventDefault();choose(next,event.isTrusted);
   });
   align(index);observer?.observe(wheel);
  });
  cleanup.push(()=>observer?.disconnect());
 }
 return ()=>cleanup.forEach(stop=>stop());
}
