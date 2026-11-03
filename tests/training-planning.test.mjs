import test from 'node:test';
import assert from 'node:assert/strict';
import {rideFTP,updateFTPHistory,validateFTPHistory} from '../src/thresholds.js';
import {validProfile} from '../src/physiology.js';
import {powerLoad} from '../src/training-load.js';
import {trainingHistory,coachPlan,validateCoachSettings,emptyCoach} from '../src/coach.js';
import {trainingGoalProgress,manualCommitments,calendarWeek} from '../src/training-goals.js';
import {validateGoal} from '../src/intellect.js';
import {localDate,dateKey,nextDay} from '../src/periods.js';

const now=+new Date(2026,10,3,12),today=dateKey(now),at=date=>+localDate(date)+8*3600000;
const settings=validateCoachSettings({level:'regular',focus:'speed',days:[0,1,2,3,4,5,6],weeklyMinutes:420,sessionMinutes:120,comfortableMinutes:90,historyConfirmedOn:today},now);
const state={...emptyCoach(),settings,checkins:[{date:today,sleepHours:8,sleepQuality:4,fatigue:2,stress:2}]};
const goal={id:'g',title:'November',kind:'distance',smart:true,target:1000,from:today,to:nextDay(today,29)};
const history=Array.from({length:14},(_,i)=>{const start=at(nextDay(today,-(i*2+1)));return {id:'r'+i,start,end:start+3600000,duration:3600,durationSource:'timer',distance:20000,points:[]}});
const weather={status:'fresh',days:Object.fromEntries(Array.from({length:16},(_,i)=>[nextDay(today,i),{low:12,high:20,wind:5,gusts:10,rain:0,code:1}]))};
const plan=(extra={})=>coachPlan({goal,rides:history,state,weather,now,...extra});

