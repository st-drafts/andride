import {dateKey,localDate,nextDay,validRange} from './periods.js';

const DAY=86400000,EPSILON=1e-8;
// Count calendar days in UTC from the local date components, including DST changes.
export function goalDays(goal){
 if(!validRange(goal))return 0;
 const serial=key=>{const d=localDate(key);return Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/DAY};
 return serial(goal.to)-serial(goal.from)+1;
}
export function validateGoal(value){
 const title=String(value.title??'').trim(),target=Number(value.target),kind=value.kind,smart=value.smart===true;
 if(!title||title.length>100)throw Error('Укажи название цели до 100 символов.');
 if(!['distance','duration','count'].includes(kind)||!Number.isFinite(target)||target<=0||target>100000||kind==='count'&&!Number.isInteger(target))throw Error('Укажи положительную цель до 100 000. Количество поездок — целое число.');
 if(!validRange(value))throw Error('Проверь даты: окончание должно быть не раньше начала.');
 if(smart&&(kind!=='distance'||goalDays(value)>366))throw Error('Умный план доступен для дистанции на период до 366 дней.');
 return {title,kind,target,from:value.from,to:value.to,smart};
}

// Space training across the entire window. Recent recorded activity gets the
// first available rest day; the other sessions have gaps differing by <= 1 day.
function trainingDates(slots,count,restFirst){
 const selected=new Set();
 if(!count)return selected;
 if(count>=slots){for(let i=0;i<slots;i++)selected.add(i);return selected}
 const first=restFirst?1:0;
 if(count===1){selected.add(restFirst?Math.floor(slots/2):0);return selected}
 for(let i=0;i<count;i++)selected.add(Math.round(first+i*(slots-1-first)/(count-1)));
 return selected;
}
const sessionsNeeded=(distance,daily,slots)=>distance<=EPSILON?0:Math.min(slots,Math.max(1,Math.ceil(distance/daily-EPSILON)));

// Recorded FIT distance is the only earned credit. Future rides and forecasts
// never count as completed work. No model download, network or saved-plan migration.
export function smartSchedule(goal,rides,now=Date.now()){
 const days=goalDays(goal);
 if(goal.smart!==true||goal.kind!=='distance'||!Number.isFinite(goal.target)||goal.target<=0||!days||days>366||!Number.isFinite(+now))return null;
 const today=dateKey(now),daily=goal.target/days,actual=new Map(),seen=new Set();
 for(const r of rides){
  if(r.id&&seen.has(r.id))continue;
  if(r.id)seen.add(r.id);
  if(!Number.isFinite(r.start)||r.start>+now||!Number.isFinite(r.distance)||r.distance<0)continue;
  const key=dateKey(r.start);
  if(key<goal.from||key>goal.to)continue;
  actual.set(key,(actual.get(key)||0)+r.distance/1000);
 }
 const completed=[...actual.values()].reduce((a,b)=>a+b,0),rows=[];
 let recordedBefore=0,lastRide='';
 // History depends only on records available by each historical day. Newer FIT
 // must not rewrite earlier days into rest based on credit earned later.
 for(let key=goal.from,i=0;i<days;i++,key=nextDay(key)){
  const past=key<today,ridden=actual.get(key)||0;
  if(!past){rows.push({date:key,planned:0,actual:ridden,rest:false,complete:false,past:false,current:key===today,remaining:0});continue}
  const remaining=Math.max(0,goal.target-recordedBefore),done=remaining<=EPSILON;
  const rest=!done&&ridden<=EPSILON&&recordedBefore-daily*i+EPSILON>=daily;
  const planned=done||rest?0:Math.min(remaining,Math.max(daily,remaining/(days-i)));
  rows.push({date:key,planned,actual:ridden,rest,complete:done,past:true,current:false,remaining:Math.max(0,planned-ridden)});
  recordedBefore+=ridden;if(ridden>EPSILON)lastRide=key;
 }
 let pending=rows.filter(r=>!r.past),forecast=recordedBefore;
 // Keep today's real activity on today's row. When credit already permits rest,
 // even a short ride is extra work; do not ask the rider to top it up needlessly.
 const current=pending[0];
 if(current?.current&&current.actual>EPSILON){
  const remaining=Math.max(0,goal.target-forecast),count=sessionsNeeded(remaining,daily,pending.length);
  const earnedRest=count<pending.length;
  current.planned=Math.min(remaining,earnedRest?current.actual:Math.max(current.actual,remaining/Math.max(1,count)));
  current.remaining=Math.max(0,current.planned-current.actual);
  current.complete=remaining<=EPSILON;
  forecast+=Math.max(current.planned,current.actual);lastRide=current.date;pending=pending.slice(1);
 }
 const distance=Math.max(0,goal.target-forecast),count=sessionsNeeded(distance,daily,pending.length);
 const perSession=count?distance/count:0;
 const restFirst=!!pending.length&&lastRide===nextDay(pending[0].date,-1);
 const sessions=trainingDates(pending.length,count,restFirst);
 pending.forEach((row,i)=>{
  row.complete=distance<=EPSILON;
  row.rest=!row.complete&&!sessions.has(i);
  row.planned=sessions.has(i)?perSession:0;row.remaining=row.planned;
 });
 const elapsed=rows.filter(r=>r.past||r.current).length,credit=Math.max(0,completed-daily*elapsed);
 return {days,daily,completed,remaining:Math.max(0,goal.target-completed),credit,
  restDays:rows.filter(r=>!r.past&&r.rest).length,
  trainingDays:rows.filter(r=>!r.past&&r.remaining>EPSILON).length,
  sessionDistance:perSession||(current?.planned||0),strategy:'balanced-local',
  next:rows.find(r=>!r.past)||null,rows};
}

export function selectedGoal(goals,id,today=dateKey(Date.now())){
 return goals.find(g=>g.id===id)||goals.filter(g=>g.from<=today&&g.to>=today).sort((a,b)=>a.to.localeCompare(b.to))[0]||goals.filter(g=>g.from>today).sort((a,b)=>a.from.localeCompare(b.from))[0]||[...goals].sort((a,b)=>b.to.localeCompare(a.to))[0]||null;
}
