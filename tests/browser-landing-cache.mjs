// Upgrade regression: PREVIOUS_BUILD must point to a built 1.64 installation.
const playwright=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const engine=process.env.BROWSER_ENGINE||'chromium';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createServer} from 'node:http';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import {Encoder,Profile} from '../vendor/fit/index.js';
const root=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const previous=path.resolve(process.env.PREVIOUS_BUILD||path.join(root,'artifacts/landing-cache-fix/previous-build'));
const current=path.join(root,'dist'),out=path.join(root,'artifacts/landing-cache-fix');
await mkdir(out,{recursive:true});
assert((await readFile(path.join(previous,'sw.js'),'utf8')).includes('"version":"1.0.64"'),'Use the actual 1.64 build as the upgrade baseline');
const html=await readFile(path.join(current,'index.html'),'utf8'),version=html.match(/entry\.js\?site-v=([a-f0-9]{14})/)[1],future='1234567890abcd';
let stage=0,hotfix=false,disconnected=false;
const requests=[],types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2','.ttf':'font/ttf','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{
 try{
  if(disconnected){req.socket.destroy();return}
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/qa'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>Outside worker scope</title>');return}
  if(!url.pathname.startsWith('/andride/'))throw Error('path');
  const rel=decodeURIComponent(url.pathname.slice(9))||'index.html',dir=stage===0?previous:current,file=path.resolve(dir,rel);
  if(!file.startsWith(dir+path.sep))throw Error('path');
  let data=await readFile(file);
  if(stage===2&&/\.(?:html|js|css)$/.test(rel))data=Buffer.from(data.toString().replaceAll(version,future));
  if(rel==='src/landing.css')data=Buffer.concat([data,Buffer.from(`\n.landing{--cache-qa:${hotfix?'hotfix':stage===0?'old':stage===1?'current':'future'}}`)]);
  requests.push({path:rel,query:url.search,stage,hotfix});
  res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');
  res.setHeader('Cache-Control',rel==='index.html'||rel==='sw.js'?'no-cache':'public,max-age=31536000');
  res.end(data);
 }catch{res.writeHead(404);res.end('Not found')}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const port=server.address().port,base=`http://cache-test.localhost:${port}/andride/`;
