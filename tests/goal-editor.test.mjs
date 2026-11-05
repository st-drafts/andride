import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultGoal,goalEditorMarkup,goalDraft,goalQuestions,suggestedGoalTarget} from '../src/goal-editor.js';
import {coachSection} from '../src/coach-ui.js';
import {emptyCoach,validateCoachSettings} from '../src/coach.js';
import {dateKey,nextDay} from '../src/periods.js';
const now=+new Date(2028,0,31,12);
test('goal period presets count from today and include the last day of a shorter month',()=>{
 const g=defaultGoal(now);
 assert.equal(g.from,'2028-01-31');assert.equal(g.to,'2028-02-29');assert.equal(g.smart,true);
 const regular=defaultGoal(+new Date(2026,10,5,12));
 assert.equal(regular.to,'2026-12-04');
 for(const [preset,to] of [['week','2028-02-06'],['fortnight','2028-02-13'],['month','2028-02-29']]){
  const draft=goalDraft({...g,title:'Existing',from:'2028-01-01',to:'2028-01-15'},null,now);
  goalQuestions(draft.values,{now}).find(step=>step.key==='period').apply(draft,preset);
  assert.equal(draft.values.from,g.from);assert.equal(draft.values.to,to);
 }
});
test('goals open as a chat page and ask for a typed name',()=>{
 const html=goalEditorMarkup({back:'<a class="back-link" href="#overview"></a>'}),draft=goalDraft(null,null,now);
 assert.match(html,/<h1><img [^>]+icon-assistant\.svg[^>]*> and Ride<\/h1>/);assert(html.includes('aria-label="Новая цель"'));assert(html.includes('id="goal-editor-form"'));assert(html.includes('role="log"'));assert.match(html,/<div class="page-heading"><a class="back-link" href="#overview">/);assert(!html.includes('<dialog'));
 const steps=goalQuestions(draft.values,{now});
 assert.deepEqual(steps[0].choices.map(choice=>choice.value),['distance','duration','count','weekly-time','event']);
 assert.equal(steps[1].key,'title');
 assert.equal(steps[1].input.type,'text');assert.equal(steps[1].input.maxLength,100);
 assert.deepEqual(steps.find(step=>step.key==='period').choices.map(choice=>choice.value),['week','fortnight','month','custom']);
 assert.equal(draft.answered.size,0);
});
test('editing starts from saved answers and lets the rider change the name and dates',()=>{
 const goal={...defaultGoal(now),id:'g',title:'<script>alert(1)</script>',target:400,smart:false};
 const draft=goalDraft(goal,null,now),steps=goalQuestions(draft.values,{now});
 assert(goalEditorMarkup({goal}).includes('Изменить цель'));assert(!goalEditorMarkup({goal}).includes('<script>alert'));
 assert(steps.every(step=>draft.answered.has(step.key)));
 assert.equal(draft.values.target,400);assert.equal(draft.values.title,goal.title);
 assert.equal(draft.values.period,'custom');assert.equal(steps.find(step=>step.key==='title').input.type,'text');
 steps.find(step=>step.key==='period').apply(draft,'custom');
 assert(!draft.answered.has('from'));assert(!draft.answered.has('to'));
 assert.equal(draft.values.from,goal.from);assert.equal(draft.values.to,goal.to);
});
test('only an existing goal has a delete action, separate from the response form',()=>{
 const html=goalEditorMarkup({goal:{...defaultGoal(now),id:'g"<',title:'November'},now});
 assert(html.indexOf('data-remove-goal')<html.indexOf('<form'));assert(html.includes('type="button" class="link-button danger-text"'));assert(html.includes('data-remove-goal="g&quot;&lt;"'));assert(!goalEditorMarkup({now}).includes('data-remove-goal'));
});
test('goal answers react to a new goal kind or incompatible dates',()=>{
 const goal={...defaultGoal(now),id:'g',title:'Existing',target:400},draft=goalDraft(goal,null,now);
 const questions=()=>goalQuestions(draft.values,{now});
 const changeKind=questions()[0].apply;
 draft.values.kind='event';changeKind(draft,'event','distance');
 assert.equal(draft.values.target,1);assert.equal(draft.values.smart,true);
 assert(!questions().some(step=>step.key==='target'||step.key==='smart'));
 assert(questions().some(step=>step.key==='days'));
 draft.values.kind='count';changeKind(draft,'count','event');
 assert.equal(draft.values.target,12);assert.equal(draft.values.smart,false);assert.equal(draft.answered.has('target'),false);
 assert.equal(questions().find(step=>step.key==='target').input.step,1);
 assert(!questions().some(step=>step.key==='days'));
 const from=questions().find(step=>step.key==='from');draft.values.from='2028-03-01';from.apply(draft);
 assert(!draft.answered.has('to'));assert.equal(questions().find(step=>step.key==='to').input.min,draft.values.from);
});
test('hour goals retain fractional targets and ranges in the coaching dashboard',()=>{
 const today=dateKey(now),state={...emptyCoach(),settings:validateCoachSettings({level:'beginner',focus:'endurance',days:[0,1,2,3,4,5,6],weeklyMinutes:120,sessionMinutes:60,comfortableMinutes:30},now),checkins:[{date:today,sleepHours:8,sleepQuality:4,fatigue:2,stress:2}]};
 for(const kind of ['duration','weekly-time']){
  const goal={id:'fraction',title:'Fractional hours',kind,target:1.5,from:today,to:nextDay(today,6),smart:true};
  const {html,model}=coachSection({goal,state,rides:[],now});
  assert.equal(model.range.low,1.5);assert.equal(model.range.high,1.5);
  assert(html.includes('aria-label="Выполнение цели"'));assert(!html.includes('Прогресс километровой цели'));assert(html.includes('Цель: <strong>1,5 ч</strong>'));assert(html.includes('<strong>1,5–1,5 ч</strong>'));assert(html.includes('цель 1,5'));
  const short=coachSection({goal:{...goal,target:.1},state,rides:[],now}).html;
  assert(short.includes('Цель: <strong>0,1 ч</strong>'));assert(!short.includes('Цель: <strong>0 ч</strong>'));
 }
});
test('suggested hour targets preserve tenths and can remain below one hour',()=>{
 assert.equal(suggestedGoalTarget({unit:'duration',low:.2,high:.6}),.4);
 assert.equal(suggestedGoalTarget({unit:'duration',low:1.2,high:1.8}),1.5);
 assert.equal(suggestedGoalTarget({unit:'duration',low:0,high:.05}),.1);
 assert.equal(suggestedGoalTarget({unit:'distance',low:2,high:3}),3);
});
