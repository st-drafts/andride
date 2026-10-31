import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {languages} from '../src/language-catalog.js';
import {landingCopies,resolveLandingLanguage,showLanding} from '../src/landing-copy.js';
import {landingMarkup} from '../src/landing.js';
import {runInNewContext} from 'node:vm';

test('every supported language has complete landing copy, icons and installation actions',()=>{
 assert.deepEqual(Object.keys(landingCopies).sort(),languages.map(([code])=>code).sort());
 const keys=Object.keys(landingCopies.en).sort();
 for(const [code] of languages){
  const copy=landingCopies[code];assert.deepEqual(Object.keys(copy).sort(),keys,code);
  for(const [key,value] of Object.entries(copy))assert.equal(typeof value==='string'&&value.trim().length>0,true,`${code}: ${key}`);
  assert.deepEqual(copy.hero.match(/\{\w+\}/g),['{power}'],code);
  assert.deepEqual(copy.heading.match(/\{\w+\}/g),['{power}','{up}','{heart}'],code);
  assert.deepEqual(copy.install.match(/\{\w+\}/g),['{right}'],code);
  const html=landingMarkup(code);assert(!/\{(?:power|up|heart|right)\}/.test(html),code);
  assert.equal((html.match(/data-landing-install(?:\s|>)/g)||[]).length,2,code);
  assert.equal((html.match(/<article /g)||[]).length,3,code);
  assert(html.includes('href="#about"'));assert(html.includes('id="about"'));assert(html.includes('tabindex="0"'));
  assert(!html.includes('figma.com/api/'));assert(html.includes(`value="${code}" selected`));
 }
 assert.equal(landingCopies.ru.about,'О and ride');
});
test('initial language follows a supported system locale and falls back to English',()=>{
 assert.equal(resolveLandingLanguage(),'en');
 assert.equal(resolveLandingLanguage({systemLanguage:'unknown'}),'en');
 assert.equal(resolveLandingLanguage({systemLanguage:'de-AT'}),'de');
 assert.equal(resolveLandingLanguage({systemLanguages:['ar-AE','fr-CH','en-GB']}),'fr');
 assert.equal(resolveLandingLanguage({systemLanguages:['ja-JP'],saved:'uk'}),'uk');
 assert.equal(resolveLandingLanguage({systemLanguage:'ru-RU',saved:'de',requested:'ko-KR'}),'ko');
});
test('Pages browser entry shows the landing while the installed app retains its entry',()=>{
 assert.equal(showLanding({hostname:'example.github.io'}),true);
 assert.equal(showLanding({hostname:'example.github.io',search:'?view=app'}),true);
 assert.equal(showLanding({hostname:'example.github.io',installed:true}),false);
 assert.equal(showLanding({hostname:'127.0.0.1'}),true);
 assert.equal(showLanding({hostname:'localhost',search:'?view=app'}),false);
});
test('all design assets are local and nonempty and bootstrap uses the shared Pages root',async()=>{
 const html=landingMarkup('en');
 const assets=[...new Set([...html.matchAll(/src="\.\/assets\/landing\/([^"]+)"/g)].map(match=>match[1]))];
 assert.equal(assets.length,12);
 for(const name of assets)assert((await stat(new URL('../public/assets/landing/'+name,import.meta.url))).size>0,name);
 const entry=await readFile(new URL('../index.html',import.meta.url),'utf8');assert(entry.includes('src="./src/entry.js"'));
 const manifest=JSON.parse(await readFile(new URL('../public/manifest.webmanifest',import.meta.url),'utf8'));assert.equal(manifest.start_url,'./');assert.equal(manifest.scope,'./');assert.equal(manifest.display,'standalone');
});
test('browser boot removes the loader before modules, while installed app boot retains it',async()=>{
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8'),script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
 for(const installed of [false,true]){
  const classes=new Set(['is-launching']),elements=new Map();
  const element=id=>{if(!elements.has(id))elements.set(id,{id,removed:false,hidden:false,inert:true,innerHTML:'Loading',content:'',style:{},classList:{add(){},remove(){}},remove(){this.removed=true},removeAttribute(key){if(key==='inert')this.inert=false},setAttribute(){}});return elements.get(id)};
  const window={addEventListener(){}},document={body:{style:{},classList:{remove(key){classes.delete(key)}}},documentElement:{style:{},classList:{add(){}}},getElementById:element,querySelector:element};
  runInNewContext(script,{document,window,navigator:{language:'en-GB',standalone:false},location:{hostname:'example.github.io',search:''},matchMedia:query=>({matches:query==='(display-mode: standalone)'&&installed}),URLSearchParams,localStorage:{getItem(){return null}},performance:{now(){return 0}},setTimeout(){return 1},clearTimeout(){}});
  assert.equal(element('launch-screen').removed,!installed);assert.equal(classes.has('is-launching'),installed);assert.equal(typeof window.andRideLaunch?.finish,installed?'function':'undefined');
  if(!installed){assert.equal(element('app').inert,false);assert.equal(element('app').innerHTML,'')}
 }
});
