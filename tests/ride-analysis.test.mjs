import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeRide,rideIntervals,rideSegments,bestEfforts,powerZones,matchedRides,bestDistanceEfforts} from '../src/ride-analysis.js';
import {rideAnalysisMarkup} from '../src/ride-analysis-ui.js';
import {normalizeMessages} from '../src/fit.js';
import {setLanguage} from '../src/i18n.js';
const ride=(seconds=600,change={})=>({id:'new',hash:'new',start:0,end:seconds*1000,distance:seconds*8,duration:seconds,durationSource:'timer',points:Array.from({length:seconds+1},(_,i)=>({t:i*1000,d:i*8,v:8,p:200,hr:130,c:85,h:100,grade:0})),...change});
test('time weighting, sparse samples, pauses and unknown sensors remain distinct',()=>{
 const r=ride(20,{timerPauses:[[5000,10000]],points:[{t:0,p:100,hr:0},{t:5000,p:300,hr:140},{t:10000,p:200,hr:150},{t:20000,p:0,hr:130}]});
 const a=analyzeRide(r);assert.equal(a.total.seconds,15);assert.equal(a.total.p,500/3);assert.equal(a.total.hr,150);assert.equal(a.paused,5);assert.equal(a.coverage,1);assert.equal(a.total.v,null);assert.equal(a.total.hrCoverage,2/3);
 const gap=analyzeRide(ride(100,{points:[{t:0,p:100},{t:100000,p:200}]}));assert.equal(gap.coverage,0);assert.equal(gap.gapSeconds,100);assert.equal(gap.segments.length,0);
});
test('normalization does not reorder original data and rejects invalid readings',()=>{
 const r=ride(10,{points:[{t:10000,p:200},{t:0,p:-1,v:500,hr:255,c:999},{t:0,p:999},{t:NaN,p:200}]});const snapshot=r.points.map(p=>p.t);const rows=rideIntervals(r);assert.equal(rows.length,1);assert.equal(rows[0].p,null);assert.equal(rows[0].hr,null);assert.equal(rows[0].v,null);assert.deepEqual(r.points.map(p=>p.t),snapshot);
});
test('segments follow sustained terrain and measured effort transitions',()=>{
 const r=ride(900);r.points=r.points.map((p,i)=>({...p,grade:i<300?0:i<600?5:-5,p:i<300?250:i<600?180:80,hr:i<300?140:i<600?160:130}));
 const segments=rideSegments(r);assert.deepEqual(segments.map(s=>s.terrain),['flat','climb','descent']);assert.deepEqual(segments.map(s=>s.seconds),[300,300,300]);
 const html=rideAnalysisMarkup(r,{maxHr:190});assert.match(html,/Мощность снизилась, хотя пульс вырос/);assert.match(html,/На спуске пульс снизился/);assert.match(html,/Z4–Z5/);
});
test('missing zones and missing power cannot invent high pulse, intensity or watts',()=>{
 const r=ride(600);r.points=r.points.map((p,i)=>({...p,p:null,v:i<300?5:10,hr:170}));
 const html=rideAnalysisMarkup(r);assert.doesNotMatch(html,/Средний пульс — в верхних/);assert.doesNotMatch(html,/Усилие выросло/);assert.match(html,/без мощности это не доказывает/);assert.equal(bestEfforts(r).length,0);
 const empty=rideAnalysisMarkup(ride(600,{points:[]}));assert.match(empty,/недостаточно последовательных записей/);assert.doesNotMatch(empty,/NaN|Infinity/);
});
test('power efforts integrate irregular samples and consider windows ending at a boundary',()=>{
 const r=ride(10,{points:[{t:0,p:10},{t:4000,p:100},{t:10000,p:0}]});
 const e=bestEfforts(r,[5])[0];assert.equal(e.power,100);assert.equal(e.start,4000);
 const zeros=bestEfforts(ride(5,{points:[{t:0,p:0},{t:5000,p:0}]}),[5])[0];assert.equal(zeros.power,0);
 // The best 5s interval starts at 1s, which is not a record timestamp.
 const e2=bestEfforts(ride(10,{points:[{t:0,p:100},{t:3000,p:200},{t:6000,p:0},{t:10000,p:0}]}),[5])[0];assert.equal(e2.power,160);assert.equal(e2.start,1000);
});
test('power efforts cannot bridge pauses, partial intervals, missing power or recording gaps',()=>{
 for(const r of [ride(10,{timerPauses:[[4000,6000]]}),ride(10,{timerPauses:[[4500,4600]]}),ride(10,{points:[{t:0,p:200},{t:4000,p:null},{t:6000,p:200},{t:10000,p:200}]}),ride(30,{points:[{t:0,p:200},{t:15000,p:200},{t:30000,p:200}]})])assert.equal(bestEfforts(r,[10]).length,0);
});
test('power zones use recorded zero, exact upper boundaries and configured FTP only',()=>{
 const r=ride(7,{ftp:200,points:[0,110,150,180,210,240,300,350].map((p,i)=>({t:i*1000,p}))});const z=powerZones(r);assert(z.available);assert.equal(z.recorded,7);assert.deepEqual(z.zones.map(s=>s.seconds),[2,1,1,1,1,1,0]);assert.equal(powerZones({...r,ftp:null}).available,false);
});
function gpsRide(id,start=0,offset=0,reverse=false){return ride(1600,{id,hash:id,start,end:start+1600000,points:Array.from({length:161},(_,i)=>({t:start+i*10000,d:i*80,lat:25+(reverse?160-i:i)*.0005+offset,lon:55}))})}
test('matched rides require GPS shape, direction, distance and earlier distinct originals',()=>{
 const current=gpsRide('current',10000000),same=gpsRide('earlier'),far=gpsRide('far',0,1),reverse=gpsRide('reverse',0,0,true),future=gpsRide('future',20000000),duplicate={...same,id:'duplicate',hash:'current'},missing=ride(1600,{id:'no-gps',hash:'no-gps'});
 assert.deepEqual(matchedRides(current,[same,far,reverse,future,duplicate,missing]).map(r=>r.id),['earlier']);assert.equal(matchedRides(missing,[same]).length,0);
});
test('records only compare earlier measured rides and escape user titles',()=>{
 const current=ride(600,{start:1000000,end:1600000,points:ride().points.map(p=>({...p,t:p.t+1000000,p:250}))});const earlier=ride(600,{id:'old',hash:'old',customTitle:'<script>alert(1)</script>'});
 const html=rideAnalysisMarkup(current,{},[current,earlier]);assert.match(html,/>PR</);assert.doesNotMatch(rideAnalysisMarkup(earlier,{},[current,earlier]),/>PR</);
});
test('FIT laps are scoped to the session and FTP can come from zones target',()=>{
 const start=new Date('2026-01-01T00:00Z'),end=new Date(+start+60000),messages={fileIdMesgs:[{type:'activity'}],sessionMesgs:[{sport:'cycling',startTime:start,timestamp:end}],zonesTargetMesgs:[{functionalThresholdPower:220}],lapMesgs:[{startTime:start,timestamp:end,totalTimerTime:50,totalDistance:400,avgPower:230},{startTime:new Date(+start-60000),timestamp:start}]};
 const [r]=normalizeMessages(messages,'hash','ride.fit',100);assert.equal(r.ftp,220);assert.equal(r.laps.length,1);assert.equal(r.laps[0].duration,50);assert.equal(r.laps[0].avgPower,230);assert.equal(r.analyticsVersion,4);
});
test('new analysis has readable English fallback for other app languages',async()=>{try{await setLanguage('en');assert.match(rideAnalysisMarkup(ride()),/Ride analysis/);assert.doesNotMatch(rideAnalysisMarkup(ride()),/Разбор заезда/)}finally{await setLanguage('ru')}});

test('distance efforts interpolate boundaries, include zeros as stationary time and reject gaps',()=>{
 const r=ride(300,{points:[{t:0,d:0},{t:10000,d:0},...Array.from({length:30},(_,i)=>({t:20000+i*10000,d:(i+1)*100}))]});
 const e=bestDistanceEfforts(r).find(e=>e.meters===1000);assert.equal(e.seconds,100);assert.equal(e.start,10000);
 const gap={...r,points:r.points.filter(p=>p.t!==50000)};assert(bestDistanceEfforts(gap).every(e=>e.end-e.start<=260000));
 const partial=ride(200,{timerPauses:[[50000,150000]]});assert.equal(bestDistanceEfforts(partial).length,0);
 const sparse={...r,points:[{t:0,d:0},{t:100000,d:2000}]};assert.equal(bestDistanceEfforts(sparse).length,0);
});
test('manual FTP overrides FIT boundaries without altering measured efforts',()=>{
 const r=ride(60,{ftp:200});assert.equal(powerZones(r,{ftp:300}).ftp,300);assert.equal(powerZones(r,{ftp:300}).source,'profile');assert.equal(analyzeRide(r,{ftp:300}).powerZones.ftp,300);assert.equal(bestEfforts(r)[0].power,200);
});
