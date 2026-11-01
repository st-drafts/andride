import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const scope='https://example.github.io/andride/';
const siteFiles=['./src/entry.js','./src/landing.js','./src/landing.css','./src/landing-copy.js','./src/installation.js','./src/installation-copy.js','./assets/landing/phone.png','./assets/InterDisplay-SemiBold.ttf'];
const address=value=>new URL(typeof value==='string'?value:value.url||value.href,scope).href;
async function environment({failPrecache=false}={}){
 const stores=new Map(),handlers=new Map();let skipWaiting=0,network=async()=>new Response('network landing',{headers:{'Content-Type':'text/html'}});
 const bucket=name=>{if(!stores.has(name))stores.set(name,new Map());const entries=stores.get(name);return {async addAll(requests){if(failPrecache)throw Error('download failed');for(const request of requests)entries.set(address(request),new Response(address(request).endsWith('app.js')?'new module':'new landing'))},async match(request){return entries.get(address(request))?.clone()},async put(request,response){entries.set(address(request),response.clone())}}};
 const old=bucket('andride-old');await old.put(scope,new Response('old installation'));await old.put(scope+'index.html',new Response('old installation'));await old.put(scope+'src/app.js',new Response('running old app'));
 await bucket('andride-map-tiles').put(scope+'tile',new Response('map'));await bucket('another-app').put(scope,new Response('another app'));
 const caches={open:async name=>bucket(name),keys:async()=>[...stores.keys()],delete:async name=>stores.delete(name),match:async request=>{for(const name of stores.keys()){const hit=await bucket(name).match(request);if(hit)return hit}}};
 let source=await readFile(new URL('../scripts/sw-template.js',import.meta.url),'utf8');source=source.replace('__VERSION__','new').replace('__SITE_VERSION__','new').replace('__SITE_FILES__',JSON.stringify(siteFiles)).replace('__RELEASE__','{}').replace('__FILES__',JSON.stringify(['./','./index.html','./src/entry.js','./src/app.js','./src/landing.js','./src/landing.css','./src/landing-copy.js','./src/installation.js','./src/installation-copy.js','./assets/landing/phone.png','./assets/InterDisplay-SemiBold.ttf']));
 runInNewContext(source,{URL,Request,Response,Headers,caches,fetch:(request,options)=>network(request,options),self:{registration:{scope},location:{origin:new URL(scope).origin},clients:{claim:async()=>{}},skipWaiting(){skipWaiting++},addEventListener:(name,handler)=>handlers.set(name,handler)}});
 return {stores,bucket,handlers,setNetwork:fn=>network=fn,skipWaiting:()=>skipWaiting};
}
async function install(env){let task;env.handlers.get('install')({waitUntil(value){task=value}});await task}
async function navigate(env){let response;env.handlers.get('fetch')({request:{url:scope,method:'GET',mode:'navigate'},respondWith(value){response=value}});return await response}

test('successful precache repairs legacy entry documents without activating or changing app modules and map data',async()=>{
 const env=await environment();await install(env);
 for(const path of ['', 'index.html'])assert.equal(await(await env.bucket('andride-old').match(scope+path)).text(),'new landing');
 assert.equal(await(await env.bucket('andride-old').match(scope+'src/app.js')).text(),'running old app');
 assert.equal(await(await env.bucket('andride-old').match(scope+'src/entry.js')).text(),'new landing');
 assert.equal(await(await env.bucket('andride-map-tiles').match(scope+'tile')).text(),'map');
 assert.equal(await(await env.bucket('another-app').match(scope)).text(),'another app');assert.equal(env.skipWaiting(),0);
});
test('versioned landing assets use the active offline cache while bypassing legacy cached filenames',async()=>{
 const env=await environment();await install(env);await env.bucket('andride-old').put(scope+'src/landing.css',new Response('old style'));
 await env.bucket('andride-new').put(scope+'src/landing.css',new Response('current style'));env.setNetwork(async()=>{throw Error('offline')});
 let response;env.handlers.get('fetch')({request:{url:scope+'src/landing.css?landing-v=1.54',method:'GET',mode:'cors'},respondWith(value){response=value}});
 assert.equal(await(await response).text(),'current style');
});
test('failed precache leaves the usable legacy entry intact',async()=>{
 const env=await environment({failPrecache:true});await assert.rejects(install(env),/download failed/);assert.equal(await(await env.bucket('andride-old').match(scope)).text(),'old installation');
});
test('browser navigation prefers the live landing and falls back to its own complete offline version',async()=>{
 const env=await environment();await install(env);assert.equal(await(await navigate(env)).text(),'network landing');
 await env.bucket('andride-old').put(scope+'index.html',new Response('stale other cache'));
 env.setNetwork(async()=>{throw Error('offline')});assert.equal(await(await navigate(env)).text(),'new landing');
 env.setNetwork(async()=>new Response('temporarily unavailable',{status:503}));assert.equal(await(await navigate(env)).text(),'new landing');
});

