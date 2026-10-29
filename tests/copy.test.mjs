import test from 'node:test';
import assert from 'node:assert/strict';
import {languages} from '../src/language-catalog.js';
import {setLanguage,t} from '../src/i18n.js';
import {message} from '../src/copy.js';
import {copySources} from '../src/copy-sources.js';
import {coachHistoryMarkup,coachSection} from '../src/coach-ui.js';
import {emptyCoach,validateCoachSettings} from '../src/coach.js';
import {sleepPickerMarkup} from '../src/sleep-picker.js';
import {rideNoun} from '../src/copy-counts.js';

test('every complete interface message is translated in every language with intact value slots',async()=>{
 try{
  for(const [lang] of languages){
   await setLanguage(lang);
   for(const [key,source] of Object.entries(copySources)){
    const result=message(key,['123','456','789','246']);assert(!/@m[a-f0-9]{12}|\{\d+\}|ZXQA|XQPV/.test(result),lang+':'+key);
    for(const match of source.matchAll(/\{(\d+)\}/g))assert(result.includes(['123','456','789','246'][Number(match[1])]),lang+':'+key);
    if(lang!=='ru')assert(result.trim(),lang+':'+key);
   }
  }
 }finally{await setLanguage('ru')}
});
test('new coach screens and history render in all 38 languages without English or Russian fallbacks',async()=>{
 const at=+new Date(2026,9,29,12),goal={id:'g',title:'My goal',kind:'distance',target:100,from:'2026-10-29',to:'2026-11-20',smart:true};
 const state={...emptyCoach(),settings:validateCoachSettings({level:'beginner',focus:'endurance',days:[1,3,5],weeklyMinutes:100,sessionMinutes:45,comfortableMinutes:30},at)};
 try{for(const [lang] of languages){
  await setLanguage(lang);const html=coachSection({goal,state,rides:[],now:at}).html;
  assert(html.includes('coach-week-strip'));assert(!html.includes('@m'));assert(!coachHistoryMarkup([],{now:at}).includes('@m'));assert(sleepPickerMarkup(7.5).includes('aria-valuenow="7.5"'));assert(rideNoun(2).trim());
  if(lang!=='ru'){assert(!html.includes('Самочувствие сегодня'));assert(!html.includes('Скорость'))}
 }}finally{await setLanguage('ru')}
});
test('translations keep safety-critical numbers, units and the reset confirmation token',async()=>{
 try{for(const [lang] of languages){
  await setLanguage(lang);assert(t('Для подтверждения введи RESET.').includes('RESET'));
  for(const key of ['m589f5041a3cb','mabf8418882af']){const text=message(key);for(const number of key==='m589f5041a3cb'?['10','30','80']:['30','45'])assert(text.includes(number),lang+':'+key)}
 }}finally{await setLanguage('ru')}
});
test('cycling terms keep their meaning instead of amusement rides or electrical power supplies',async()=>{
 try{
  await setLanguage('zh');assert.equal(t('Поездки'),'骑行');assert.equal(t('Мощность'),'功率');assert.equal(message('m92e0314efd0b'),'踏频');assert.equal(t('Импорт FIT'),'导入 FIT');
  await setLanguage('da');assert.equal(t('Поездки'),'Cykelture');assert.equal(t('Мощность'),'Effekt');
  await setLanguage('pl');assert.equal(t('Мощность'),'Moc');
  await setLanguage('uk');assert.equal(t('Поездки'),'Поїздки');
 }finally{await setLanguage('ru')}
});
