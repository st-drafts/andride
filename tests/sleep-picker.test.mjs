import test from 'node:test';
import assert from 'node:assert/strict';
import {sleepHoursValue,sleepPickerMarkup,mountSleepPickers} from '../src/sleep-picker.js';
import {validateCheckin} from '../src/coach.js';

test('sleep picker retains zero and half hours, with a bounded explicit-save default',()=>{
 for(const value of [0,.5,7.5,14]){
  assert.equal(sleepHoursValue(value),value);
  const html=sleepPickerMarkup(value);assert(html.includes(`name="sleepHours" value="${value}"`));assert(html.includes(`aria-valuenow="${value}"`));assert.equal((html.match(/data-sleep-index=/g)||[]).length,29);
  assert.equal(validateCheckin({date:'2026-10-28',sleepHours:value,sleepQuality:3,fatigue:3,stress:3},new Date('2026-10-29')).sleepHours,value);
 }
 assert.equal(sleepHoursValue(undefined),8);assert.equal(sleepHoursValue(-1),0);assert.equal(sleepHoursValue(20),14);
});

function fixture(value){
 const listeners={},input={value:String(value)},attrs={},selected=new Set(),items=Array.from({length:29},(_,i)=>({getBoundingClientRect:()=>({width:112}),classList:{toggle:(_,on)=>on?selected.add(i):selected.delete(i)}}));
 const picker={clientWidth:336,scrollLeft:0,querySelectorAll:()=>items,setAttribute:(k,v)=>attrs[k]=v,addEventListener:(k,fn)=>listeners[k]=fn};
 const field={querySelector:s=>s==='input'?input:picker};
 return {root:{querySelectorAll:()=>[field]},picker,input,attrs,listeners,selected};
}
test('keyboard, wheel and swipe update the submitted value without persisting a check-in',()=>{
 const f=fixture(7.5);let prevented=0;
 const stop=mountSleepPickers(f.root);assert.equal(f.picker.scrollLeft,15*112);assert.equal(f.input.value,'7.5');
 f.listeners.keydown({key:'ArrowRight',preventDefault:()=>prevented++});assert.equal(f.input.value,'8');assert.equal(f.attrs['aria-valuenow'],'8');assert(f.selected.has(16));
 f.listeners.keydown({key:'Home',preventDefault:()=>prevented++});assert.equal(f.input.value,'0');
 f.listeners.keydown({key:'ArrowLeft',preventDefault:()=>prevented++});assert.equal(f.input.value,'0');
 f.listeners.keydown({key:'End',preventDefault:()=>prevented++});assert.equal(f.input.value,'14');
 f.listeners.pointerdown({isTrusted:false});f.picker.scrollLeft=13*112;f.listeners.scroll();assert.equal(f.input.value,'6.5');
 f.listeners.wheel({deltaX:112,deltaY:0,preventDefault:()=>prevented++});f.listeners.scroll();assert.equal(f.input.value,'7');assert.equal(prevented,5);stop();
});
