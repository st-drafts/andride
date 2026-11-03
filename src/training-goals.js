import {dateKey,localDate,nextDay,validRange} from './periods.js';
import {recordedRides} from './history-data.js';

export const smartGoalKinds=['distance','duration','weekly-time','event'];
export const isTrainingGoal=goal=>!!goal&&smartGoalKinds.includes(goal.kind);
export function calendarWeek(key){const d=localDate(key);d.setDate(d.getDate()-(d.getDay()+6)%7);const from=dateKey(d);return {from,to:nextDay(from,6)}}

export function trainingGoalProgress(goal,rides,now=Date.now()){
 const today=dateKey(now),week=calendarWeek(goal.from>today?goal.from:goal.to<today?goal.to:today),range=goal.kind==='weekly-time'?{from:goal.from>week.from?goal.from:week.from,to:goal.to<week.to?goal.to:week.to}:goal;
 const rows=validRange(range)?recordedRides(rides,now).filter(r=>dateKey(r.start)>=range.from&&dateKey(r.start)<=range.to):[];
 const value=goal.kind==='event'?rows.reduce((sum,r)=>sum+(Number.isFinite(r.duration)&&r.duration>=0?r.duration/3600:0),0):goal.kind==='distance'?rows.reduce((sum,r)=>sum+(Number.isFinite(r.distance)&&r.distance>=0?r.distance/1000:0),0):goal.kind==='count'?rows.length:rows.reduce((sum,r)=>sum+(Number.isFinite(r.duration)&&r.duration>=0?r.duration/3600:0),0);
 const remaining=goal.kind==='event'?today<=goal.to?1:0:Math.max(0,goal.target-value);
 return {value,remaining,unit:goal.kind==='distance'?'км':goal.kind==='count'?'поездок':'ч',percent:goal.kind==='event'?0:Math.min(100,Math.floor(value/goal.target*100)),range};
}

export function manualCommitments(plans,rides,now=Date.now()){
 const today=dateKey(now),recorded=new Set(recordedRides(rides,now).map(r=>r.id)),seen=new Set(),minutesByDay=new Map(),rows=[];
 for(const plan of plans||[]){
  if(!plan||typeof plan.id!=='string'||seen.has(plan.id)||!localDate(plan.date)||plan.date<today||!Number.isFinite(plan.minutes)||plan.minutes<=0||plan.minutes>1440||recorded.has(plan.rideId))continue;
  seen.add(plan.id);rows.push(plan);minutesByDay.set(plan.date,(minutesByDay.get(plan.date)||0)+plan.minutes);
 }
 return {rows,minutesByDay};
}
