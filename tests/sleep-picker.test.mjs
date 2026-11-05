import test from 'node:test';
import assert from 'node:assert/strict';
import {sleepDurationLabel,sleepPickerMarkup,mountSleepPickers} from '../src/sleep-picker.js';
import {validateCheckin} from '../src/coach.js';

test('sleep picker shows minutes and retains valid saved values, including zero',()=>{
 const values=[0,7.125,7+37/60,14];
 for(const value of values){
  const html=sleepPickerMarkup(value);
  assert(html.includes(`name="sleepHours" value="${value}"`));
  assert.equal((html.match(/role="slider"/g)||[]).length,2);
  assert.equal(validateCheckin({date:'2026-10-28',sleepHours:value,sleepQuality:3,fatigue:3,stress:3},new Date('2026-10-29')).sleepHours,value);
 }
 assert(sleepDurationLabel(7+37/60).includes('37'));
 assert(sleepPickerMarkup(undefined).includes('name="sleepHours" value="8"'));
 assert(sleepPickerMarkup(14).includes('aria-valuemax="0" aria-valuenow="0"'));
});

function wheel(length){
 const listeners={},attrs={};
 const items=Array.from({length},()=>({
  getBoundingClientRect:()=>({height:72}),
  classList:new Set()
 }));
 for(const item of items)item.classList.remove=item.classList.delete;
 return {
  listeners,attrs,children:items,firstElementChild:items[0],scrollTop:0,
  querySelector:()=>items.find(item=>item.classList.has('is-selected')),
  setAttribute:(key,value)=>attrs[key]=String(value),addEventListener:(key,fn)=>listeners[key]=fn
 };
}

test('wheels combine keyboard and scroll changes and cap the duration at 14 hours',()=>{
 const changes=[],input={value:'7.5',dispatchEvent:event=>changes.push([event.type,input.value])};
 const hours=wheel(15),minutes=wheel(60);
 const field={querySelector:()=>input,querySelectorAll:()=>[hours,minutes]};
 const stop=mountSleepPickers({querySelectorAll:()=>[field]});
 const press=(wheel,key)=>wheel.listeners.keydown({key,preventDefault:()=>{}});
 assert.equal(hours.scrollTop,7*72);assert.equal(minutes.scrollTop,30*72);assert.deepEqual(changes,[]);
 minutes.scrollTop=37*72;minutes.listeners.scroll({isTrusted:false});
 assert.equal(Math.round(Number(input.value)*60),7*60+37);
 assert.equal(minutes.attrs['aria-valuenow'],'37');
 press(hours,'End');
 assert.equal(input.value,'14');assert.equal(minutes.attrs['aria-disabled'],'true');assert.equal(minutes.scrollTop,0);
 press(minutes,'ArrowUp');assert.equal(input.value,'14');
 press(hours,'Home');assert.equal(input.value,'0');
 press(minutes,'ArrowUp');assert.equal(Number(input.value),1/60);
 assert.equal(changes.length,4);stop();
});
