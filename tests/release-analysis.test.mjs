import test from 'node:test';import assert from 'node:assert/strict';
import {activeSeconds} from '../src/physiology.js';import {pausedMilliseconds,activeDuration} from '../src/pause-time.js';
import {analyzeRide,powerZones} from '../src/ride-analysis.js';import {rideAnalysisMarkup,prepareAnalysisHistory,analysisDetailMarkup} from '../src/ride-analysis-ui.js';
test('timer stops are merged, clipped and counted only once without changing the FIT arrays',()=>{
 const pauses=[[5000,12000],[0,7000],[-1000,1000],[20000,25000],[22000,28000],[40000,42000]],r={start:0,end:30000,timerPauses:pauses},snapshot=JSON.stringify(pauses);
 assert.equal(pausedMilliseconds(r,0,30000),20000);assert.equal(activeDuration(r),10);assert.equal(activeSeconds(r,10000,20000),8);assert.equal(activeSeconds(r,1000,2000),0);assert.equal(JSON.stringify(pauses),snapshot);
 for(let a=-2000;a<40000;a+=701){const b=a+7337;let expected=0;for(let t=a;t<b;t++)if(pauses.some(([x,y])=>t>=x&&t<y))expected++;assert.equal(pausedMilliseconds(r,a,b),expected)}
});
test('missing distance cannot turn known elevation into a fabricated climb and power coverage includes gaps',()=>{
 const points=Array.from({length:61},(_,i)=>({t:i*1000,h:i*.3,d:i<=5?i*30:null,v:5,p:150,c:null})),r={id:'r',start:0,end:60000,points};const a=analyzeRide(r);assert(a.total.distanceCoverage<.8);assert.equal(a.total.grade,null);assert.equal(a.total.terrain,'unknown');
 const sparse={...r,ftp:200,points:[{t:0,p:150},{t:1000,p:150},{t:59000,p:150},{t:60000,p:150}]};assert.equal(powerZones(sparse).coverage,2/60);
});
test('opening a ride does not read unrelated historical points; requesting comparisons yields the same records',async()=>{
 const base={start:0,end:60000,points:Array.from({length:61},(_,i)=>({t:i*1000,p:100,d:i*8,v:8}))},current={...base,id:'current',hash:'current',start:100000,end:160000,points:base.points.map(p=>({...p,t:p.t+100000,p:200}))};
 let reads=0;const older={...base,id:'old',hash:'old',get points(){reads++;return base.points}};
 const html=rideAnalysisMarkup(current,{},[current,older]);assert.equal(reads,0);assert(html.includes('data-analysis-deferred="power"'));assert(!html.includes('>PR<'));
 assert.equal(await prepareAnalysisHistory(current,[older],'power'),true);assert(reads>0);assert(analysisDetailMarkup('power',current,[older]).includes('>PR<'));
 const before=reads;assert.equal(await prepareAnalysisHistory(current,[older],'power',()=>true),false);assert.equal(reads,before);
});
