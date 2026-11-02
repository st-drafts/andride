import test from 'node:test';
import assert from 'node:assert/strict';
import {coachPlan,coachWeather,emptyCoach,validateCoachSettings} from '../src/coach.js';
import {coachSection,coachWeatherAdviceMarkup} from '../src/coach-ui.js';
import {coachWeatherCopies,coachWeatherCopy} from '../src/coach-weather-copy.js';
import {languages,setLanguage} from '../src/i18n.js';
import {dateKey,nextDay,localDate} from '../src/periods.js';
const now=+new Date(2026,10,2,12),today=dateKey(now);
const goal={id:'weather-goal',title:'November',kind:'distance',smart:true,target:1000,from:today,to:nextDay(today,29)};
const settings=(extra={})=>validateCoachSettings({level:'regular',focus:'endurance',days:[0,2,4,6],weeklyMinutes:300,sessionMinutes:90,comfortableMinutes:90,historyConfirmedOn:today,...extra},now);
const rides=()=>Array.from({length:16},(_,i)=>{const start=+localDate(nextDay(today,-(i+1)*2))+8*3600000;return {id:'ride'+i,start,end:start+3600000,duration:3600,durationSource:'timer',distance:18000,points:[]}});
const checkin={date:today,sleepHours:8,sleepQuality:4,fatigue:2,stress:2};
const state=(s=settings(),extra={})=>({...emptyCoach(),settings:s,checkins:[checkin],...extra});
const forecast=()=>({status:'fresh',at:now,days:Object.fromEntries(Array.from({length:7},(_,i)=>[nextDay(today,i),{low:i<4?10:1,high:i<4?18:6,wind:8,gusts:15,rain:0,probability:10,code:1}]))});
const plan=(extra={})=>coachPlan({goal,rides:rides(),state:state(),weather:forecast(),now,...extra});
const advice=p=>p.rows.filter(r=>r.weatherAdvice);

