import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultGoal,goalEditorMarkup,captureGoalDraft} from '../src/goal-editor.js';
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
test('rerender draft retains disabled questionnaire inputs, availability and smart state',()=>{
 const values={title:'Мой черновик',kind:'count',target:'12',from:'2028-02-01',to:'2028-02-29',coachFocus:'speed',coachLevel:'regular',coachWeekly:'180',coachSession:'90',coachComfortable:'45',smart:true,coachIndoor:true,coachHistory:false};
 const form={elements:{namedItem:key=>['smart','coachIndoor','coachHistory'].includes(key)?{checked:values[key],disabled:true}:{value:values[key],disabled:true}},querySelectorAll:()=>[{value:'0'},{value:'3'}]};const draft=captureGoalDraft(form),html=goalEditorMarkup({draft,now});
 assert.equal(draft.title,values.title);assert.deepEqual(draft.coachDays,[0,3]);assert.equal(draft.coachFocus,'speed');assert.equal(draft.coachIndoor,true);assert(html.includes('value="12"'));assert(html.includes('data-goal-coach hidden'));assert(html.includes('value="180"'));assert(html.includes('value="speed" selected'));
});
