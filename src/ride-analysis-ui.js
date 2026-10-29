import {message} from './copy.js';
import {analyzeRide,bestEfforts,bestDistanceEfforts,matchedRides} from './ride-analysis.js';
import {heartZones} from './physiology.js';
import {num,date} from './metrics.js';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stamp=s=>`${Math.floor(s/3600)?Math.floor(s/3600)+':':''}${String(Math.floor(s/60)%60).padStart(2,'0')}:${String(Math.floor(s)%60).padStart(2,'0')}`;
const range=(s,r)=>`${stamp((s.start-r.start)/1000)}–${stamp((s.end-r.start)/1000)}`;
const terrain=t=>({climb:message('m20aa2b9b4861'),descent:message('m9a1bda208490'),flat:message('m147f0f72257c'),unknown:message('m78f4ba5ed90d')})[t];
function observations(s,prev,z){
 const text=[];
 if(s.v!==null&&s.vCoverage>=.8)text.push(message('mc9667fa51bf9',[num(s.v*3.6)]));
 if(s.p!==null&&s.pCoverage>=.8)text.push(message('m5e1499afd524',[num(s.p,0)]));
 if(s.hr!==null&&s.hrCoverage>=.8)text.push(message('m31195d342696',[num(s.hr,0)]));
 if(s.c!==null&&s.cCoverage>=.8){
  text.push(message('mf138d4570edf',[num(s.c,0)]));
  if(s.cZeroMovingSeconds>=10)text.push(message('m08dfadce1c7b',[stamp(s.cZeroMovingSeconds)]));
  else if(s.cZeroSeconds>=10)text.push(message('mc4c4869d7560',[stamp(s.cZeroSeconds)]));
  const coast=s.coastingAcceleration;
  if(coast){
   text.push(coast.terrain==='descent'?message('m2c1b0f5482f8',[num(coast.startSpeed*3.6),num(coast.endSpeed*3.6)]):message('meb9e29d2a4f7',[num(coast.startSpeed*3.6),num(coast.endSpeed*3.6)]));
   if(coast.terrain==='unknown'||coast.terrain==='flat')text.push(message('mff9edc05e228'));
  }
 }
 // Compare adjacent sustained sections; discontinuities never imply recovery.
 if(prev&&prev.end===s.start&&prev.seconds>=30&&s.seconds>=30){
  const power=prev.pCoverage>=.8&&s.pCoverage>=.8&&prev.p>=30?(s.p/prev.p-1)*100:null;
  const hr=prev.hrCoverage>=.8&&s.hrCoverage>=.8?s.hr-prev.hr:null;
  const cadence=prev.cCoverage>=.8&&s.cCoverage>=.8?s.c-prev.c:null;
  if(cadence!==null&&Math.abs(cadence)>=10){
   text.push(cadence>0?message('m79c11bcf874a',[num(cadence,0)]):message('m109de8135b95',[num(-cadence,0)]));
   if(power!==null&&power>=15&&cadence<0)text.push(message('m8aba3a452fe8'));
   if(power!==null&&Math.abs(power)<10)text.push(message('m156b1c1a1dd5'));
  }
  if(power!==null&&power<=-15&&hr!==null&&hr>=5)text.push(message('m59ed3b45c86c'));
  else if(power!==null&&power>=15)text.push(message('m995e778c85b7'));
  else if(power!==null&&power<=-15)text.push(message('mbf1e8389a88b'));
  if(hr!==null&&hr<=-8)text.push(s.terrain==='descent'?message('maf3117f6ec6c'):message('m20418acc0323'));
  if(power===null&&prev.vCoverage>=.8&&s.vCoverage>=.8&&prev.v>1&&s.v>prev.v*1.15)text.push(message('mff6f89585827'));
 }
 if(z.available&&s.hrCoverage>=.8&&s.hr>=z.bounds[2])text.push(message('m29e311e4cd7a'));
 if(!text.length)text.push(message('mdebc97ad6ba3'));
 return text.join(' ');
}
const detailMetric=(label,v,unit)=>Number.isFinite(v)?`<span>${label} <strong>${num(v)} ${unit}</strong></span>`:'';
export function rideAnalysisMarkup(ride,profile={},history=[]){
 const a=analyzeRide(ride,profile),z=heartZones(ride,profile),segments=a.segments;
 if(!segments.length)return `<section class="stack ride-analysis"><h2>${message('m1f7ac2a15282')}</h2><p class="muted">${message('mc2dadb33cfc8')}</p></section>`;
 const narratives=segments.map((s,i)=>observations(s,segments[i-1],z));
 const milestones=segments.flatMap((s,i)=>{const prev=segments[i-1];return !prev||i===segments.length-1||s.terrain!==prev.terrain||s.pCoverage>=.8&&prev.pCoverage>=.8&&Math.abs(s.p-prev.p)>=Math.max(35,prev.p*.15)||s.hrCoverage>=.8&&prev.hrCoverage>=.8&&Math.abs(s.hr-prev.hr)>=8||s.cCoverage>=.8&&prev.cCoverage>=.8&&Math.abs(s.c-prev.c)>=10?[i]:[]});
 const keySections=milestones.length<=8?milestones:milestones.filter((n,i)=>i===0||i===milestones.length-1||i%Math.ceil(milestones.length/6)===0);
 const available=['v','p','hr','c'].filter(k=>a.total[k+'Coverage']>=.8);
 const names={v:message('mb08e87a40dff'),p:message('m7c0abf76d042'),hr:message('m936c4fb9befb'),c:message('m74c1980c33b2')};
 return `<section class="stack ride-analysis"><div class="spread"><h2>${message('m1f7ac2a15282')}</h2><span class="badge">${message('ma3f66beca7ba')}</span></div><p class="muted small">${message('mcc5f10901e06')} · ${num(a.coverage*100,0)}% ${message('md7cbd0a589c0')}</p><div class="card ride-analysis-overview">${keySections.map((n,i)=>`<p><strong>${keySections.length===1?message('m423c2fe4489d'):n===0?message('mde8bb9d7104b'):n===segments.length-1?message('m2e0a11653600'):terrain(segments[n].terrain)} · ${range(segments[n],ride)}</strong><br>${esc(narratives[n])}</p>`).join('')}</div><details class="fold" open><summary>${message('maa5622834bff')} · ${segments.length}</summary><ol class="ride-timeline">${segments.map((s,i)=>`<li><details class="story-segment"><summary><span class="story-time">${range(s,ride)}</span><strong>${terrain(s.terrain)}</strong>${s.grade!==null?`<span class="muted small">${num(s.grade)}%</span>`:''}</summary><div class="stack"><p>${esc(narratives[i])}</p><div class="story-sensors">${detailMetric(message('mf4e167dfd0ee'),s.temp,'°C')}${detailMetric(message('m92e0314efd0b'),s.c,message('meddad85b91bf'))}${detailMetric(message('mc170f35646a4'),s.distance===null?null:s.distance/1000,message('m0e987caf8587'))}${detailMetric(message('ma99e9dc0372f'),s.elevation,message('m3c1dccfe1f75'))}</div><p class="muted small">${message('m68e203702624')}: ${stamp(s.seconds)} · ${message('m96d8fefec108')} ${num(s.hrCoverage*100,0)}% · ${message('m8c2313be66f5')} ${num(s.pCoverage*100,0)}% · ${message('m92e0314efd0b')} ${num(s.cCoverage*100,0)}%</p></div></details></li>`).join('')}</ol></details><details class="fold"><summary>${message('m4f6b59775120')}</summary><div class="stack"><p>${message('m14f4e6e6adb0')}</p><p>${message('m6f4ef8a57518')}: ${available.map(k=>names[k]).join(', ')||'—'}. ${message('m4221ebecc1e8')}: ${stamp(a.paused)}. ${message('mb62cc6ab8058')}: ${stamp(a.gapSeconds)}.</p><p>${message('m589f5041a3cb')}</p></div></details></section>${effortsMarkup(ride,a.efforts,history)}${distanceEffortsMarkup(ride,history)}${powerMarkup(a.powerZones)}${lapsMarkup(ride)}${matchesMarkup(ride,history)}`;
}
function effortsMarkup(ride,efforts,history){
 if(!efforts.length)return '';
 const previous=new Map();for(const r of history.filter(r=>r.id!==ride.id&&!(r.hash&&r.hash===ride.hash)&&r.start<ride.start))for(const e of bestEfforts(r)){previous.set(e.seconds,Math.max(previous.get(e.seconds)??0,e.power))}
 return `<details class="fold"><summary>${message('m5b5a2d39a0c7')}</summary><div class="stack"><p class="muted small">${message('mb45aa1a10482')}</p><div class="analysis-table"><table><thead><tr><th>${message('mcf2cde727c84')}</th><th>${message('m8c2313be66f5')}</th><th>${message('m480505d72f9c')}</th><th>${message('m01afcab93b88')}</th></tr></thead><tbody>${efforts.map(e=>{const best=previous.get(e.seconds),pr=Number.isFinite(best)&&e.power>best+.5;return `<tr><td>${stamp(e.seconds)}</td><td>${num(e.power,0)} ${message('m8e3966cfaef2')}${pr?` <span class="accent">PR</span>`:''}</td><td>${range(e,ride)}</td><td>${best===undefined?'—':num(best,0)+' '+message('m8e3966cfaef2')}</td></tr>`}).join('')}</tbody></table></div></div></details>`;
}
function powerMarkup(z){
 return `<details class="fold"><summary>${message('m6726b31e3843')}</summary>${!z.available?`<p class="muted">${z.reason==='ftp'?message('m8fdb9d70592f'):message('m382fff6bf3c4')}</p>`:`<div class="stack"><p class="muted small">FTP ${num(z.ftp,0)} ${message('m8e3966cfaef2')} · ${z.source==='profile'?message('mefde0efeb1b3'): 'FIT'} · ${message('m492a06da4771')} ${num(z.coverage*100,0)}%. ${message('md524dde5bc02')}</p>${z.zones.map(v=>`<div class="zone-row"><div class="spread"><strong>Z${v.index} · ${num(v.low,0)}–${v.high===null?'∞':num(v.high,0)} ${message('m8e3966cfaef2')}</strong><span>${stamp(v.seconds)} · ${num(v.percent,0)}%</span></div><div class="zone-track"><i style="width:${v.percent}%;--zone-color:var(--accent)"></i></div></div>`).join('')}</div>`}</details>`;
}
function lapsMarkup(ride){
 if(!ride.laps?.length)return '';
 return `<details class="fold"><summary>${message('m3ee25b06def1')} · ${ride.laps.length}</summary><div class="analysis-table"><table><thead><tr><th>#</th><th>${message('m5e587891cc4e')}</th><th>${message('mc170f35646a4')}</th><th>${message('m8c2313be66f5')}</th><th>${message('m96d8fefec108')}</th></tr></thead><tbody>${ride.laps.map((l,i)=>`<tr><td>${i+1}</td><td>${Number.isFinite(l.duration)?stamp(l.duration):'—'}</td><td>${num(l.distance===null?null:l.distance/1000)} ${message('m0e987caf8587')}</td><td>${num(l.avgPower,0)}</td><td>${num(l.avgHr,0)}</td></tr>`).join('')}</tbody></table></div></details>`;
}
function matchesMarkup(ride,history){
 const matches=matchedRides(ride,history);
 return `<details class="fold"><summary>${message('m548dd77b44b3')} · ${matches.length}</summary><div class="stack"><p class="muted small">${message('mefb8cdd6f19b')}</p>${matches.length?matches.map(r=>`<a class="card" href="#ride/${esc(r.id)}"><strong data-user-content>${esc(r.customTitle||date(r.start))}</strong><p>${num(r.distance/1000)} ${message('m0e987caf8587')} · ${Number.isFinite(r.duration)?stamp(r.duration):'—'}${r.duration>0&&ride.duration>0&&r.durationSource===ride.durationSource?` · ${message('mdd01032a7819')}: ${num((ride.duration/r.duration-1)*100)}%`:''}</p></a>`).join(''):`<p class="muted">${message('m0106d64465ca')}</p>`}</div></details>`;
}

