import test from 'node:test';import assert from 'node:assert/strict';
import {memoizeRideCalculation} from '../src/calculation-cache.js';
import {heartZones,powerAndEnergy} from '../src/physiology.js';
import {analyzeRide} from '../src/ride-analysis.js';
const ride=()=>({start:0,end:60000,duration:60,points:Array.from({length:61},(_,i)=>({t:i*1000,p:150,hr:140,v:5,c:i<30?0:null,d:i*5,h:0}))});
test('repeated calculations reuse only matching profile inputs and release old variants',()=>{let calls=0;const f=memoizeRideCalculation((r,p)=>({n:++calls,value:p.weight}),['weight']),r={};const a=f(r,{weight:70});assert.equal(f(r,{weight:70,ftp:200}),a);assert.notEqual(f(r,{weight:80}),a);assert.notEqual(f(r,{weight:70}),a);assert.notEqual(f({}, {weight:70}),a);assert.equal(calls,4)});
test('analysis caches invalidate FTP without changing zero or missing cadence',()=>{const r=ride(),a=analyzeRide(r,{ftp:200});assert.equal(analyzeRide(r,{ftp:200}),a);const b=analyzeRide(r,{ftp:300});assert.notEqual(a,b);assert.notDeepEqual(a.powerZones,b.powerZones);assert.equal(b.total.cZeroSeconds,30);assert.equal(b.total.cCoverage,.5);assert.notEqual(analyzeRide({...r},{ftp:300}),b)});
test('physiology caches invalidate changed rider settings',()=>{const r=ride(),profile={maxHr:180,weight:70,bikeWeight:10};const h=heartZones(r,profile),p=powerAndEnergy(r,profile);assert.equal(heartZones(r,{...profile}),h);assert.equal(powerAndEnergy(r,{...profile}),p);profile.maxHr=200;assert.notDeepEqual(heartZones(r,profile).bounds,h.bounds);profile.weight=80;assert.notEqual(powerAndEnergy(r,profile),p)});