test('installation page modules use the current offline cache for versioned requests',async()=>{
 const env=await environment();await install(env);env.setNetwork(async()=>{throw Error('offline')});
 for(const file of ['installation.js','installation-copy.js']){
  await env.bucket('andride-new').put(scope+'src/'+file,new Response('current installation module'));
  let response;env.handlers.get('fetch')({request:{url:scope+'src/'+file+'?landing-v=1.61',method:'GET',mode:'cors'},respondWith(value){response=value}});
  assert.equal(await(await response).text(),'current installation module');
 }
});

async function resource(env,path){
 let response;const tasks=[];
 env.handlers.get('fetch')({request:{url:scope+path,method:'GET',mode:'cors'},respondWith(value){response=value},waitUntil(task){tasks.push(task)}});
 const result=await response;await Promise.all(tasks);return result;
}
test('tagged public files revalidate over the network instead of returning a stale cache hit',async()=>{
 const env=await environment();await install(env);
 for(const file of siteFiles){
  const path=file.slice(2)+'?site-v=new';
  await env.bucket('andride-new').put(scope+path,new Response('stale public file'));
  env.setNetwork(async(request,options)=>{assert.equal(options.cache,'no-cache');return new Response('fresh public file')});
  const response=await resource(env,path);assert.equal(response.headers.get('Cache-Control'),'no-cache');assert.equal(await response.text(),'fresh public file');
  assert.equal(await(await env.bucket('andride-new').match(scope+path)).text(),'fresh public file');
 }
});
test('public resources fall back offline and failed responses cannot poison their cached copies',async()=>{
 const env=await environment();await install(env);
 const path='src/landing.css?site-v=new';await env.bucket('andride-new').put(scope+path,new Response('usable style'));
 env.setNetwork(async()=>new Response('unavailable',{status:503}));assert.equal(await(await resource(env,path)).text(),'usable style');
 env.setNetwork(async()=>{throw Error('offline')});assert.equal(await(await resource(env,path)).text(),'usable style');
 assert.equal(await(await env.bucket('andride-new').match(scope+path)).text(),'usable style');
});
test('precache aliases remain usable through a legacy cache-first worker while an app is open',async()=>{
 const env=await environment();await install(env);
 for(const file of siteFiles)assert(await env.bucket('andride-new').match(scope+file.slice(2)+'?site-v=new'),file);
 // This is the old worker's generic cache lookup, without its landing-v branch.
 assert(await env.bucket('andride-new').match(scope+'src/entry.js?site-v=new'));
 assert.equal(await(await env.bucket('andride-old').match(scope+'src/app.js')).text(),'running old app');
 assert.equal(env.skipWaiting(),0);
});
test('an unknown future site version does not grow the active cache or replace installed-app modules',async()=>{
 const env=await environment();await install(env);const before=env.stores.get('andride-new').size;
 env.setNetwork(async()=>new Response('future public file'));
 assert.equal(await(await resource(env,'src/landing.js?site-v=future')).text(),'future public file');
 assert.equal(env.stores.get('andride-new').size,before);
 assert.equal(await(await resource(env,'src/app.js')).text(),'running old app');
 assert.equal(env.skipWaiting(),0);
});
test('document navigation revalidates the browser HTTP cache',async()=>{
 const env=await environment();await install(env);
 env.setNetwork(async(request,options)=>{assert.equal(options.cache,'no-cache');return new Response('fresh document')});
 assert.equal(await(await navigate(env)).text(),'fresh document');
});
