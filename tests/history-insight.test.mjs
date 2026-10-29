import test from 'node:test';
import assert from 'node:assert/strict';
import {historyInsight} from '../src/history-insight.js';
import {coachHistoryMarkup} from '../src/coach-ui.js';
import {coachPlan,emptyCoach,validateCoachSettings} from '../src/coach.js';
import {dateKey,nextDay} from '../src/periods.js';
import {historyMessages,historyMessageKeys,historyMessage} from '../src/history-copy.js';
import {languages,setLanguage} from '../src/i18n.js';

const now=+new Date(2026,9,29,18),today=dateKey(now);
const ride=(id,ago=0,distance=20000,duration=3600,extra={})=>{const start=+new Date(nextDay(today,-ago)+'T10:00:00');return {id,start,end:start+duration*1000,distance,duration,...extra}};
const regular=()=>[0,3,7,10,14,17,21,24].map((day,i)=>ride('r'+i,day));
const settings=validateCoachSettings({level:'regular',focus:'endurance',days:[0,2,4],weeklyMinutes:300,sessionMinutes:120,comfortableMinutes:90,historyConfirmedOn:today},now);
const goal={id:'g',kind:'distance',smart:true,title:'Goal',from:nextDay(today,-10),to:nextDay(today,20),target:500};
const context=(rides,state={...emptyCoach(),settings},g=goal)=>({state,goal:g,model:coachPlan({rides,state,goal:g,now})});
const ids=h=>h.insights.map(x=>x.id);

