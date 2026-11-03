import {rideNoun} from './copy-counts.js';
import {progressRides,progressRecords,progressPeriods} from './progress.js';
import {totals,num,km,time,date,day} from './metrics.js';
import {locale,t} from './i18n.js';
import {trainingCopy as copy} from './training-copy.js';

const periodLabel=period=>period==='season'?copy('season'):period==='all'?copy('allTime'):new Intl.NumberFormat(locale(),{style:'unit',unit:'day',unitDisplay:'short'}).format(Number(period));
export function progressMarkup(rides,period='30',now=Date.now()){
 const model=progressRides(rides,period,now),total=totals(model.rides),months=new Map();
 for(const ride of model.rides){const key=day(ride.start).slice(0,7);if(!months.has(key))months.set(key,[]);months.get(key).push(ride)}
 return `<div class="stack progress-view" data-progress-view data-no-localize><div class="spread"><h1>${t('Прогресс')}</h1><a class="pill" href="#intellect">${t('Интеллект')}</a></div><div class="row progress-periods">${progressPeriods.map(value=>`<button type="button" class="pill ${value===period?'selected':''}" aria-pressed="${value===period}" data-progress-period="${value}">${periodLabel(value)}</button>`).join('')}</div><p class="muted small">${periodLabel(period)} · ${num(total.count,0)} ${rideNoun(total.count)}</p><div class="hero"><strong>${km(total.distance===null&&!model.rides.length?0:total.distance)}</strong><span>${t('км')}</span></div><div class="metrics"><div class="metric"><small>${t('Всего времени')}</small><strong>${time(total.duration===null&&!model.rides.length?0:total.duration)}</strong></div><div class="metric"><small>${t('Набор высоты · м')}</small><strong>${num(total.ascent===null&&!model.rides.length?0:total.ascent,0)}</strong></div></div><section class="stack"><h2>${t('По месяцам')}</h2><table><thead><tr><th>${t('Месяц')}</th><th>${t('км')}</th><th>${t('Время')}</th></tr></thead><tbody>${[...months].sort(([a],[b])=>b.localeCompare(a)).map(([key,rows])=>{const total=totals(rows);return `<tr><td>${new Date(key+'-01T12:00').toLocaleDateString(locale(),{month:'long',year:'numeric'})}</td><td>${km(total.distance)}</td><td>${time(total.duration)}</td></tr>`}).join('')}</tbody></table></section><section class="stack progress-records"><h2>${t('Кривая мощности')}</h2>${model.previous?`<p class="muted small">${copy('comparePeriod',[model.previous.from,model.previous.to].map(key=>new Date(key+'T12:00').toLocaleDateString(locale(),{day:'numeric',month:'long',year:'numeric'})))}</p>`:''}<div data-progress-records aria-busy="true"><p class="muted small">${copy('calculating')}</p></div></section></div>`;
}
export function mountProgress(root,rides,period,{now=Date.now(),onPeriod=()=>{}}={}){
 const section=root.querySelector('[data-progress-view]');if(!section)return()=>{};let disposed=false;
 const click=event=>{const button=event.target.closest('[data-progress-period]');if(button&&progressPeriods.includes(button.dataset.progressPeriod))onPeriod(button.dataset.progressPeriod)};
 section.addEventListener('click',click);const model=progressRides(rides,period,now),output=section.querySelector('[data-progress-records]');
 const show=async()=>{
  try{
   await new Promise(resolve=>setTimeout(resolve,0));const records=await progressRecords(model.rides,model.prior,{cancelled:()=>disposed||!section.isConnected});if(!records||disposed)return;
   const cell=entry=>entry?`${num(entry.power,0)} ${t('Вт')}<br><a class="accent" href="#ride/${entry.ride.id}">${date(entry.ride.start)}</a>`:'—';
   output.innerHTML=!records.length?`<p class="muted small">${t('Нет данных')}</p>`:`<div class="analysis-table"><table><thead><tr><th>${t('Интервал')}</th><th>${periodLabel(period)}</th>${model.previous?`<th>${t('Период для сравнения')}</th><th>Δ ${t('Вт')}</th>`:''}</tr></thead><tbody>${records.map(row=>`<tr><td>${row.seconds<60?num(row.seconds,0)+' '+t('с'):num(row.seconds/60)+' '+t('мин')}</td><td>${cell(row.current)}</td>${model.previous?`<td>${cell(row.previous)}</td><td>${num(row.current&&row.previous?row.current.power-row.previous.power:null,0)}</td>`:''}</tr>`).join('')}</tbody></table></div>`;
  }catch{if(!disposed)output.textContent=t('Нет данных')}finally{if(!disposed)output.setAttribute('aria-busy','false')}
 };
 show();return()=>{disposed=true;section.removeEventListener('click',click)};
}
