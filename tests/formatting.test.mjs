import test from 'node:test';
import assert from 'node:assert/strict';
import {num,date,clockTime} from '../src/metrics.js';
import {setLanguage,locale} from '../src/i18n.js';

test('cached number formatters preserve native formatting across all languages and precision changes',()=>{
 try{for(const language of ['ru','en','fr','de','es','ja','ru']){setLanguage(language);for(const d of [0,1,4,1])for(const value of [-12345.6789,-0,0,0.123,1200000])assert.equal(num(value,d),value.toLocaleString(locale(),{maximumFractionDigits:d}));for(const value of [null,undefined,NaN,Infinity])assert.equal(num(value),'—')}}finally{setLanguage('ru')}
});

test('cached date and clock formatters preserve local calendar and time including invalid dates',()=>{
 try{for(const language of ['ru','en','fr','de','es','ja','ru']){setLanguage(language);for(const value of [0,'2026-10-23T23:59:00Z','2026-03-29T01:30:00Z',null,undefined,'invalid']){const d=new Date(value);assert.equal(date(value),d.toLocaleDateString(locale(),{day:'numeric',month:'long'}));assert.equal(clockTime(value),d.toLocaleTimeString(locale(),{hour:'2-digit',minute:'2-digit'}))}}}finally{setLanguage('ru')}
});
