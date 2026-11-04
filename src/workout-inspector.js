import {message} from './copy.js';
import {pausedMilliseconds} from './pause-time.js';
import {t} from './i18n.js';
import {num} from './metrics.js';
import {themePalette,watchTheme} from './theme.js';
import {syncRangeFill} from './range-controls.js';
import {trainingCopy as copy} from './training-copy.js';
import {createSelectionSummarizer,workoutBounds} from './workout-selection.js';

const stamp=value=>`${Math.floor(value/3600)}:${String(Math.floor(value/60)%60).padStart(2,'0')}:${String(Math.floor(value)%60).padStart(2,'0')}`;
const sensors=[['p','Мощность','Вт'],['hr','Пульс','уд/мин'],['c','Каденс','об/мин'],['v','Скорость','км/ч']];
const usable=(p,key)=>Number.isFinite(p[key])&&(key==='hr'?p[key]>=30&&p[key]<=250:key==='p'?p[key]>=0&&p[key]<=3000:key==='c'?p[key]>=0&&p[key]<=250:p[key]>=0&&p[key]<=45);
const value=(p,key)=>usable(p,key)?p[key]*(key==='v'?3.6:1):null;

export function workoutInspectorMarkup(ride){
 const bounds=workoutBounds(ride);if(!bounds||!ride.points?.some(p=>Number.isFinite(p.t)&&sensors.some(([key])=>usable(p,key))))return '';
 const seconds=(bounds.end-bounds.start)/1000;
 return `<section class="stack workout-inspector" data-workout-inspector data-no-localize><h2>${copy('inspect')}</h2><p class="muted small">${copy('selectionHelp')}</p><canvas data-workout-chart aria-label="${copy('inspect')}"></canvas><div class="row workout-legend" data-workout-legend></div><output class="chart-readout" data-workout-cursor></output><div class="range-grid">${[['from',t('От'),0],['to',t('До'),seconds]].map(([key,label,selected])=>`<label>${label} <output data-workout-time="${key}">${stamp(selected)}</output><input type="range" min="0" max="${seconds}" step="1" value="${selected}" data-workout-range="${key}" aria-label="${label}"></label>`).join('')}</div><div class="spread"><h3 data-workout-selection-label>${copy('full')}</h3><button type="button" class="link-button" data-workout-full hidden>${copy('full')}</button></div><div class="metrics" data-workout-values aria-live="polite"></div><details class="analysis-method" data-detail-key="workout-source"><summary>${t('Источник и доступность')}</summary><p>${copy('scales')}</p><p class="muted small" data-workout-coverage></p></details>${ride.laps?.length?`<details class="fold workout-laps"><summary>${message('m3ee25b06def1')} · ${ride.laps.length}</summary><div class="analysis-table"><table><thead><tr><th>${t('Сравнить')}</th><th>${t('Время')}</th><th>${t('Мощность')} · ${t('Вт')}</th><th>${t('Пульс')}</th><th>${t('Каденс')}</th></tr></thead><tbody data-workout-laps></tbody></table></div><div data-workout-comparison></div></details>`:''}</section>`;
}

export function captureWorkoutInspector(root){
 const section=root.querySelector('[data-workout-inspector]');if(!section)return null;
 return {start:Number(section.dataset.selectionStart),end:Number(section.dataset.selectionEnd),series:[...section.querySelectorAll('[data-workout-series][aria-pressed="true"]')].map(button=>button.dataset.workoutSeries),laps:[...section.querySelectorAll('[data-workout-lap]:checked')].map(input=>Number(input.dataset.workoutLap))};
}