test('dated FTP preserves old effort zones, explicit override is reversible and FIT bytes stay untouched',()=>{
 const old={ftp:200,weight:72},ride={start:at('2026-10-15'),ftp:180},snapshot=JSON.stringify([old,ride]);
 const updated=updateFTPHistory(old,validProfile({ftp:260,weight:72}),{from:today,now});
 assert.equal(rideFTP(ride,updated).ftp,200);assert.equal(rideFTP({...ride,start:now},updated).ftp,260);
 assert.equal(rideFTP(ride,{...updated,ftpMode:'override'}).ftp,260);assert.equal(rideFTP(ride,{...updated,ftpMode:'history'}).ftp,200);
 assert.equal(JSON.stringify([old,ride]),snapshot);assert.deepEqual(validProfile(JSON.parse(JSON.stringify(updated))),updated);
});
test('a first FTP setting does not rewrite earlier FIT thresholds and clearing it is effective only from its date',()=>{
 const updated=updateFTPHistory({},validProfile({ftp:250}),{from:today,now}),ride={start:at('2026-10-15'),ftp:180};
 assert.equal(rideFTP(ride,updated).ftp,180);
 const cleared=updateFTPHistory(updated,{}, {from:nextDay(today),now});assert.equal(rideFTP({...ride,start:now},cleared).ftp,250);assert.equal(rideFTP({...ride,start:at(nextDay(today,2))},cleared).ftp,180);
 for(const rows of [null,[{from:'bad',ftp:250}],[{from:today,ftp:0}],[{from:today,ftp:250},{from:today,ftp:260}]])assert.throws(()=>validateFTPHistory(rows));
 assert.deepEqual(validateFTPHistory([{from:nextDay(today),ftp:null},{from:today,ftp:250}]),[{from:today,ftp:250},{from:nextDay(today),ftp:null}]);
});
test('measured power identifies a hard ride without heart rate or RPE; missing and modelled power cannot do so',()=>{
 const start=now-4*3600000,ride={id:'power',start,end:start+3600000,duration:3600,ftp:250,normalizedPower:290,points:Array.from({length:3601},(_,i)=>({t:start+i*1000,p:i%600<300?350:100,c:90,hr:null}))};
 const snapshot=JSON.stringify(ride),load=powerLoad(ride);assert.equal(load.coverage,1);assert.equal(load.highSeconds,1800);assert.equal(load.intensity,290/250);assert.equal(load.hard,true);assert.equal(trainingHistory([ride],settings,now).hardRecent,true);
 assert.equal(powerLoad({...ride,points:ride.points.map(p=>({...p,p:null,routeSpeed:12}))}).known,false);
 assert.equal(powerLoad({...ride,points:ride.points.map((p,i)=>({...p,p:i<1800?350:null}))}).hard,false);
 const zeros=powerLoad({...ride,points:ride.points.map(p=>({...p,p:0})),normalizedPower:0});assert.equal(zeros.coverage,1);assert.equal(zeros.highSeconds,0);assert.equal(zeros.intensity,0);assert.equal(zeros.hard,false);assert.equal(JSON.stringify(ride),snapshot);
});
test('power classification uses the FTP effective on the ride date and invalidates its cache',()=>{
 const start=now-86400000,ride={start,end:start+1200000,duration:1200,points:Array.from({length:1201},(_,i)=>({t:start+i*1000,p:230}))};
 const profile={ftp:300,ftpMode:'history',ftpHistory:[{from:'2026-01-01',ftp:200},{from:today,ftp:300}]};
 assert.equal(powerLoad(ride,profile).hard,true);assert.equal(powerLoad(ride,{...profile,ftpMode:'override'}).hard,false);
});
test('missing FTP does not turn measured power coverage into missing power or invent relative intensity',()=>{
 const ride={start:0,end:600000,normalizedPower:290,points:Array.from({length:601},(_,i)=>({t:i*1000,p:300}))},load=powerLoad(ride);
 assert.equal(load.coverage,1);assert.equal(load.recorded,600);assert.equal(load.intensity,null);assert.equal(load.known,false);assert.equal(load.hard,false);
});
test('manual commitments deduplicate, ignore past and completed linked plans, and never count as ridden work',()=>{
 const plans=[{id:'future',date:nextDay(today,2),minutes:180},{id:'past',date:nextDay(today,-1),minutes:60},{id:'linked',date:today,minutes:60,rideId:history[0].id},{id:'invalid',date:today,minutes:NaN}];
 const commitments=manualCommitments([...plans,plans[0]],history,now);assert.equal(commitments.rows.length,1);assert.equal(commitments.minutesByDay.get(nextDay(today,2)),180);assert.equal(trainingGoalProgress(goal,history,now).value,0);
});
test('reserved rides block automatic workouts and every affected rolling window includes later commitments',()=>{
 const plans=[{id:'group',title:'Group ride',date:nextDay(today,3),minutes:120},{id:'later',title:'Beyond horizon',date:nextDay(today,8),minutes:90}],p=plan({plans});
 const reserved=p.rows.find(r=>r.date===plans[0].date);assert.equal(reserved.type,'manual');assert.equal(reserved.minutes,0);assert.equal(reserved.manualMinutes,120);assert.equal(reserved.rest,false);
 for(let offset=0;offset<13;offset++){
  const to=nextDay(today,offset),from=nextDay(to,-6),actual=history.filter(r=>dateKey(r.start)>=from&&dateKey(r.start)<=to).reduce((n,r)=>n+r.duration/60,0),manual=plans.filter(p=>p.date>=from&&p.date<=to).reduce((n,p)=>n+p.minutes,0),automatic=p.rows.filter(r=>r.date>=from&&r.date<=to).reduce((n,r)=>n+r.minutes,0);
  assert(automatic<=Math.max(0,p.weeklyCap-actual-manual)+1e-8,JSON.stringify({from,to,actual,manual,automatic,cap:p.weeklyCap}));
 }
 assert.equal(p.range.completed,0);assert(p.notes.includes('manual-plan'));
});
test('oversubscribed manual plans remain visible while automatic work cannot add to their overloaded windows',()=>{
 const plans=[{id:'group',title:'Long ride',date:nextDay(today,3),minutes:600}],p=plan({plans});assert.equal(p.automaticMinutes,0);assert.equal(p.manualMinutes,600);assert(p.notes.includes('manual-over-cap'));assert.equal(p.rows.find(r=>r.manualMinutes).manualPlans[0].title,'Long ride');
});
test('a recorded ride today does not mark an unlinked manual workout complete',()=>{
 const start=at(today),ride={id:'today',start,end:start+3600000,duration:3600,distance:20000,points:[]},plans=[{id:'later-today',title:'Second workout',date:today,minutes:120}],rides=[...history,ride];
 const pending=plan({rides,plans}),row=pending.rows.find(r=>r.current);assert.equal(row.type,'manual');assert.equal(row.actualMinutes,60);assert.equal(row.manualMinutes,120);assert.equal(row.rest,false);assert.equal(pending.range.completed,20);
 const linked=plan({rides,plans:[{...plans[0],rideId:ride.id}]});assert.equal(linked.rows.find(r=>r.current).manualMinutes,0);assert.equal(linked.range.completed,20);
});
test('weekly time resets at local Monday and a completed week does not cancel the following week',()=>{
 const sunday=+new Date(2026,10,8,12),key=dateKey(sunday),weekly={...goal,kind:'weekly-time',target:1,from:'2026-11-01',to:'2026-11-30'},start=at(key),rides=[{id:'sun',start,end:start+3600000,duration:3600,points:[]}];
 const st={...state,settings:{...settings,historyConfirmedOn:key},checkins:[{date:key,sleepHours:8,sleepQuality:4,fatigue:2,stress:2}]},p=plan({goal:weekly,rides,state:st,now:sunday});
 assert.equal(trainingGoalProgress(weekly,rides,sunday).value,1);assert.equal(p.remaining,0);assert(p.rows.some(r=>r.date>key&&r.minutes>0));
 const monday=+new Date(2026,10,9,12);assert.equal(trainingGoalProgress(weekly,rides,monday).value,0);assert.equal(calendarWeek(dateKey(monday)).from,'2026-11-09');
 for(const row of p.rows){const week=calendarWeek(row.date),sum=p.rows.filter(r=>r.date>=week.from&&r.date<=week.to).reduce((n,r)=>n+r.minutes,0);assert(sum<=60)}
});
test('duration and event goals plan training time without requiring distance, and reserve the event date',()=>{
 const timed={...goal,kind:'duration',target:6},a=plan({goal:timed}),b=plan({goal:timed,rides:history.map(r=>({...r,distance:null}))});assert.deepEqual(a.rows.map(r=>r.minutes),b.rows.map(r=>r.minutes));assert.equal(a.range.unit,'duration');
 const event=validateGoal({title:'Race',kind:'event',from:today,to:nextDay(today,5),smart:false});assert.equal(event.target,1);assert.equal(event.smart,true);
 const p=plan({goal:event});assert(p.notes.includes('event-week'));assert(p.rows.every(r=>r.type!=='intervals'));assert.equal(p.rows.at(-1).type,'event');assert.equal(p.rows.at(-1).minutes,0);assert(p.automaticMinutes<=p.history.baseline*.6+1e-8);
 assert.throws(()=>validateGoal({...goal,kind:'weekly-time',target:169}));
});
