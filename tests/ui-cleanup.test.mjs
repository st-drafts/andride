import test from 'node:test';
import assert from 'node:assert/strict';
import {progressMarkup} from '../src/progress-ui.js';
import {energyMarkup,hrMarkup} from '../src/analytics-ui.js';
import {workoutInspectorMarkup} from '../src/workout-inspector.js';
import {t} from '../src/i18n.js';

const now=+new Date(2026,10,4,12),start=now-3600000;
const points=(extra={})=>Array.from({length:61},(_,i)=>({t:start+i*1000,v:8,h:100,d:i*8,...extra}));
const ride=(extra={})=>({id:'ride',start,end:start+60000,duration:60,distance:480,points:points(),...extra});
const metricCount=html=>(html.match(/class="metric"/g)||[]).length;

test('a sensor chart is omitted without valid timed sensors but recorded zero cadence remains inspectable',()=>{
 const empty={p:null,hr:null,c:null,v:null};
 assert.equal(workoutInspectorMarkup(ride({points:points(empty)})),'');
 assert.equal(workoutInspectorMarkup(ride({points:[{t:null,p:100}]})),'');
 assert.equal(workoutInspectorMarkup(ride({points:points({...empty,hr:0})})), '');
 assert(workoutInspectorMarkup(ride({points:points({...empty,c:0})})).includes('data-workout-chart'));
});

test('an empty progress period shows an explanation instead of an empty monthly table',()=>{
 const old=ride({id:'old',start:now-100*86400000});
 const empty=progressMarkup([old],'30',now);
 assert(!empty.includes('<table>'));assert(empty.includes(t('В этом периоде пока пусто')));assert(empty.includes('data-progress-records'));
 const populated=progressMarkup([old,ride({distance:0})],'30',now);
 assert(populated.includes('<table>'));assert(populated.includes('<td>0</td>'));assert(!populated.includes(t('В этом периоде пока пусто')));
});

test('missing heart-rate analysis is folded while its actionable setup link stays accessible',()=>{
 const missing=hrMarkup(ride(),{});
 assert(missing.includes('<details class="fold"><summary>Пульсовые зоны</summary>'));assert(!missing.includes('<h2>'));assert(!missing.includes(' open'));assert(missing.includes('В FIT нет пригодной записи пульса'));
 const unconfigured=hrMarkup(ride({points:points({hr:130})}),{});
 assert(unconfigured.includes('Пульс записан, но границ зон нет.'));assert(unconfigured.indexOf('href="#athlete"')>unconfigured.indexOf('</details>'));
 const populated=hrMarkup(ride({points:points({hr:130})}),{maxHr:200});
 assert(populated.includes('<h2>Пульсовые зоны</h2>'));assert(populated.includes('class="zone-list"'));assert(populated.includes('100%'));
});

test('unavailable energy uses folded context instead of empty metric cards and keeps setup accessible',()=>{
 const absent=energyMarkup(ride({points:[]}),{});
 assert.equal(metricCount(absent),0);assert(!absent.includes('<h2>'));assert(absent.includes('<details class="fold">'));assert(absent.includes('В FIT недостаточно записей по времени'));assert(!absent.includes(' open'));
 const unconfigured=energyMarkup(ride(),{});
 assert.equal(metricCount(unconfigured),0);assert(unconfigured.includes('укажи вес велосипедиста'));assert(unconfigured.indexOf('href="#athlete"')>unconfigured.indexOf('</details>'));
});

test('energy metrics retain recorded zeroes and omit only missing values',()=>{
 const caloriesOnly=energyMarkup(ride({points:[],calories:0}),{});
 assert.equal(metricCount(caloriesOnly),1);assert(caloriesOnly.includes('Калории · ккал'));assert(caloriesOnly.includes('<strong>0</strong>'));assert(!caloriesOnly.includes('<strong>—</strong>'));
 const zeroPower=energyMarkup(ride({points:points({p:0})}),{});
 assert.equal(metricCount(zeroPower),2);assert(zeroPower.includes('<strong>0</strong>'));assert(zeroPower.includes('<strong>≈ 0</strong>'));
 const powerOnly=energyMarkup(ride({end:start+3600000,duration:3600,points:points({p:180})}),{});
 assert.equal(metricCount(powerOnly),1);assert(powerOnly.includes('<h2>Мощность</h2>'));assert(powerOnly.includes('<strong>180</strong>'));assert(!powerOnly.includes('Калории · ккал'));assert(!powerOnly.includes('<strong>—</strong>'));
});
