import test from 'node:test';import assert from 'node:assert/strict';
import {coachPlan,coachWeather,emptyCoach,validateCoachSettings} from '../src/coach.js';
import {nextDay,localDate,dateKey} from '../src/periods.js';
const now=+new Date(2026,10,2,12),today=dateKey(now),goal={id:'rhythm',kind:'distance',smart:true,target:10000,from:today,to:nextDay(today,200)};
const settings=extra=>validateCoachSettings({level:'regular',focus:'endurance',days:[0,1,2,3,4,5,6],weeklyMinutes:300,sessionMinutes:90,comfortableMinutes:90,historyConfirmedOn:today,...extra},now);
const ride=(ago,minutes=60)=>{const start=+localDate(nextDay(today,-ago))+8*3600000;return {id:'ride-'+ago,start,end:start+minutes*60000,duration:minutes*60,durationSource:'timer',distance:minutes*300,points:[]}};
const history=()=>Array.from({length:14},(_,i)=>ride((i+1)*2));
const state=(extra={})=>({...emptyCoach(),settings:settings(),checkins:[{date:today,sleepHours:8,sleepQuality:4,fatigue:2,stress:2}],...extra});
const forecast=high=>({status:'fresh',days:Object.fromEntries(Array.from({length:7},(_,i)=>[nextDay(today,i),{low:1,high:typeof high==='function'?high(i):high,rain:0,wind:8,gusts:15,code:1}]))});
const plan=extra=>coachPlan({goal,rides:history(),state:state(),weather:forecast(18),now,...extra});
const maximumGap=p=>{const dates=[p.history.all.map(r=>dateKey(r.start)).sort().at(-1),...p.rows.filter(r=>r.minutes||r.manualMinutes).map(r=>r.date)].filter(Boolean).sort();return Math.max(0,...dates.slice(1).map((d,i)=>(Date.parse(d)-Date.parse(dates[i]))/86400000))};

test('milder temperatures cannot remove feasible sessions or lengthen the known training gaps',()=>{
 const flat=plan(),warmWindow=plan({weather:forecast(i=>i<4?18:6)});
 assert.equal(warmWindow.rows.filter(r=>r.minutes).length,flat.rows.filter(r=>r.minutes).length);
 assert(maximumGap(warmWindow)<=maximumGap(flat));assert(!warmWindow.notes.includes('weather-window'));
 assert(warmWindow.rows.some(r=>r.index>=4&&r.minutes));assert(warmWindow.minutes<=warmWindow.weeklyCap);
});
test('a known five-day break is not extended to wait for a warm day when an earlier short ride fits',()=>{
 const p=plan({rides:[ride(5,15)],state:state({settings:settings({weeklyMinutes:30,sessionMinutes:30,comfortableMinutes:30,historyConfirmedOn:null})}),weather:forecast(i=>i===6?20:6)});
 assert(p.rows[0].minutes>=15);assert.equal(p.rows[0].minutes,15);assert.equal(p.rows.at(-1).minutes,0);assert.equal(p.recordedMinutes+p.rows[0].minutes,30);
});
test('rhythm never adds a day outside availability or overrides rest and workload constraints',()=>{
 const limited=plan({state:state({settings:settings({days:[6]})}),rides:[ride(5,15)],weather:forecast(18)});
 assert(limited.rows.filter(r=>r.minutes).every(r=>r.date===nextDay(today,6)));
 const tired=plan({state:state({checkins:[{date:today,sleepHours:8,sleepQuality:4,fatigue:5,stress:2}]})});assert.equal(tired.rows[0].minutes,0);
 const overloaded=plan({rides:[...history(),{...ride(0,300),start:now-300*60000,end:now}]});assert.equal(overloaded.rows.slice(0,6).reduce((sum,r)=>sum+r.minutes,0),0);
 const unsafe=plan({weather:forecast(18)});for(const w of Object.values(unsafe.weather.days))w.code=97;
 assert.equal(plan({weather:unsafe.weather}).automaticMinutes,0);
});
test('optional weather moves do not turn a balanced rhythm into longer gaps',()=>{
 const p=plan({state:state({settings:settings({days:[0,2,4,6]})}),weather:forecast(i=>i<4?18:6)});
 assert.equal(p.weatherDecision.status,'blocked');assert.equal(p.weatherDecision.reason,'regularity');assert(!p.rows.some(r=>r.weatherAdvice));
});
test('severe weather codes remain restrictive even with missing or contradictory totals',()=>{
 for(const code of [95,96,97,99,56,57,66,67,71,73,75,77,85,86]){const weather=forecast(18);weather.days[today].code=code;assert.equal(coachWeather(today,weather).status,'avoid',String(code))}
 for(const code of [65,82]){const weather=forecast(18);weather.days[today].code=code;assert.equal(coachWeather(today,weather).status,'caution',String(code))}
 for(const code of [4,95.5,-1,NaN]){const weather=forecast(18);weather.days[today].code=code;assert.equal(coachWeather(today,weather).status,'partial',String(code))}
});
test('an old five-day streak cannot justify a new automatic three-day streak',()=>{
 const rides=[2,3,4,5,6].map(ago=>ride(ago,30)).concat([8,11,15,18,22,25].map(ago=>ride(ago,180)));
 const p=plan({rides,state:state({settings:settings({weeklyMinutes:600,sessionMinutes:120,comfortableMinutes:120})}),weather:forecast(i=>i<4?20:6)});
 let streak=0;for(const row of p.rows){streak=row.minutes>0||row.manualMinutes>0?streak+1:0;assert(streak<=2)}
 assert(p.rows.some(r=>r.minutes));
});
test('a past long break cannot hide a new gap created by a proposed weather move',()=>{
 const p=plan({rides:[ride(21,60)],state:state({settings:settings({days:[0,3]})}),weather:forecast(i=>i===5?18:6)});
 // The old 21-day gap stays unchanged while a Thursday-to-Saturday move
 // would widen the new Monday-to-Thursday interval from three to five days.
 assert.equal(p.history.gap,21);assert.deepEqual(p.rows.filter(r=>r.minutes).map(r=>r.date),[today,nextDay(today,3)]);
 assert.deepEqual(p.weatherDecision,{status:'blocked',from:nextDay(today,3),to:nextDay(today,5),reason:'regularity'});assert(!p.rows.some(r=>r.weatherAdvice));
});
test('an interval weather move cannot approach a booked ninety-minute ride',()=>{
 const rides=[ride(1,30),ride(6,30),...[8,9,11,15,16,18,22,25].map(ago=>ride(ago,180))],weather=forecast(i=>[0,4,5].includes(i)?20:6);
 Object.assign(weather.days[nextDay(today,2)],{wind:22,gusts:28});
 const p=plan({rides,weather,plans:[{id:'manual-long',date:nextDay(today,5),minutes:90}],state:state({settings:settings({focus:'speed',days:[0,2,3,5],weeklyMinutes:600,sessionMinutes:120,comfortableMinutes:120})})});
 assert.equal(p.rows[3].type,'intervals');assert(p.rows[3].minutes>=35);assert.equal(p.rows[5].manualMinutes,90);assert.equal(p.rows[4].weather.status,'available');assert(p.rows[4].rest);
 assert.deepEqual(p.weatherDecision,{status:'blocked',from:nextDay(today,3),to:nextDay(today,4),reason:'recovery'});assert(!p.rows.some(r=>r.weatherAdvice));
});
