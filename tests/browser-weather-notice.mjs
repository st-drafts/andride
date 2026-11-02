// Synthetic forecasts: validate visible decisions, including the user's November 6 date.
const playwright=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
import {emptyCoach,validateCoachSettings} from '../src/coach.js';
import {nextDay,localDate} from '../src/periods.js';
import {createServer} from 'node:http';import {readFile,writeFile,mkdir} from 'node:fs/promises';import path from 'node:path';import assert from 'node:assert/strict';
const root=path.resolve(process.env.BUILD_DIR||'dist'),out=path.resolve('artifacts/weather-notice'),engine=process.env.BROWSER_ENGINE||'chromium';await mkdir(out,{recursive:true});
const now=+new Date('2026-11-03T08:00:00Z'),today='2026-11-03',goal={id:'g',title:'November',kind:'distance',smart:true,target:1000,from:today,to:'2026-11-30'};
const settings=extra=>validateCoachSettings({level:'regular',focus:'endurance',days:[0,1,2,3,4,5,6],weeklyMinutes:300,sessionMinutes:90,comfortableMinutes:90,historyConfirmedOn:today,...extra},now);
const state=s=>({...emptyCoach(),settings:s,checkins:[{date:today,sleepHours:8,sleepQuality:4,fatigue:2,stress:2}]});
const ride=(id,date,minutes)=>{const start=+localDate(date)+8*3600000;return {id,hash:id,analyticsVersion:4,start,end:start+minutes*60000,duration:minutes*60,durationSource:'timer',distance:minutes*300,points:[]}};
const history=Array.from({length:16},(_,i)=>ride('h'+i,nextDay(today,-(i+1)*2),60));
const forecast=(warm=3)=>Object.fromEntries(Array.from({length:7},(_,i)=>[nextDay(today,i),{low:i<warm?10:1,high:i<warm?18:6,wind:8,gusts:15,rain:0,probability:10,code:1}]));
const partial=forecast(7);for(const d of Object.values(partial))delete d.gusts;
const cases=[
 {status:'move',state:state(settings({days:[4]})),rides:[],days:forecast()},
 {status:'blocked',state:state(settings({level:'beginner',weeklyMinutes:90,sessionMinutes:30,comfortableMinutes:30,historyConfirmedOn:null})),rides:[ride('recent','2026-10-30',90)],days:forecast()},
 {status:'applied',state:state(settings()),rides:history,days:forecast(4)},
 {status:'none',state:state(settings()),rides:history,days:forecast(7)},
 {status:'stale',state:state(settings()),rides:history,days:forecast(),age:7*3600000},
 {status:'partial',state:state(settings()),rides:history,days:partial},
 {status:'missing',state:state(settings()),rides:history,days:null}
];
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');assert(url.pathname.startsWith('/andride/'));const file=path.resolve(root,url.pathname.slice(9)||'index.html');assert(file.startsWith(root+path.sep));res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(await readFile(file))}catch{res.writeHead(404);res.end()}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}/andride/`,browser=await playwright[engine].launch({headless:true,...(engine==='chromium'?{channel:process.env.BROWSER_CHANNEL||'chrome'}:{})}),checks=[],errors=[];
const check=(ok,label)=>{assert(ok,label);checks.push(label);console.log('PASS',label)};
try{
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:844},timezoneId:'Asia/Dubai',locale:'ru-RU',colorScheme:'dark',reducedMotion:'reduce',serviceWorkers:'block'});await context.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.clock.setFixedTime(new Date(now));await page.goto(base+'?view=app&lang=ru#settings');await page.waitForFunction(()=>!document.querySelector('#app').inert);
  for(const fixture of cases){
   await page.evaluate(async({fixture,goal,now})=>{const db=await import('/andride/src/db.js');await db.clearAll();for(const ride of fixture.rides)await db.put('rides',ride);for(const [id,value] of [['coach',fixture.state],['goals',[goal]],['overview-goal',goal.id]])await db.put('meta',{id,value});localStorage.setItem('andride-language','ru');localStorage.setItem('andride-weather-city',JSON.stringify({name:'Astrakhan · test fixture',latitude:10,longitude:20}));if(fixture.days)localStorage.setItem('andride-weather-cache',JSON.stringify({schema:2,key:'10,20',at:now-(fixture.age||0),days:fixture.days}));else localStorage.removeItem('andride-weather-cache')},{fixture,goal,now});
   const before=await page.evaluate(async()=>JSON.stringify(await(await import('/andride/src/db.js')).readHistory()));await page.goto(base+'?view=app&lang=ru#intellect');await page.reload();const notice=page.locator('[data-weather-notice]');await page.locator(`[data-weather-notice=${fixture.status}]`).waitFor();check(await notice.isVisible()&&await notice.locator('details').count()===0,`${width}: ${fixture.status} is visible on Intellect without opening details`);
   if(fixture.status==='move'){check(await notice.innerText().then(s=>s.includes('6 ноября')&&s.includes('5 ноября')&&s.includes('Если перенос')),`${width}: the full November 6 to November 5 suggestion is visible`);await notice.locator('[data-coach-day]').click();check(await page.locator('#coach-2026-11-05').evaluate(n=>n.open),`${width}: the suggestion opens the target day`)}
   if(fixture.status==='blocked')check(await notice.innerText().then(s=>s.includes('6 ноября')&&s.includes('5 ноября')&&s.includes('семь дней'))&&await page.locator('.coach-weather-advice').count()===0,`${width}: the workload constraint is explained without offering an invalid move`);
   await page.goto(base+'?view=app&lang=ru#overview');await page.locator('.overview-upcoming').waitFor();check(await notice.count()===0&&await page.locator('[data-plan-weather]').count()>0,`${width}: ${fixture.status} is absent from Overview while forecast refresh remains enabled`);await page.goto(base+'?view=app&lang=ru#intellect');await page.locator(`[data-weather-notice=${fixture.status}]`).waitFor();check(await notice.evaluate(n=>getComputedStyle(n).borderLeftWidth==='0px'),`${width}: ${fixture.status} has no accent stripe`);
   await page.locator('#launch-screen').waitFor({state:'detached'});await page.evaluate(()=>document.fonts.ready);await notice.screenshot({path:path.join(out,`${engine}-${width}-${fixture.status}.png`)});
   for(const code of ['en','uk','de','ja']){await page.evaluate(async code=>await(await import('/andride/src/i18n.js')).setLanguage(code),code);await page.waitForFunction(code=>document.documentElement.lang===code,code);assert(!/undefined|\{\d+\}/.test(await notice.innerText()));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))}
   check(await page.evaluate(async()=>JSON.stringify(await(await import('/andride/src/db.js')).readHistory()))===before,`${width}: ${fixture.status} and language switches preserve stored data`);
  }
  await context.close();
 }
 check(!errors.length,'No uncaught browser errors');await writeFile(path.join(out,`checks-${engine}.json`),JSON.stringify({engine,checks,errors},null,2));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
