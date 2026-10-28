import test from 'node:test';
import assert from 'node:assert/strict';
import {coachPlan,emptyCoach,validateCoachSettings,validateCoachState,validateCheckin,validateFeedback,goalDistanceRange,trainingHistory,coachWeather,coachEvidence} from '../src/coach.js';
import {coachSection,coachSettingsFields} from '../src/coach-ui.js';
import {dateKey,nextDay,localDate} from '../src/periods.js';
const now=+new Date(2026,9,28,12),today=dateKey(now);
const goal={id:'goal',title:'Мой месяц',kind:'distance',smart:true,target:300,from:today,to:nextDay(today,29)};
const settings=(extra={})=>validateCoachSettings({level:'regular',focus:'endurance',days:[0,1,2,3,4,5,6],weeklyMinutes:300,sessionMinutes:90,comfortableMinutes:90,historyConfirmedOn:today,...extra},now);
const checkin={date:today,sleepHours:8,sleepQuality:4,fatigue:2,stress:2};
const state=(s=settings(),extra={})=>({...emptyCoach(),settings:s,checkins:[checkin],...extra});
const rides=()=>Array.from({length:16},(_,i)=>{const start=+localDate(nextDay(today,-(i+1)*2))+8*3600000;return {id:'r'+i,start,end:start+3600000,duration:3600,durationSource:'timer',distance:18000,points:[]}});
const forecast=(changes={})=>({status:'fresh',at:now,days:Object.fromEntries(Array.from({length:40},(_,i)=>[nextDay(today,i),{low:18,high:24,wind:8,gusts:15,rain:0,code:1,...changes}]))});
const plan=(extra={})=>coachPlan({goal,rides:rides(),state:state(),weather:forecast(),now,...extra});
test('first-time questionnaire produces a bounded distance range without inferring fitness or FTP',()=>{
 const s=settings({level:'beginner',weeklyMinutes:120,comfortableMinutes:30,days:[1,3,5],historyConfirmedOn:null}),range=goalDistanceRange(goal,[],s,now),p=plan({rides:[],state:state(s)});
 assert(range.low>=0&&range.high>range.low);assert.equal(range.speedSource,'assumption');assert(p.minutes<=90);assert(p.rows.every(r=>r.minutes<=30));assert(p.notes.includes('history-limited'));assert.equal(p.rows.filter(r=>r.type==='intervals').length,0);
});
test('completed distance is deduplicated, future FIT cannot earn credit and only actual FIT completes a goal',()=>{
 const r=rides()[0],current={...r,id:'today',start:now-3600000,end:now,distance:20000};const future={...current,id:'future',start:now+3600000,end:now+7200000};
 const p=plan({rides:[current,current,future],goal:{...goal,target:20}});assert.equal(p.range.completed,20);assert.equal(p.remaining,0);assert.equal(p.minutes,0);assert(p.rows.every(r=>r.rest));
 assert.equal(plan({rides:[],goal:{...goal,target:20}}).remaining,20);
});
test('impossible distance goals do not raise the training budget and an expired goal has no future sessions',()=>{
 const easy=plan({goal:{...goal,target:300}}),huge=plan({goal:{...goal,target:10000}});assert(huge.notes.includes('goal-high'));assert(huge.minutes<=huge.history.baseline);assert(huge.minutes<=settings().weeklyMinutes);assert(huge.minutes<=easy.minutes);
 const old=plan({goal:{...goal,from:nextDay(today,-30),to:nextDay(today,-1)}});assert.equal(old.rows.length,0);assert.deepEqual(old.notes,['expired']);
});
test('availability, per-session comfort and the goal end date bound every session',()=>{
 const s=settings({days:[0,2,5],sessionMinutes:35,comfortableMinutes:25}),p=plan({state:state(s),goal:{...goal,to:nextDay(today,3)}});
 for(const r of p.rows){assert(r.date<=nextDay(today,3));assert(r.minutes<=25);if(r.minutes)assert(s.days.includes((localDate(r.date).getDay()+6)%7))}assert(p.minutes<=p.budget);
});
test('poor wellness reduces volume, high fatigue rests today and absent check-in limits today',()=>{
 const normal=plan(),tired=plan({state:state(settings(),{checkins:[{...checkin,fatigue:4}]})}),exhausted=plan({state:state(settings(),{checkins:[{...checkin,fatigue:5}]})}),missing=plan({state:state(settings(),{checkins:[]})});
 assert(tired.minutes<=normal.minutes);assert(tired.notes.includes('wellbeing-reduced'));assert(exhausted.rows.find(r=>r.current).rest);assert(exhausted.rows.find(r=>r.current).reasons.includes('wellbeing-rest'));assert(missing.rows.find(r=>r.current).minutes<=30);
});
test('no FIT is not proof of rest: confirmed history is needed for established calibration',()=>{
 const incomplete=trainingHistory(rides(),settings({historyConfirmedOn:null}),now),complete=trainingHistory(rides(),settings(),now);assert.equal(incomplete.established,false);assert.equal(complete.established,true);assert.equal(trainingHistory(rides(),settings({historyConfirmedOn:nextDay(today,-8)}),now).established,false);
});
test('a long break and a large recent volume increase trigger bounded re-entry or deload',()=>{
 const old=rides().map(r=>({...r,start:r.start-20*86400000,end:r.end-20*86400000}));const returning=plan({rides:old});assert(returning.minutes<=90);assert(returning.notes.includes('return'));
 const loaded=rides().map(r=>({...r,duration:r.start>=+localDate(nextDay(today,-7))?14400:r.duration}));const p=plan({rides:loaded});assert(p.notes.includes('load-increase'));assert(p.history.baseline<=p.history.reference*.8+.001);
});
test('wind and gusts remove outdoor days, a trainer substitutes without promising kilometres',()=>{
 const bad=forecast({gusts:60}),outdoors=plan({weather:bad}),indoors=plan({weather:bad,state:state(settings({indoor:true}))});assert.equal(outdoors.minutes,0);assert(outdoors.rows.every(r=>r.rest));assert(indoors.minutes>0);assert(indoors.rows.filter(r=>r.minutes).every(r=>r.indoor&&r.kmLow===null&&r.kmHigh===null&&r.planned===0));
});
test('stale forecasts and missing wind data are never treated as favourable weather',()=>{
 const old=coachWeather(today,{...forecast({gusts:100}),status:'stale'});assert.equal(old.status,'unknown');assert.equal(old.data,null);assert(old.reasons.includes('weather-stale'));
 const partial=coachWeather(today,{status:'fresh',days:{[today]:{low:18,high:23,code:1}}});assert.equal(partial.status,'partial');assert(partial.reasons.includes('weather-partial'));
 const rain=coachWeather(today,forecast({rain:10}));assert.equal(rain.status,'caution');assert.equal(coachWeather(today,forecast({code:95})).status,'avoid');
});
test('speed focus uses at most one interval session and does not prescribe it to beginners or fatigued riders',()=>{
 const s=settings({focus:'speed'}),p=plan({state:state(s)});assert.equal(p.rows.filter(r=>r.type==='intervals').length,1);
 for(const st of [state(s,{checkins:[]}),state(s,{checkins:[{...checkin,fatigue:4}]}),state(settings({focus:'speed',level:'beginner'}))])assert.equal(plan({state:st}).rows.filter(r=>r.type==='intervals').length,0);
 assert.equal(plan({state:state(s),weather:{}}).rows.filter(r=>r.type==='intervals').length,0);
});
test('session RPE is stored as reported, remains a partial load metric and can flag recent hard work',()=>{
 const current={...rides()[0],id:'recent',start:now-2*3600000,end:now-3600000},rs=[current,...rides()];const s=state(settings(),{feedback:[{rideId:'recent',rpe:8}]});const p=plan({rides:rs,state:s});assert(p.history.hardRecent);assert.equal(p.rows.find(r=>r.current).type,'recorded');assert.equal(p.history.rpeCount,0);assert.equal(p.history.rpeLoad,0);
 const history=trainingHistory(rs,settings(),now,[{rideId:rides()[0].id,rpe:5}]);assert.equal(history.rpeCount,1);assert.equal(history.rpeLoad,300);
});
test('coach state round-trips in backups and invalid inputs are rejected before persistence',()=>{
 const s=state();assert.deepEqual(validateCoachState(JSON.parse(JSON.stringify(s)),now),s);
 assert.throws(()=>validateCoachSettings({...settings(),days:[]},now));assert.throws(()=>validateCoachSettings({...settings(),weeklyMinutes:-1},now));assert.throws(()=>validateCheckin({...checkin,date:nextDay(today)},now));assert.throws(()=>validateFeedback({rideId:'r',rpe:11}));assert.throws(()=>validateCoachState({version:2,checkins:[],feedback:[]},now));
});
test('dashboard uses visual schedules, range graphics and source attribution without leaking user markup',()=>{
 const result=coachSection({goal:{...goal,title:'<script>alert(1)</script>'},state:state(),rides:rides(),now});assert(result.model);assert(result.html.includes('coach-week-strip'));assert(result.html.includes('coach-range-track'));assert(result.html.includes('coach-history-bars'));assert(!result.html.includes('<script>alert'));assert(!result.html.includes('href="#coach-'));assert(coachEvidence.every(e=>result.html.includes(e.url)));assert(coachSettingsFields().includes('coachFocus'));
});
