import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultPeriods,currentMonthRange,withinRange,localDate,nextDay,validRange,periodBars} from '../src/periods.js';
test('inclusive date ranges include midnight and late end-day rides, exclude next day',()=>{const range={from:'2026-10-12',to:'2026-10-18'},rides=['2026-10-11T23:59:59','2026-10-12T00:00:00','2026-10-18T23:59:59','2026-10-19T00:00:00'].map((s,id)=>({id,start:+new Date(s)}));assert.deepEqual(withinRange(rides,range).map(r=>r.id),[1,2]);assert.equal(withinRange(rides,{from:'2026-10-18',to:'2026-10-18'}).length,1)});
test('calendar validation and defaults handle year and leap day boundaries',()=>{assert.equal(validRange({from:'2026-02-30',to:'2026-03-01'}),false);assert.equal(validRange({from:'2026-10-18',to:'2026-10-12'}),false);assert.equal(nextDay('2024-02-28'),'2024-02-29');assert.deepEqual(defaultPeriods(+new Date(2026,0,1)),{current:{from:'2025-12-29',to:'2026-01-04'},previous:{from:'2025-12-22',to:'2025-12-28'}})});
test('local calendar boundaries survive daylight-saving days',()=>{const previous=process.env.TZ;process.env.TZ='Europe/Berlin';try{assert.equal(+localDate('2026-03-30')-+localDate('2026-03-29'),23*3600000);assert.equal(nextDay('2026-03-29'),'2026-03-30');assert.equal(withinRange([{start:+new Date(2026,2,29,23,59)}],{from:'2026-03-29',to:'2026-03-29'}).length,1)}finally{if(previous)process.env.TZ=previous;else delete process.env.TZ}});
test('long-period chart aggregates without dropping distance or admitting outside rides',()=>{const range={from:'2026-01-01',to:'2026-12-31'},rides=[{start:+new Date(2026,0,1),distance:10000},{start:+new Date(2026,11,31),distance:20000},{start:+new Date(2027,0,1),distance:9000}],bars=periodBars(rides,range);assert.equal(bars.grouped,true);assert.ok(bars.values.length<=31);assert.equal(bars.values.reduce((a,b)=>a+b),30)});
test('goal chart bounds buckets and includes the last day of the maximum supported year',()=>{
 const range={from:'1000-01-01',to:'9999-12-31'};
 const rides=[
  {id:'before',start:+new Date(999,11,31,23,59),distance:90000},
  {id:'first',start:+new Date(1000,0,1),distance:10000},
  {id:'last',start:+new Date(9999,11,31,23,59,59,999),distance:20000},
  {id:'after',start:+new Date(10000,0,1),distance:90000}
 ];
 assert.deepEqual(withinRange(rides,range).map(r=>r.id),['first','last']);
 const bars=periodBars(rides,range);
 assert.equal(bars.grouped,true);
 assert.equal(bars.values.length,31);
 assert.equal(bars.labels[0],'1.1');
 assert.equal(bars.values[0],10);
 assert.equal(bars.values.at(-1),20);
 assert.equal(bars.values.reduce((a,b)=>a+b),30);
 assert.deepEqual(periodBars(rides,{from:range.to,to:range.to}),{values:[20],labels:['31'],grouped:false});
});
test('chart uses local calendar days across a daylight-saving change',()=>{
 const previous=process.env.TZ;
 try{
  process.env.TZ='Europe/Berlin';
  const rides=[28,29,30].map((day,index)=>({start:+new Date(2026,2,day,23,59),distance:(index+1)*1000}));
  assert.deepEqual(periodBars(rides,{from:'2026-03-28',to:'2026-03-30'}),{values:[1,2,3],labels:['28','29','30'],grouped:false});
 }finally{if(previous)process.env.TZ=previous;else delete process.env.TZ}
});

test('the current calendar month handles short months, leap years and year boundaries',()=>{
 for(const [now,expected] of [[new Date(2026,10,21),{from:'2026-11-01',to:'2026-11-30'}],[new Date(2026,11,31,23,59),{from:'2026-12-01',to:'2026-12-31'}],[new Date(2027,0,1),{from:'2027-01-01',to:'2027-01-31'}],[new Date(2024,1,29),{from:'2024-02-01',to:'2024-02-29'}],[new Date(2026,1,1),{from:'2026-02-01',to:'2026-02-28'}]])assert.deepEqual(currentMonthRange(now),expected);
});
test('month selection uses local midnight and the whole month rather than a week',()=>{
 const previous=process.env.TZ;
 try{for(const timezone of ['Asia/Dubai','America/Los_Angeles','Europe/Berlin']){
  process.env.TZ=timezone;const now=+new Date(2026,2,31,23,59),range=currentMonthRange(now);
  const rides=[[new Date(2026,1,28,23,59,59,999),1000],[new Date(2026,2,1),10000],[new Date(2026,2,12,12),20000],[new Date(2026,2,31,23,59,59,999),30000],[new Date(2026,3,1),100000]].map(([date,distance],id)=>({id,start:+date,distance}));
  assert.deepEqual(withinRange(rides,range).map(r=>r.id),[1,2,3],timezone);
  const bars=periodBars(rides,range);assert.equal(bars.values.length,31);assert.equal(bars.grouped,false);assert.equal(bars.values.reduce((a,b)=>a+b),60);
 }}finally{if(previous)process.env.TZ=previous;else delete process.env.TZ}
});
