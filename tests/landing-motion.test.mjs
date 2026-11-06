import test from 'node:test';
import assert from 'node:assert/strict';
import {mountLandingMotion,scheduleLandingCache} from '../src/landing.js';

function globals(values){
 const previous=new Map(Object.keys(values).map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
 for(const [key,value] of Object.entries(values))Object.defineProperty(globalThis,key,{value,writable:true,configurable:true});
 return()=>{for(const [key,descriptor] of previous)if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key]};
}
function motionFixture(width=1440){
 let reads=0,queries=0,nextFrame=0,bottom=3200;
 const events=new Map(),frames=new Map(),resizes=[],mediaEvents=new Map();
 const style=()=>{const values=new Map();return {setProperty:(key,value)=>values.set(key,value),getPropertyValue:key=>values.get(key)||'',removeProperty:key=>values.delete(key)}};
 const node=()=>({style:style()});
 const phone=node(),cockpit=node(),signature=node(),scene={getBoundingClientRect(){reads++;return {top:844-window.scrollY}}};
 Object.defineProperty(signature,'offsetHeight',{get(){reads++;return 350}});
 const classes=new Set(),root={style:style(),classList:{add:word=>classes.add(word),remove:word=>classes.delete(word)},querySelector(selector){queries++;return {'.landing-about':scene,'.landing-phone-drift':phone,'.landing-cockpit-drift':cockpit,'.landing-signature':signature}[selector]},querySelectorAll:()=>[],getBoundingClientRect(){reads++;return {bottom:bottom-window.scrollY}}};
 const media={matches:false,addEventListener:(key,fn)=>mediaEvents.set(key,fn),removeEventListener:key=>mediaEvents.delete(key)};
 const window={scrollY:0,IntersectionObserver:true,addEventListener:(key,fn)=>events.set(key,fn),removeEventListener:key=>events.delete(key)};
 const restore=globals({window,innerWidth:width,innerHeight:844,matchMedia:()=>media,requestAnimationFrame:fn=>{const id=++nextFrame;frames.set(id,fn);return id},cancelAnimationFrame:id=>frames.delete(id),IntersectionObserver:class{observe(){}unobserve(){}disconnect(){}},ResizeObserver:class{constructor(fn){resizes.push(fn)}observe(){}disconnect(){}}});
 const flush=()=>{const callbacks=[...frames.values()];frames.clear();callbacks.forEach(fn=>fn())};
 return {root,phone,cockpit,signature,media,classes,events,mediaEvents,frames,resizes,window,flush,restore,get reads(){return reads},get queries(){return queries},setBottom:value=>bottom=value};
}

test('scroll motion keeps its geometry without DOM reads or root-wide style changes on each frame',()=>{
 const f=motionFixture();let stop;
 try{
  stop=mountLandingMotion(f.root);const reads=f.reads,queries=f.queries;
  assert.equal(f.phone.style.getPropertyValue('--phone-drift'),'');assert.equal(f.cockpit.style.getPropertyValue('--cockpit-drift'),'10px');
  for(let top=100;top<=1000;top+=100){f.window.scrollY=top;f.events.get('scroll')();f.events.get('scroll')();assert.equal(f.frames.size,1);f.flush()}
  assert.equal(f.reads,reads);assert.equal(f.queries,queries);assert.equal(f.phone.style.getPropertyValue('--phone-drift'),'scale(1.02)');
  assert.equal(f.cockpit.style.getPropertyValue('--cockpit-drift'),`${(844-1000)/844*10}px`);
  assert.equal(f.root.style.getPropertyValue('--phone-drift'),'');assert.equal(f.root.style.getPropertyValue('--cockpit-drift'),'');assert.equal(f.frames.size,0);
  f.window.scrollY=0;f.events.get('scroll')();f.flush();assert.equal(f.phone.style.getPropertyValue('--phone-drift'),'');
 }finally{stop?.();f.restore()}
});

test('mobile signature follows the same scroll positions and remeasures after layout changes',()=>{
 const f=motionFixture(390);let stop;
 try{
  stop=mountLandingMotion(f.root);assert.equal(f.signature.style.getPropertyValue('--signature-rise'),'430px');
  const reads=f.reads;f.window.scrollY=2256;f.events.get('scroll')();f.flush();assert.equal(f.signature.style.getPropertyValue('--signature-rise'),'160px');assert.equal(f.reads,reads);
  f.window.scrollY=2356;f.events.get('scroll')();f.flush();assert.equal(f.signature.style.getPropertyValue('--signature-rise'),'0px');
  f.setBottom(4000);f.resizes[0]();f.flush();assert(f.reads>reads);assert.equal(f.signature.style.getPropertyValue('--signature-rise'),'430px');
  globalThis.innerWidth=1440;f.events.get('resize')();f.flush();assert.equal(f.signature.style.getPropertyValue('--signature-rise'),'');assert.equal(f.phone.style.getPropertyValue('--phone-drift'),'scale(1.024)');
  f.media.matches=true;f.mediaEvents.get('change')();assert.equal(f.events.size,0);assert.equal(f.frames.size,0);assert(!f.classes.has('landing-motion'));assert.equal(f.phone.style.getPropertyValue('--phone-drift'),'');
 }finally{stop?.();assert.equal(f.mediaEvents.size,0);f.restore()}
});

test('offline preparation waits for page load, hero decoding and an idle callback',async()=>{
 const events=new Map(),registered=[],idle=[];let finishImage;
 const image=new Promise(resolve=>finishImage=resolve);
 const restore=globals({navigator:{serviceWorker:{register(...args){registered.push(args);return Promise.resolve()}}},location:{hostname:'example.github.io'},document:{readyState:'loading',querySelectorAll:()=>[{decode:()=>image}]},window:{addEventListener:(key,fn)=>events.set(key,fn),requestIdleCallback:(fn,options)=>idle.push({fn,options})}});
 try{
  scheduleLandingCache();assert.equal(registered.length,0);assert.equal(idle.length,0);
  const loading=events.get('load')();await Promise.resolve();assert.equal(idle.length,0);
  finishImage();await loading;assert.equal(idle.length,1);assert.deepEqual(idle[0].options,{timeout:3000});assert.equal(registered.length,0);
  await idle[0].fn();assert.deepEqual(registered,[['./sw.js',{scope:'./',updateViaCache:'none'}]]);
 }finally{restore()}
});

test('offline preparation has a Safari fallback and tolerates image and worker failures',async()=>{
 const timers=[],registered=[];
 const restore=globals({navigator:{serviceWorker:{register(){registered.push(true);return Promise.reject(Error('Offline'))}}},location:{hostname:'example.github.io'},document:{readyState:'complete',querySelectorAll:()=>[{decode:()=>Promise.reject(Error('Missing image'))}]},window:{},setTimeout:(fn,delay)=>timers.push({fn,delay})});
 try{
  scheduleLandingCache();await new Promise(resolve=>queueMicrotask(()=>queueMicrotask(()=>queueMicrotask(resolve))));assert.equal(timers.length,1);assert.equal(timers[0].delay,200);
  await timers[0].fn();assert.equal(registered.length,1);
  location.hostname='localhost';scheduleLandingCache();assert.equal(timers.length,1);
 }finally{restore()}
});
