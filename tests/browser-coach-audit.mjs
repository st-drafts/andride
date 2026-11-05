// Integration audit: all weekdays selected, forecast refresh and smart-goal deletion.
const playwright=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
import {Encoder,Profile} from '../vendor/fit/index.js';
import {emptyCoach,validateCoachSettings} from '../src/coach.js';
import {nextDay,localDate} from '../src/periods.js';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const engine=process.env.BROWSER_ENGINE||'chromium',root=path.resolve(process.env.BUILD_DIR||'dist'),out=path.resolve('artifacts/coach-audit');await mkdir(out,{recursive:true});
const now=+new Date('2026-11-02T08:00:00Z'),today='2026-11-02';
const settings=validateCoachSettings({level:'regular',focus:'endurance',days:[0,1,2,3,4,5,6],weeklyMinutes:300,sessionMinutes:90,comfortableMinutes:90,historyConfirmedOn:today},now);
const state={...emptyCoach(),settings,checkins:[{date:today,sleepHours:8,sleepQuality:4,fatigue:2,stress:2}]};
const rides=Array.from({length:16},(_,i)=>{const start=+localDate(nextDay(today,-(i+1)*2))+8*3600000;return {analyticsVersion:4,id:'audit-'+i,hash:'audit-'+i,start,end:start+3600000,duration:3600,durationSource:'timer',distance:18000,points:[]}});
const goal={id:'audit-goal',title:'November',kind:'distance',smart:true,target:1000,from:today,to:nextDay(today,29)},fallback={...goal,id:'fallback',title:'Next goal'};
// Both forecasts are complete. The update is cooler and windy (caution, not
// avoid), so refreshing must update temperatures and session minutes while
// retaining the weekly-cap and recovery constraints.
const forecast=windy=>Object.fromEntries(Array.from({length:7},(_,i)=>{const warm=!windy&&[0,1,4].includes(i);return [nextDay(today,i),{low:warm?10:1,high:warm?18:6,wind:windy?22:8,gusts:windy?28:15,rain:0,probability:10,code:windy?3:1}]}));
const initial=forecast(false),updated=forecast(true),response=days=>({daily:{time:Object.keys(days),...Object.fromEntries(Object.entries({temperature_2m_min:'low',temperature_2m_max:'high',precipitation_sum:'rain',precipitation_probability_max:'probability',wind_speed_10m_max:'wind',wind_gusts_10m_max:'gusts',weather_code:'code'}).map(([key,value])=>[key,Object.values(days).map(d=>d[value])]))}});
const encoder=new Encoder(),start=new Date('2025-01-01T08:00:00Z');encoder.onMesg(Profile.MesgNum.FILE_ID,{type:'activity',manufacturer:'development',product:1});encoder.onMesg(Profile.MesgNum.RECORD,{timestamp:start,distance:0,speed:0});encoder.onMesg(Profile.MesgNum.RECORD,{timestamp:new Date(+start+3600000),distance:18000,speed:5});encoder.onMesg(Profile.MesgNum.SESSION,{sport:'cycling',startTime:start,timestamp:new Date(+start+3600000),totalElapsedTime:3600,totalTimerTime:3600,totalDistance:18000});const fit=Buffer.from(encoder.close().buffer).toString('base64');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');assert(url.pathname.startsWith('/andride/'));const file=path.resolve(root,url.pathname.slice(9)||'index.html');assert(file.startsWith(root+path.sep));res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-cache');res.end(await readFile(file))}catch{res.writeHead(404);res.end('Not found')}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}/andride/`;
const browser=await playwright[engine].launch({headless:true,...(engine==='chromium'?{channel:process.env.BROWSER_CHANNEL||'chrome'}:{})}),checks=[],errors=[];
const check=(ok,label)=>{assert(ok,label);checks.push(label);console.log('PASS',label)};
const snapshot=page=>page.evaluate(async()=>{const data=await(await import('/andride/src/db.js')).readBackup();return {...data,files:data.files.map(file=>({...file,buffer:[...new Uint8Array(file.buffer)]}))}});
const meta=(data,id)=>data.meta.find(row=>row.id===id)?.value;
const schedule=page=>page.locator('.coach-week-day strong').allTextContents();
try{
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:844},locale:'ru-RU',timezoneId:'Asia/Dubai',colorScheme:'light',reducedMotion:'reduce',serviceWorkers:'block'});let requests=0,fail=false;
  await context.route('**/*',route=>{const url=new URL(route.request().url());if(url.hostname==='127.0.0.1')return route.continue();if(url.hostname==='api.open-meteo.com'){requests++;return route.fulfill({status:fail?503:200,contentType:'application/json',body:JSON.stringify(response(updated))})}return route.abort()});
  const page=await context.newPage();page.on('pageerror',error=>{errors.push(error.message);console.error(error)});await page.clock.setFixedTime(new Date(now));await page.goto(base+'?view=app&lang=ru#settings');await page.waitForFunction(()=>!document.querySelector('#app').inert);
  await page.evaluate(async({state,goal,fallback,rides,days,now,fit})=>{const db=await import('/andride/src/db.js'),bytes=Uint8Array.from(atob(fit),c=>c.charCodeAt(0)).buffer,parsed=await(await import('/andride/src/fit.js')).parseFit(bytes,'original.fit');await db.addImport(parsed,bytes,'original.fit');for(const ride of rides)await db.put('rides',ride);for(const [id,value] of [['coach',state],['goals',[goal,fallback]],['overview-goal',goal.id]])await db.put('meta',{id,value});localStorage.setItem('andride-weather-city',JSON.stringify({name:'Test city',latitude:10,longitude:20}));localStorage.setItem('andride-weather-cache',JSON.stringify({schema:2,key:'10,20',at:now,days}))},{state,goal,fallback,rides,days:initial,now,fit});
  const before=await snapshot(page);await page.goto(base+'?view=app&lang=ru#intellect');await page.reload();await page.locator('[data-weather-notice=blocked]').waitFor();
  check(await page.locator('[data-weather-notice=blocked]').isVisible()&&await page.locator('[data-weather-notice]').innerText().then(text=>text.includes('регулярность')),`${width}: a rhythm-breaking weather move is explained without opening day details`);const first=await schedule(page);check(first.filter(x=>x!=='—').length===4&&first.slice(4).some(x=>x!=='—')&&await page.locator('[data-weather-window]').count()===0,`${width}: all seven weekdays selected keeps four workouts including usable cooler days`);
  check((await page.locator('[data-plan-capacity]').innerText()).includes('180')&&(await page.locator('[data-plan-capacity]').innerText()).includes('200'),`${width}: recorded workload and rolling guideline are visible`);
  check((await page.locator('.coach-day-weather').allTextContents()).join(',')===Object.values(initial).map(day=>day.high+'°').join(',')&&await page.locator('[data-remove-goal]').count()===0&&await page.locator('[data-edit-goal="audit-goal"]').isVisible(),`${width}: daily temperatures match the forecast and goal deletion is absent from the card`);
  check(requests===0,`${width}: a fresh forecast does not trigger an automatic request`);
  await page.locator('#launch-screen').waitFor({state:'detached'});await page.evaluate(()=>document.fonts.ready);await page.locator('.coach-schedule').screenshot({path:path.join(out,`${engine}-${width}-regular-week.png`)});await page.locator('.coach-weather-status').screenshot({path:path.join(out,`${engine}-${width}-weather-controls.png`)});
  await page.locator('[data-weather-refresh]').click();await page.waitForFunction(()=>document.querySelector('.coach-day-weather')?.textContent==='6°');const second=await schedule(page);
  check(requests===1&&second.filter(x=>x!=='—').length===4&&JSON.stringify(second)!==JSON.stringify(first)&&await page.locator('[data-weather-notice=none]').isVisible(),`${width}: manual refresh bypasses the cache and recalculates four sessions for the complete windy forecast`);
  check(JSON.stringify(await snapshot(page))===JSON.stringify(before),`${width}: refreshing weather does not write to training history or coach settings`);
  fail=true;await page.locator('[data-weather-refresh]').click();await page.locator('[data-weather-update-status]').filter({hasText:'Не удалось'}).waitFor();check(requests===2&&JSON.stringify(await schedule(page))===JSON.stringify(second)&&!await page.locator('[data-weather-refresh]').isDisabled(),`${width}: failed refresh retains the forecast and permits retry`);
  await page.locator('a[href="#coach-settings"]').click();const settingsChat=page.locator('#coach-settings-form');
  await settingsChat.locator('[data-chat-edit=days]').click();
  assert.deepEqual(await settingsChat.locator('[data-chat-option]').allTextContents(),['Пн','Вт','Ср','Чт','Пт','Сб','Вс']);
  await settingsChat.locator('[data-chat-option="5"]').click();await settingsChat.locator('[type=submit]').click();
  await settingsChat.locator('[data-chat-edit=comfortableMinutes]').click();await settingsChat.locator('[data-chat-custom]').click();await settingsChat.locator('[name=comfortableMinutes]').fill('75');
  for(const code of ['en','uk','de','ja','ru']){
   await page.evaluate(async code=>await(await import('/andride/src/i18n.js')).setLanguage(code),code);await page.waitForFunction(code=>document.documentElement.lang===code,code);
   assert.equal(await settingsChat.locator('[name=comfortableMinutes]').inputValue(),'75');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
  check(true,`${width}: typed numbers and the active question survive language changes without overflow`);
  await settingsChat.locator('[name=comfortableMinutes]').press('Enter');await settingsChat.locator('[type=submit]').click();await settingsChat.waitFor({state:'detached'});
  await page.locator('a[href="#coach-checkin"]').click();const checkin=page.locator('#coach-checkin-form');
  await page.emulateMedia({colorScheme:width===390?'dark':'light'});
  const wellnessReview=checkin.locator('.goal-story.training-chat-review');
  assert.match(await wellnessReview.innerText(),/^Ты спал .*Качество сна/u);
  assert.equal(await wellnessReview.locator('button[data-chat-edit] .icon').count(),4);
  assert(await wellnessReview.evaluate(node=>node.scrollWidth<=node.clientWidth&&parseFloat(getComputedStyle(node).fontSize)>=23));
  await checkin.locator('[data-chat-edit=sleepHours]').click();
  const hours=checkin.locator('[data-sleep-wheel="0"]'),minutes=checkin.locator('[data-sleep-wheel="1"]');
  await hours.press('End');assert.equal(await minutes.getAttribute('aria-disabled'),'true');
  await hours.press('ArrowDown');
  await minutes.evaluate(wheel=>{wheel.scrollTop=37*wheel.firstElementChild.getBoundingClientRect().height});
  await minutes.and(checkin.locator('[aria-valuenow="37"]')).waitFor();
  await page.evaluate(()=>window.dispatchEvent(new Event('online')));
  assert.equal(await hours.getAttribute('aria-valuenow'),'13');assert.equal(await minutes.getAttribute('aria-valuenow'),'37');
  await page.screenshot({path:path.join(out,`${engine}-${width}-sleep-wheel.png`)});
  await checkin.locator('[type=submit]').click();
  for(const [key,keys,value] of [['sleepQuality',['End'],5],['fatigue',['End','ArrowLeft'],4],['stress',['Home'],1]]){
   await checkin.locator(`[data-chat-edit=${key}]`).click();
   const slider=checkin.locator(`input[name=${key}][type=range]`);
   for(const keypress of keys)await slider.press(keypress);
   assert.equal(await slider.inputValue(),String(value));
   assert.equal(await checkin.locator('output').textContent(),`${value} / 5`);
   if(key==='sleepQuality')await page.screenshot({path:path.join(out,`${engine}-${width}-sleep-quality.png`)});
   await checkin.locator('[type=submit]').click();
  }
  const reviewValues=await wellnessReview.locator('button[data-chat-edit] strong').allTextContents();
  assert.deepEqual(reviewValues.map(value=>value.replace(/\s+/g,' ')),['13 ч 37 мин','5 / 5','4 / 5','1 / 5']);
  await wellnessReview.screenshot({path:path.join(out,`${engine}-${width}-wellness-review.png`),style:'#toast{visibility:hidden}'});
  check(true,`${width}: the wellness story uses large text and four icons, and updates its values after editing`);
  await checkin.locator('[type=submit]').click();await checkin.waitFor({state:'detached'});
  await page.emulateMedia({colorScheme:'light'});
  const saved=await snapshot(page),wellness=meta(saved,'coach').checkins[0];
  check(meta(saved,'coach').settings.comfortableMinutes===75&&meta(saved,'coach').settings.days.length===6&&wellness.sleepHours===(13*60+37)/60&&wellness.sleepQuality===5&&wellness.fatigue===4&&wellness.stress===1,`${width}: sleep wheels and all three rating sliders save the chosen values`);
  await page.evaluate(()=>document.fonts.ready);await page.locator('.coach-goal').screenshot({path:path.join(out,`${engine}-${width}-goal.png`)});await page.locator('.coach-schedule').screenshot({path:path.join(out,`${engine}-${width}-schedule.png`)});
  await page.locator('[data-edit-goal="audit-goal"]').click();const goalChat=page.locator('#goal-editor-form');await goalChat.waitFor();
  check(await page.locator('.training-chat-header [data-remove-goal]').count()===1&&await goalChat.locator('[data-remove-goal]').count()===0,`${width}: delete is a separate action in the chat header`);
  const goalReview=goalChat.locator('.training-chat-review');
  check(await goalReview.evaluate(node=>{
   const left=node.getBoundingClientRect().left;
   const icons=[...node.querySelectorAll('.training-chat-review-lead .icon')];
   const paired=icons.every(icon=>{
    const word=document.createRange();
    word.selectNode(icon.nextSibling);
    const label=word.getBoundingClientRect(),symbol=icon.getBoundingClientRect();
    return label.left>=symbol.right&&label.top<symbol.bottom&&symbol.top<label.bottom;
   });
   return paired&&node.scrollWidth<=node.clientWidth&&icons.some(icon=>icon.getBoundingClientRect().left>left+8);
  }),`${width}: goal icons flow inside the paragraph without overflow`);
  await goalReview.screenshot({path:path.join(out,`${engine}-${width}-goal-review.png`)});
  const back=page.locator('.training-chat-header .back-link');
  const kind=goalChat.locator('[data-chat-edit=kind] strong');
  const originalKind=await kind.textContent();
  await kind.click();
  await goalChat.locator('[data-chat-option="3"]').click();
  await goalChat.and(page.locator('[data-chat-step=target]')).waitFor();
  await back.click();
  assert.equal(await kind.textContent(),originalKind);
  assert.equal(await goalChat.locator('.training-chat-reply :is(a,button)').count(),1);
  await back.click();
  await goalChat.waitFor({state:'detached'});
  check(await page.evaluate(()=>location.hash)==='#intellect',`${width}: the header arrow restores the review after an unfinished change and exits on the next press`);
  await page.locator('[data-edit-goal="audit-goal"]').click();
  await goalChat.locator('[data-chat-edit=title]').click();
  const title=goalChat.locator('input[name=title]');
  assert.equal(await title.inputValue(),goal.title);
  await title.fill('Длинные поездки');await title.press('Enter');
  assert.equal(await goalChat.locator('[data-chat-edit=title] strong').textContent(),'Длинные поездки');
  await page.locator('[data-chat-edit=target]').click();await page.locator('[data-chat-custom]').click();await page.locator('[name=target]').fill('234');await page.locator('[data-remove-goal="audit-goal"]').click();await page.locator('[data-cancel]').click();check(await page.locator('[name=target]').inputValue()==='234',`${width}: cancelling deletion retains the unsaved goal draft`);check(JSON.stringify(await snapshot(page))===JSON.stringify(saved),`${width}: cancelling smart-goal deletion changes nothing`);
  await page.locator('[data-remove-goal="audit-goal"]').click();await page.evaluate(()=>{const put=IDBObjectStore.prototype.put;window.qaFailGoal=true;IDBObjectStore.prototype.put=function(value,...args){if(window.qaFailGoal&&this.name==='meta'&&value.id==='overview-goal')throw new DOMException('QA goal rollback','QuotaExceededError');return put.call(this,value,...args)}});await page.locator('[data-confirm]').click();await page.locator('#toast').filter({hasText:'QA goal rollback'}).waitFor();
  check(JSON.stringify(await snapshot(page))===JSON.stringify(saved)&&await page.locator('#modal').evaluate(modal=>modal.open),`${width}: failure on the second goal write rolls back the complete deletion`);
  await page.evaluate(()=>window.qaFailGoal=false);await page.locator('[data-confirm]').evaluate(button=>{button.click();button.click()});await page.waitForFunction(()=>!document.querySelector('#modal').open);await page.locator('[data-edit-goal="fallback"]').waitFor();check(await page.locator('#goal-editor-form').count()===0,`${width}: successful deletion returns to Intellect`);const after=await snapshot(page);
  check(meta(after,'goals').length===1&&meta(after,'overview-goal')==='fallback'&&JSON.stringify(after.rides)===JSON.stringify(saved.rides)&&JSON.stringify(after.files)===JSON.stringify(saved.files)&&JSON.stringify(meta(after,'coach'))===JSON.stringify(meta(saved,'coach')),`${width}: deletion selects the remaining goal and preserves all rides, original FIT bytes and coach data`);
  await page.locator('[data-edit-goal="fallback"]').click();await page.locator('#goal-editor-form').waitFor();await page.locator('[data-remove-goal="fallback"]').click();await page.locator('[data-confirm]').click();await page.waitForFunction(()=>!document.querySelector('#modal').open);const empty=await snapshot(page);check(meta(empty,'goals').length===0&&meta(empty,'overview-goal')===null&&await page.locator('[data-action="add-goal"]').count()>0&&JSON.stringify(empty.rides)===JSON.stringify(saved.rides)&&JSON.stringify(empty.files)===JSON.stringify(saved.files),`${width}: deleting the final goal shows the create-goal state and keeps training data`);
  await context.close();
 }
 const shared=await browser.newContext({locale:'en-US',timezoneId:'Asia/Dubai',reducedMotion:'reduce',serviceWorkers:'block'});
 await shared.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
 const first=await shared.newPage(),second=await shared.newPage(),url=base+'?view=app&lang=en';
 for(const tab of [first,second]){tab.on('pageerror',error=>errors.push(error.message));await tab.clock.setFixedTime(new Date(now));}
 await first.goto(url+'#intellect');await first.waitForFunction(()=>!document.querySelector('#app').inert);
 await first.evaluate(async({state,goal,fallback})=>{
  const db=await import('/andride/src/db.js');
  for(const [id,value] of [['coach',state],['goals',[goal,fallback]],['overview-goal',goal.id]])await db.put('meta',{id,value});
 },{state,goal,fallback});
 await first.reload();await first.waitForFunction(()=>!document.querySelector('#app').inert);
 const openGoal=async(tab,id)=>{await tab.goto(url+'#goal-edit/'+id);await tab.locator('#goal-editor-form[data-chat-step=review]').waitFor();};
 const renameGoal=async(tab,value)=>{
  await tab.locator('[data-chat-edit=title]').click();const input=tab.locator('input[name=title]');
  await input.fill(value);await input.press('Enter');await tab.locator('#goal-editor-form[data-chat-step=review]').waitFor();
 };
 const saveGoal=async tab=>{await tab.locator('#goal-editor-form [type=submit]').click();await tab.locator('#goal-editor-form').waitFor({state:'detached'});};
 await Promise.all([openGoal(first,goal.id),openGoal(second,fallback.id)]);
 await renameGoal(first,'First tab');await renameGoal(second,'Second tab');
 const latestCoach={...state,settings:{...settings,comfortableMinutes:75},checkins:[{...state.checkins[0],sleepHours:7}]};
 await second.evaluate(async value=>await(await import('/andride/src/db.js')).put('meta',{id:'coach',value}),latestCoach);
 await saveGoal(first);await saveGoal(second);
 const savedTogether=await snapshot(first);
 check(meta(savedTogether,'goals').map(g=>g.title).join(',')==='First tab,Second tab'&&JSON.stringify(meta(savedTogether,'coach'))===JSON.stringify(latestCoach),'Separate goal edits from two tabs preserve both goals and the latest coach data');

 await Promise.all([openGoal(first,goal.id),openGoal(second,goal.id)]);
 await second.locator('[data-remove-goal]').click();
 await renameGoal(first,'Newer title');await saveGoal(first);
 await second.locator('[data-confirm]').click();
 await second.locator('#toast').filter({hasText:'This goal has changed'}).waitFor();
 assert(await second.locator('#modal').evaluate(modal=>modal.open));
 await second.locator('[data-cancel]').click();
 await renameGoal(second,'Stale title');await second.locator('#goal-editor-form [type=submit]').click();
 await second.locator('#goal-editor-form .error').filter({hasText:'This goal has changed'}).waitFor();
 check(meta(await snapshot(first),'goals').find(g=>g.id===goal.id).title==='Newer title','Stale goal edits and deletions keep the newer revision');

 await openGoal(first,goal.id);await first.locator('[data-remove-goal]').click();await first.locator('[data-confirm]').click();
 await first.locator('#goal-editor-form').waitFor({state:'detached'});
 await second.locator('#goal-editor-form [type=submit]').click();
 await second.locator('#goal-editor-form .error').filter({hasText:'Goal not found'}).waitFor();
 await second.locator('.training-chat-header .back-link').click();
 await second.locator('#intellect-goal').selectOption(goal.id);
 await second.locator('#toast').filter({hasText:'Goal not found'}).waitFor();
 const afterDelete=await snapshot(first);
 check(meta(afterDelete,'goals').length===1&&meta(afterDelete,'goals')[0].id===fallback.id&&meta(afterDelete,'overview-goal')===fallback.id&&await second.locator('#intellect-goal').inputValue()===fallback.id,'A stale tab cannot recreate or select a deleted goal');
 await shared.close();
 check(errors.length===0,'No uncaught browser errors');await writeFile(path.join(out,`checks-${engine}.json`),JSON.stringify({engine,checks,errors},null,2));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
