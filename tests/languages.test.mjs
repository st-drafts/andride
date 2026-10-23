import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {messages} from '../src/translations.js';
import {languages,languageCode} from '../src/language-catalog.js';
import {setLanguage,getLanguage,locale,t} from '../src/i18n.js';
const base=new Set(['ru','en','fr','de','es','ja']);
test('catalog includes every official EU language, regional languages, Chinese and Korean without duplicate IDs',()=>{
 assert.equal(languages.length,38);assert.equal(new Set(languages.map(x=>x[0])).size,38);
 for(const code of 'bg hr cs da nl en et fi fr de el hu ga it lv lt mt pl pt ro sk sl es sv ru az hy be ka kk ky tg tk uk uz zh ko ja'.split(' '))assert(languages.some(x=>x[0]===code),code);
 assert.equal(languageCode('zh-Hans-CN'),'zh');assert.equal(languageCode('pt-BR'),'pt');assert.equal(languageCode('ko-KR'),'ko');assert.equal(languageCode('unknown'),null);
 for(const [code,,region] of languages){assert(new Intl.DateTimeFormat(region).format(0));assert(new Intl.NumberFormat(region).format(1234.5));assert.equal(languageCode(region),code)}
});
test('every additional pack covers all messages, preserves confirmation token and has a localized install manifest',async()=>{
 const warning=Object.keys(messages).find(k=>k.startsWith('Все поездки и оригинальные FIT,'));
 const reference=JSON.parse(await readFile(new URL('../public/manifest.webmanifest',import.meta.url),'utf8'));
 for(const [code] of languages){if(base.has(code))continue;const pack=(await import(`../src/locales/${code}.js`)).default;
 assert.deepEqual(Object.keys(pack).sort(),Object.keys(messages).sort(),code);
 for(const [key,value] of Object.entries(pack)){assert.equal(typeof value,'string',code+':'+key);assert(value.trim(),code+':'+key);assert(!/91234567\d\d/.test(value),'unresolved placeholder '+code+':'+key)}
 assert(pack['Для подтверждения введи RESET.'].includes('RESET'),code);assert(pack[warning].includes('FIT'),code);assert(pack['Обзор'].length>0,code);
 const manifest=JSON.parse(await readFile(new URL(`../public/manifest.${code}.webmanifest`,import.meta.url),'utf8'));assert.equal(manifest.lang,code);assert.equal(manifest.start_url,'./?lang='+code);assert.equal(manifest.id,reference.id);assert.equal(manifest.scope,reference.scope);assert.deepEqual(manifest.icons,reference.icons);
 }
});
test('async language selection translates copy and keeps latest choice when loads overlap',async()=>{
 try{await setLanguage('zh');assert.equal(getLanguage(),'zh');assert.equal(t('Обзор'),'概览');assert.equal(locale(),'zh-CN');assert.equal(t('My ride 2026'),'My ride 2026');await setLanguage('ko');assert.equal(t('Обзор'),'개요');const earlier=setLanguage('ga');const latest=setLanguage('en');await Promise.all([earlier,latest]);assert.equal(getLanguage(),'en');assert.equal(t('Обзор'),'Overview');await setLanguage('not-a-language');assert.equal(getLanguage(),'en')}finally{await setLanguage('ru')}
});
