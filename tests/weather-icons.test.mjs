import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {weatherCondition,forecastIconMarkup,weatherIconMarkup} from '../src/weather-icons.js';
import {languages} from '../src/language-catalog.js';

test('forecast icons distinguish clear code zero from missing or unknown conditions',()=>{
 assert.equal(weatherCondition(0).kind,'sunny');
 for(const code of [null,undefined,NaN,Infinity,'0',false,-1,4,95.5]){
  assert.equal(weatherCondition(code),null);
  assert.equal(forecastIconMarkup({code}),'');
 }
 assert.equal(forecastIconMarkup({wind:0,rain:0}),'');
});
test('WMO precipitation and hazardous conditions keep their distinct symbols',()=>{
 for(const [kind,codes] of Object.entries({'sunny':[0,1],'partly-cloudy':[2],overcast:[3],fog:[45,48],drizzle:[51,53,55],sleet:[56,57,66,67],rain:[61,63,80,81],'heavy-rain':[65,82],snow:[71,73,75,77,85,86],thunderstorm:[95,96,97,99]}))
  for(const code of codes)assert.equal(weatherCondition(code).kind,kind,`WMO ${code}`);
});
test('all interface languages have accessible weather descriptions',()=>{
 for(const [language] of languages)for(const code of [0,2,3,45,51,56,61,65,71,95]){
  const condition=weatherCondition(code,language);assert(condition.label);
  assert(forecastIconMarkup({code}).includes('role="img"'));
  if(language!=='ru')assert(!/[А-Яа-яЁё]/.test(condition.label)||['be','bg','kk','ky','tg','uk'].includes(language));
 }
 assert(!weatherIconMarkup('unknown'));
 assert(weatherIconMarkup('wind','"<').includes('aria-label="&quot;&lt;"'));
});
test('every forecast asset is a local nonempty 32px vector exported from Figma',async()=>{
 for(const kind of ['sunny','partly-cloudy','cloudy','overcast','drizzle','rain','heavy-rain','thunderstorm','snow','sleet','fog','wind','clear-night','cloudy-night']){
  const svg=await readFile(new URL(`../public/assets/icon-weather-${kind}.svg`,import.meta.url),'utf8');
  assert(/<svg[^>]*width="32"[^>]*height="32"[^>]*viewBox="0 0 32 32"/.test(svg));
  assert(/<path\b/.test(svg));
  const html=weatherIconMarkup(kind);assert(html.includes(`icon-weather-${kind}.svg`));assert(!html.includes('figma.com'));
 }
});
