import test from 'node:test';
import assert from 'node:assert/strict';
import {importedFeedbackRides,importedFeedbackMarkup,rideFeedbackMarkup} from '../src/ride-feedback.js';
import {wellnessSliderMarkup,coachSection} from '../src/coach-ui.js';
import {emptyCoach,validateFeedback,validateCoachState,validateCoachSettings} from '../src/coach.js';
import {dateKey,nextDay} from '../src/periods.js';
const rides=[{id:'one',start:Date.now(),name:'One'},{id:'two',start:Date.now(),name:'Two'}];
test('post-import ratings belong to successfully added sessions, never failed or duplicate files',()=>{
 const results=[{ok:true,newRideIds:['one','two']},{ok:true,newRideIds:[]},{ok:false,newRideIds:['bad']},{ok:true,newRideIds:['one','missing']}];
 assert.deepEqual(importedFeedbackRides(results,rides).map(r=>r.id),['one','two']);assert.equal(importedFeedbackRides([{ok:true}],rides).length,0);
 const html=importedFeedbackMarkup(results,rides);assert.equal((html.match(/data-ride-feedback=/g)||[]).length,2);assert(html.includes('data-ride-feedback="one"'));assert(html.includes('data-ride-feedback="two"'));
});
test('skipping a rating creates no assumed RPE and leaves later entry available on the ride',()=>{
 const state=emptyCoach(),html=importedFeedbackMarkup([{ok:true,newRideIds:['one']}],rides,state.feedback,new Set(['one']));
 assert(!html.includes('data-ride-feedback='));assert(html.includes('#ride/one'));assert(html.includes('Оценка пропущена'));assert.deepEqual(state.feedback,[]);
 const later=rideFeedbackMarkup(rides[0],state.feedback);assert(later.includes('Оценить поездку'));assert(later.includes('type="range"'));assert(later.includes('min="0" max="10"'));assert(later.includes('5 / 10'));assert(!later.includes('data-feedback-skip'));
});
test('saved zero and maximum ratings survive backups, are visible and can be edited later',()=>{
 for(const rpe of [0,10]){const entry=validateFeedback({rideId:'one',rpe:String(rpe)}),state=validateCoachState({...emptyCoach(),feedback:[entry]});
  const restored=validateCoachState(JSON.parse(JSON.stringify(state)));const html=rideFeedbackMarkup(rides[0],restored.feedback);assert(html.includes(rpe+'/10'));assert(html.includes(`value="${rpe}"`));assert(html.includes('Обновить оценку'));assert(!html.includes('data-feedback-skip'));
 }assert.throws(()=>validateFeedback({rideId:'one',rpe:''}));
});
test('feedback card escapes imported filenames and does not ask for already stored ratings again',()=>{
 const r={...rides[0],name:'<img src=x onerror=alert(1)>'},html=importedFeedbackMarkup([{ok:true,newRideIds:['one']}],[r],[{rideId:'one',rpe:7}]);
 assert(!html.includes('<img src=x'));assert(html.includes('&lt;img'));assert(html.includes('Оценка сохранена'));assert(!html.includes('ride-feedback" open'));
});
test('well-being controls use integer 1–5 sliders and preserve stored values without saving implicit defaults',()=>{
 for(const [name,value] of [['sleepQuality',5],['fatigue',1],['stress',4]]){const html=wellnessSliderMarkup(name,'Оценка','Низко','Высоко',value);assert(html.includes('type="range"'));assert(html.includes('min="1" max="5" step="1"'));assert(html.includes(`value="${value}"`));assert(html.includes(`${value} / 5`));assert(html.includes(`for="wellness-${name}"`))}
 const now=Date.now(),today=dateKey(now),state={...emptyCoach(),settings:validateCoachSettings({level:'beginner',days:[1,3,5],weeklyMinutes:120,sessionMinutes:60,comfortableMinutes:30},now)};
 const html=coachSection({goal:{id:'g',title:'Goal',kind:'distance',smart:true,target:100,from:today,to:nextDay(today,28)},state,rides:[],now}).html;
 assert.equal((html.match(/data-wellness-slider/g)||[]).length,3);assert(!html.includes('coach-feedback-form'));assert(!html.includes('<select name="fatigue"'));assert.deepEqual(state.checkins,[]);
});

test('adding a skipped rating later replaces the skipped message in import results',()=>{
 const html=importedFeedbackMarkup([{ok:true,newRideIds:['one']}],rides,[{rideId:'one',rpe:0}],new Set(['one']));assert(html.includes('0/10'));assert(!html.includes('Оценка пропущена'));
});

test('new ride ratings use a 0–10 slider, while saved boundaries remain unchanged',()=>{
 const blank=rideFeedbackMarkup(rides[0],[]);assert(blank.includes('type="range"'));assert(blank.includes('step="1"'));assert(blank.includes('data-feedback-slider'));assert(!blank.includes('type="number"'));
 for(const rpe of [0,10]){const html=rideFeedbackMarkup(rides[0],[{rideId:'one',rpe}]);assert(html.includes(`aria-valuetext="${rpe} / 10"`));assert(html.includes(`value="${rpe}"`))}
});
