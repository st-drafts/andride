import test from 'node:test';import assert from 'node:assert/strict';
import {smartSchedule,goalDays,validateGoal} from '../src/intellect.js';
const goal={id:'november',title:'Ноябрь',kind:'distance',target:250,from:'2026-11-01',to:'2026-11-30',smart:true};
const at=s=>+new Date(s+'T12:00:00'),ride=(date,km,id=date)=>({id,start:at(date),distance:km*1000});
const near=(a,b)=>assert(Math.abs(a-b)<1e-7,`${a} != ${b}`);
test('250 km in November produces 30 daily targets totaling exactly 250 km',()=>{const s=smartSchedule(goal,[],at('2026-10-22'));assert.equal(s.days,30);near(s.daily,250/30);assert.equal(s.next.date,'2026-11-01');near(s.rows.reduce((n,r)=>n+r.planned,0),250);assert.equal(s.restDays,0)});
test('12 + 16 km earns one rest day and carries fractional surplus forward',()=>{const s=smartSchedule(goal,[ride('2026-11-01',12),ride('2026-11-02',16)],at('2026-11-03'));assert.equal(s.next.rest,true);assert.equal(s.next.planned,0);assert.equal(s.restDays,1);near(s.completed,28);near(s.rows[3].planned,222/27);near(s.rows.filter(r=>!r.past).reduce((n,r)=>n+r.planned,0)+28,250)});
test('a partial surplus cannot earn a full rest day, multiple FITs on one day add together',()=>{const s=smartSchedule(goal,[ride('2026-11-01',12,'a'),ride('2026-11-01',4,'b')],at('2026-11-02'));assert.equal(s.completed,16);assert.equal(s.next.rest,false);near(s.next.planned,234/29)});
test('today can earn upcoming rest without predicting additional measured distance',()=>{const s=smartSchedule(goal,[ride('2026-11-01',12),ride('2026-11-02',16)],at('2026-11-02'));assert.equal(s.next.remaining,0);assert.equal(s.rows[2].rest,true);near(s.completed,28)});
test('missed days redistribute remaining distance and debt is not mistaken for surplus',()=>{const s=smartSchedule(goal,[ride('2026-11-02',12)],at('2026-11-03'));assert.equal(s.restDays,0);near(s.next.planned,238/28);near(s.rows.filter(r=>!r.past).reduce((n,r)=>n+r.planned,0)+12,250)});
test('reimported IDs, invalid distance, out-of-period and future FIT do not inflate credit',()=>{const a=ride('2026-11-01',12);const s=smartSchedule(goal,[a,a,ride('2026-10-31',100),ride('2026-12-01',100),ride('2026-11-03',100),ride('2026-11-02',NaN)],at('2026-11-02'));assert.equal(s.completed,12);assert.equal(s.restDays,0);assert.equal(s.rows[2].actual,0)});
test('completed goal frees future days; deleting a FIT recomputes the plan without stale rest days',()=>{const s=smartSchedule(goal,[ride('2026-11-01',250)],at('2026-11-02'));assert.equal(s.remaining,0);assert(s.rows.slice(1).every(r=>r.planned===0&&r.complete));const cleared=smartSchedule(goal,[],at('2026-11-02'));assert.equal(cleared.restDays,0);near(cleared.next.planned,250/29)});
test('leap years and DST use inclusive local calendar dates',()=>{assert.equal(goalDays({from:'2028-02-01',to:'2028-02-29'}),29);assert.equal(goalDays({from:'2026-03-01',to:'2026-03-31'}),31);assert.equal(goalDays({from:'2026-02-30',to:'2026-03-02'}),0)});
test('one-day and expired goals have no division by zero or invented progress',()=>{const one=smartSchedule({...goal,to:goal.from},[],at('2026-11-01'));assert.equal(one.next.planned,250);const old=smartSchedule(goal,[],at('2026-12-01'));assert.equal(old.next,null);assert.equal(old.remaining,250);assert(old.rows.every(r=>Number.isFinite(r.planned)))});
test('ordinary and restored goals remain valid; smart plans validate their supported period',()=>{assert.equal(validateGoal({...goal,title:'  Ноябрь  '}).title,'Ноябрь');assert.equal(validateGoal({...goal,smart:false,kind:'duration'}).smart,false);assert.equal(smartSchedule({...goal,smart:false},[]),null);for(const g of [{...goal,target:0},{...goal,title:' '},{...goal,to:'2026-02-30'},{...goal,from:'2026-12-01'},{...goal,kind:'count'},{...goal,to:'2028-11-30'}])assert.throws(()=>validateGoal(g));});
test('local FIT date boundaries and autumn DST do not shift earned distance',()=>{const previous=process.env.TZ;process.env.TZ='America/New_York';try{const s=smartSchedule(goal,[{id:'before',start:+new Date('2026-11-01T03:30:00Z'),distance:3000},{id:'inside',start:+new Date('2026-11-01T04:30:00Z'),distance:5000}],at('2026-11-02'));assert.equal(s.days,30);assert.equal(s.completed,5);assert.equal(s.rows[0].actual,5)}finally{if(previous===undefined)delete process.env.TZ;else process.env.TZ=previous}});
test('later FIT does not retroactively create earlier rest days',()=>{const s=smartSchedule(goal,[ride('2026-11-04',30)],at('2026-11-05'));assert(s.rows.slice(0,4).every(r=>!r.rest));assert.equal(s.next.rest,false);near(s.next.planned,220/26)});

