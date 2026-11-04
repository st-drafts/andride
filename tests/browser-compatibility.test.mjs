import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {legacyBrowserCopies} from '../src/legacy-copy.js';
import {languages} from '../src/language-catalog.js';

const gate=await readFile(new URL('../src/browser-gate.js',import.meta.url),'utf8');
const legacy=(await readFile(new URL('../src/legacy-browser.js',import.meta.url),'utf8')).replace('__LEGACY_BROWSER_COPY__',()=>JSON.stringify(legacyBrowserCopies));
function boot({modules=true,grid=true,fetch=true,prefix='',lookbehind=true}={}){
 const appended=[],fallback={parentNode:{removeChild(node){node.removed=true}}},root={className:''},body={className:'is-launching',appendChild(node){appended.push(node)}},viewport={setAttribute(name,value){this[name]=value}};
 const document={documentElement:root,body,getElementById:id=>id==='browser-fallback'?fallback:{textContent:'MODERN BOOT'},querySelector:()=>viewport,createElement:type=>type==='dialog'?{showModal(){}}:modules?{noModule:false}:{}};
 const window={fetch:fetch?()=>{}:undefined,Promise,AbortController,Intl,CSS:{supports:(property,value)=>property!=='display'||value!=='grid'||grid}};
 const context={document,window};if(!lookbehind)context.RegExp=function(){throw new SyntaxError('Unsupported regular expression')};
 runInNewContext(prefix+gate,context);return {appended,fallback,root,body,viewport};
}
test('a capable browser starts the unchanged bootstrap and module entry without loading compatibility code',()=>{
 const state=boot();assert.equal(state.appended.length,2);assert.equal(state.appended[0].text,'MODERN BOOT');assert.equal(state.appended[1].type,'module');assert(state.appended[1].src.includes('/src/entry.js?site-v='));assert(!state.root.className.includes('legacy-browser'));assert(state.fallback.removed);assert.equal(state.body.className,'is-launching');
});
test('old or partially compatible engines see the simple page before any modern code can be parsed',()=>{
 for(const options of [{modules:false},{grid:false},{fetch:false},{lookbehind:false},{prefix:'Object.hasOwn=undefined;'},{prefix:'Array.prototype.at=undefined;'},{prefix:'String.prototype.replaceAll=undefined;'}]){
  const state=boot(options);assert(state.root.className.includes('legacy-browser'));assert.equal(state.appended.length,1);assert(state.appended[0].src.includes('/src/legacy-browser.js?site-v='));assert.equal(state.appended[0].type,undefined);assert.equal(state.body.className,'');assert.equal(state.viewport.content,'width=device-width,initial-scale=1');
 }
});
function compatibility({search='',saved=null,system='en-GB',storageThrows=false}={}){
 const fields=Object.keys(legacyBrowserCopies.en).filter(key=>key!=='name').map(key=>({key,textContent:'',getAttribute(){return key}})),options=[],writes=[];
 const picker={appendChild(node){options.push(node)},setAttribute(key,value){this[key]=value}},language={style:{display:'none'}},root={querySelector:selector=>selector==='select'?picker:selector==='h1'?{appendChild(){}}:language,querySelectorAll:()=>fields};
 const document={documentElement:{},getElementById:()=>root,createElement:()=>({})};
 runInNewContext(legacy,{document,navigator:{languages:[system]},location:{search},localStorage:{getItem(){if(storageThrows)throw Error('blocked');return saved},setItem(...args){writes.push(args)}}});
 return {document,picker,options,writes,root,language,fields};
}
test('compatibility copy follows language choices and remains usable without storage access',()=>{
 for(const [code] of languages){
  const page=compatibility({search:'?lang='+code,saved:'en',system:'en-GB'});assert.equal(page.document.documentElement.lang,code);assert.equal(page.options.length,38);assert.equal(page.fields.find(f=>f.key==='notice').textContent,legacyBrowserCopies[code].notice);assert(!page.fields.some(f=>/[{}]|undefined/.test(f.textContent)));assert.equal(page.writes.length,0);
 }
 assert.equal(compatibility({saved:'ru',system:'de-DE'}).root.lang,'ru');assert.equal(compatibility({storageThrows:true,system:'ja-JP'}).root.lang,'ja');assert.equal(compatibility({search:'?lang=%E0%A4%A',system:'xx'}).root.lang,'en');
 const page=compatibility();page.picker.value='ru';page.picker.onchange();assert.equal(page.root.lang,'ru');assert.deepEqual(page.writes,[['andride-language','ru']]);
});
