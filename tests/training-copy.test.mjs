import test from 'node:test';
import assert from 'node:assert/strict';
import {languages} from '../src/language-catalog.js';
import {trainingCopy,trainingKeys,trainingTranslations} from '../src/training-copy.js';
import {setLanguage} from '../src/i18n.js';
import {trainingSummaryMarkup} from '../src/training-summary.js';
import {progressMarkup} from '../src/progress-ui.js';
import {ftpSettingsMarkup} from '../src/ftp-settings.js';

test('all 38 languages include complete new training copy with matching placeholders',()=>{
 const placeholders=value=>[...value.matchAll(/\{\d+\}/g)].map(m=>m[0]).sort();
 assert.equal(Object.keys(trainingTranslations).length,38);
 for(const [code] of languages){const rows=trainingTranslations[code];assert(rows,code);assert.equal(rows.length,trainingKeys.length,code);for(const [i,key] of trainingKeys.entries()){assert.equal(typeof rows[i],'string',code+':'+key);assert(rows[i].trim(),code+':'+key);assert.deepEqual(placeholders(rows[i]),placeholders(trainingTranslations.en[i]),code+':'+key);const copy=trainingCopy(key,['6','7'],code);assert(!/\{\d+\}/.test(copy),code+':'+key)}}
});
test('new English surfaces do not depend on Russian fragment matching and keep historical dates explicit',async()=>{
 await setLanguage('en');try{
  const ride={start:0,end:600000,duration:600,ftp:250,normalizedPower:290,points:Array.from({length:601},(_,i)=>({t:i*1000,p:350}))};
  const summary=trainingSummaryMarkup(ride);assert(summary.includes('Power zones'));assert(!summary.includes('Зоны мощности'));
  const progress=progressMarkup([ride],'all');assert(progress.includes('All time'));assert(!progress.includes('За всё время'));
  const history=ftpSettingsMarkup({ftp:300,ftpMode:'history',ftpHistory:[{from:'2025-01-01',ftp:200},{from:'2026-01-01',ftp:300}]});assert(history.includes('2025'));assert(history.includes('2026'));assert.equal(trainingCopy('goalSaved'),'Goal saved.');
 }finally{await setLanguage('ru')}
});
