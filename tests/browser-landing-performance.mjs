// Optional cold-load benchmark. Build first; provide PLAYWRIGHT_MODULE when needed.
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {gzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const label=process.env.PERF_LABEL||'current',root=path.resolve(process.env.PERF_BUILD||'dist'),out=path.resolve('artifacts/landing-performance',label+'-results');await mkdir(out,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2','.ttf':'font/ttf','.webmanifest':'application/manifest+json','.png':'image/png','.webp':'image/webp'};
const files=new Map();const server=createServer(async(req,res)=>{try{const name=new URL(req.url,'http://localhost').pathname.replace(/^\/andride\//,'')||'index.html',file=path.resolve(root,name);assert(file.startsWith(root+path.sep));if(!files.has(file)){const raw=await readFile(file),compressed=/\.(?:js|css|html|svg|webmanifest)$/.test(file);files.set(file,{body:compressed?gzipSync(raw):raw,compressed})}const {body,compressed}=files.get(file);res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-cache');if(compressed)res.setHeader('Content-Encoding','gzip');res.end(body)}catch{res.writeHead(404);res.end('Not found')}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}/andride/`;
const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome',headless:true}),results=[],errors=[];
try{
 for(const width of [390,1440])for(let run=0;run<3;run++){
  const context=await browser.newContext({viewport:{width,height:844},locale:'en-US',serviceWorkers:'block'}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  const session=await context.newCDPSession(page);await session.send('Network.enable');await session.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:200000,uploadThroughput:93750});await session.send('Emulation.setCPUThrottlingRate',{rate:4});
  await page.addInitScript(()=>{window.qaPerformance={lcp:0,cls:0,longTasks:0};new PerformanceObserver(list=>{for(const e of list.getEntries())window.qaPerformance.lcp=e.startTime}).observe({type:'largest-contentful-paint',buffered:true});new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.qaPerformance.cls+=e.value}).observe({type:'layout-shift',buffered:true});new PerformanceObserver(list=>{for(const e of list.getEntries())window.qaPerformance.longTasks+=e.duration}).observe({type:'longtask',buffered:true})});
  await page.goto(base+'?lang=en');await page.locator('.landing-hero').waitFor();await page.locator('.landing-phone img').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));const heroReady=await page.evaluate(()=>performance.now());await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1700);
  const data=await page.evaluate(()=>({performance:window.qaPerformance,paint:performance.getEntriesByType('paint').map(e=>({name:e.name,time:e.startTime})),navigation:{domContentLoaded:performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd,load:performance.getEntriesByType('navigation')[0].loadEventEnd},resources:performance.getEntriesByType('resource').map(e=>({name:new URL(e.name).pathname.split('/andride/')[1],start:e.startTime,end:e.responseEnd,bytes:e.encodedBodySize,decoded:e.decodedBodySize,type:e.initiatorType}))}));
  results.push({width,run,heroReady,...data});console.log(label,width,run,JSON.stringify({heroReady:Math.round(heroReady),lcp:Math.round(data.performance.lcp),scriptBytes:data.resources.filter(r=>r.name?.endsWith('.js')).reduce((n,r)=>n+r.bytes,0)}));await context.close();
 }
 for(const width of [390,1440])for(const language of ['ru','en','uk','ja']){
  const context=await browser.newContext({viewport:{width,height:844},locale:language,reducedMotion:'reduce',serviceWorkers:'block'}),page=await context.newPage();await page.goto(base+'?lang='+language);await page.locator('.landing-hero').waitFor();await page.locator('.landing img').evaluateAll(images=>{for(const i of images)i.loading='eager';return Promise.all(images.map(i=>i.decode()))});await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(200);await page.screenshot({path:path.join(out,`${width}-${language}.png`),fullPage:true});await context.close();
 }
 assert.deepEqual(errors,[]);await writeFile(path.join(out,'measurements.json'),JSON.stringify({conditions:{latency:150,downloadBytesPerSecond:200000,cpuSlowdown:4,compression:'gzip',coldContext:true},results,errors},null,2));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