export function mountWorkoutInspector(root,ride,saved=null){
 const section=root.querySelector('[data-workout-inspector]');if(!section)return()=>{};
 const bounds=workoutBounds(ride),summarize=createSelectionSummarizer(ride),points=(ride.points||[]).filter(p=>Number.isFinite(p.t)),duration=(bounds.end-bounds.start)/1000,canvas=section.querySelector('canvas'),ctx=canvas.getContext('2d');
 const available=sensors.filter(([key])=>points.some(p=>usable(p,key))),enabled=new Set(available.map(([key])=>key).filter(key=>!saved?.series||saved.series.includes(key))),maxima=Object.fromEntries(available.map(([key])=>[key,points.reduce((n,p)=>Math.max(n,value(p,key)||0),0)]));
 let from=0,to=duration,width=350,bins=[],binCount=0,cursor=null,drag=null,disposed=false;const compared=new Set((saved?.laps||[]).filter(i=>Number.isInteger(i)&&i>=0&&i<(ride.laps?.length||0)));
 if(Number.isFinite(saved?.start)&&Number.isFinite(saved?.end)&&saved.start<saved.end){from=Math.max(0,Math.min(duration,(saved.start-bounds.start)/1000));to=Math.max(from,Math.min(duration,(saved.end-bounds.start)/1000));if(to<=from){from=0;to=duration}}
 const inputs=Object.fromEntries([...section.querySelectorAll('[data-workout-range]')].map(input=>[input.dataset.workoutRange,input]));
 const color=(key,colors)=>colors.series[key]||(key==='p'?'#b18bff':colors.accent);
 function makeBins(count){
  bins=Array.from({length:count},()=>Object.fromEntries(available.map(([key])=>[key,{sum:0,n:0,missing:false}])));
  for(const p of points){const i=Math.max(0,Math.min(count-1,Math.floor((p.t-bounds.start)/(bounds.end-bounds.start)*count)));for(const [key] of available){const v=value(p,key);if(v===null)bins[i][key].missing=true;else{bins[i][key].sum+=v;bins[i][key].n++}}}
  for(let i=0;i<count;i++)if(pausedMilliseconds(ride,bounds.start+i/count*(bounds.end-bounds.start),bounds.start+(i+1)/count*(bounds.end-bounds.start))>0)for(const [key] of available)bins[i][key].missing=true;
 }
 function draw(){
  if(disposed)return;const colors=themePalette(),dpr=devicePixelRatio||1,height=240;width=canvas.clientWidth||350;
  if(canvas.width!==Math.round(width*dpr))canvas.width=Math.round(width*dpr);if(canvas.height!==Math.round(height*dpr))canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle=colors.bg;ctx.fillRect(0,0,width,height);
  const left=8,right=width-8,top=14,bottom=210,count=Math.max(1,Math.floor((right-left)/3));if(count!==binCount){binCount=count;makeBins(count)}
  ctx.strokeStyle=colors.line;for(const ratio of [.25,.5,.75,1]){const y=bottom-(bottom-top)*ratio;ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(right,y);ctx.stroke()}
  const x=seconds=>left+seconds/(duration||1)*(right-left);
  for(const [key] of available){if(!enabled.has(key))continue;ctx.strokeStyle=color(key,colors);ctx.lineWidth=key==='p'?2:1.5;ctx.beginPath();let connected=false;bins.forEach((bin,i)=>{const data=bin[key];if(!data.n||data.missing){connected=false;return}const px=left+(i+.5)/count*(right-left),py=bottom-(data.sum/data.n)/(maxima[key]||1)*(bottom-top);if(connected)ctx.lineTo(px,py);else ctx.moveTo(px,py);connected=true});ctx.stroke()}
  // Muting happens after the curves, so only the excluded time is greyed out.
  ctx.fillStyle=colors.muted;ctx.globalAlpha=.28;ctx.fillRect(left,top,x(from)-left,bottom-top);ctx.fillRect(x(to),top,right-x(to),bottom-top);ctx.globalAlpha=1;
  ctx.lineWidth=1;ctx.strokeStyle=colors.muted;for(const seconds of [from,to].filter(s=>s>0&&s<duration)){ctx.beginPath();ctx.moveTo(x(seconds),top);ctx.lineTo(x(seconds),bottom);ctx.stroke()}
  if(cursor!==null){ctx.strokeStyle=colors.ink;ctx.beginPath();ctx.moveTo(x(cursor),top);ctx.lineTo(x(cursor),bottom);ctx.stroke()}
  ctx.font='11px Inter,Arial';ctx.fillStyle=colors.muted;ctx.fillText(stamp(0),left,235);ctx.textAlign='right';ctx.fillText(stamp(duration),right,235);ctx.textAlign='left';
 }
 const metric=(label,text)=>`<div class="metric"><small>${label}</small><strong>${text}</strong></div>`;
 function updateValues(){
  const result=summarize(bounds.start+from*1000,bounds.start+to*1000);if(!result)return;
  section.querySelector('[data-workout-values]').innerHTML=metric(t('Время'),stamp(result.active))+available.map(([key,label,unit])=>metric(t(label),`${num(result[key]===null?null:result[key]*(key==='v'?3.6:1),key==='v'?1:0)} ${t(unit)}${result[key+'Coverage']<.995?`<small>${num(result[key+'Coverage']*100,0)}% · FIT</small>`:''}`)).join('');
  const full=from===0&&to===duration;section.querySelector('[data-workout-selection-label]').textContent=copy(full?'full':'selection');section.querySelector('[data-workout-full]').hidden=full;
  section.querySelector('[data-workout-coverage]').textContent='FIT · '+available.map(([key,label])=>`${t(label)}: ${num(result[key+'Coverage']*100,0)}%`).join(' · ');
  for(const key of ['from','to']){inputs[key].value=key==='from'?from:to;inputs[key].setAttribute('aria-valuetext',stamp(key==='from'?from:to));syncRangeFill(inputs[key]);section.querySelector(`[data-workout-time="${key}"]`).textContent=stamp(key==='from'?from:to)}
  section.dataset.selectionStart=bounds.start+from*1000;section.dataset.selectionEnd=bounds.start+to*1000;
 }
 function setRange(a,b){from=Math.max(0,Math.min(a,b,duration));to=Math.min(duration,Math.max(a,b));if(to-from<1){to=Math.min(duration,from+1);from=Math.max(0,to-1)}updateValues();draw()}
 function inspect(seconds){
  cursor=Math.max(0,Math.min(duration,seconds));const target=bounds.start+cursor*1000;let lo=0,hi=points.length;while(lo<hi){const m=(lo+hi)>>1;if(points[m].t<target)lo=m+1;else hi=m}const choices=[points[lo-1],points[lo]].filter(Boolean).sort((a,b)=>Math.abs(a.t-target)-Math.abs(b.t-target)),p=choices[0],near=p&&Math.abs(p.t-target)<=5000;
  section.querySelector('[data-workout-cursor]').textContent=stamp(cursor)+' · '+available.map(([key,label,unit])=>`${t(label)}: ${num(near?value(p,key):null,key==='v'?1:0)} ${t(unit)}`).join(' · ');draw();
 }
 section.querySelector('[data-workout-legend]').innerHTML=available.map(([key,label,unit])=>`<button type="button" class="pill series-toggle ${enabled.has(key)?'selected':''}" data-workout-series="${key}" aria-pressed="${enabled.has(key)}" style="--series-color:${color(key,themePalette())}">${t(label)} · 0–${num(maxima[key],0)} ${t(unit)}</button>`).join('');
 const laps=(ride.laps||[]).map(lap=>{const data=Number.isFinite(lap.start)&&Number.isFinite(lap.end)?summarize(lap.start,lap.end):null;return {lap,data:{active:Number.isFinite(lap.duration)?lap.duration:data?.active,p:data?.p??lap.avgPower??null,hr:data?.hr??lap.avgHr??null,c:data?.c??null}}});
 const lapValues=data=>`<td>${Number.isFinite(data.active)?stamp(data.active):'—'}</td><td>${num(data.p,0)}</td><td>${num(data.hr,0)}</td><td>${num(data.c,0)}</td>`;
 const lapBody=section.querySelector('[data-workout-laps]');if(lapBody)lapBody.innerHTML=laps.map(({data},i)=>`<tr><td><label class="workout-lap-choice"><input type="checkbox" data-workout-lap="${i}" ${compared.has(i)?'checked':''}><span>${copy('lap',[num(i+1,0)])}</span></label></td>${lapValues(data)}</tr>`).join('');
 function compare(){const chosen=[...compared].sort((a,b)=>a-b),output=section.querySelector('[data-workout-comparison]');if(!output)return;output.innerHTML=chosen.length<2?'':`<div class="analysis-table"><table><thead><tr><th>${t('Сравнить')}</th><th>${t('Время')}</th><th>${t('Мощность')}</th><th>${t('Пульс')}</th><th>${t('Каденс')}</th><th>Δ ${t('Мощность')} · ${t('Вт')}</th></tr></thead><tbody>${chosen.map(i=>`<tr><td>${copy('lap',[num(i+1,0)])}</td>${lapValues(laps[i].data)}<td>${num(Number.isFinite(laps[i].data.p)&&Number.isFinite(laps[chosen[0]].data.p)?laps[i].data.p-laps[chosen[0]].data.p:null,0)}</td></tr>`).join('')}</tbody></table></div>`}
 const click=event=>{const button=event.target.closest('[data-workout-series]');if(button){const key=button.dataset.workoutSeries;enabled.has(key)?enabled.delete(key):enabled.add(key);button.setAttribute('aria-pressed',String(enabled.has(key)));button.classList.toggle('selected',enabled.has(key));draw()}if(event.target.closest('[data-workout-full]'))setRange(0,duration)};
 const change=event=>{if(event.target.matches('[data-workout-lap]')){const index=Number(event.target.dataset.workoutLap);event.target.checked?compared.add(index):compared.delete(index);const lap=laps[index].lap;if(event.target.checked&&Number.isFinite(lap.start)&&Number.isFinite(lap.end))setRange((lap.start-bounds.start)/1000,(lap.end-bounds.start)/1000);compare()}};
 const input=event=>{if(!event.target.matches('[data-workout-range]'))return;const gap=Math.min(1,duration);if(event.target===inputs.from)setRange(Math.min(Number(inputs.from.value),to-gap),to);else setRange(from,Math.max(Number(inputs.to.value),from+gap))};
 const seconds=event=>Math.max(0,Math.min(duration,(event.clientX-canvas.getBoundingClientRect().left-8)/Math.max(1,width-16)*duration));
 const down=event=>{if(event.button!==0||drag||event.isPrimary===false)return;drag={id:event.pointerId,start:seconds(event),x:event.clientX,moved:false,previous:[from,to]};canvas.setPointerCapture(event.pointerId);inspect(drag.start)};
 const move=event=>{if(drag){if(drag.id!==event.pointerId)return;if(Math.abs(event.clientX-drag.x)>8)drag.moved=true;if(drag.moved)setRange(drag.start,seconds(event))}else if(event.pointerType==='mouse')inspect(seconds(event))};
 const up=event=>{if(drag?.id!==event.pointerId)return;const saved=drag;drag=null;if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);if(saved.moved)setRange(saved.start,seconds(event))};
 const cancel=event=>{if(drag?.id!==event.pointerId)return;const saved=drag;drag=null;if(saved.moved)setRange(...saved.previous)};
 const leave=event=>{if(drag||event.pointerType!=='mouse')return;cursor=null;section.querySelector('[data-workout-cursor]').textContent='';draw()};
 section.addEventListener('click',click);section.addEventListener('change',change);section.addEventListener('input',input);canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',cancel);canvas.addEventListener('lostpointercapture',cancel);canvas.addEventListener('pointerleave',leave);
 const observer=new ResizeObserver(draw);observer.observe(canvas);const stopTheme=watchTheme(draw);compare();updateValues();draw();
 return()=>{disposed=true;const pointer=drag?.id;drag=null;if(pointer!==undefined&&canvas.hasPointerCapture(pointer))canvas.releasePointerCapture(pointer);observer.disconnect();stopTheme();section.removeEventListener('click',click);section.removeEventListener('change',change);section.removeEventListener('input',input);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',cancel);canvas.removeEventListener('lostpointercapture',cancel);canvas.removeEventListener('pointerleave',leave)};
}
