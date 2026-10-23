import test from 'node:test';import assert from 'node:assert/strict';
import {overviewPlanMarkup} from '../src/intellect-ui.js';
import {smartSchedule} from '../src/intellect.js';
import {num} from '../src/metrics.js';
const goal={id:'test',title:'November',kind:'distance',target:70,from:'2026-11-01',to:'2026-11-07',smart:true};
const now=day=>+new Date(2026,10,day,12);
const ride=(day,distance)=>({id:'ride'+day,start:now(day)-3600000,distance});
test('overview shows the current smart session in the same typography and distance as Intellect',()=>{const g={...goal,target:250,to:'2026-11-30'},html=overviewPlanMarkup(g,[],{now:now(1),weather:{}}),row=smartSchedule(g,[],now(1)).rows.find(r=>r.current);assert(html.includes('goal-story overview-today'));assert(html.includes('data-plan-weather'));assert(html.replace(/<[^>]*>/g,'').includes('Сегодня запланирована тренировка на'));assert(html.includes(num(row.remaining,1)+' км'))});
test('earned rest and a completed active goal show rest instead of inventing a ride',()=>{for(const distance of [30000,70000]){const rides=[ride(1,distance)];assert(smartSchedule(goal,rides,now(2)).rows.find(r=>r.current).rest||distance===70000);assert(overviewPlanMarkup(goal,rides,{now:now(2),weather:{}}).includes('Сегодня день отдыха.'))}});
test('today partial FIT shows remaining distance; a completed daily target shows completion',()=>{assert(overviewPlanMarkup(goal,[ride(1,4000)],{now:now(1),weather:{}}).replace(/<[^>]*>/g,'').includes('На сегодня осталось проехать'));assert(overviewPlanMarkup(goal,[ride(1,4000)],{now:now(1),weather:{}}).includes('6 км'));assert(overviewPlanMarkup(goal,[ride(1,10000)],{now:now(1),weather:{}}).includes('План на сегодня выполнен.'))});
test('future, past, ordinary and absent goals never show a fabricated current-day session',()=>{for(const g of [null,{...goal,smart:false},{...goal,from:'2026-11-03'},{...goal,to:'2026-11-01'}])assert.equal(overviewPlanMarkup(g,[],{now:now(2),weather:{}}),'')});
test('overview follows the same weather-based rest decision as Intellect',()=>{const weather=Object.fromEntries(Array.from({length:7},(_,i)=>['2026-11-0'+(i+1),{low:12,high:20,rain:i===0?12:0,probability:i===0?95:10,wind:8,gusts:15,code:1}]));const model=smartSchedule(goal,[],now(1),weather);assert(model.rows[0].rest);assert(overviewPlanMarkup(goal,[],{now:now(1),weather}).includes('Сегодня день отдыха.'))});

 test('today label is white while the rest of the training sentence keeps its muted styling',()=>{const html=overviewPlanMarkup(goal,[],{now:now(1),weather:{}});assert(html.includes('<strong>Сегодня</strong> запланирована тренировка на'));assert(html.includes('<strong class="accent">10 км</strong>'))});
