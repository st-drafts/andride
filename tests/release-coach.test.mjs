import test from 'node:test';import assert from 'node:assert/strict';
import {coachPlan,trainingHistory,goalDistanceRange,validateCoachSettings,emptyCoach,mergeCoachState} from '../src/coach.js';
import {dateKey,nextDay,localDate} from '../src/periods.js';
const at=+new Date(2026,9,31,12),today=dateKey(at),goal={id:'g',title:'Season',kind:'distance',smart:true,target:10000,from:today,to:nextDay(today,100)};
const settings=extra=>validateCoachSettings({level:'regular',focus:'speed',days:[0,1,2,3,4,5,6],weeklyMinutes:300,sessionMinutes:90,comfortableMinutes:90,historyConfirmedOn:today,...extra},at);
const wellness=date=>({date,sleepHours:8,sleepQuality:4,fatigue:2,stress:2});
const ride=(id,ago,minutes=60)=>{const start=+localDate(nextDay(today,-ago))+8*3600000;return {id,hash:id,start,end:start+minutes*60000,duration:minutes*60,durationSource:'timer',distance:minutes*300,points:[]}};
const history=()=>[2,4,6,8,10,12,14,16,18,20,22,24,26,28].map(d=>ride('r'+d,d));
const state=extra=>({...emptyCoach(),settings:settings(),checkins:[wellness(today)],...extra});
const forecast=date=>({status:'fresh',days:Object.fromEntries(Array.from({length:7},(_,i)=>[nextDay(date,i),{low:10,high:20,rain:0,wind:5,gusts:10,code:1}]))});
const plan=(rows,st=state())=>coachPlan({goal,rides:rows,state:st,weather:forecast(today),now:at});
test('each future seven-day window includes already ridden minutes, not a new budget at each refresh',()=>{
 const rows=history(),p=plan(rows);
 for(const row of p.rows){const from=nextDay(row.date,-6),actual=rows.filter(r=>dateKey(r.start)>=from&&dateKey(r.start)<=row.date).reduce((n,r)=>n+r.duration/60,0),planned=p.rows.filter(r=>r.date>=from&&r.date<=row.date).reduce((n,r)=>n+r.minutes,0);assert(planned<=Math.max(0,p.history.baseline-actual)+1e-8)}
 const overloaded=[...history(),ride('today',0,240)];assert.equal(plan(overloaded).rows.slice(0,6).reduce((n,r)=>n+r.minutes,0),0);
 const shortGoal={...goal,to:today};assert.equal(goalDistanceRange(shortGoal,overloaded,settings(),at).minutes,0);
});
test('a recent hard session prevents another interval inside seven calendar days and needs recovery beyond today',()=>{
 const rows=history().filter(r=>r.id!=='r2').concat(ride('hard',1)),p=plan(rows,state({feedback:[{rideId:'hard',rpe:8}]}));
 for(const row of p.rows.filter(r=>r.type==='intervals'))assert(row.date>=nextDay(today,6));
 const tomorrow=p.rows.find(r=>r.date===nextDay(today));if(tomorrow.minutes)assert.equal(tomorrow.type,'recovery');
});
test('repeated poor wellbeing limits intensity even after one good morning, without using stale check-ins',()=>{
 const checks=[wellness(today),{...wellness(nextDay(today,-1)),fatigue:4},{...wellness(nextDay(today,-2)),sleepHours:5}];
 const p=plan(history(),state({checkins:checks}));assert(p.notes.includes('wellbeing-trend'));assert(p.rows.every(r=>r.type!=='intervals'));
 const old=checks.map(x=>({...x,date:nextDay(x.date,-10)}));assert(!plan(history(),state({checkins:[wellness(today),...old]})).notes.includes('wellbeing-trend'));
});
test('missing duration or reversed sessions cannot calibrate a confident training history',()=>{
 const rows=history(),bad=Array.from({length:20},(_,i)=>({...ride('bad'+i,1+i%27),duration:null})),reversed={...ride('reversed',0),end:0};
 const h=trainingHistory([...rows,...bad,reversed],settings(),at);assert.equal(h.established,false);assert(!h.all.includes(reversed));assert(!plan([reversed]).range.completed);
});
test('daily replanning over six weeks stays within availability and rolling time limits',()=>{
 for(const focus of ['endurance','speed']){
  let rows=history(),feedback=[],intervalDates=[];
  for(let d=0;d<42;d++){
   const now=at+d*86400000,date=dateKey(now),s=settings({focus,historyConfirmedOn:date}),st={...state(),settings:s,checkins:[wellness(date)],feedback};
   const p=coachPlan({goal,rides:rows,state:st,weather:forecast(date),now});
   for(const r of p.rows){assert(r.minutes<=s.sessionMinutes);assert(r.minutes<=s.comfortableMinutes);assert(r.minutes>=0&&Number.isFinite(r.minutes));assert(p.minutes<=p.budget+1e-8)}
   const session=p.rows.find(r=>r.current);if(session?.minutes){
    const start=+localDate(date)+8*3600000;rows.push({id:'new'+d,hash:'new'+d,start,end:start+session.minutes*60000,duration:session.minutes*60,distance:session.minutes*300,durationSource:'timer',points:[]});feedback.push({rideId:'new'+d,rpe:session.type==='intervals'?8:2});
    if(session.type==='intervals'){if(intervalDates.length)assert(d-intervalDates.at(-1)>=7);intervalDates.push(d)}
   }
   const actual=rows.filter(r=>dateKey(r.start)>=nextDay(date,-6)&&dateKey(r.start)<=date).reduce((n,r)=>n+r.duration/60,0);assert(actual<=s.weeklyMinutes+1e-8);
  }
  assert(rows.length>history().length);
 }
});
test('merging two valid full coach backups deduplicates first, then keeps the latest bounded history',()=>{
 const checks=offset=>Array.from({length:730},(_,i)=>wellness(nextDay(today,-(i+offset))));
 const current=state({checkins:checks(0),feedback:[{rideId:'same',rpe:2}]}),incoming=state({checkins:checks(300),feedback:[{rideId:'same',rpe:8}]});
 const snapshot=JSON.stringify([current,incoming]),merged=mergeCoachState(current,incoming,at);assert.equal(merged.checkins.length,730);assert.equal(merged.checkins.at(-1).date,today);assert.equal(merged.feedback.length,1);assert.equal(merged.feedback[0].rpe,8);assert.equal(JSON.stringify([current,incoming]),snapshot);
});

test('unconfigured coach does not fall back to a competing kilometre-driven training prescription',async()=>{
 const {intellectMarkup}=await import('../src/intellect-ui.js');
 const html=intellectMarkup({goals:[goal],activeId:goal.id,rides:history(),month:new Date(at),selectedDay:'',calendar:()=>'',monthHeader:()=>'',manualMarkup:()=>'',goalProgress:()=>({value:0,remaining:10000,unit:'км'}),coach:{model:null,html:'<p>Coach setup</p>'}});
 assert(html.includes('Coach setup'));assert(!html.includes('smart-next'));assert(!html.includes('smart-schedule'));assert(!html.includes('км в день'));
});

test('known ultra-distance work is excluded from typical calibration but never treated as zero weekly load',()=>{
 const ultra=ride('ultra',2,1500),p=plan([...history(),ultra]);assert(p.history.minutesByDay.get(dateKey(ultra.start))>=1500);assert.equal(p.rows.slice(0,5).reduce((n,r)=>n+r.minutes,0),0);
});
