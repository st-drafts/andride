// Optional integration: build first, then run in Chromium or WebKit.
const playwright=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
import {Encoder,Profile} from '../vendor/fit/index.js';
import {parseFit} from '../src/fit.js';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createServer} from 'node:http';
import path from 'node:path';
import assert from 'node:assert/strict';
const engine=process.env.BROWSER_ENGINE||'chromium',root=path.resolve(process.env.BUILD_DIR||'dist'),out=path.resolve('artifacts/overview-month');await mkdir(out,{recursive:true});
function fit(sessions){
 const encoder=new Encoder();encoder.onMesg(Profile.MesgNum.FILE_ID,{type:'activity',manufacturer:'development',product:1});
 for(const [date,distance,ascent] of sessions){const start=new Date(date),end=new Date(+start+3600000);for(const [timestamp,recordDistance] of [[start,0],[end,distance]])encoder.onMesg(Profile.MesgNum.RECORD,{timestamp,distance:recordDistance,speed:distance/3600,power:150,cadence:85});encoder.onMesg(Profile.MesgNum.SESSION,{sport:'cycling',startTime:start,timestamp:end,totalElapsedTime:3600,totalTimerTime:3600,totalDistance:distance,totalAscent:ascent})}
 return Buffer.from(encoder.close().buffer);
}
const original=fit([['2026-10-31T18:00:00Z',200000,1000],['2026-10-31T20:00:00Z',10000,10],['2026-11-05T04:00:00Z',20000,20],['2026-11-12T04:00:00Z',30000,30],['2026-11-20T04:00:00Z',40000,40],['2026-12-01T04:00:00Z',90000,500]]);
assert.equal((await parseFit(original.buffer.slice(original.byteOffset,original.byteOffset+original.byteLength),'months.fit')).rides.length,6);
const older=fit([['2026-10-15T04:00:00Z',80000,50]]);
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');assert(url.pathname.startsWith('/andride/'));const file=path.resolve(root,url.pathname.slice(9)||'index.html');assert(file.startsWith(root+path.sep));res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-cache');res.end(await readFile(file))}catch{res.writeHead(404);res.end('Not found')}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}/andride/`;
const browser=await playwright[engine].launch({headless:true,...(engine==='chromium'?{channel:process.env.BROWSER_CHANNEL||'chrome'}:{})}),checks=[],errors=[];
const check=(ok,label)=>{assert(ok,label);checks.push(label);console.log('PASS',label)};
const snapshot=page=>page.evaluate(async()=>{const data=await(await import('/andride/src/db.js')).readBackup();return JSON.stringify({...data,files:data.files.map(file=>({...file,buffer:Array.from(new Uint8Array(file.buffer))}))})});
try{
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:844},locale:'ru-RU',timezoneId:'Asia/Dubai',colorScheme:'light',reducedMotion:'reduce',serviceWorkers:'block'});
  await context.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));await page.clock.setFixedTime(new Date('2026-11-21T08:00:00Z'));
  const savedPeriods=JSON.stringify({current:{from:'2026-10-01',to:'2026-10-31'},previous:{from:'2026-09-01',to:'2026-09-30'}});
  await page.addInitScript(saved=>localStorage.setItem('andride-periods',saved),savedPeriods);
  await page.goto(base+'?view=app&lang=ru#settings');await page.waitForFunction(()=>!document.querySelector('#app').inert);
  await page.evaluate(async encoded=>{const db=await import('/andride/src/db.js'),{parseFit}=await import('/andride/src/fit.js'),bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0)).buffer;const parsed=await parseFit(bytes,'months.fit');await db.addImport(parsed,bytes,'months.fit')},original.toString('base64'));
  const saved=await snapshot(page);await page.goto(base+'?view=app&lang=ru#overview');await page.reload();await page.waitForFunction(()=>!document.querySelector('#app').inert);
  let summary=page.locator('[data-overview-month="2026-11"]');await summary.waitFor();
  check(await summary.locator('.hero strong').innerText()==='100',`${width}: distance includes every November ride, including local midnight, not the selected period or latest week`);
  check(/4 поездки/.test(await summary.locator('.hero + p').innerText()),`${width}: ride count includes all four recorded rides this month`);
  check(JSON.stringify(await summary.locator('.overview-summary .metric strong').allTextContents())===JSON.stringify(['4:00','100']),`${width}: FIT time and elevation use the same month`);
  check((await summary.locator('time').innerText()).includes('ноябрь')&&await summary.locator('time').getAttribute('datetime')==='2026-11',`${width}: the month is visible in the summary`);
  check(await page.evaluate(()=>localStorage.getItem('andride-periods'))===savedPeriods,`${width}: saved comparison preferences are retained`);
  check(await snapshot(page)===saved,`${width}: rendering leaves FIT bytes and all stored history intact`);
  await page.evaluate(()=>location.hash='progress');await page.locator('h1').filter({hasText:'Прогресс'}).waitFor();
  check(await page.locator('.hero strong').innerText()==='300'&&await page.locator('#content table tbody tr').count()===2,`${width}: all-time progress and monthly totals exclude the future December ride`);
  await page.evaluate(()=>location.hash='overview');await summary.waitFor();
  await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:path.join(out,`${engine}-${width}-november.png`),fullPage:true});
  for(const code of ['en','uk']){await page.evaluate(async code=>await(await import('/andride/src/i18n.js')).setLanguage(code),code);await page.waitForFunction(code=>document.documentElement.lang===code,code);assert.equal(await summary.locator('.hero strong').innerText(),'100');const label=await summary.locator('time').innerText();assert(label.includes(code==='en'?'November':'листопад'),label)}
  check(true,`${width}: month labels follow the interface language`);
  await page.clock.setFixedTime(new Date('2027-01-01T08:00:00Z'));await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));summary=page.locator('[data-overview-month="2027-01"]');await summary.waitFor();
  check(await summary.locator('.hero strong').innerText()==='0'&&JSON.stringify(await summary.locator('.overview-summary .metric strong').allTextContents())===JSON.stringify(['0:00','0']),`${width}: resuming in a new year shows zero for an empty current month`);
  check(await snapshot(page)===saved,`${width}: month rollover preserves the complete history`);
  await page.locator('#fit-input').setInputFiles({name:'older.fit',mimeType:'application/octet-stream',buffer:older});await page.waitForFunction(()=>document.querySelector('#fit-input').value===''&&document.querySelectorAll('.import-status').length>0);await page.evaluate(()=>location.hash='overview');summary=page.locator('[data-overview-month="2027-01"]');await summary.waitFor();
  check(await summary.locator('.hero strong').innerText()==='0',`${width}: importing an older FIT does not move the summary back to that month`);
  const history=JSON.parse(await snapshot(page));check(history.rides.length===7&&history.files.some(file=>Buffer.from(file.buffer).equals(original)),`${width}: original FIT and all sessions survive the extra import`);
  await page.evaluate(async()=>{const db=await import('/andride/src/db.js'),template=(await db.all('rides'))[0];await db.put('rides',{...template,id:'missing-summary',hash:'missing-summary',start:+new Date('2027-01-01T04:00:00Z'),end:+new Date('2027-01-01T05:00:00Z'),distance:null,duration:null,ascent:null,avgPower:null,avgHr:null,avgCadence:null,points:[]})});await page.reload();await page.waitForFunction(()=>!document.querySelector('#app').inert);summary=page.locator('[data-overview-month="2027-01"]');await summary.waitFor();
  check(await summary.locator('.hero strong').innerText()==='—'&&JSON.stringify(await summary.locator('.overview-summary .metric strong').allTextContents())===JSON.stringify(['—','—']),`${width}: missing FIT measurements stay unavailable rather than becoming false zeros`);
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}: the month caption fits without horizontal overflow`);
  await context.close();
 }
 check(errors.length===0,'No uncaught browser errors');await writeFile(path.join(out,`checks-${engine}.json`),JSON.stringify({engine,checks,errors},null,2));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
