import test from 'node:test';
import assert from 'node:assert/strict';
import {checkForUpdate,installedWorker,watchUpdates} from '../src/updates.js';
class Worker extends EventTarget{constructor(state='installing'){super();this.state=state}change(state){this.state=state;this.dispatchEvent(new Event('statechange'))}}
class Registration extends EventTarget{constructor(){super();this.active={state:'activated'};this.waiting=null;this.installing=null}async update(){}}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('update check waits for precache installation after update() has resolved',async()=>{const r=new Registration(),w=new Worker();r.update=async()=>{r.installing=w;r.dispatchEvent(new Event('updatefound'))};let resolved=false;const result=checkForUpdate(r).then(value=>{resolved=true;return value});await tick();assert.equal(resolved,false);r.waiting=w;r.installing=null;w.change('installed');assert.equal(await result,w)});
test('an already waiting update is returned without another network check',async()=>{const r=new Registration(),w=new Worker('installed');r.waiting=w;r.update=()=>{throw Error('Should not check again')};assert.equal(await checkForUpdate(r),w)});
test('no changed script returns no update',async()=>{assert.equal(await checkForUpdate(new Registration()),null)});
test('failed precache is an error rather than a latest-version result',async()=>{const r=new Registration(),w=new Worker();r.update=async()=>{r.installing=w;r.dispatchEvent(new Event('updatefound'))};const result=checkForUpdate(r);await tick();r.installing=null;w.change('redundant');await assert.rejects(result,/Обновление не загрузилось/)});
test('installation timeout is reported',async()=>{await assert.rejects(installedWorker(new Worker(),{timeout:5}),/слишком долго/)});
test('background update notifies the UI once when it becomes ready',()=>{const r=new Registration(),w=new Worker();let ready=0;const stop=watchUpdates(r,value=>{assert.equal(value,w);ready++});r.installing=w;r.dispatchEvent(new Event('updatefound'));r.dispatchEvent(new Event('updatefound'));assert.equal(ready,0);r.waiting=w;w.change('installed');assert.equal(ready,1);r.dispatchEvent(new Event('updatefound'));assert.equal(ready,1);stop()});
test('first install does not prompt an update of a fresh page',()=>{const r=new Registration(),w=new Worker();r.active=null;r.installing=w;let ready=0;const stop=watchUpdates(r,()=>ready++);w.change('installed');assert.equal(ready,0);stop()});
test('background install failure is exposed and does not become ready',()=>{const r=new Registration(),w=new Worker();r.installing=w;let ready=0,errors=0;const stop=watchUpdates(r,()=>ready++,()=>errors++);w.change('redundant');assert.equal(ready,0);assert.equal(errors,1);stop()});

test('release metadata comes from the worker, not the installed application',async()=>{const {getReleaseInfo}=await import('../src/updates.js');const info={version:'0.25.4',date:'2026-10-21',changes:['New release']};const worker={postMessage(message,ports){assert.equal(message.type,'RELEASE_INFO');ports[0].postMessage(info)}};assert.deepEqual(await getReleaseInfo(worker),info)});
test('older workers without release metadata remain usable',async()=>{const {getReleaseInfo}=await import('../src/updates.js');assert.equal(await getReleaseInfo({postMessage(){}},{timeout:5}),null)});
test('invalid release metadata is ignored',async()=>{const {getReleaseInfo}=await import('../src/updates.js');assert.equal(await getReleaseInfo({postMessage(message,ports){ports[0].postMessage({version:'bad',changes:[]})}}),null)});
