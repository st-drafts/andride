// Run after building. Chrome feature removal exercises the old-browser path;
// it does not replace acceptance on an actual iOS 9 device.
const playwright=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import assert from 'node:assert/strict';
import {languages} from '../src/language-catalog.js';
import {legacyBrowserCopies} from '../src/legacy-copy.js';
const root=path.resolve('dist'),out=path.resolve('output/browser-compatibility');await mkdir(out,{recursive:true});
const html=await readFile(path.join(root,'index.html'),'utf8'),version=html.match(/entry\.js\?site-v=([a-f0-9]+)/)[1];
const baseline=html.replace(/<style id="browser-fallback-style">[\s\S]*?<\/style>/,'').replace(/<section id="browser-fallback"[\s\S]*?<\/section>/,'').replace('<script id="modern-bootstrap" type="text/plain">','<script>').replace(/<script id="browser-gate">[\s\S]*?<\/script>/,`<script type="module" src="./src/entry.js?site-v=${version}"></script>`);
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.ttf':'font/ttf','.woff2':'font/woff2','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost'),name=url.pathname.replace(/^\/andride\//,'')||'index.html',file=path.resolve(root,name);assert(file.startsWith(root+path.sep));res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-cache');res.end(name==='index.html'&&url.searchParams.has('compat-baseline')?baseline:await readFile(file))}catch{res.writeHead(404);res.end('Not found')}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}/andride/`;
const browser=await playwright.chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'chrome'}),checks=[],errors=[];
const check=(ok,label)=>{assert(ok,label);checks.push(label);console.log('PASS',label)};
try{
 for(const [width,height] of [[320,568],[568,320],[390,844]]){
  const context=await browser.newContext({viewport:{width,height},locale:'ru-RU',serviceWorkers:'block',userAgent:'Mozilla/5.0 (iPod touch; CPU iPhone OS 9_3_5 like Mac OS X) AppleWebKit/601.1.46 Version/9.0 Mobile/13G36 Safari/601.1'});
  await context.addInitScript(()=>{delete HTMLScriptElement.prototype.noModule;window.CSS=undefined;localStorage.setItem('compat-sentinel','preserve');indexedDB.open=()=>{throw Error('Compatibility page must not open ride storage')}});
  const page=await context.newPage(),requests=[];page.on('request',request=>requests.push(new URL(request.url()).pathname));page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base+'?install=1&lang=ru');await page.locator('[data-legacy-language] select option').first().waitFor({state:'attached'});
  check(await page.locator('#browser-fallback').isVisible(),`${width}: compatible page is visible without modules or CSS.supports`);
  for(const [code] of languages){await page.selectOption('#browser-fallback select',code);assert.equal(await page.locator('.legacy-notice').textContent(),legacyBrowserCopies[code].notice);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),width+' '+code)}
  await page.selectOption('#browser-fallback select','ru');await page.locator('#browser-fallback h1 img').waitFor();
  check(!requests.some(url=>/\/(?:entry|app|landing|installation|translations|i18n)\.js$/.test(url)),`${width}: unsupported engines load no modern modules or installation flow`);
  check(await page.evaluate(()=>localStorage.getItem('compat-sentinel'))==='preserve',`${width}: existing stored data remains untouched`);
  check(await page.evaluate(()=>getComputedStyle(document.body).overflowY!=='hidden'),`${width}: the whole description can scroll`);
  await page.screenshot({path:path.join(out,`legacy-${width}x${height}.png`),fullPage:true});await context.close();
 }
 const noJS=await browser.newContext({viewport:{width:320,height:568},javaScriptEnabled:false,serviceWorkers:'block'}),plain=await noJS.newPage();await plain.goto(base);
 check(await plain.locator('#browser-fallback').isVisible()&&!await plain.locator('#launch-screen').isVisible(), 'Static description remains visible with JavaScript disabled');
 assert(await plain.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await noJS.close();
 for(const width of [390,1440]){
  const images=[];
  for(const old of [true,false]){
   const context=await browser.newContext({viewport:{width,height:844},locale:'en-GB',colorScheme:'light',reducedMotion:'reduce',serviceWorkers:'block'}),page=await context.newPage(),requests=[];
   page.on('request',request=>requests.push(new URL(request.url()).pathname));page.on('pageerror',error=>errors.push(error.message));
   await page.goto(base+'?lang=en'+(old?'&compat-baseline=1':''));await page.locator('.landing-hero').waitFor();await page.addStyleTag({content:'*{animation:none!important;transition:none!important;caret-color:transparent!important}'});
   await page.locator('.landing img').evaluateAll(images=>{for(const image of images)image.loading='eager';return Promise.all(images.map(image=>image.decode()))});await page.evaluate(()=>document.fonts.ready);
   images.push(await page.locator('.landing').screenshot({path:path.join(out,`modern-${width}-${old?'before':'after'}.png`)}));
   if(!old)check(!requests.some(url=>/\/legacy-browser\.js$/.test(url))&&await page.locator('#browser-fallback').count()===0,`${width}: modern browsers keep only their original interface`);
   await context.close();
  }
  check(createHash('sha256').update(images[0]).digest('hex')===createHash('sha256').update(images[1]).digest('hex'),`${width}: modern landing screenshot matches the original bootstrap exactly`);
 }
 check(errors.length===0,'No uncaught browser errors');await writeFile(path.join(out,'checks.json'),JSON.stringify({checks,errors},null,2));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
