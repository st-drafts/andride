import test from 'node:test';import assert from 'node:assert/strict';
import {overviewPlanMarkup} from '../src/intellect-ui.js';
import {smartSchedule} from '../src/intellect.js';
import {num} from '../src/metrics.js';
import {coachUpcomingMarkup,coachSection} from '../src/coach-ui.js';
import {coachPlan,emptyCoach,validateCoachSettings} from '../src/coach.js';
const goal={id:'test',title:'November',kind:'distance',target:70,from:'2026-11-01',to:'2026-11-07',smart:true};
const now=day=>+new Date(2026,10,day,12);
const ride=(day,distance)=>({id:'ride'+day,start:now(day)-3600000,distance});
test('overview shows the current smart session in the same typography and distance as Intellect',()=>{const g={...goal,target:250,to:'2026-11-30'},html=overviewPlanMarkup(g,[],{now:now(1),weather:{}}),row=smartSchedule(g,[],now(1)).rows.find(r=>r.current);assert(html.includes('goal-story overview-today'));assert(html.includes('data-plan-weather'));assert(html.replace(/<[^>]*>/g,'').includes('Сегодня запланирована тренировка на'));assert(html.includes(num(row.remaining,1)+' км'))});
test('earned rest and a completed active goal show rest instead of inventing a ride',()=>{for(const distance of [30000,70000]){const rides=[ride(1,distance)];assert(smartSchedule(goal,rides,now(2)).rows.find(r=>r.current).rest||distance===70000);assert(overviewPlanMarkup(goal,rides,{now:now(2),weather:{}}).includes('Сегодня день отдыха.'))}});
test('today partial FIT shows remaining distance; a completed daily target shows completion',()=>{assert(overviewPlanMarkup(goal,[ride(1,4000)],{now:now(1),weather:{}}).replace(/<[^>]*>/g,'').includes('На сегодня осталось проехать'));assert(overviewPlanMarkup(goal,[ride(1,4000)],{now:now(1),weather:{}}).includes('6 км'));assert(overviewPlanMarkup(goal,[ride(1,10000)],{now:now(1),weather:{}}).includes('План на сегодня выполнен.'))});
test('future, past, ordinary and absent goals never show a fabricated current-day session',()=>{for(const g of [null,{...goal,smart:false},{...goal,from:'2026-11-03'},{...goal,to:'2026-11-01'}])assert.equal(overviewPlanMarkup(g,[],{now:now(2),weather:{}}),'')});
test('overview follows the same weather-based rest decision as Intellect',()=>{const weather=Object.fromEntries(Array.from({length:7},(_,i)=>['2026-11-0'+(i+1),{low:12,high:20,rain:i===0?12:0,probability:i===0?95:10,wind:8,gusts:15,code:1}]));const model=smartSchedule(goal,[],now(1),weather);assert(model.rows[0].rest);assert(overviewPlanMarkup(goal,[],{now:now(1),weather}).includes('Сегодня день отдыха.'))});

 test('today label is white while the rest of the training sentence keeps its muted styling',()=>{const html=overviewPlanMarkup(goal,[],{now:now(1),weather:{}});assert(html.includes('<strong>Сегодня</strong> запланирована тренировка на'));assert(html.includes('<strong class="accent">10 км</strong>'))});

test('overview uses the same coach days, minutes and rest as Intellect, with links to each day',()=>{
 const at=now(1),state={...emptyCoach(),settings:validateCoachSettings({focus:'endurance',level:'beginner',days:[1,3,5],weeklyMinutes:120,sessionMinutes:60,comfortableMinutes:30},at)},g={...goal,target:200,to:'2026-11-30'};
 const {model,html:dashboard}=coachSection({goal:g,state,rides:[],now:at}),html=coachUpcomingMarkup(model);
 assert.equal((html.match(/class="coach-week-day /g)||[]).length,7);assert(!html.includes('coach-session'));assert(html.includes('Ближайшие дни'));assert(html.includes(model.minutes+' мин'));
 for(const row of model.rows){assert(html.includes(`href="#intellect/${row.date}"`));assert(dashboard.includes(`data-coach-day="${row.date}"`));}
 const tired=coachPlan({goal:g,state:{...state,checkins:[{date:'2026-11-01',sleepHours:8,sleepQuality:4,fatigue:5,stress:2}]},rides:[],now:at});assert(tired.rows[0].rest);assert(coachUpcomingMarkup(tired).includes('#intellect/2026-11-01'));
});
test('overview prompts setup without making up a week when the coach is not configured',()=>{
 const html=coachUpcomingMarkup(null);assert(html.includes('data-action="add-goal"'));assert(!html.includes('coach-week-day'));
 assert(coachUpcomingMarkup(null,{hasGoal:true}).includes('data-action="coach-setup"'));
});
test('an expired coach goal does not fabricate future days in the overview',()=>{
 const html=coachUpcomingMarkup({rows:[],minutes:0});assert(html.includes('Период цели завершён'));assert(!html.includes('#intellect/'));
});