export function ftpProfileMarkup(profile={}){return `<label>FTP · ${message('m8e3966cfaef2')}<input name="ftp" type="number" min="30" max="1000" step="1" value="${esc(profile.ftp||'')}" placeholder="FTP"></label><p class="muted small">${message('m89fb2a8e2795')}</p>`}

function distanceEffortsMarkup(ride,history){
 const efforts=bestDistanceEfforts(ride);if(!efforts.length)return '';
 const previous=new Map();for(const r of history.filter(r=>r.id!==ride.id&&!(r.hash&&r.hash===ride.hash)&&r.start<ride.start))for(const e of bestDistanceEfforts(r))previous.set(e.meters,Math.min(previous.get(e.meters)??Infinity,e.seconds));
 return `<details class="fold"><summary>${message('m3793426fd4eb')}</summary><div class="stack"><p class="muted small">${message('m27482eee8613')}</p><div class="analysis-table"><table><thead><tr><th>${message('mc170f35646a4')}</th><th>${message('m5e587891cc4e')}</th><th>${message('m480505d72f9c')}</th><th>${message('m01afcab93b88')}</th></tr></thead><tbody>${efforts.map(e=>{const before=previous.get(e.meters);return `<tr><td>${num(e.meters/1000)} ${message('m0e987caf8587')}</td><td>${stamp(e.seconds)}${before!==undefined&&e.seconds<before-.5?' <span class="accent">PR</span>':''}</td><td>${range(e,ride)}</td><td>${before===undefined?'—':stamp(before)}</td></tr>`}).join('')}</tbody></table></div></div></details>`;
}
