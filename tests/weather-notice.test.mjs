import test from 'node:test';import assert from 'node:assert/strict';
import {coachPlan,emptyCoach,validateCoachSettings} from '../src/coach.js';
import {coachWeatherNoticeMarkup} from '../src/coach-ui.js';
import {coachWeatherCopies,coachWeatherCopy} from '../src/coach-weather-copy.js';
import {nextDay,localDate} from '../src/periods.js';
const now=+new Date(2026,10,2,12),today='2026-11-02';
const settings=(extra={})=>validateCoachSettings({level:'regular',focus:'endurance',days:[0,1,2,3,4,5,6],weeklyMinutes:300,sessionMinutes:90,comfortableMinutes:90,historyConfirmedOn:today,...extra},now);
const state=(s=settings())=>({...emptyCoach(),settings:s,checkins:[{date:today,sleepHours:8,sleepQuality:4,fatigue:2,stress:2}]});
const history=()=>Array.from({length:16},(_,i)=>{const start=+localDate(nextDay(today,-(i+1)*2))+8*3600000;return {id:'h'+i,start,end:start+3600000,duration:3600,durationSource:'timer',distance:18000,points:[]}});
const weather=()=>({status:'fresh',days:Object.fromEntries(Array.from({length:7},(_,i)=>[nextDay(today,i),{low:i<4?10:1,high:i<4?18:6,wind:8,gusts:15,rain:0,probability:10,code:1}]))});
const plan=extra=>coachPlan({goal:{id:'g',smart:true,kind:'distance',target:1000,from:today,to:nextDay(today,29)},state:state(),rides:history(),weather:weather(),now,...extra});
test('an already weather-adapted week explains the chosen dates instead of silently lacking a move',()=>{
 const forecast=weather();for(const day of Object.values(forecast.days)){day.low=10;day.high=18}Object.assign(forecast.days[nextDay(today,1)],{low:1,high:6});
 const p=plan({weather:forecast});assert.equal(p.rows.filter(r=>r.minutes).length,4);assert(p.rows.filter(r=>r.minutes).every(r=>r.weather.data.high===18));assert.equal(p.weatherDecision.status,'applied');assert.deepEqual(p.weatherDecision.dates,p.rows.filter(r=>r.minutes).map(r=>r.date));const html=coachWeatherNoticeMarkup(p);assert(html.includes('data-weather-notice="applied"'));assert(html.includes('Дополнительный перенос сейчас не предлагается'));assert(!html.includes('<details'));
});
test('an optional move is shown in full on overview and Intellect without changing the schedule',()=>{
 const p=plan({state:state(settings({days:[4]}))});assert.equal(p.weatherDecision.status,'move');const html=coachWeatherNoticeMarkup(p,{linked:true});assert(html.includes('пятница')&&html.includes('четверг'));assert(html.includes('href="#intellect/2026-11-05"'));assert(p.rows.find(r=>r.date==='2026-11-06').minutes>0);assert.equal(p.rows.find(r=>r.date==='2026-11-05').minutes,0);
});
test('a warmer date cannot advertise a move that breaks the regular four-day rhythm',()=>{
 const p=plan({state:state(settings({days:[0,2,4,6]}))});assert.equal(p.rows.filter(r=>r.minutes).length,4);assert.deepEqual(p.weatherDecision,{status:'blocked',from:'2026-11-06',to:'2026-11-05',reason:'regularity'});assert(!p.rows.some(r=>r.weatherAdvice));
 const html=coachWeatherNoticeMarkup(p,{linked:true});assert(html.includes('data-weather-notice="blocked"'));assert(!html.includes('href="#intellect/2026-11-05"'));
});
test('a warmer rest day blocked by rolling load gets an explanation rather than an unsafe offer',()=>{
 const start=+localDate(nextDay(today,-2))+8*3600000,p=plan({state:state(settings({level:'beginner',weeklyMinutes:90,sessionMinutes:30,comfortableMinutes:30,historyConfirmedOn:null})),rides:[{id:'recent',start,end:start+3600000,duration:3600,distance:18000,points:[]}]});
 assert.equal(p.weatherDecision.status,'blocked');assert.equal(p.weatherDecision.reason,'weekly-cap');assert(!p.rows.some(r=>r.weatherAdvice));const html=coachWeatherNoticeMarkup(p);assert(html.includes('data-weather-notice="blocked"'));assert(html.includes('нагрузкой или восстановлением'));assert(html.includes(coachWeatherCopy('weekly-cap')));
});
test('November 6 can remain the first workout when moving to warm November 5 would exceed recorded load',()=>{
 // Synthetic forecast and history reproduce the user's date; they are not a live Astrakhan forecast.
 const now=+new Date('2026-11-03T08:00:00Z'),today='2026-11-03',start=+localDate('2026-10-30')+8*3600000;
 const s=validateCoachSettings({level:'beginner',days:[0,1,2,3,4,5,6],weeklyMinutes:90,sessionMinutes:30,comfortableMinutes:30},now),forecast={status:'fresh',days:Object.fromEntries(Array.from({length:7},(_,i)=>[nextDay(today,i),{low:i<3?10:1,high:i<3?18:6,wind:8,gusts:15,rain:0,probability:10,code:1}]))};
 const p=coachPlan({goal:{id:'g',smart:true,kind:'distance',target:1000,from:today,to:'2026-11-30'},state:{...emptyCoach(),settings:s,checkins:[{date:today,sleepHours:8,sleepQuality:4,fatigue:2,stress:2}]},rides:[{id:'recent',start,end:start+5400000,duration:5400,distance:27000,points:[]}],weather:forecast,now});
 assert.equal(p.rows.find(r=>r.minutes).date,'2026-11-06');assert.deepEqual(p.weatherDecision,{status:'blocked',from:'2026-11-06',to:'2026-11-05',reason:'weekly-cap'});const html=coachWeatherNoticeMarkup(p);assert(html.includes('6 ноября')&&html.includes('5 ноября'));assert(html.includes(coachWeatherCopy('weekly-cap')));
});
test('missing, stale, partial and flat forecasts all have visible and truthful states',()=>{
 for(const [forecast,status] of [[{},'missing'],[{...weather(),status:'stale'},'stale']]){const p=plan({weather:forecast});assert.equal(p.weatherDecision.status,status);assert(coachWeatherNoticeMarkup(p).includes('data-weather-notice="'+status+'"'))}
 const flat=weather();for(const w of Object.values(flat.days)){w.low=10;w.high=18}assert.equal(plan({weather:flat}).weatherDecision.status,'none');assert(coachWeatherNoticeMarkup(plan({weather:flat})).includes(coachWeatherCopy('no-move')));
 for(const w of Object.values(flat.days))delete w.gusts;assert.equal(plan({weather:flat}).weatherDecision.status,'partial');assert(coachWeatherNoticeMarkup(plan({weather:flat})).includes('Прогноз неполный'));
});
test('weather notices never claim a move for expired or completed goals and validate dates',()=>{
 const p=plan();assert.equal(coachWeatherNoticeMarkup({...p,remaining:0}),'');assert.equal(coachWeatherNoticeMarkup({...p,rows:[]}),'');assert.equal(coachWeatherNoticeMarkup({...p,weatherDecision:{status:'move',from:'<script>',to:today}}),'');
});
test('new weather notices contain complete localized sentences with values inserted afterwards',()=>{
 for(const code of Object.keys(coachWeatherCopies))for(const key of ['notice-title','applied','no-move','blocked','blocked-regularity']){const text=coachWeatherCopy(key,['DATE_A','DATE_B'],code);assert(text.trim());assert(!/[{}]|undefined/.test(text));if(['applied','blocked','blocked-regularity'].includes(key))assert(text.includes('DATE_A'));if(['blocked','blocked-regularity'].includes(key))assert(text.includes('DATE_B'))}
});