test('large credit distributes sessions between rest days instead of a final cluster',()=>{
 const g={...goal,from:'2026-10-01',to:'2026-10-31',target:200};
 const s=smartSchedule(g,[ride('2026-10-21',180)],at('2026-10-22'));
 const pending=s.rows.filter(r=>!r.past),active=pending.filter(r=>r.planned>0);
 assert.equal(s.trainingDays,4);assert.equal(s.restDays,6);assert.equal(pending[0].rest,true);
 assert(active[0].date<'2026-10-28');assert(active.some(r=>r.date<'2026-10-26'));
 const indexes=active.map(r=>pending.indexOf(r)),gaps=indexes.slice(1).map((n,i)=>n-indexes[i]);
 assert(Math.max(...gaps)-Math.min(...gaps)<=1);
 near(active.reduce((n,r)=>n+r.planned,0),20);assert(active.every(r=>Math.abs(r.planned-5)<1e-8));
});
test('a short ride on a prepaid day is credited without demanding a top-up',()=>{
 const g={...goal,from:'2026-10-01',to:'2026-10-31',target:200};
 const s=smartSchedule(g,[ride('2026-10-21',174.5),ride('2026-10-22',5.5)],at('2026-10-22'));
 near(s.next.planned,5.5);assert.equal(s.next.remaining,0);assert.equal(s.next.rest,false);
 const future=s.rows.filter(r=>r.date>'2026-10-22'&&r.planned>0);
 assert.equal(future.length,4);assert(future[0].date<'2026-10-28');near(future.reduce((n,r)=>n+r.planned,0),20);
});
test('behind-schedule partial activity retains a realistic remainder for today',()=>{
 const s=smartSchedule(goal,[ride('2026-11-01',4)],at('2026-11-01'));
 near(s.next.planned,250/30);near(s.next.remaining,250/30-4);assert.equal(s.restDays,0);
 near(s.rows.reduce((n,r)=>n+Math.max(0,r.planned-r.actual),0),246);
});
test('remaining plan conserves the goal budget across periods, progress and current activity',()=>{
 for(const days of [1,2,7,15,30])for(const elapsed of [0,Math.floor(days/2),days-1])for(const km of [0,1,12,60,125,249.9999,250,300])for(const todayKm of [0,.1,5.5,16]){
  const end=new Date(2026,10,days),today=new Date(2026,10,elapsed+1),g={...goal,to:dateString(end)};
  const records=[];if(elapsed>0)records.push(ride('2026-11-01',km));records.push(ride(dateString(today),todayKm,'current'));
  const s=smartSchedule(g,records,+new Date(+today+12*3600000));
  const pending=s.rows.filter(r=>!r.past);
  near(pending.reduce((n,r)=>n+Math.max(0,r.planned-r.actual),0),s.remaining);
  assert(pending.every(r=>Number.isFinite(r.planned)&&r.planned>=0));
  assert.equal(s.restDays,pending.filter(r=>r.rest).length);
  assert(pending.every(r=>!(r.rest&&r.planned>0)));
 }
});
function dateString(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
