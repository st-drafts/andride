import {message} from './copy.js';
import {locale} from './i18n.js';
import {num} from './metrics.js';
import {numberHaptic} from './haptics.js';

const format=value=>num(value);
const sleepValueText=value=>new Intl.NumberFormat(locale(),{style:'unit',unit:'hour',unitDisplay:'long',maximumFractionDigits:1}).format(value);
export const sleepHoursValue=value=>Number.isFinite(value)?Math.max(0,Math.min(14,Math.round(value*2)/2)):8;

export function sleepPickerMarkup(value){
 const selected=sleepHoursValue(value);
 return `<div class="sleep-picker-field" data-sleep-picker><span id="sleep-hours-label">${message('m563286c9cc6d')}</span><input type="hidden" name="sleepHours" value="${selected}"><div class="sleep-picker" role="slider" tabindex="0" aria-labelledby="sleep-hours-label" aria-describedby="sleep-hours-hint" aria-valuemin="0" aria-valuemax="14" aria-valuenow="${selected}" aria-valuetext="${sleepValueText(selected)}">${Array.from({length:29},(_,i)=>`<span class="sleep-hour-option${i/2===selected?' is-selected':''}" data-sleep-index="${i}" aria-hidden="true">${format(i/2)}</span>`).join('')}</div><span class="muted small" id="sleep-hours-hint">${message('md39f756c5071')}</span></div>`;
}

export function mountSleepPickers(root){
 const cleanup=[];
 for(const field of root.querySelectorAll('[data-sleep-picker]')){
  const picker=field.querySelector('[role=slider]'),input=field.querySelector('input'),items=[...picker.querySelectorAll('[data-sleep-index]')];
  let index=sleepHoursValue(Number(input.value))*2,ready=false,userScroll=false;
  const width=()=>items[0].getBoundingClientRect().width;
  const update=(next,haptic=false)=>{
   next=Math.max(0,Math.min(28,next));if(next===index)return;
   index=next;input.value=String(index/2);picker.setAttribute('aria-valuenow',input.value);picker.setAttribute('aria-valuetext',sleepValueText(index/2));
   items.forEach((item,i)=>item.classList.toggle('is-selected',i===index));
   if(haptic)numberHaptic();
  };
  const align=()=>{if(!picker.clientWidth)return;ready=false;picker.scrollLeft=index*width();ready=true;userScroll=false};
  const choose=(next,trusted)=>{update(next,trusted);userScroll=false;picker.scrollLeft=index*width()};
  picker.addEventListener('pointerdown',event=>{userScroll=event.isTrusted});
  picker.addEventListener('scroll',()=>{if(ready&&width())update(Math.round(picker.scrollLeft/width()),userScroll)});
  picker.addEventListener('click',event=>{const item=event.target.closest('[data-sleep-index]');if(item)choose(Number(item.dataset.sleepIndex),event.isTrusted)});
  picker.addEventListener('keydown',event=>{
   const next={ArrowLeft:index-1,ArrowDown:index-1,ArrowRight:index+1,ArrowUp:index+1,Home:0,End:28,PageUp:index+2,PageDown:index-2}[event.key];
   if(next===undefined)return;event.preventDefault();choose(next,event.isTrusted);
  });
  // Native horizontal touch scrolling; also support desktop mouse wheels.
  picker.addEventListener('wheel',event=>{if(!event.deltaY&&!event.deltaX)return;event.preventDefault();userScroll=event.isTrusted;picker.scrollLeft+=Math.abs(event.deltaX)>Math.abs(event.deltaY)?event.deltaX:event.deltaY},{passive:false});
  align();
  // The check-in can be inside a closed details element at mount time.
  if(typeof ResizeObserver!=='undefined'){
   const observer=new ResizeObserver(()=>{if(!picker.isConnected){observer.disconnect();return}align()});observer.observe(picker);
   const details=field.closest('details');details?.addEventListener('toggle',align);
   cleanup.push(()=>{observer.disconnect();details?.removeEventListener('toggle',align)});
  }
 }
 return ()=>cleanup.forEach(stop=>stop());
}