test('history facts exclude duplicates, future and invalid rides without inventing missing distance',()=>{
 const first=ride('one',1),unknown=ride('two',3,null,null),rows=[first,first,unknown,ride('future',-1),{...ride('ongoing',1),end:now+1},{...ride('bad'),start:NaN}];
 const h=historyInsight(rows,now);assert.equal(h.count,2);assert.equal(h.distanceCount,1);assert.equal(h.distance,20000);assert.equal(h.longest,20000);assert.equal(rows.length,6);
 assert(coachHistoryMarkup(rows,{now}).includes('с записью дистанции'));
 assert(!JSON.stringify(h).includes('NaN'));
});
test('regularity uses distinct days across all four recent weeks, not endpoint comparison',()=>{
 const h=historyInsight(regular(),now);assert(ids(h).includes('regular'));assert.equal(h.insights.find(x=>x.id==='regular').values[0],8);
 assert(!('trend' in h));assert(!coachHistoryMarkup(regular(),{now}).includes('первые'));
 const oneWeek=[0,1,2,3,4,5,6,6].map((d,i)=>ride('r'+i,d));assert(!ids(historyInsight(oneWeek,now)).includes('regular'));
 const oneDay=Array.from({length:8},(_,i)=>ride('r'+i,0));assert(!ids(historyInsight(oneDay,now)).includes('regular'));
});
test('new distance records require prior rides, a meaningful gain, and a recent record',()=>{
 const base=[1,2,3,4,5].map(d=>ride('r'+d,d));
 assert.equal(historyInsight([...base,ride('new',0,40000)],now).selected[0].id,'record');
 for(const rows of [[ride('new',0,40000)],[...base,ride('new',0,20100)],[...base.map(r=>({...r,start:r.start-30*86400000,end:r.end-30*86400000})),ride('new',20,40000)]])assert(!ids(historyInsight(rows,now)).includes('record'));
});
test('unusually long rides use the median of previous sessions without claiming better fitness',()=>{
 const rows=regular();rows[0]={...rows[0],duration:6000,end:rows[0].start+6000000};
 const h=historyInsight(rows,now);assert.equal(h.selected[0].id,'long');assert.deepEqual(h.selected[0].values,[100,60]);
 const html=coachHistoryMarkup(rows,{now});assert(html.includes('обычно'));assert(!html.includes('форма улучшилась'));assert(!html.includes('NaN'));
});
test('fresh wellbeing and real weather decisions take precedence over achievements',()=>{
 const rows=[...regular(),ride('record',0,50000)];
 const state={...emptyCoach(),settings,checkins:[{date:today,sleepHours:8,sleepQuality:4,fatigue:5,stress:1}]};
 assert.equal(historyInsight(rows,now,context(rows,state)).selected[0].id,'wellbeing-rest');
 const stale={...state,checkins:[{...state.checkins[0],date:nextDay(today,-1)}]};assert.notEqual(historyInsight(rows,now,context(rows,stale)).selected[0].id,'wellbeing-rest');
 const weather={rows:[{current:true,rest:true,hasRide:false,weather:{status:'avoid'},reasons:['weather-rest']}]};
 assert.equal(historyInsight(rows,now,{model:weather}).selected[0].id,'weather-rest');
 weather.rows[0].weather.status='unknown';assert(!ids(historyInsight(rows,now,{model:weather})).includes('weather-rest'));
});
test('hard effort is based on explicit fresh RPE, never fabricated from missing sensors',()=>{
 const rows=regular(),state={feedback:[{rideId:'r0',rpe:8}]};
 const h=historyInsight(rows,now,{state});assert.equal(h.selected[0].id,'hard');assert.deepEqual(h.selected[0].values,[8]);
 for(const feedback of [[],[{rideId:'r0',rpe:null}],[{rideId:'r0',rpe:Infinity}],[{rideId:'r0',rpe:15}],[{rideId:'r7',rpe:9}]])assert(!ids(historyInsight(rows,now,{state:{feedback}})).includes('hard'));
});
test('easy rides describe perceived effort only with sufficient rated coverage',()=>{
 const rows=regular(),feedback=rows.map(r=>({rideId:r.id,rpe:3}));
 assert.deepEqual(historyInsight(rows,now,{state:{feedback}}).insights.find(x=>x.id==='easy').values,[8,8]);
 assert(!ids(historyInsight(rows,now,{state:{feedback:feedback.slice(0,5)}})).includes('easy'));
 assert(!ids(historyInsight(rows,now)).includes('easy'));
});
test('load increase follows the existing planner and requires confirmed complete history',()=>{
 const rows=[1,3,5,8,10,12,15,17,19,22,24,26].map(d=>ride('r'+d,d,20000,d<=7?7200:1800));
 const c=context(rows),h=historyInsight(rows,now,c);assert(c.model.notes.includes('load-increase'));assert.equal(h.selected[0].id,'load');
 const values=h.selected[0].values;assert.equal(values[0],360);assert.equal(values[1],300);
 const incomplete={...emptyCoach(),settings:{...settings,historyConfirmedOn:null}};assert(!ids(historyInsight(rows,now,context(rows,incomplete))).includes('load'));
 assert(!ids(historyInsight(rows,now)).includes('load'));
});
test('terrain compares climbing per distance with sufficient data, not raw speed',()=>{
 const rows=[1,5,10,15,20,25,30,35,40,45,50,54].map(d=>ride('r'+d,d,20000,3600,{ascent:d<28?400:100}));
 const t=historyInsight(rows,now).insights.find(x=>x.id==='terrain');assert.deepEqual(t.values,[200,50]);
 assert(!ids(historyInsight(rows.map(r=>({...r,ascent:null})),now)).includes('terrain'));
 assert(!ids(historyInsight(rows.map(r=>({...r,ascent:0,avgSpeed:50})),now)).includes('terrain'));
});
test('old histories prompt import updates without assuming inactivity or describing old fatigue as current',()=>{
 const rows=regular().map(r=>({...r,start:r.start-60*86400000,end:r.end-60*86400000}));
 const h=historyInsight(rows,now,{state:{feedback:[{rideId:'r0',rpe:9}]}});assert.equal(h.selected[0].id,'gap');assert(!ids(h).includes('hard'));
 const html=coachHistoryMarkup(rows,{now});assert(html.includes('Если ты катался'));assert(!html.includes('ты не катался'));
});
test('completed goals follow the actual active plan rather than summing unrelated dates',()=>{
 const rows=regular(),g={...goal,target:1},c=context(rows,undefined,g);assert(ids(historyInsight(rows,now,c)).includes('goal-done'));
 assert(!ids(historyInsight(rows,now,context(rows,undefined,{...g,to:nextDay(today,-1)}))).includes('goal-done'));
});
test('selection stays stable during a day, varies among supported facts and never mutates source data',()=>{
 const rows=regular(),snapshot=JSON.stringify(rows),h=historyInsight(rows,now);
 assert.deepEqual(h.selected,historyInsight(rows,now+1000).selected);assert(h.selected.length<=2);assert.equal(new Set(h.selected.map(x=>x.category)).size,h.selected.length);
 const variants=new Set(Array.from({length:4},(_,i)=>historyInsight(rows,now+i*86400000).selected.map(x=>x.id).join(',')));assert(variants.size>1);assert.equal(JSON.stringify(rows),snapshot);
});
test('empty and sparse history remains useful without inventing trends or physiological changes',()=>{
 assert.equal(historyInsight([],now).selected.length,0);assert(coachHistoryMarkup([],{now}).includes('Сохрани первую поездку'));
 const html=coachHistoryMarkup([ride('one',0,12000)],{now});assert(html.includes('12'));assert(!html.includes('первые'));assert(!html.includes('пульс'));assert(!html.includes('каденс'));
});
test('all 38 languages have complete history sentences with the same value slots and render every scenario',async()=>{
 const scenarios=[regular(),[...regular(),ride('record',0,50000)],regular().map(r=>({...r,start:r.start-60*86400000,end:r.end-60*86400000}))];
 try{for(const [lang] of languages){
  await setLanguage(lang);const pack=historyMessages[lang];assert.equal(pack.length,historyMessageKeys.length,lang);
  for(let i=0;i<pack.length;i++){
   assert.deepEqual([...pack[i].matchAll(/\{\d+\}/g)].map(x=>x[0]).sort(),[...historyMessages.ru[i].matchAll(/\{\d+\}/g)].map(x=>x[0]).sort(),lang+':'+i);
   assert(!/\{\d+\}/.test(historyMessage(historyMessageKeys[i],['123','456'])));
  }
  for(const rows of scenarios){const html=coachHistoryMarkup(rows,{now});assert(html.includes('goal-story'));assert(!/@m|undefined|NaN|\{\d+\}/.test(html),lang);if(lang!=='ru')assert(!html.includes('Новый рекорд'))}
 }}finally{await setLanguage('ru')}
});
