import test from 'node:test';
import assert from 'node:assert/strict';
import {historyInsight} from '../src/history-insight.js';
import {coachHistoryMarkup} from '../src/coach-ui.js';
const start=(day)=>+new Date(2026,8,day,12),now=+new Date(2026,10,1,12);
const ride=(id,day,distance=10000,duration=1800)=>({id,start:start(day),end:start(day)+duration*1000,distance,duration});
const history=(ratio=2)=>[1,3,5].map(day=>ride('a'+day,day)).concat([22,24,28].map(day=>ride('b'+day,day,10000*ratio)));

test('all-time summary excludes duplicate, future and unfinished rides without inventing missing distance',()=>{
 const first=ride('one',1),unknown=ride('two',3,null,null),rs=[first,first,unknown,{...ride('future',5),start:now+1},{...ride('ongoing',6),end:now+1},{...ride('bad',7),start:NaN}];
 const h=historyInsight(rs,now);assert.equal(h.count,2);assert.equal(h.distanceCount,1);assert.equal(h.distance,10000);assert.equal(h.longest,10000);assert.equal(h.trend,null);assert.equal(rs.length,6);
 const markup=coachHistoryMarkup(rs,{now});assert(markup.includes('goal-story'));assert(markup.includes('с записанной дистанцией'));assert(!markup.includes('NaN'));
});
test('growth compares equal disjoint first and latest windows and never claims fitness improvement',()=>{
 const h=historyInsight(history(),now);assert.equal(h.trend.days,14);assert.equal(h.trend.change,100);assert.equal(h.trend.kind,'volume');assert(h.trend.early.to<h.trend.recent.from);
 const html=coachHistoryMarkup(history(),{now});assert(html.includes('100% выше'));assert(html.includes('в FIT'));assert(!html.includes('форма улучшилась'));
});
test('decreasing and stable recorded volume are reported according to the data',()=>{
 assert(coachHistoryMarkup(history(.5),{now}).includes('50% ниже'));
 const h=historyInsight(history(1.04),now);assert.equal(h.trend.kind,'steady');assert(coachHistoryMarkup(history(1.04),{now}).includes('остаётся близким'));
});
test('regularity uses distinct riding days rather than the number of FIT sessions',()=>{
 const rs=[1,1,1,1,1].map((day,i)=>ride('a'+i,day)).concat([22,23,24,25,28].map(day=>ride('b'+day,day)));
 const h=historyInsight(rs,now);assert.equal(h.trend.kind,'regularity');assert.equal(h.trend.earlyDays,1);assert.equal(h.trend.recentDays,5);
});
test('short history and sparse endpoint windows do not produce a trend',()=>{
 for(const rs of [[],[ride('one',1)],[1,2,3,4,5,6].map(day=>ride('r'+day,day)),[1,3,5,10,12,14,20,28].map(day=>ride('r'+day,day))]){
  assert.equal(historyInsight(rs,now).trend,null);
 }
 assert(coachHistoryMarkup([],{now}).includes('импортируй первую поездку'));
});
test('missing sensors never become zero and comparable duration can replace missing distance',()=>{
 const rs=history().map(r=>({...r,distance:null,duration:r.id.startsWith('a')?1800:2700}));
 const h=historyInsight(rs,now);assert.equal(h.distance,null);assert.equal(h.trend.metric,'duration');assert.equal(h.trend.change,50);
 assert(coachHistoryMarkup(rs,{now}).includes('времени в седле'));
 const sparse=history().map(r=>({...r,distance:null,duration:null}));assert.equal(historyInsight(sparse,now).trend,null);
});
