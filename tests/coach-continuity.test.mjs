import test from 'node:test';
import assert from 'node:assert/strict';
import {coachPlan,trainingHistory,emptyCoach,validateCoachSettings} from '../src/coach.js';
import {dateKey,nextDay,localDate} from '../src/periods.js';

// An engineering continuity regression, not a physiological training target:
// following every prescribed day in steady conditions must not silently halve
// the reference volume as the seven-day forecast is recalculated each morning.
const start=+new Date(2026,9,31,12),first=dateKey(start);
const goal={id:'continuity',kind:'distance',smart:true,target:100000,from:first,to:nextDay(first,200)};
const ride=(id,date,minutes)=>{const at=+localDate(date)+8*3600000;return {id,start:at,end:at+minutes*60000,duration:minutes*60,durationSource:'timer',distance:minutes*300,points:[]}};
const settings=(date,focus,now)=>validateCoachSettings({level:'regular',focus,days:[0,1,2,3,4,5,6],weeklyMinutes:300,sessionMinutes:90,comfortableMinutes:90,historyConfirmedOn:date},now);
const weather=date=>({status:'fresh',days:Object.fromEntries(Array.from({length:7},(_,i)=>[nextDay(date,i),{low:10,high:20,wind:5,gusts:10,rain:0,code:1}]))});
const wellbeing=date=>({date,sleepHours:8,sleepQuality:4,fatigue:2,stress:2});
const runs=new Map();
const initialRides=(date=first)=>Array.from({length:14},(_,i)=>ride('history-'+i,nextDay(date,-(i+1)*2),60));
function follow(focus,shift=0){
 const key=focus+':'+shift,origin=start+shift*86400000;
 if(runs.has(key))return runs.get(key);
 const rides=initialRides(dateKey(origin)),feedback=[],weeks=[];let initial=null,last;
 for(let day=0;day<112;day++){
  const now=origin+day*86400000,date=dateKey(now),state={...emptyCoach(),settings:settings(date,focus,now),checkins:[wellbeing(date)],feedback};
  const model=coachPlan({goal,rides,state,weather:weather(date),now});if(initial===null)initial=model.weeklyCap;last=model;
  if(day%7===0)weeks.push({day,cap:model.weeklyCap,previousWeek:model.history.weeks[0]});
  const current=model.rows.find(row=>row.current),before=Array.from({length:7},(_,age)=>model.history.minutesByDay.get(nextDay(date,-age))||0).reduce((a,b)=>a+b,0);
  assert(current.minutes<=Math.max(0,model.weeklyCap-before)+1e-8,'new work must fit the rolling guideline');
  assert(model.rows.every(row=>row.minutes>=0&&row.minutes<=90));
  if(current.minutes){const id='followed-'+day;rides.push(ride(id,date,current.minutes));feedback.push({rideId:id,rpe:current.type==='intervals'?8:2})}
 }
 const result={initial,last,rides,feedback,weeks};runs.set(key,result);return result;
}
for(let shift=0;shift<7;shift++)for(const focus of ['endurance','speed'])test(`${focus}, start ${nextDay(first,shift)}: 112 days of full adherence do not produce a self-reinforcing collapse in training volume`,()=>{
 const run=follow(focus,shift),average=run.last.history.weeks.reduce((a,b)=>a+b,0)/4;
 assert(average>=run.initial*.8,JSON.stringify({initial:run.initial,finalAverage:average,weeks:run.weeks}));
});
test('the established reference stays stable within a calendar week as ordinary completed work is added',()=>{
 const rides=initialRides(),before=trainingHistory(rides,settings(first,'endurance',start),start);
 const next=start+86400000,key=dateKey(next),after=trainingHistory([...rides,ride('followed-saturday',first,30)],settings(key,'endurance',next),next);
 assert(before.established&&after.established);assert.notEqual(before.average,after.average,'the rolling display window really moved');assert.equal(after.baseline,before.baseline,'the planning reference should not oscillate with the phase of a rolling 28-day window');
});
test('a feasible ordinary ride preserves the recent typical duration instead of taking a fresh fraction of the whole weekly budget',()=>{
 const model=coachPlan({goal,rides:initialRides(),state:{...emptyCoach(),settings:settings(first,'endurance',start),checkins:[wellbeing(first)]},weather:weather(first),now:start});
 const ordinary=model.rows.find(row=>row.minutes>0&&row.type==='endurance'&&!row.current&&!row.reasons.includes('weekly-cap'));
 assert(ordinary);assert.equal(model.history.typicalMinutes,60);assert.equal(ordinary.minutes,60);
});
test('continuity protection still reduces work for poor readiness and a genuine two-week break',()=>{
 const run=follow('endurance'),now=start+112*86400000,date=dateKey(now),baseState={...emptyCoach(),settings:settings(date,'speed',now),checkins:[{...wellbeing(date),fatigue:5}],feedback:run.feedback};
 const tired=coachPlan({goal,rides:run.rides,state:baseState,weather:weather(date),now});
 assert(tired.rows[0].rest);assert(tired.rows.every(row=>row.type!=='intervals'));assert(tired.weeklyCap<=tired.history.baseline*.75+1e-8);
 const later=now+14*86400000,key=dateKey(later),state={...baseState,settings:settings(key,'speed',later),checkins:[wellbeing(key)]};
 const returned=coachPlan({goal,rides:run.rides,state,weather:weather(key),now:later});
 assert(returned.history.gap>=14);assert(returned.weeklyCap<=90);assert(returned.rows.every(row=>row.type!=='intervals'));
});
test('a limited weekday can still receive a short recovery ride after hard work',()=>{
 const now=+new Date(2026,10,4,12),date=dateKey(now),rides=[ride('hard',nextDay(date,-1),40),...Array.from({length:3},(_,i)=>[ride('weekly-easy-'+i,nextDay(date,-7*(i+1)),20),ride('weekly-longer-'+i,nextDay(date,-7*(i+1)-1),40)]).flat()];
 const state={...emptyCoach(),settings:{...settings(date,'speed',now),days:[2]},checkins:[wellbeing(date)],feedback:[{rideId:'hard',rpe:8}]};
 const model=coachPlan({goal,rides,state,weather:weather(date),now}),current=model.rows.find(row=>row.current);
 assert(model.history.established);assert.equal(current.type,'recovery');assert(current.minutes>0&&current.minutes<=30);assert(model.rows.every(row=>row.type!=='intervals'));
});
