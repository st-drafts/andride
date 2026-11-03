import test from 'node:test';
import assert from 'node:assert/strict';
import {createSelectionSummarizer,summarizeSelection} from '../src/workout-selection.js';
import {progressRides,progressRanges,progressRecords} from '../src/progress.js';
import {rideIntervals} from '../src/ride-analysis.js';
import {activeSeconds} from '../src/physiology.js';

const near=(a,b)=>assert(Math.abs(a-b)<1e-7,`${a} != ${b}`);
test('one common interval integrates irregular samples, overlapping pauses, zero cadence and missing sensors correctly',()=>{
 const ride={start:0,end:36000,timerPauses:[[5000,7000],[6000,8000]],points:[{t:0,p:100,hr:null,c:0,v:5,d:0},{t:4000,p:200,hr:120,c:null,v:5,d:20},{t:9000,p:0,hr:130,c:90,v:5,d:45},{t:15000,p:300,c:90,v:5,d:75},{t:30000,p:150,hr:140,c:80,v:5,d:150},{t:36000,p:150,hr:140,c:80,v:5,d:180}]},before=JSON.stringify(ride),result=summarizeSelection(ride,2000,12000);
 assert.equal(result.active,7);near(result.p,600/7);near(result.c,54);near(result.cCoverage,5/7);near(result.hr,126);assert.equal(result.distance,35);assert.equal(result.pCoverage,1);assert.equal(JSON.stringify(ride),before);
 const gap=summarizeSelection(ride,20000,25000);assert.equal(gap.p,null);assert.equal(gap.pCoverage,0);assert.equal(gap.distance,null);
 const pause=summarizeSelection(ride,5500,7500);assert.equal(pause.active,0);assert.equal(pause.p,null);assert.equal(pause.c,null);
 assert.equal(summarizeSelection(ride,40000,50000),null);
});
test('prefix selections agree with direct integration across all boundaries and release no measured zeroes',()=>{
 const ride={start:0,end:120000,timerPauses:[[4000,9000],[8000,12000],[45000,47000]],points:Array.from({length:41},(_,i)=>({t:i*3000,p:i%4?i*10:0,c:i%3?null:0,hr:i%2?130:null,d:i*18,v:6}))},summarize=createSelectionSummarizer(ride),rows=rideIntervals(ride);
 for(let a=0;a<110000;a+=1703){const b=Math.min(120000,a+13733),result=summarize(a,b);for(const key of ['p','c','hr','v']){let area=0,known=0;for(const row of rows){const from=Math.max(a,row.start),to=Math.min(b,row.end),dt=to>from?activeSeconds(ride,from,to):0;if(Number.isFinite(row[key])){area+=row[key]*dt;known+=dt}}if(known)near(result[key],area/known);else assert.equal(result[key],null)}}
});
test('progress compares independent recent windows and excludes future and duplicate rides',async()=>{
 const now=+new Date(2026,10,3,12),ride=(id,days,power)=>{const start=now-days*86400000-3600000;return {id,start,end:start+10000,duration:10,distance:100,points:Array.from({length:11},(_,i)=>({t:start+i*1000,p:power}))}},recent=ride('recent',1,200),older=ride('prior',40,150),ancient=ride('ancient',400,400),future=ride('future',-2,1000);
 const model=progressRides([recent,recent,older,ancient,future],'30',now);assert.deepEqual(model.rides,[recent]);assert.deepEqual(model.prior,[older]);const rows=await progressRecords(model.rides,model.prior);assert.equal(rows[0].current.power,200);assert.equal(rows[0].previous.power,150);
 assert.equal(progressRides([recent,older,ancient,future],'90',now).rides.length,2);assert.equal(progressRides([recent,older,ancient,future],'season',now).rides.length,2);assert.equal(progressRides([recent,older,ancient,future],'all',now).rides.length,3);
 assert.equal(await progressRecords([recent],[],{cancelled:()=>true}),null);
});
test('season comparisons handle leap day and day windows follow local DST dates',()=>{
 const ranges=progressRanges('season',+new Date(2028,1,29,12));assert.equal(ranges.previous.to,'2027-02-28');
 const previous=process.env.TZ;process.env.TZ='America/New_York';try{const range=progressRanges('30',+new Date(2026,10,3,12));assert.equal(range.current.from,'2026-10-05');assert.equal(range.previous.to,'2026-10-04')}finally{if(previous===undefined)delete process.env.TZ;else process.env.TZ=previous}
});
