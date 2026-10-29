import test from 'node:test';
import assert from 'node:assert/strict';
import {projectRouteSpeeds,routeSpeedProfile,routePointSpeed,routeColourRange} from '../src/route-speed.js';
import {colouredRouteData} from '../src/route-map.js';
import {routeDistance} from '../src/route-data.js';

const geometry=[{lat:25,lon:55,h:100},{lat:25,lon:55.001,h:110},{lat:25,lon:55.01,h:200}];
const ride=()=>({points:[{t:0,d:1000,v:2,p:200,c:80,hr:130},{t:5000,d:1100,v:10,p:250,c:90,hr:140},{t:10000,d:2000,v:5,p:100,c:70,hr:120}]});
const close=(a,b)=>assert(Math.abs(a-b)<1e-6,`${a} ≠ ${b}`);
test('speed follows FIT distance rather than record or geometry indices, with a nonzero FIT offset',()=>{
 const r=ride(),profile=routeSpeedProfile(r),result=projectRouteSpeeds(geometry,r);assert.equal(profile.source,'fit-distance');assert.equal(profile.offset,1000);assert.equal(profile.length,1000);close(profile.at(100),10);
 const atTenPercent=result.points.find(p=>Math.abs(p.fitDistance-1100)<1e-6);assert(atTenPercent);close(atTenPercent.d/result.length,.1);close(atTenPercent.routeSpeed,10);close(atTenPercent.h,110);
 close(result.points[0].routeSpeed,2);close(result.points.at(-1).routeSpeed,5);
});
test('different edited lengths align start and finish and keep the original FIT colour scale',()=>{
 for(const scale of [.2,3]){const g=geometry.map(p=>({...p,lon:55+(p.lon-55)*scale})),result=projectRouteSpeeds(g,ride());
  close(result.length,routeDistance(g));close(result.points[0].fitDistance,1000);close(result.points.at(-1).fitDistance,2000);assert.equal(result.profile.range.low,7);assert.equal(result.profile.range.high,36);
 }
});
test('both route views retain speed peaks recorded while GPS coordinates were missing',()=>{
 const r=ride();r.points[1]={...r.points[1],v:25,lat:null,lon:null};
 assert.equal(routeColourRange(r).high,90);assert.deepEqual(projectRouteSpeeds(geometry,r).profile.range,routeColourRange(r));
});
test('speed mapping is visual only and never changes FIT measurements or saved terrain',()=>{
 const r=ride(),before=JSON.stringify(r),g=JSON.stringify(geometry),result=projectRouteSpeeds(geometry,r);
 assert.equal(JSON.stringify(r),before);assert.equal(JSON.stringify(geometry),g);assert(result.points.every(p=>p.v===null&&p.p===null&&p.hr===null&&p.c===null));
 assert(result.points.some(p=>routePointSpeed(p)>0));assert.equal(result.points[0].h,100);assert.equal(result.points.at(-1).h,200);
});
test('zero speed remains zero; missing, invalid and paused data cannot become an invented speed band',()=>{
 const r={points:[{t:0,d:0,v:0},{t:5000,d:100,v:10},{t:10000,d:200,v:null},{t:15000,d:300,v:5}]};const p=routeSpeedProfile(r);
 assert.equal(p.at(0),0);assert.equal(p.at(150),null);assert(p.hasGap(100,250));
 const result=projectRouteSpeeds(geometry,r);assert.equal(result.points[0].routeSpeed,0);assert(result.points.some(p=>p.routeSpeedGap));assert(colouredRouteData(geometry,r).features.some(f=>f.properties.color==='#666666'));
 const paused={points:[{t:0,d:0,v:5},{t:10000,d:100,v:10}],timerPauses:[[4000,6000]]};assert.equal(routeSpeedProfile(paused).at(50),null);
 const missingDistance={points:[{t:0,d:0,v:5},{t:5000,d:null,v:null},{t:10000,d:100,v:10}]};assert.equal(routeSpeedProfile(missingDistance).at(50),null);
});
test('recording gaps are grey rather than bridged, while known endpoint values remain available',()=>{
 const r={points:[{t:0,d:0,v:5},{t:40000,d:100,v:10}]},p=routeSpeedProfile(r);assert.equal(p.at(50),null);assert.equal(p.at(0),5);assert.equal(p.at(100),10);assert(colouredRouteData(geometry,r).features.every(f=>f.properties.color==='#666666'));
});
test('continuous original GPS can supply distance if FIT distance is missing or resets',()=>{
 const gpsGeometry=geometry.map(p=>({...p,lon:55+(p.lon-55)/10}));const points=gpsGeometry.map((p,i)=>({...p,t:i*5000,v:5+i*2,d:null})),r={points};const p=routeSpeedProfile(r);assert.equal(p.source,'gps-distance');assert(p.available);close(p.length,routeDistance(gpsGeometry));
 const reset={points:points.map((p,i)=>({...p,d:i===1?100:0}))};assert.equal(routeSpeedProfile(reset).source,'gps-distance');
});
test('missing speed or distance does not colour the manual route orange or fabricate sensor data',()=>{
 for(const r of [{points:[]},{points:[{t:0,v:5},{t:10000,v:10}]},{points:[{t:0,d:0,v:null},{t:5000,d:100,v:null}]}]){
  const result=projectRouteSpeeds(geometry,r);assert(result.points.every(p=>p.routeSpeed===null));assert(colouredRouteData(geometry,r).features.every(f=>f.properties.color==='#666666'));
 }
});
test('edited routes keep varied speed colours in the live editor, including across the date line',()=>{
 const features=colouredRouteData(geometry,ride()).features;assert(new Set(features.map(f=>f.properties.color)).size>=2);assert(features.every(f=>f.properties.color!=='#FF5000'));
 const cross=[{lat:0,lon:179.999,h:10},{lat:0,lon:-179.999,h:20}],fc=colouredRouteData(cross,ride());
 assert(fc.features.every(f=>Math.abs(f.geometry.coordinates[1][0]-f.geometry.coordinates[0][0])<.01));
});
test('large FIT recordings use bounded display geometry while retaining the full speed scale',()=>{
 const r={points:Array.from({length:140000},(_,i)=>({t:i*1000,d:i*5,v:i===1?25:5}))},result=projectRouteSpeeds(geometry,r);
 assert(result.points.length<=3805);assert.equal(result.profile.range.high,90);assert.equal(r.points.length,140000);
});
