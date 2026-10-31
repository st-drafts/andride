import test from 'node:test';import assert from 'node:assert/strict';
import {MAP_CACHE,mapSource,mapTile,saveMapResource,readMapResource,clearMapCaches} from '../src/basemap-cache.js';
import {resetAppData} from '../src/app-reset.js';
const original=globalThis.caches;
const memory=new Map();
const key=url=>typeof url==='string'?url:url.url;
const fake={keys:async()=>[...memory.keys()],delete:async name=>memory.delete(name),open:async name=>{if(!memory.has(name))memory.set(name,new Map());const rows=memory.get(name);return {match:async url=>rows.get(key(url))?.clone(),put:async(url,response)=>rows.set(key(url),response.clone()),delete:async url=>rows.delete(key(url)),keys:async()=>[...rows.keys()].map(url=>new Request(url))}}};
const source='https://tiles.openfreemap.org/planet',url='https://tiles.openfreemap.org/planet/test_123/14/8186/5448.pbf',cached=url.replace('test_123','viewport');
const enter=async()=>{globalThis.caches=fake;await clearMapCaches()};
const leave=()=>{if(original===undefined)delete globalThis.caches;else globalThis.caches=original};
test('viewed tiles and source metadata remain available without network, across weekly versions',async()=>{
 await enter();try{let calls=0;const get=async u=>{calls++;return u===source?Response.json({tiles:[url.replace('14/8186/5448','{z}/{x}/{y}')],maxzoom:14}):new Response(new Uint8Array([1,2,3]))};
 const s=await mapSource(undefined,get);assert.equal(s.maxZoom,14);assert.deepEqual([...new Uint8Array(await mapTile(url,undefined,get))],[1,2,3]);assert.equal(calls,2);
 const offline=()=>{throw Error('offline')};assert.equal((await mapSource(undefined,offline)).url,s.url);assert.deepEqual([...new Uint8Array(await mapTile(url.replace('test_123','test_456'),undefined,offline))],[1,2,3]);
 const c=await fake.open(MAP_CACHE);await c.put(cached,new Response(new Uint8Array([1,2,3]),{headers:{'X-Andride-Saved':'0'}}));assert.deepEqual([...new Uint8Array(await mapTile(url,undefined,offline))],[1,2,3]);
 }finally{leave()}
});
test('source cannot redirect to an arbitrary host or use an unbounded zoom level',async()=>{
 await enter();try{await assert.rejects(mapSource(undefined,async()=>Response.json({tiles:['https://evil.invalid/{z}/{x}/{y}.pbf']})));const s=await mapSource(undefined,async()=>Response.json({tiles:[url.replace('14/8186/5448','{z}/{x}/{y}')],maxzoom:24}));assert.equal(s.maxZoom,14)}finally{leave()}
});
test('invalid cached tiles are evicted and a valid response replaces them',async()=>{
 await enter();try{await saveMapResource(cached,new Uint8Array([9]),'application/x-protobuf');let calls=0;const result=await mapTile(url,undefined,async()=>{calls++;return new Response(new Uint8Array([1]))},bytes=>{if(new Uint8Array(bytes)[0]!==1)throw Error('invalid')});assert.equal(calls,1);assert.equal(new Uint8Array(result)[0],1)}finally{leave()}
});
test('cache respects byte and entry limits and does not retain failed or aborted requests',async()=>{
 await enter();try{for(let i=0;i<12;i++)await saveMapResource(url+'/'+i,new Uint8Array(2*1024*1024),'application/x-protobuf');let c=await fake.open(MAP_CACHE);assert((await c.keys()).length<=10);
 await clearMapCaches();for(let i=0;i<170;i++)await saveMapResource(url+'/'+i,new Uint8Array(1),'application/x-protobuf');c=await fake.open(MAP_CACHE);assert.equal((await c.keys()).length,160);
 const controller=new AbortController();controller.abort();await saveMapResource(url+'/aborted',new Uint8Array([1]),'application/x-protobuf',controller.signal);assert(!await readMapResource(url+'/aborted'));await assert.rejects(mapTile(url,undefined,async()=>new Response('fail',{status:503})));assert(!await readMapResource(cached));
 }finally{leave()}
});
test('app reset removes route map caches and preserves the application shell cache',async()=>{
 await enter();try{await saveMapResource(cached,new Uint8Array([1]),'application/x-protobuf');await fake.open('andride-shell-test');let cleared=false;const storage={length:0,setItem(){}};await resetAppData('RESET',{clearDatabase:async()=>{cleared=true;return 'done'},storage,session:storage});assert(cleared);assert(!memory.has(MAP_CACHE));assert(memory.has('andride-shell-test'))}finally{leave()}
});