const browser=await playwright[engine].launch({headless:true,...(engine==='chromium'?{channel:process.env.BROWSER_CHANNEL||'chrome'}:{})}),checks=[],errors=[];
const check=(condition,label)=>{assert(condition,label);checks.push(label);console.log('PASS',label)};
const until=async(fn,label)=>{for(let i=0;i<300;i++){if(await fn())return;await new Promise(resolve=>setTimeout(resolve,100))}throw Error('Timed out: '+label)};
const state=page=>page.evaluate(async()=>{const db=await import('/andride/src/db.js'),snapshot=await db.readBackup();for(const file of snapshot.files)file.buffer=[...new Uint8Array(file.buffer)];return JSON.stringify({snapshot,preference:localStorage.getItem('andride-language'),unrelated:localStorage.getItem('qa-unrelated')})});
const marker=page=>page.evaluate(()=>getComputedStyle(document.querySelector('.landing')).getPropertyValue('--cache-qa').trim());
try{
 const context=await browser.newContext({viewport:{width:390,height:844},locale:'en-US',reducedMotion:'reduce'});
 const offline=async value=>{if(engine==='webkit')disconnected=value;else await context.setOffline(value)};
 context.on('page',page=>page.on('pageerror',error=>errors.push(error.message)));
 const app=await context.newPage();
 await app.addInitScript(()=>{
  sessionStorage.setItem('qa-boots',String(Number(sessionStorage.getItem('qa-boots')||0)+1));
  const original=matchMedia.bind(window);window.matchMedia=query=>{const media=original(query);if(query==='(display-mode: standalone)')Object.defineProperty(media,'matches',{value:true});return media};
 });
 await app.goto(base+'?lang=en#settings');await app.locator('#launch-screen').waitFor({state:'detached'});
 await until(()=>app.evaluate(()=>!!navigator.serviceWorker.controller),'legacy worker control');
 await app.evaluate(()=>window.qaInitialController=navigator.serviceWorker.controller);
 const encoder=new Encoder(),start=new Date('2026-10-30T06:00:00Z');encoder.onMesg(Profile.MesgNum.FILE_ID,{type:'activity'});
 for(let i=0;i<=60;i++)encoder.onMesg(Profile.MesgNum.RECORD,{timestamp:new Date(+start+i*1000),distance:i*8,power:150,cadence:85,speed:8});
 encoder.onMesg(Profile.MesgNum.SESSION,{sport:'cycling',startTime:start,timestamp:new Date(+start+60000),totalElapsedTime:60,totalTimerTime:60,totalDistance:480});
 const bytes=[...new Uint8Array(encoder.close().buffer)];
 await app.evaluate(async bytes=>{const db=await import('/andride/src/db.js'),{parseFit}=await import('/andride/src/fit.js'),buffer=new Uint8Array(bytes).buffer,parsed=await parseFit(buffer,'saved-ride.fit');await db.addImport(parsed,buffer,'saved-ride.fit');await db.put('meta',{id:'athlete',value:{weight:75,ftp:220}});await db.put('meta',{id:'goals',value:[{id:'saved-goal',title:'Keep this goal',kind:'distance',target:100,from:'2026-10-01',to:'2026-12-01'}]});localStorage.setItem('qa-unrelated','keep')},bytes);
 const saved=await state(app),landing=await context.newPage();await landing.goto(base+'?lang=en');await landing.locator('.landing-hand').waitFor();check(await marker(landing)==='old','Reproduced a cached 1.64 landing with the installed app held open');
 stage=1;await landing.reload();await landing.locator('.landing-hand').waitFor();check(await marker(landing)==='current','New build loads fresh landing CSS through the old active worker');
 const webpImages=await landing.evaluate(async()=>{const images=[...document.querySelectorAll('.landing img')];for(const image of images)image.loading='eager';await Promise.all(images.map(image=>image.decode()));return images.filter(image=>/\.webp(?:\?|$)/.test(image.currentSrc)).map(image=>image.naturalWidth)});check(webpImages.length===3&&webpImages.every(width=>width>0),'WebP images decode during the upgrade through the legacy worker');
 check(await landing.locator('.landing-hand').evaluate(img=>new URL(img.src).searchParams.get('site-v'))===version,'Landing images use the new build fingerprint');
 await until(()=>landing.evaluate(async()=>!!(await navigator.serviceWorker.getRegistration()).waiting),'new waiting worker');
 check(await app.evaluate(()=>navigator.serviceWorker.controller===window.qaInitialController&&sessionStorage.getItem('qa-boots')==='1'),'Landing update does not activate a new worker or reload the open app');
 check(await state(app)===saved,'FIT bytes, rides, goals, profile and preferences survive the first update');
 await app.evaluate(async()=>{window.qaFirstWaiting=(await navigator.serviceWorker.getRegistration()).waiting});
 stage=2;await landing.reload();await landing.locator('.landing-hand').waitFor();check(await marker(landing)==='future','A second design update works while the original app worker remains active');
 // An early cache alias can exist while installation is still refreshing the
 // legacy entry. Wait for this update's worker, not the preceding waiting one.
 await until(()=>app.evaluate(async()=>{const reg=await navigator.serviceWorker.getRegistration();if(!reg.waiting||reg.waiting===window.qaFirstWaiting||reg.waiting.state!=='installed'||reg.installing)return false;const names=await caches.keys();return names.some(name=>name.includes('1234567890abcd'))}),'second worker installation');
 await until(()=>landing.evaluate(async()=>{const c=await caches.open('andride-1234567890abcd');return !!await c.match(new URL('./src/landing.css?site-v=1234567890abcd',location.href))}),'second offline aliases');
 check(await state(app)===saved,'Saved training data remains unchanged across two landing updates');
 await offline(true);await landing.reload();await landing.locator('.landing-hand').waitFor();check(await marker(landing)==='future','Legacy worker can serve the complete new public page offline');await offline(false);
 const outside=await context.newPage();await outside.goto(`http://cache-test.localhost:${port}/qa`);await app.close();await landing.close();
 try{await until(()=>outside.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration('/andride/');return r?.active?.state==='activated'&&!r.waiting&&!r.installing}),'natural activation after clients close')}catch(error){console.log('Worker state after clients close',await outside.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration('/andride/');return {active:r?.active?.state,waiting:r?.waiting?.state,installing:r?.installing?.state,controller:navigator.serviceWorker.controller?.state}}));throw error}
 const fresh=await context.newPage();await fresh.goto(base+'?lang=en');await fresh.locator('.landing-hand').waitFor();check(await marker(fresh)==='future','App worker activates normally after its open pages close');
 check(await state(fresh)===saved,'Training history remains intact after normal worker activation');
 // Prime the new policy before any public page is loaded into this context's
 // HTTP cache. The previous context also holds old immutable HTTP responses.
 const policyContext=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 policyContext.on('page',page=>page.on('pageerror',error=>errors.push(error.message)));
 const bootstrap=await policyContext.newPage();await bootstrap.goto(`http://cache-test.localhost:${port}/qa`);
 await bootstrap.evaluate(async()=>{await navigator.serviceWorker.register('/andride/sw.js',{scope:'/andride/',updateViaCache:'none'})});
 await until(()=>bootstrap.evaluate(async()=>!!(await navigator.serviceWorker.getRegistration('/andride/'))?.active),'new-policy worker activation');
 const publicPage=await policyContext.newPage();await publicPage.goto(base+'?lang=en');await publicPage.locator('.landing-hand').waitFor();
 hotfix=true;await publicPage.reload();await publicPage.locator('.landing-hand').waitFor();
 check(await marker(publicPage)==='hotfix','Active worker revalidates landing CSS despite long-lived upstream HTTP headers');
 if(engine==='webkit')disconnected=true;else await policyContext.setOffline(true);
 await publicPage.reload();await publicPage.locator('.landing-hand').waitFor();
 check(await marker(publicPage)==='hotfix','Offline fallback retains the latest successfully loaded design');
 check(errors.length===0,'No uncaught errors during the cache migration');
 await publicPage.screenshot({path:path.join(out,'offline-after-upgrade-'+engine+'.png'),fullPage:true,animations:'disabled'});
 await writeFile(path.join(out,'checks-'+engine+'.json'),JSON.stringify({engine,version,checks,errors,requests},null,2));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
