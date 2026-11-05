// Full training workflow, isolated storage and synthetic original FIT bytes.
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {Encoder,Profile} from '../vendor/fit/index.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve('dist'),out=path.resolve('artifacts/release-1.75/browser-training');await mkdir(out,{recursive:true});
const now=Date.parse('2026-11-03T08:00:00Z'),encoder=new Encoder();encoder.onMesg(Profile.MesgNum.FILE_ID,{type:'activity',manufacturer:'development',product:1});
encoder.onMesg(Profile.MesgNum.ZONES_TARGET,{functionalThresholdPower:250});
for(const [age,power] of [[100,170],[45,150],[1,350]]){
 const start=now-age*86400000-3*3600000,seconds=age===1?3600:10;
 for(let i=0;i<=seconds;i++)encoder.onMesg(Profile.MesgNum.RECORD,{timestamp:new Date(start+i*1000),distance:i*8,speed:8,power:age===1?(i%600<300?350:100):power,cadence:age===1?(i%600<300?95:0):85});
 if(age===1)for(let lap=0;lap<12;lap++)encoder.onMesg(Profile.MesgNum.LAP,{startTime:new Date(start+lap*300000),timestamp:new Date(start+(lap+1)*300000),totalTimerTime:300,totalDistance:2400,avgPower:lap%2?100:350});
 encoder.onMesg(Profile.MesgNum.SESSION,{sport:'cycling',startTime:new Date(start),timestamp:new Date(start+seconds*1000),totalTimerTime:seconds,totalElapsedTime:seconds,totalDistance:seconds*8,avgPower:age===1?225:power,normalizedPower:age===1?290:power,thresholdPower:250});
}
const original=Buffer.from(encoder.close().buffer),types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');assert(url.pathname.startsWith('/andride/'));const file=path.resolve(root,url.pathname.slice(9)||'index.html');assert(file.startsWith(root+path.sep));res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-cache');res.end(await readFile(file))}catch{res.writeHead(404);res.end('Not found')}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}/andride/`,browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'chrome'}),checks=[],errors=[];
const check=(ok,label)=>{assert(ok,label);checks.push(label);console.log('PASS',label)};
const configure=async context=>{context.on('page',page=>page.on('pageerror',e=>errors.push(e.message)));await context.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort())};
const loaded=page=>page.waitForFunction(()=>!document.querySelector('#app').inert);
const go=async(page,route)=>{await page.evaluate(route=>location.hash=route,route);await page.waitForTimeout(40)};
const backHeading=page=>page.locator('#content .page-heading');
const alignedHeading=(page,target)=>backHeading(page).evaluate((heading,target)=>{
 const arrow=heading.querySelector('.back-link'),title=heading.querySelector('h1'),style=getComputedStyle(title);
 const a=arrow.getBoundingClientRect(),h=title.getBoundingClientRect();
 const firstLine=h.top+parseFloat(style.paddingTop)+parseFloat(style.lineHeight)/2;
 return arrow.getAttribute('href')==='#'+target&&a.right<=h.left&&
  Math.abs((a.top+a.bottom)/2-firstLine)<1&&a.width>=44&&a.height>=44&&heading.scrollWidth<=heading.clientWidth;
},target);
const stored=page=>page.evaluate(async()=>await(await import('/andride/src/db.js')).readBackup());
const originals=async page=>page.evaluate(async()=>{const db=await import('/andride/src/db.js'),data=await db.readBackup();return JSON.stringify({rides:data.rides,files:data.files.map(f=>({...f,buffer:Array.from(new Uint8Array(f.buffer))}))})});
try{
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:950},locale:'en-GB',timezoneId:'Asia/Dubai',colorScheme:width===390?'dark':'light',reducedMotion:'reduce',serviceWorkers:'block'});await configure(context);const page=await context.newPage();await page.clock.setFixedTime(new Date(now));await page.goto(base+'?view=app&lang=en#import');await loaded(page);await page.locator('#fit-input').setInputFiles({name:'training.fit',mimeType:'application/octet-stream',buffer:original});await page.waitForFunction(()=>document.querySelector('#fit-input').value===''&&document.querySelectorAll('.import-status').length>0);
  await page.evaluate(async()=>{const db=await import('/andride/src/db.js'),{emptyCoach,validateCoachSettings}=await import('/andride/src/coach.js');await db.put('meta',{id:'athlete',value:{ftp:250,weight:72,bikeWeight:8,maxHr:190}});await db.put('meta',{id:'coach',value:{...emptyCoach(),settings:validateCoachSettings({level:'regular',focus:'speed',days:[0,1,2,3,4,5,6],weeklyMinutes:360,sessionMinutes:90,comfortableMinutes:90}),checkins:[{date:'2026-11-03',sleepHours:8,sleepQuality:4,fatigue:2,stress:2}]}});await db.put('meta',{id:'goals',value:[{id:'distance',title:'November',kind:'distance',smart:true,target:600,from:'2026-11-01',to:'2026-11-30'}]});await db.put('meta',{id:'overview-goal',value:'distance'});await db.put('meta',{id:'plans',value:[{id:'manual',title:'Saturday group ride',date:'2026-11-07',minutes:120,rideId:null}]});localStorage.setItem('andride-basemap-enabled','0')});await page.reload();await loaded(page);
  const data=await stored(page),ride=data.rides.find(r=>r.duration===3600),saved=await originals(page);assert(ride);const rideRoute='ride/'+ride.id;await go(page,rideRoute);await page.locator('[data-workout-inspector]').waitFor();
  for(const [route,parent] of [
   ['intro','settings'],['fit-info','settings'],['import','overview'],['compare','rides'],
   ['settings','more'],['athlete','more'],['backup','more'],['about','more'],['install','settings'],['storage','settings'],
   ['route/'+ride.id,rideRoute],['analysis/'+ride.id,'rides'],['goal-edit/missing','intellect'],
   ['goal-new','intellect'],['coach-settings','intellect'],['coach-checkin','intellect'],['plan-new','intellect']
  ]){
   await go(page,route);
   assert(await alignedHeading(page,parent),`${width}: #${route} aligns its title with the back link to #${parent}`);
  }
  await go(page,rideRoute);
  const title=backHeading(page).locator('h1'),savedTitle=await title.textContent();
  await title.evaluate(node=>node.textContent='A long title for a ride '.repeat(8));
  assert(await title.evaluate(node=>node.clientHeight>2*parseFloat(getComputedStyle(node).lineHeight)));
  check(await alignedHeading(page,'rides'),`${width}: back links align with headings across the app and stay on the first line of a long ride title`);
  await title.evaluate((node,original)=>node.textContent=original,savedTitle);
  check(await page.locator('[data-training-summary]').innerText().then(text=>text.includes('290')&&text.includes('1.16')),`${width}: FIT normalized power and date-specific intensity appear near the top`);
  check(await page.locator('[data-workout-inspector]').evaluate(node=>node.compareDocumentPosition(document.querySelector('.ride-analysis'))&Node.DOCUMENT_POSITION_FOLLOWING),`${width}: synchronized charts precede narrative and route`);
  check(await page.locator('[data-workout-full]').isHidden()&&(await page.locator('[data-workout-selection-label]').innerText())==='Whole ride',`${width}: whole ride is labelled accurately without a redundant reset action`);
  check(await page.locator('.ride-analysis > details').first().evaluate(node=>!node.open),`${width}: detailed chronology starts collapsed after the key sections`);
  await page.locator('[data-workout-chart]').evaluate(canvas=>window.__fullChart=Array.from(canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data));
  await page.locator('[data-workout-range=from]').fill('300');await page.locator('[data-workout-range=from]').dispatchEvent('input');await page.locator('[data-workout-range=to]').fill('600');await page.locator('[data-workout-range=to]').dispatchEvent('input');await page.waitForFunction(start=>Number(document.querySelector('[data-workout-inspector]').dataset.selectionStart)===start+300000,ride.start);
  const values=await page.locator('[data-workout-values]').innerText();check(values.includes('100 W')&&values.includes('0 rpm'),`${width}: one interval shows its recorded power and zero cadence`);
  const mask=await page.locator('[data-workout-chart]').evaluate(canvas=>{
   const data=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data,old=window.__fullChart,scale=canvas.width/canvas.clientWidth,x=ratio=>Math.round((8+ratio*(canvas.clientWidth-16))*scale),same=(x,y)=>{const i=(y*canvas.width+x)*4;return data.slice(i,i+4).every((v,j)=>v===old[i+j])};
   const unchanged=Array.from({length:160},(_,i)=>same(x(450/3600),Math.round((30+i)*scale))).every(Boolean);
   const grey=ratio=>{for(let y=30;y<190;y++){const i=(Math.round(y*scale)*canvas.width+x(ratio))*4;if(old[i]===old[i+1]&&old[i]===old[i+2]&&!same(x(ratio),Math.round(y*scale))&&data[i]===data[i+1]&&data[i]===data[i+2])return true}return false};
   return {unchanged,left:grey(.02),right:grey(.7)};
  });
  check(mask.unchanged&&mask.left&&mask.right,`${width}: selected curves retain their original pixels and both excluded regions are grey`);
  await page.locator('[data-workout-inspector]').screenshot({path:path.join(out,`${width}-selection.png`),style:'.brand,.tabbar{visibility:hidden}'});
  await page.locator('[data-workout-range=from]').fill('900');await page.locator('[data-workout-range=from]').dispatchEvent('input');
  check(await page.locator('[data-workout-inspector]').evaluate(node=>+node.dataset.selectionEnd-+node.dataset.selectionStart===1000&&node.querySelector('[data-workout-range=to]').value==='600'),`${width}: moving From past To clamps without moving the end`);
  await page.locator('[data-workout-range=from]').fill('300');await page.locator('[data-workout-range=from]').dispatchEvent('input');await page.locator('[data-workout-range=to]').fill('100');await page.locator('[data-workout-range=to]').dispatchEvent('input');
  check(await page.locator('[data-workout-inspector]').evaluate(node=>+node.dataset.selectionEnd-+node.dataset.selectionStart===1000&&node.querySelector('[data-workout-range=from]').value==='300'),`${width}: moving To before From clamps without moving the start`);
  const keyboard=page.locator('[data-workout-range=to]');await keyboard.focus();await keyboard.press('ArrowRight');
  check(await keyboard.inputValue()==='302'&&await keyboard.evaluate(node=>node.getBoundingClientRect().height>=44),`${width}: line handles retain keyboard operation and a comfortable control height`);
  await page.locator('.workout-laps > summary').click();await page.locator('[data-workout-lap="0"]').check();await page.locator('[data-workout-lap="1"]').check();check(await page.locator('[data-workout-comparison] tbody tr').count()===2&&(await page.locator('[data-workout-comparison]').innerText()).includes('-250'),`${width}: two selected laps compare work and recovery power`);
  const beforeUncheck=await page.locator('[data-workout-inspector]').evaluate(node=>[+node.dataset.selectionStart,+node.dataset.selectionEnd]);await page.locator('[data-workout-lap="0"]').uncheck();
  check(JSON.stringify(await page.locator('[data-workout-inspector]').evaluate(node=>[+node.dataset.selectionStart,+node.dataset.selectionEnd]))===JSON.stringify(beforeUncheck),`${width}: deselecting a lap leaves the chart interval in place`);
  await page.locator('[data-workout-lap="0"]').check();await page.locator('[data-workout-series=c]').click();await page.locator('[data-detail-key=workout-source] > summary').click();
  const beforeMetric=await page.locator('[data-workout-inspector]').evaluate(node=>[+node.dataset.selectionStart,+node.dataset.selectionEnd]);await page.locator('.sensor-details > summary').click();await page.locator('[data-metric=c]').click();
  check(JSON.stringify(await page.locator('[data-workout-inspector]').evaluate(node=>[+node.dataset.selectionStart,+node.dataset.selectionEnd]))===JSON.stringify(beforeMetric)&&await page.locator('[data-workout-series=c]').getAttribute('aria-pressed')==='false'&&await page.locator('[data-workout-comparison] tbody tr').count()===2,`${width}: switching a separate metric retains interval, series visibility and lap comparison`);
  check(await page.locator('[data-detail-key=workout-source]').evaluate(node=>node.open)&&await page.locator('[data-detail-key=ride-source]').evaluate(node=>!node.open),`${width}: independent source disclosures keep their own open state after rerender`);
  await page.locator('[data-workout-series=c]').click();
  await page.locator('[data-workout-full]').click();await page.waitForFunction(start=>Number(document.querySelector('[data-workout-inspector]').dataset.selectionStart)===start,ride.start);check(await page.locator('[data-workout-chart]').evaluate(canvas=>{const data=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data,old=window.__fullChart;return data.every((v,i)=>v===old[i])}),`${width}: resetting to the whole ride removes both grey masks`);const chart=page.locator('[data-workout-chart]');await chart.scrollIntoViewIfNeeded();let box=await chart.boundingBox();await page.mouse.move(box.x+box.width*.1,box.y+80);await page.mouse.down();await page.mouse.move(box.x+box.width*.2,box.y+80,{steps:5});await page.mouse.up();const selected=await page.locator('[data-workout-inspector]').evaluate(node=>[+node.dataset.selectionStart,+node.dataset.selectionEnd]);check(selected[0]>ride.start&&selected[1]<ride.end,`${width}: dragging selects a common interval across every sensor`);await page.mouse.move(box.x+box.width*.3,box.y+80);await page.mouse.down();await page.mouse.move(box.x+box.width*.5,box.y+80,{steps:3});await chart.dispatchEvent('pointerdown',{pointerId:99,pointerType:'touch',isPrimary:false,button:0,clientX:box.x+box.width*.9,clientY:box.y+80});await chart.dispatchEvent('pointercancel',{pointerId:99,pointerType:'touch'});const active=await page.locator('[data-workout-inspector]').evaluate(node=>[+node.dataset.selectionStart,+node.dataset.selectionEnd]);check(JSON.stringify(active)!==JSON.stringify(selected),`${width}: a secondary pointer cannot replace or cancel the active selection`);await chart.dispatchEvent('pointercancel',{pointerId:1,pointerType:'mouse'});await page.mouse.up();check(JSON.stringify(await page.locator('[data-workout-inspector]').evaluate(node=>[+node.dataset.selectionStart,+node.dataset.selectionEnd]))===JSON.stringify(selected),`${width}: pointer cancellation restores the previous interval`);await page.locator('[data-workout-full]').click();await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(out,`${width}-ride.png`),fullPage:false});
  await page.locator('[data-workout-range=from]').fill('300');await page.locator('[data-workout-range=from]').dispatchEvent('input');await page.locator('[data-workout-series=c]').click();const otherRide=data.rides.find(row=>row.id!==ride.id);await go(page,'ride/'+otherRide.id);
  check(await page.locator('[data-workout-full]').isHidden()&&await page.locator('[data-workout-series=c]').getAttribute('aria-pressed')==='true'&&await page.locator('[data-workout-inspector]').evaluate((node,start)=>+node.dataset.selectionStart===start,otherRide.start),`${width}: another ride starts with its own whole interval and visible sensors`);
  await go(page,'progress');await page.locator('[data-progress-records][aria-busy=false]').waitFor();check((await page.locator('[data-progress-records]').innerText()).includes('350')&&(await page.locator('[data-progress-records]').innerText()).includes('150'),`${width}: recent power records compare with the preceding period`);
  const recent=await page.locator('.hero strong').innerText();await page.locator('[data-progress-period="all"]').click();await page.locator('[data-progress-records][aria-busy=false]').waitFor();check(await page.locator('.hero strong').innerText()!==recent,`${width}: period changes update totals and power records together`);await page.locator('[data-progress-period="season"]').click();await page.locator('[data-progress-records][aria-busy=false]').waitFor();await page.screenshot({path:path.join(out,`${width}-progress.png`),fullPage:false});
  await go(page,'athlete');await page.locator('#athlete-form [name=ftp]').fill('300');await page.locator('#athlete-form [name=ftpFrom]').fill('2026-11-03');await page.locator('#athlete-form > button[type=submit]').click();await page.waitForFunction(async()=>{const p=await(await import('/andride/src/db.js')).get('meta','athlete');return p.value.ftpHistory?.length===2});await go(page,rideRoute);
  check((await page.locator('[data-training-summary]').innerText()).includes('1.16'),`${width}: changing current FTP preserves the previous ride intensity`);
  await go(page,'athlete');await page.locator('[name=ftpOverride]').check();await page.locator('#athlete-form > button[type=submit]').click();await page.waitForFunction(async()=>{const p=await(await import('/andride/src/db.js')).get('meta','athlete');return p.value.ftpMode==='override'});await go(page,rideRoute);check((await page.locator('[data-training-summary]').innerText()).includes('0.97'),`${width}: explicit global recalculation changes historical intensity`);
  await go(page,'athlete');await page.locator('[name=ftpOverride]').uncheck();await page.locator('#athlete-form > button[type=submit]').click();await page.waitForFunction(async()=>{const p=await(await import('/andride/src/db.js')).get('meta','athlete');return p.value.ftpMode==='history'});await page.screenshot({path:path.join(out,`${width}-ftp.png`),fullPage:false});
  await go(page,'intellect');const reserved=page.locator('#coach-2026-11-07');await reserved.locator('summary').click();check((await reserved.innerText()).includes('Saturday group ride')&&(await reserved.innerText()).includes('120'),`${width}: manual workouts reserve their date in the automatic schedule`);
  for(const kind of ['weekly-time','event']){
   await page.locator('[data-action=add-goal]').click();
   const chat=page.locator('#goal-editor-form'),atStep=step=>chat.and(page.locator(`[data-chat-step="${step}"]`));
   const option=(step,index)=>atStep(step).locator(`[data-chat-option="${index}"]`);
   const choose=(step,index)=>option(step,index).click();
   const title=kind==='event'?'City ride':'Tempo & endurance';
   const enterTitle=async()=>{
    const field=atStep('title').locator('input[name=title][type=text]'),send=atStep('title').getByRole('button',{name:'Send',exact:true});
    await field.fill('   ');assert(await send.isDisabled());
    await field.fill(`  ${title}  `);await send.click();
   };
   await chat.waitFor();
   if(kind==='weekly-time'){
    await page.emulateMedia({reducedMotion:'no-preference'});
    const transition=await option('kind',3).evaluate(button=>{
     const form=button.form;
     button.click();
     const dots=form.querySelector('.training-chat-typing');
     const typing=dots?.getAttribute('aria-label')==='and Ride is typing…'&&
      form.querySelector('.training-chat-answer')?.textContent==='Hours per week'&&
      !form.querySelector('[data-chat-option]');
     window.dispatchEvent(new Event('online'));
     return typing&&!!document.getElementById(form.id).querySelector('.training-chat-typing');
    });
    check(transition,`${width}: the answer appears before the next question and typing survives a rerender`);
    await enterTitle();
    await atStep('target').waitFor();
    assert.deepEqual((await chat.locator('[data-chat-option]').allTextContents()).map(label=>parseFloat(label)),[3,6,10]);
    const language=code=>page.evaluate(async code=>await(await import('/andride/src/i18n.js')).setLanguage(code,{persist:false}),code);
    await chat.locator('[data-chat-custom]').click();
    const number=chat.locator('input[name=target]'),send=chat.getByRole('button',{name:'Send',exact:true});
    assert.equal(await number.inputValue(),'');
    assert.equal(await number.getAttribute('enterkeyhint'),'send');
    assert(await send.isDisabled());
    await number.fill('0');
    await send.click();
    assert.equal(await chat.getAttribute('data-chat-step'),'target');
    assert(await number.evaluate(field=>field.validity.rangeUnderflow));
    await number.fill('6');
    await chat.locator('[data-chat-revisit=title]').press('Enter');
    const priorTitle=atStep('title').locator('input[name=title]');
    assert.equal(await priorTitle.inputValue(),title);
    await priorTitle.fill('Unsaved name');
    await page.locator('.training-chat-header .back-link').click();
    check(await atStep('target').locator('input[name=target]').inputValue()==='6',`${width}: a past question opens for editing and the header arrow restores the pending reply`);
    const fieldBox=await number.boundingBox(),sendBox=await send.boundingBox();
    assert(fieldBox.x+fieldBox.width<=sendBox.x&&Math.abs(fieldBox.y-sendBox.y)<1);
    await language('ru');
    await page.screenshot({path:path.join(out,`${width}-goal-number-chat.png`),style:'#toast{visibility:hidden}'});
    await language('en');
    if(width===390)await send.click();
    else await number.press('Enter');
    await atStep('smart').waitFor();
    check(await chat.getAttribute('data-chat-step')==='smart',`${width}: numeric reply sends from the message composer`);
    const layout=await chat.evaluate(form=>{
     const [question,answer,next]=[...form.querySelectorAll('.training-chat-question,.training-chat-answer')].slice(-3);
     const log=form.querySelector('.training-chat-log').getBoundingClientRect();
     const options=form.querySelector('.training-chat-options');
     const right=answer.getBoundingClientRect().right;
     const composer=form.querySelector('.training-chat-composer').getBoundingClientRect();
     const thread=form.querySelector('.training-chat-thread').getBoundingClientRect();
     const tabbar=document.querySelector('.tabbar').getBoundingClientRect();
     return question.getBoundingClientRect().bottom<=answer.getBoundingClientRect().top&&
      answer.getBoundingClientRect().bottom<=next.getBoundingClientRect().top&&
      Math.abs(question.getBoundingClientRect().left-log.left)<1&&Math.abs(right-log.right)<1&&
      Math.abs(options.lastElementChild.getBoundingClientRect().right-right)<1&&
      getComputedStyle(form).borderRightWidth==='0px'&&
      composer.top>=thread.bottom-1&&composer.bottom<=(tabbar.height?tabbar.top:innerHeight)&&composer.bottom>innerHeight-110;
    });
    check(layout,`${width}: replies and docked choices align to the right in the frameless chat`);
    await language('ru');
    await page.screenshot({path:path.join(out,`${width}-goal-chat.png`),style:'#toast{visibility:hidden}'});
    await language('en');
    await choose('smart',0);
    await atStep('period').getByRole('button',{name:'One month',exact:true}).click();
   }else{
    await choose('kind',4);
    await enterTitle();
    await atStep('period').getByRole('button',{name:'Custom dates',exact:true}).click();
    for(const [step,value] of [['from','2026-11-03'],['to','2026-11-09']]){
     await atStep(step).locator(`input[name=${step}]`).fill(value);
     await atStep(step).locator('button[type=submit]').click();
    }
   }
   await choose('coachMode',0);
   await atStep('review').waitFor();
   await page.emulateMedia({reducedMotion:'reduce'});
   assert.equal(await chat.locator('input:not([type=number]):not([type=date]),textarea,[contenteditable]').count(),0);
   await chat.locator('button[type=submit]').click();await chat.waitFor({state:'detached'});await page.locator('.coach-goal').waitFor();
   const goal=(await stored(page)).meta.find(row=>row.id==='goals').value.find(value=>value.kind===kind);
   assert.equal(goal.title,title);assert.equal(goal.from,'2026-11-03');
   assert.equal(goal.to,kind==='event'?'2026-11-09':'2026-12-02');
   check((await page.locator('.coach-goal').innerText()).includes(kind==='event'?'Event date':'6 hours'),`${width}: ${kind} produces a personal plan without a kilometre target`);
  }
  check((await page.locator('#coach-2026-11-09 summary').innerText()).includes('Event day'),`${width}: the event day is reserved`);await page.screenshot({path:path.join(out,`${width}-event.png`),fullPage:false});
  for(const code of ['ru','uk','ja']){await page.evaluate(async code=>await(await import('/andride/src/i18n.js')).setLanguage(code),code);await page.waitForFunction(code=>document.documentElement.lang===code,code);check((await page.locator('.coach-goal').innerText()).length>20,`${width}: event planning renders after switching to ${code}`)}
  check(await originals(page)===saved,`${width}: all training features preserve original rides and FIT bytes`);check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}: training controls fit the viewport`);
  await go(page,'backup');const downloaded=page.waitForEvent('download');await page.locator('[data-action=export]').click();const download=await downloaded,backupPath=path.join(out,`${width}.backup.json`);await download.saveAs(backupPath);const backup=JSON.parse(await readFile(backupPath,'utf8'));check(backup.version===2&&backup.athlete.ftpHistory.length===2&&backup.goals.some(g=>g.kind==='event')&&backup.goals.some(g=>g.kind==='weekly-time')&&Buffer.from(backup.files[0].data,'base64').equals(original),`${width}: backups retain FTP dates, new goal kinds and original files`);
  if(width===390){const fresh=await browser.newContext({viewport:{width:390,height:950},locale:'en-GB',timezoneId:'Asia/Dubai',serviceWorkers:'block'});await configure(fresh);const restored=await fresh.newPage();await restored.clock.setFixedTime(new Date(now));await restored.goto(base+'?view=app&lang=en#backup');await loaded(restored);await restored.locator('#backup-input').setInputFiles({name:'training.backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});await restored.waitForFunction(()=>document.querySelector('#backup-input').value==='');const result=await stored(restored);check(result.rides.length===3&&result.meta.find(row=>row.id==='athlete').value.ftpHistory.length===2&&result.meta.find(row=>row.id==='goals').value.some(g=>g.kind==='event'), 'New FTP history and goal kinds restore on an empty device');await fresh.close()}
  await context.close();
 }
 check(errors.length===0,'No uncaught browser errors');await writeFile(path.join(out,'checks.json'),JSON.stringify({checks,errors},null,2));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
