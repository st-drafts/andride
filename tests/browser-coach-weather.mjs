// Optional regression for weather advice on an unavailable day.
const playwright=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
import {emptyCoach,validateCoachSettings} from '../src/coach.js';
import {coachWeatherCopy} from '../src/coach-weather-copy.js';
import {dateKey,nextDay,localDate} from '../src/periods.js';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const engine=process.env.BROWSER_ENGINE||'chromium',root=path.resolve(process.env.BUILD_DIR||'dist'),out=path.resolve('artifacts/coach-weather');await mkdir(out,{recursive:true});
const now=+new Date('2026-11-02T08:00:00Z'),today='2026-11-02';
const settings=validateCoachSettings({level:'regular',focus:'endurance',days:[4],weeklyMinutes:300,sessionMinutes:90,comfortableMinutes:90,historyConfirmedOn:today},now);
const state={...emptyCoach(),settings,checkins:[{date:today,sleepHours:8,sleepQuality:4,fatigue:2,stress:2}]};
const rides=Array.from({length:16},(_,i)=>{const start=+localDate(nextDay(today,-(i+1)*2))+8*3600000;return {analyticsVersion:4,id:'weather-'+i,hash:'weather-'+i,start,end:start+3600000,duration:3600,durationSource:'timer',distance:18000,points:[]}});
const goal={id:'weather-goal',title:'November',kind:'distance',smart:true,target:1000,from:today,to:nextDay(today,29)};
const days=Object.fromEntries(Array.from({length:7},(_,i)=>[nextDay(today,i),{low:i<4?10:1,high:i<4?18:6,wind:8,gusts:15,rain:0,probability:10,code:1}]));
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');assert(url.pathname.startsWith('/andride/'));const file=path.resolve(root,url.pathname.slice(9)||'index.html');assert(file.startsWith(root+path.sep));res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-cache');res.end(await readFile(file))}catch{res.writeHead(404);res.end('Not found')}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}/andride/`;
const browser=await playwright[engine].launch({headless:true,...(engine==='chromium'?{channel:process.env.BROWSER_CHANNEL||'chrome'}:{})}),checks=[],errors=[];
const check=(ok,label)=>{assert(ok,label);checks.push(label);console.log('PASS',label)};
try{
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:844},locale:'ru-RU',timezoneId:'Asia/Dubai',colorScheme:'light',reducedMotion:'reduce',serviceWorkers:'block'});await context.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));await page.clock.setFixedTime(new Date(now));await page.goto(base+'?view=app&lang=ru#settings');await page.waitForFunction(()=>!document.querySelector('#app').inert);
  await page.evaluate(async({state,goal,rides,days,now})=>{const db=await import('/andride/src/db.js');for(const ride of rides)await db.put('rides',ride);for(const [id,value] of [['coach',state],['goals',[goal]],['overview-goal',goal.id]])await db.put('meta',{id,value});localStorage.setItem('andride-weather-city',JSON.stringify({name:'Test city',latitude:10,longitude:20}));localStorage.setItem('andride-weather-cache',JSON.stringify({schema:2,key:'10,20',at:now,days}))},{state,goal,rides,days,now});
  const before=await page.evaluate(async()=>JSON.stringify(await(await import('/andride/src/db.js')).readHistory()));await page.goto(base+'?view=app&lang=ru#intellect/2026-11-05');await page.reload();await page.waitForFunction(()=>!document.querySelector('#app').inert);
  check(await page.locator('[data-weather-notice=move]').isVisible(),`${width}: full weather advice is visible before opening day details`);const target=page.locator('#coach-2026-11-05'),source=page.locator('#coach-2026-11-06'),card=target.locator('.coach-weather-advice');await card.waitFor({state:'visible'});
  check(await target.locator('summary').innerText().then(text=>text.includes('Отдых')&&text.includes('Совет по погоде')),`${width}: the unavailable rest day has a visible weather suggestion hint`);
  check(await card.getAttribute('data-weather-advice-from')==='2026-11-06'&&await card.getAttribute('data-weather-advice-to')==='2026-11-05',`${width}: advice points from cold Friday to warm Thursday`);
  check(await card.innerText().then(text=>text.includes('пятница')&&text.includes('четверг')&&text.includes('Если перенос тебе подходит')),`${width}: conditional advice names both days without changing the schedule`);
  check(/\d/.test(await source.locator('summary > span:last-child').innerText())&&(await target.locator('summary > span:last-child').innerText())==='—',`${width}: Friday retains its workout and Thursday stays unplanned`);
  await page.evaluate(()=>document.fonts.ready);await target.screenshot({path:path.join(out,`${engine}-${width}-advice.png`)});
  for(const code of ['en','uk','de','ja']){await page.evaluate(async code=>await(await import('/andride/src/i18n.js')).setLanguage(code),code);await page.waitForFunction(code=>document.documentElement.lang===code,code);assert((await card.innerText()).includes(coachWeatherCopy('title',[],code)),code);assert(!/[{}]|weather-comfort/.test(await card.innerText()),code);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),code)}
  check(true,`${width}: localized dates and advice fit in English, Ukrainian, German and Japanese`);
  check(await page.evaluate(async()=>JSON.stringify(await(await import('/andride/src/db.js')).readHistory()))===before,`${width}: advice and language switches do not change stored rides, selected days or coach state`);
  await page.evaluate(()=>{const cache=JSON.parse(localStorage.getItem('andride-weather-cache'));delete cache.days['2026-11-05'].gusts;localStorage.setItem('andride-weather-cache',JSON.stringify(cache));document.dispatchEvent(new Event('visibilitychange'))});await page.waitForFunction(()=>!document.querySelector('.coach-weather-advice'));
  check(await page.locator('.coach-weather-advice').count()===0,`${width}: a missing gust forecast removes the suggestion`);
  await page.evaluate(()=>{const cache=JSON.parse(localStorage.getItem('andride-weather-cache'));cache.days['2026-11-05'].gusts=15;cache.at-=7*3600000;localStorage.setItem('andride-weather-cache',JSON.stringify(cache));document.dispatchEvent(new Event('visibilitychange'))});await page.waitForFunction(()=>!document.querySelector('.coach-weather-advice'));
  check(await page.locator('.coach-weather-advice').count()===0,`${width}: stale weather does not suggest a move`);
  await context.close();
 }
 check(errors.length===0,'No uncaught browser errors');await writeFile(path.join(out,`checks-${engine}.json`),JSON.stringify({engine,checks,errors},null,2));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
