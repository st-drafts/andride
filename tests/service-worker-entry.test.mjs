import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const scope='https://example.github.io/andride/';
const address=value=>new URL(typeof value==='string'?value:value.url||value.href,scope).href;
async function environment({failPrecache=false}={}){
 const stores=new Map(),handlers=new Map();let skipWaiting=0,network=async()=>new Response('network landing',{headers:{'Content-Type':'text/html'}});
 const bucket=name=>{if(!stores.has(name))stores.set(name,new Map());const entries=stores.get(name);return {async addAll(requests){if(failPrecache)throw Error('download failed');for(const request of requests)entries.set(address(request),new Response(address(request).endsWith('app.js')?'new module':'new landing'))},async match(request){return entries.get(address(request))?.clone()},async put(request,response){entries.set(address(request),response.clone())}}};
 const old=bucket('andride-old');await old.put(scope,new Response('old installation'));await old.put(scope+'index.html',new Response('old installation'));await old.put(scope+'src/app.js',new Response('running old app'));
 await bucket('andride-map-tiles').put(scope+'tile',new Response('map'));await bucket('another-app').put(scope,new Response('another app'));
 const caches={open:async name=>bucket(name),keys:async()=>[...stores.keys()],delete:async name=>stores.delete(name),match:async request=>{for(const name of stores.keys()){const hit=await bucket(name).match(request);if(hit)return hit}}};
 let source=await readFile(new URL('../scripts/sw-template.js',import.meta.url),'utf8');source=source.replace('__VERSION__','new').replace('__RELEASE__','{}').replace('__FILES__',JSON.stringify(['./','./index.html','./src/app.js']));
 runInNewContext(source,{URL,Request,Response,caches,fetch:request=>network(request),self:{registration:{scope},location:{origin:new URL(scope).origin},clients:{claim:async()=>{}},skipWaiting(){skipWaiting++},addEventListener:(name,handler)=>handlers.set(name,handler)}});
 return {stores,bucket,handlers,setNetwork:fn=>network=fn,skipWaiting:()=>skipWaiting};
}
async function install(env){let task;env.handlers.get('install')({waitUntil(value){task=value}});await task}
async function navigate(env){let response;env.handlers.get('fetch')({request:{url:scope,method:'GET',mode:'navigate'},respondWith(value){response=value}});return await response}

test('successful precache repairs legacy entry documents without activating or changing app modules and map data',async()=>{
 const env=await environment();await install(env);
 for(const path of ['', 'index.html'])assert.equal(await(await env.bucket('andride-old').match(scope+path)).text(),'new landing');
 assert.equal(await(await env.bucket('andride-old').match(scope+'src/app.js')).text(),'running old app');
 assert.equal(await(await env.bucket('andride-map-tiles').match(scope+'tile')).text(),'map');
 assert.equal(await(await env.bucket('another-app').match(scope)).text(),'another app');assert.equal(env.skipWaiting(),0);
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