test('temperature distinguishes a mild day from a cold day without banning cool rides or penalizing a cold night',()=>{
 const weather=forecast(),warm=coachWeather(today,weather);weather.days[today]={...weather.days[today],low:1,high:6};const cool=coachWeather(today,weather);
 assert(warm.penalty<cool.penalty);assert.equal(cool.status,'available');assert(cool.comfortPenalty>0);
 weather.days[today]={...weather.days[today],low:-2,high:18};assert.equal(coachWeather(today,weather).comfortPenalty,warm.comfortPenalty);
 weather.days[today]={...weather.days[today],low:20,high:28};assert(coachWeather(today,weather).penalty>warm.penalty);
 weather.days[today].high=36;assert.equal(coachWeather(today,weather).status,'avoid');
});
test('warmth does not give rain, strong gusts or heat an advantage over a normal dry cool day',()=>{
 const cool=forecast();Object.assign(cool.days[today],{low:1,high:6});const reference=coachWeather(today,cool);
 for(const patch of [{rain:5},{gusts:30},{wind:20},{low:20,high:30}]){const weather=forecast();Object.assign(weather.days[today],patch);const candidate=coachWeather(today,weather);assert.equal(candidate.status,'caution');assert(candidate.penalty>reference.penalty,JSON.stringify(patch))}
});
test('four mild days before a cold spell attract more sessions within the selected weekdays and the same budget',()=>{
 const s=state(settings({days:[0,1,2,3,4,5,6]})),flat=forecast();for(const day of Object.values(flat.days)){day.low=10;day.high=18}
 const balanced=plan({state:s,weather:flat}),mild=plan({state:s});
 assert(mild.rows.filter(r=>r.index<4&&r.minutes).length>balanced.rows.filter(r=>r.index<4&&r.minutes).length);
 assert.equal(mild.rows.filter(r=>r.minutes).length,balanced.rows.filter(r=>r.minutes).length);assert.equal(mild.budget,balanced.budget);assert(mild.minutes<=mild.budget);assert(mild.notes.includes('weather-comfort'));
});
test('a warmer unavailable day receives one optional suggestion without changing availability, sessions or state',()=>{
 const s=state(),history=rides(),weather=forecast(),before=JSON.stringify({s,history,weather}),p=plan({state:s,rides:history,weather});
 assert.equal(advice(p).length,1);const target=advice(p)[0],source=p.rows.find(r=>r.date===target.weatherAdvice.from);
 assert.equal(target.date,nextDay(today,3));assert.equal(source.date,nextDay(today,4));assert.equal(target.weatherAdvice.to,target.date);assert.equal(target.weatherAdvice.minutes,source.minutes);
 assert.equal(target.minutes,0);assert.equal(target.rest,true);assert(source.minutes>0);assert(target.reasons.includes('unavailable'));
 assert(p.rows.filter(r=>r.minutes).every(r=>s.settings.days.includes((localDate(r.date).getDay()+6)%7)));
 assert.equal(JSON.stringify({s,history,weather}),before);
});
test('a cold Wednesday can suggest a warmer unselected Thursday without delaying the scheduled ride automatically',()=>{
 const weather=forecast();for(const [date,day] of Object.entries(weather.days))if(date!==nextDay(today,3)){day.low=1;day.high=6}
 const p=plan({state:state(settings({days:[2]})),rides:[],weather}),target=advice(p)[0];
 assert.equal(target?.date,nextDay(today,3));assert.equal(target.weatherAdvice.from,nextDay(today,2));assert.equal(target.minutes,0);assert(p.rows.find(r=>r.date===nextDay(today,2)).minutes>0);
});
test('suggestions need a meaningful temperature gain and no stronger wind, gusts, rain or precipitation probability',()=>{
 for(const patch of [{high:8},{wind:9},{gusts:16},{rain:1},{probability:11},{high:32},{code:95}]){
  const weather=forecast();Object.assign(weather.days[nextDay(today,3)],patch);assert.equal(advice(plan({weather})).length,0,JSON.stringify(patch));
 }
});
test('stale, absent and incomplete forecasts never produce a comfort suggestion',()=>{
 for(const weather of [{},{...forecast(),status:'stale'},{...forecast(),status:'missing'}]){const p=plan({weather});assert.equal(advice(p).length,0);assert(!p.notes.includes('weather-comfort'))}
 const weather=forecast();delete weather.days[nextDay(today,3)].gusts;assert.equal(advice(plan({weather})).length,0);
 for(const patch of [{probability:101},{feelsLike:Infinity}]){const weather=forecast();Object.assign(weather.days[nextDay(today,3)],patch);assert.equal(advice(plan({weather})).length,0)}
});
test('an unknown forecast is not preferred for the long session over known mild weather',()=>{
 const weather=forecast();for(const day of Object.values(weather.days)){day.low=10;day.high=18}delete weather.days[nextDay(today,6)];
 const p=plan(),unknown=plan({weather});assert(p.rows.some(r=>r.type==='long'));assert(unknown.rows.filter(r=>r.type==='long').every(r=>r.weather.complete&&r.weather.status==='available'));
});
test('a proposed earlier move must fit its own rolling seven-day capacity',()=>{
 const s=settings({level:'beginner',weeklyMinutes:90,sessionMinutes:30,comfortableMinutes:30,historyConfirmedOn:null}),start=+localDate(nextDay(today,-2))+8*3600000;
 const p=plan({state:state(s),rides:[{id:'saturday',start,end:start+3600000,duration:3600,distance:18000,points:[]}]});
 assert(p.rows.find(r=>r.date===nextDay(today,6)).minutes>0);assert.equal(advice(p).length,0);
 const movedMinutes=p.rows.filter(r=>r.date<=nextDay(today,3)).reduce((n,r)=>n+r.minutes,60)+p.rows.find(r=>r.date===nextDay(today,6)).minutes;
 assert(movedMinutes>p.history.baseline);
});
test('no suggestion moves work into an unready today or the recovery window after hard work',()=>{
 for(const checkins of [[],[{...checkin,fatigue:5}],[{...checkin,fatigue:4}]]){
  const weather=forecast();for(const [date,day] of Object.entries(weather.days))if(date!==today){day.low=1;day.high=6}
  assert.equal(advice(plan({state:state(settings({days:[2]}),{checkins}),weather,rides:[]})).length,0);
 }
 const weather=forecast();for(const [date,day] of Object.entries(weather.days))if(date!==nextDay(today,1)){day.low=1;day.high=6}
 const start=now-25*3600000,hard={id:'hard',start,end:start+3600000,duration:3600,distance:18000,points:[]};
 const p=plan({state:state(settings({days:[4]}),{feedback:[{rideId:hard.id,rpe:8}]}),rides:[hard,...rides()],weather});
 assert.equal(advice(p).length,0);
});
test('no advice is added after goal completion or to an expired plan',()=>{
 const start=now-2*3600000,p=plan({goal:{...goal,target:1},rides:[{id:'done',start,end:start+3600000,distance:2000,duration:3600,points:[]}]});assert.equal(advice(p).length,0);
 assert.equal(advice(plan({goal:{...goal,from:nextDay(today,-20),to:nextDay(today,-1)}})).length,0);
});
test('advice never adds a third consecutive day or changes a completed day into a new workout',()=>{
 const p=plan();assert(!p.rows.find(r=>r.date===nextDay(today,1)).weatherAdvice);
 const weather=forecast();for(const [date,day] of Object.entries(weather.days))if(date!==today){day.low=1;day.high=6}
 const start=now-2*3600000,current={id:'current',start,end:start+600000,duration:600,distance:2000,points:[]};
 assert.equal(advice(plan({state:state(settings({days:[2]})),rides:[current],weather})).length,0);
});
test('weather suggestions retain recovery, intensity separation and rolling caps across forecast and availability combinations',()=>{
 for(const days of [[0,2,4,6],[1,3,5],[2,4],[0,1,4,6]])for(let shift=0;shift<7;shift++)for(const focus of ['endurance','speed']){
  const weather=forecast();for(let i=0;i<7;i++){const w=weather.days[nextDay(today,i)];w.high=(i+shift)%7<4?18:6;w.low=w.high-7}
  const s=settings({days,focus}),p=plan({state:state(s),weather});
  for(const target of advice(p)){
   const source=p.rows.find(r=>r.date===target.weatherAdvice.from);assert(source?.minutes>0);assert(target.rest&&!target.hasRide&&!s.days.includes((localDate(target.date).getDay()+6)%7));
   const projected=p.rows.map(row=>({...row,minutes:row===source?0:row===target?source.minutes:row.minutes}));
   for(const row of projected){let used=0;for(let age=0;age<7;age++){const date=nextDay(row.date,-age);used+=(p.history.minutesByDay.get(date)||0)+projected.filter(x=>x.date===date).reduce((n,x)=>n+x.minutes,0)}assert(used<=p.history.baseline+.001)}
   if(source.type==='intervals'||source.type==='long')for(const other of p.rows)if(other!==source&&other.minutes>0&&((source.type==='long'&&other.type==='intervals')||(source.type==='intervals'&&other.type==='long')))assert(Math.abs(Date.parse(target.date)-Date.parse(other.date))>=2*86400000);
  }
 }
});
test('complete advice and comfort explanations are localized for all 38 languages, with dates inserted afterwards',async()=>{
 assert.deepEqual(Object.keys(coachWeatherCopies).sort(),languages.map(([code])=>code).sort());
 const row=advice(plan())[0];
 try{for(const [code] of languages){await setLanguage(code);const html=coachWeatherAdviceMarkup(row);assert(html.includes('coach-weather-advice'),code);assert(html.includes(coachWeatherCopy('title')),code);assert(!/\{\d+\}|undefined/.test(html),code);assert(Object.values(coachWeatherCopies[code]).every(value=>value.trim()));assert(coachWeatherCopy('advice',['FROM','TO']).includes('FROM → TO'),code)}}finally{await setLanguage('ru')}
 assert.equal(coachWeatherAdviceMarkup({date:today}),'');assert.equal(coachWeatherAdviceMarkup({date:today,weatherAdvice:{from:'<script>',to:today}}),'');
});
test('the unselected day shows a visible hint and the source ride remains scheduled',()=>{
 const previous=globalThis.localStorage,weather=forecast(),data=new Map([['andride-weather-city',JSON.stringify({name:'Test',latitude:10,longitude:20})],['andride-weather-cache',JSON.stringify({schema:2,key:'10,20',at:now,days:weather.days})]]);globalThis.localStorage={getItem:key=>data.get(key)||null};
 try{const result=coachSection({goal,state:state(),rides:rides(),now});assert(result.html.includes('Совет по погоде →'));assert(result.html.includes('data-weather-advice-from="2026-11-06"'));assert(result.html.includes('data-weather-advice-to="2026-11-05"'));assert(!result.html.includes('<li>weather-comfort</li>'));assert.equal(result.model.rows.find(r=>r.date==='2026-11-05').minutes,0);assert(result.model.rows.find(r=>r.date==='2026-11-06').minutes>0)}finally{if(previous===undefined)delete globalThis.localStorage;else globalThis.localStorage=previous}
});
