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

// A relative day-level preference, not a claim that a route is safe to ride.
export function weatherPenalty(w){
 if(!w||!['low','high','rain','probability','wind'].every(k=>Number.isFinite(w[k]))||w.low>w.high||w.rain<0||w.probability<0||w.probability>100||w.wind<0)return null;
 let score=w.rain*2+w.probability/25+Math.max(0,w.wind-12)/5;
 if(Number.isFinite(w.gusts))score+=Math.max(0,w.gusts-25)/6;
 const heat=Number.isFinite(w.feelsLike)?Math.max(w.high,w.feelsLike):w.high;
 score+=Math.max(0,12-w.high)/4+Math.max(0,heat-25)/3;
 if(w.high<5||heat>32)score+=6;
 if(w.low<=0&&w.rain>0)score+=25;
 if([56,57,66,67,71,73,75,77,85,86,95,96,99].includes(w.code))score+=40;
 return score;
}

function weatherDates(known,anchors){
 const count=anchors.length,n=known.length,dp=Array.from({length:count},()=>Array(n).fill(null));
 for(let k=0;k<count;k++)for(let i=k;i<n-(count-k-1);i++){
  const own=known[i].score*8+(known[i].index-anchors[k])**2;
  if(!k){dp[k][i]={cost:own,prev:-1};continue}
  for(let j=k-1;j<i;j++)if(dp[k-1][j]){
   const gap=(known[i].index-known[j].index)-(anchors[k]-anchors[k-1]);
   const cost=dp[k-1][j].cost+own+gap*gap*.5;
   if(!dp[k][i]||cost<dp[k][i].cost-1e-9)dp[k][i]={cost,prev:j};
  }
 }
 let last=-1;for(let i=count-1;i<n;i++)if(dp[count-1][i]&&(last<0||dp[count-1][i].cost<dp[count-1][last].cost-1e-9))last=i;
 const result=new Set();for(let k=count-1;k>=0;k--){result.add(last);last=dp[k][last].prev}return result;
}

function adaptWeather(pending,forecast,today,daily,perSession,restFirst){
 const limit=nextDay(today,16),known=pending.flatMap((row,index)=>{const score=weatherPenalty(forecast?.[row.date]);return row.date<limit&&score!==null?[{row,index,score}]:[]});
 const active=known.filter(x=>x.row.planned>EPSILON),budget=active.reduce((n,x)=>n+x.row.planned,0);
 if(known.length<2||!active.length)return {applied:false,adjusted:false};
 const good=known.filter(x=>x.score<5).length,cap=perSession*1.5;
 // Only known days exchange kilometres. No weather is invented after the horizon.
 // A poor forecast may buy extra rest, with a bounded increase per remaining ride.
 let count=active.length;
 if(good>0&&good<count)count=Math.max(good,Math.ceil(budget/cap-EPSILON));
 const anchors=count===active.length?active.map(x=>x.index):[...trainingDates(known.length,count,restFirst&&known[0].index===0)].map(i=>known[i].index);
 const selected=weatherDates(known,anchors),distance=budget/count;let adjusted=false;
 known.forEach((x,i)=>{
  const previous=x.row.planned,chosen=selected.has(i);
  x.row.planned=chosen?distance:0;x.row.remaining=x.row.planned;x.row.rest=!chosen;
  if(Math.abs(previous-x.row.planned)>EPSILON)adjusted=true;
  if(!chosen&&previous>EPSILON)x.row.restReason='weather';
  if(chosen&&previous<=EPSILON)x.row.weatherPreferred=true;
 });
 return {applied:true,adjusted};
}

// Recorded FIT distance is the only earned credit. Future rides and forecasts
// never count as completed work. No model download, network or saved-plan migration.
export function smartSchedule(goal,rides,now=Date.now(),weather={}){
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
 const weatherPlan=distance>EPSILON?adaptWeather(pending,weather,today,daily,perSession,restFirst):{applied:false,adjusted:false};
 const elapsed=rows.filter(r=>r.past||r.current).length,credit=Math.max(0,completed-daily*elapsed);
 return {days,daily,completed,remaining:Math.max(0,goal.target-completed),credit,
  restDays:rows.filter(r=>!r.past&&r.rest).length,
  trainingDays:rows.filter(r=>!r.past&&r.remaining>EPSILON).length,
  sessionDistance:weatherPlan.applied?rows.filter(r=>!r.past&&r.remaining>EPSILON).reduce((n,r)=>n+r.remaining,0)/Math.max(1,rows.filter(r=>!r.past&&r.remaining>EPSILON).length):perSession||(current?.planned||0),strategy:weatherPlan.applied?'weather-local':'balanced-local',weatherApplied:weatherPlan.applied,weatherAdjusted:weatherPlan.adjusted,
  next:rows.find(r=>!r.past)||null,rows};
}

export function selectedGoal(goals,id,today=dateKey(Date.now())){
 return goals.find(g=>g.id===id)||goals.filter(g=>g.from<=today&&g.to>=today).sort((a,b)=>a.to.localeCompare(b.to))[0]||goals.filter(g=>g.from>today).sort((a,b)=>a.from.localeCompare(b.from))[0]||[...goals].sort((a,b)=>b.to.localeCompare(a.to))[0]||null;
}
