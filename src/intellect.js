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

// FIT is the only source of completed distance. Forecast rides are never persisted
// as real workouts, and future-dated FIT cannot prepay an unstarted goal.
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
 let forecast=0;
 for(let key=goal.from,i=0;i<days;i++,key=nextDay(key)){
  const remaining=Math.max(0,goal.target-forecast),bank=Math.max(0,forecast-daily*i),done=remaining<=EPSILON;
  const rest=!done&&bank+EPSILON>=daily;
  const planned=done||rest?0:Math.min(remaining,Math.max(daily,remaining/(days-i)));
  const ridden=actual.get(key)||0,past=key<today,current=key===today;
  rows.push({date:key,planned,actual:ridden,rest,complete:done,past,current,remaining:Math.max(0,planned-ridden)});
  if(past){forecast+=ridden}
  else forecast+=Math.max(planned,current?ridden:0);
 }
 const elapsed=rows.filter(r=>r.past||r.current).length;
 const credit=Math.max(0,completed-daily*elapsed);
 const next=rows.find(r=>r.date>=today)||null;
 return {days,daily,completed,remaining:Math.max(0,goal.target-completed),credit,restDays:rows.filter(r=>r.date>=today&&r.rest).length,next,rows};
}

export function selectedGoal(goals,id,today=dateKey(Date.now())){
 return goals.find(g=>g.id===id)||goals.filter(g=>g.from<=today&&g.to>=today).sort((a,b)=>a.to.localeCompare(b.to))[0]||goals.filter(g=>g.from>today).sort((a,b)=>a.from.localeCompare(b.from))[0]||[...goals].sort((a,b)=>b.to.localeCompare(a.to))[0]||null;
}
