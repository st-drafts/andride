import test from 'node:test';import assert from 'node:assert/strict';
import {coachPlan,emptyCoach,validateCoachSettings} from '../src/coach.js';
import {coachSection,coachUpcomingMarkup} from '../src/coach-ui.js';
import {coachWeatherCopies,coachWeatherCopy} from '../src/coach-weather-copy.js';
import {dateKey,nextDay,localDate} from '../src/periods.js';
const now=+new Date(2026,10,2,12),today=dateKey(now),goal={id:'audit',title:'Audit',kind:'distance',smart:true,target:1000,from:today,to:nextDay(today,29)};
const settings=extra=>validateCoachSettings({level:'regular',focus:'endurance',days:[0,1,2,3,4,5,6],weeklyMinutes:300,sessionMinutes:90,comfortableMinutes:90,historyConfirmedOn:today,...extra},now);
const state=extra=>({...emptyCoach(),settings:settings(),checkins:[{date:today,sleepHours:8,sleepQuality:4,fatigue:2,stress:2}],...extra});
const history=()=>Array.from({length:16},(_,i)=>{const start=+localDate(nextDay(today,-(i+1)*2))+8*3600000;return {id:'history'+i,start,end:start+3600000,duration:3600,durationSource:'timer',distance:18000,points:[]}});
const forecast=()=>({status:'fresh',days:Object.fromEntries(Array.from({length:7},(_,i)=>[nextDay(today,i),{low:i<4?10:1,high:i<4?18:6,wind:8,gusts:15,rain:0,probability:10,code:1}]))});
const rhythmForecast=()=>({status:'fresh',days:Object.fromEntries(Array.from({length:7},(_,i)=>{const warm=[0,1,4].includes(i);return [nextDay(today,i),{low:warm?10:1,high:warm?18:6,wind:8,gusts:15,rain:0,probability:10,code:1}]}))});
const plan=(extra={})=>coachPlan({goal,state:state(),rides:history(),weather:forecast(),now,...extra});
test('all weekdays selected: a mild window keeps four feasible sessions and the regular workload',()=>{
 const p=plan({weather:rhythmForecast()}),flat=forecast();for(const day of Object.values(flat.days)){day.low=10;day.high=18}const regular=plan({weather:flat});
 assert.equal(p.rows.filter(r=>r.minutes).length,4);assert.equal(regular.rows.filter(r=>r.minutes).length,4);assert(p.rows.some(r=>r.minutes&&r.weather.data.high===6));assert(!p.notes.includes('weather-window'));assert.equal(p.recordedMinutes,180);assert.equal(p.weeklyCap,200);
 assert.equal(p.minutes,regular.minutes);assert(p.minutes<=p.budget);assert(p.rows.every(r=>!r.reasons.includes('weather-window')));assert.equal(p.weatherDecision.status,'blocked');assert.equal(p.weatherDecision.reason,'regularity');
});
test('ordinary weather keeps a regular four-session week and unknown weather cannot invent a warm window',()=>{
 const weather=forecast();for(const w of Object.values(weather.days)){w.low=10;w.high=18}
 assert.equal(plan({weather}).rows.filter(r=>r.minutes).length,4);
 for(const weather of [{},{...forecast(),status:'stale'}])assert(!plan({weather}).notes.includes('weather-window'));
});
test('weekly-cap rest is explained and candidate selection never leaves zero-minute phantom sessions',()=>{
 const start=now-2*3600000,p=plan({rides:[...history(),{id:'big',start,end:start+3600000,duration:14400,distance:50000,points:[]}]});
 for(const row of p.rows){if(row.minutes)assert(row.minutes>=15);if(row.index>0&&row.index<5)assert(row.rest&&row.reasons.includes('weekly-cap'))}
});
test('weather-aware choices preserve per-session bounds, rolling limits and streaks across a broad deterministic scenario matrix',()=>{
 for(const days of [[0,1,2,3,4,5,6],[0,2,4,6],[1,2,3],[2,4,6]])for(const level of ['beginner','returning','regular'])for(let shift=0;shift<7;shift++){
  const weather=forecast();for(let i=0;i<7;i++){const w=weather.days[nextDay(today,i)];w.high=(i+shift)%7<4?18:6;w.low=w.high-7}
  const s=settings({days,level}),p=plan({state:state({settings:s}),weather});let streak=0;
  for(const row of p.rows){assert(Number.isFinite(row.minutes)&&row.minutes>=0);if(row.minutes){assert(s.days.includes((localDate(row.date).getDay()+6)%7));assert(row.minutes<=s.sessionMinutes&&row.minutes<=s.comfortableMinutes)}streak=row.minutes?streak+1:0;assert(streak<=2);
   let used=0;for(let age=0;age<7;age++){const date=nextDay(row.date,-age);used+=(p.history.minutesByDay.get(date)||0)+p.rows.filter(r=>r.date===date).reduce((n,r)=>n+r.minutes,0)}assert(used<=Math.max(p.weeklyCap,p.history.minutesByDay.get(row.date)||0)+.001);
  }
  assert(p.minutes<=p.budget+.001);
 }
});
test('a configured smart goal keeps deletion off its card and exposes workload and forecast controls',()=>{
 const previous=globalThis.localStorage,weather=rhythmForecast(),data=new Map([['andride-weather-city',JSON.stringify({name:'Test',latitude:10,longitude:20})],['andride-weather-cache',JSON.stringify({schema:2,key:'10,20',at:now,days:weather.days})]]);globalThis.localStorage={getItem:key=>data.get(key)||null};
 try{const {model,html}=coachSection({goal,state:state(),rides:history(),now});assert(!html.includes('data-remove-goal'));assert(html.includes('data-edit-goal="audit"'));assert(html.includes('data-weather-notice="blocked"'));assert.equal(model.weatherDecision.reason,'regularity');assert(html.includes('data-weather-refresh'));assert(html.includes('data-plan-capacity'));assert(!html.includes('data-weather-window'));assert(html.includes('coach-day-weather'));assert(!/<li>(?:weekly-cap|weather-window|regularity)<\/li>/.test(html));assert(!coachUpcomingMarkup(model).includes('data-weather-window'))}finally{if(previous===undefined)delete globalThis.localStorage;else globalThis.localStorage=previous}
});
test('new workload and weather-window explanations resolve values in every interface language',()=>{
 assert.equal(Object.keys(coachWeatherCopies).length,38);
 for(const code of Object.keys(coachWeatherCopies)){
  for(const key of ['weather-window','weekly-cap'])assert(coachWeatherCopy(key,[],code).length>20);
  const capacity=coachWeatherCopy('capacity',['180 min','210 min'],code);assert(capacity.includes('180 min')&&capacity.includes('210 min'));assert(!/[{}]/.test(capacity));
  const advice=coachWeatherCopy('advice',['Wednesday','Thursday'],code);assert(advice.includes('Wednesday')&&advice.includes('Thursday'));assert(!/[{}]/.test(advice));
 }
});
