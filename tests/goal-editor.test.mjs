import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultGoal,goalEditorMarkup,captureGoalDraft,suggestedGoalTarget} from '../src/goal-editor.js';
import {coachSection} from '../src/coach-ui.js';
import {emptyCoach,validateCoachSettings} from '../src/coach.js';
import {dateKey,nextDay} from '../src/periods.js';
const now=+new Date(2028,0,31,12);
test('new goal dates cover next calendar month including a leap year',()=>{
 const g=defaultGoal(now);assert.equal(g.from,'2028-02-01');assert.equal(g.to,'2028-02-29');assert.equal(g.smart,true);
});
test('goal page keeps the questionnaire, date controls and range preview in a normal form',()=>{
 const html=goalEditorMarkup({now,returnTo:'overview'});assert(html.includes('<h1>Новая цель</h1>'));assert(html.includes('id="goal-editor-form"'));assert(html.includes('data-coach-fields'));assert(html.includes('data-coach-goal-range'));assert(html.includes('href="#overview"'));assert(!html.includes('<dialog'));assert(!html.includes('maxlength="100" placeholder="Мой месяц в седле" value="undefined"'));
});
test('editing restores the existing goal and escapes user titles and draft fields',()=>{
 const goal={...defaultGoal(now),id:'g',title:'<script>alert(1)</script>',target:400};const html=goalEditorMarkup({goal,now});assert(html.includes('Изменить цель'));assert(html.includes('Сохранить изменения'));assert(html.includes('value="400"'));assert(!html.includes('<script>alert'));assert(html.includes('&lt;script&gt;'));
});
test('only an existing goal has a delete action, outside and below the save form',()=>{
 const html=goalEditorMarkup({goal:{...defaultGoal(now),id:'g"<',title:'November'},now});
 assert(html.indexOf('data-remove-goal')>html.indexOf('</form>'));assert(html.includes('type="button" class="link-button danger-text"'));assert(html.includes('data-remove-goal="g&quot;&lt;"'));assert(!goalEditorMarkup({now}).includes('data-remove-goal'));
});
test('rerender draft retains disabled questionnaire inputs, availability and smart state',()=>{
 const values={title:'Мой черновик',kind:'count',target:'12',from:'2028-02-01',to:'2028-02-29',coachFocus:'speed',coachLevel:'regular',coachWeekly:'180',coachSession:'90',coachComfortable:'45',smart:true,coachIndoor:true,coachHistory:false};
 const form={elements:{namedItem:key=>['smart','coachIndoor','coachHistory'].includes(key)?{checked:values[key],disabled:true}:{value:values[key],disabled:true}},querySelectorAll:()=>[{value:'0'},{value:'3'}]};const draft=captureGoalDraft(form),html=goalEditorMarkup({draft,now});
 assert.equal(draft.title,values.title);assert.deepEqual(draft.coachDays,[0,3]);assert.equal(draft.coachFocus,'speed');assert.equal(draft.coachIndoor,true);assert(html.includes('value="12"'));assert(html.includes('data-goal-coach hidden'));assert(html.includes('value="180"'));assert(html.includes('value="speed" selected'));
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
