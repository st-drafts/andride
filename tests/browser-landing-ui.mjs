// Optional browser regression: lazy views, every language and scroll geometry.
const playwright=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createServer} from 'node:http';
import path from 'node:path';
import assert from 'node:assert/strict';
import {languages} from '../src/language-catalog.js';
import {landingCopy,landingInterfaceCopy} from '../src/landing-copy.js';
const engine=process.env.BROWSER_ENGINE||'chromium',root=path.resolve('dist'),out=path.resolve('artifacts/landing-performance');await mkdir(out,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2','.ttf':'font/ttf','.webmanifest':'application/manifest+json','.webp':'image/webp','.png':'image/png'};
const server=createServer(async(req,res)=>{try{const name=new URL(req.url,'http://localhost').pathname.replace(/^\/andride\//,'')||'index.html',file=path.resolve(root,name);assert(file.startsWith(root+path.sep));res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-cache');res.end(await readFile(file))}catch{res.writeHead(404);res.end('Not found')}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}/andride/`;
const browser=await playwright[engine].launch({headless:true,...(engine==='chromium'?{channel:process.env.BROWSER_CHANNEL||'chrome'}:{})}),errors=[],checks=[];
const check=(ok,label)=>{assert(ok,label);checks.push(label);console.log('PASS',label)};
try{
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:844},locale:'en-GB',reducedMotion:'reduce',serviceWorkers:'block',...(width===390?{isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 Version/26.0 Mobile/15E148 Safari/604.1'}:{})});
  const page=await context.newPage(),requests=[];page.on('request',request=>requests.push(new URL(request.url()).pathname));page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'?lang=en');await page.locator('.landing-hero').waitFor();await page.locator('.landing img').evaluateAll(images=>{for(const image of images)image.loading='eager';return Promise.all(images.map(image=>image.decode()))});await page.evaluate(()=>document.fonts.ready);
  check(!requests.some(url=>/\/(?:i18n|translations|installation|installation-qr|installation-copy)\.js$/.test(url)),`${width}: initial render excludes app dictionaries and installation views`);
  check(await page.locator('#landing-style').count()===1,`${width}: one early landing stylesheet`);
  check(await page.evaluate(()=>performance.getEntriesByType('resource').filter(e=>/\/(phone|screen)\.webp(?:\?|$)/.test(e.name)).length)===2,`${width}: preloaded hero images are reused without duplicate downloads`);
  for(const [code] of languages){await page.selectOption('[data-landing-language]',code);await page.waitForFunction(code=>document.documentElement.lang===code,code);assert.equal(await page.locator('.landing-start').textContent(),landingCopy(code).start,code);assert.equal(await page.locator('.skip').textContent(),landingInterfaceCopy(code).skip,code);assert.equal(await page.evaluate(()=>localStorage.getItem('andride-language')),code);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),code)}
  check(!requests.some(url=>/\/(?:i18n|translations)\.js$/.test(url)||url.includes('/src/locales/')),`${width}: all 38 language switches work without loading app dictionaries`);
  await page.locator('.landing img').evaluateAll(images=>{for(const image of images)image.loading='eager';return Promise.all(images.map(image=>image.decode()))});await page.evaluate(()=>document.fonts.ready);
  await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForFunction(()=>document.querySelector('.landing').classList.contains('landing-motion'));await page.waitForTimeout(1700);
  const geometryReads=await page.evaluate(async()=>{
   const original=Element.prototype.getBoundingClientRect,offset=Object.getOwnPropertyDescriptor(HTMLElement.prototype,'offsetHeight');let reads=0;
   Element.prototype.getBoundingClientRect=function(...args){if(this.matches('.landing,.landing-about,.landing-signature'))reads++;return original.apply(this,args)};
   Object.defineProperty(HTMLElement.prototype,'offsetHeight',{...offset,get(){if(this.matches('.landing-signature'))reads++;return offset.get.call(this)}});
   try{const max=document.documentElement.scrollHeight-innerHeight;for(let i=0;i<=30;i++){window.scrollTo({top:max*i/30,behavior:'instant'});await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))}return reads}finally{Element.prototype.getBoundingClientRect=original;Object.defineProperty(HTMLElement.prototype,'offsetHeight',offset)}
  });check(geometryReads===0,`${width}: scrolling does not remeasure landing geometry`);
  const geometryMatches=await page.evaluate(()=>{
   const root=document.querySelector('.landing'),signature=root.querySelector('.landing-signature');
   if(innerWidth<=700){const expected=Math.min(signature.offsetHeight+80,Math.max(0,root.getBoundingClientRect().bottom-innerHeight)*1.6);return Math.abs(parseFloat(signature.style.getPropertyValue('--signature-rise'))-expected)<.01}
   const expected=Math.max(-1,Math.min(1,root.querySelector('.landing-about').getBoundingClientRect().top/innerHeight))*10;return Math.abs(parseFloat(root.querySelector('.landing-cockpit-drift').style.getPropertyValue('--cockpit-drift'))-expected)<.01;
  });check(geometryMatches,`${width}: scroll effects retain their original positions`);
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>!document.querySelector('.landing').classList.contains('landing-motion'));check(await page.locator('.landing-signature').evaluate(el=>!el.style.getPropertyValue('--signature-rise')),`${width}: reduced motion clears dynamic transforms`);
  if(width===1440){await page.locator('[data-landing-install]').first().click();await page.locator('.installation-qr-dialog[open]').waitFor();check(!requests.some(url=>/\/(?:i18n|translations)\.js$/.test(url)),`${width}: lazy QR view opens without app dictionaries`);check(await page.locator('[data-landing-close]').getAttribute('aria-label')===landingInterfaceCopy('ko').close,`${width}: QR close label follows the selected language`);await page.locator('[data-landing-close]').click()}
  else{await page.locator('[data-landing-install]').first().click();await page.locator('.installation-page').waitFor();check(new URL(page.url()).searchParams.get('lang')==='ko',`${width}: mobile installation keeps the selected language`);check(await page.locator('.installation-instructions img[src*="install-add-home.svg"]').count()>0,`${width}: lazy iPhone guide renders its artwork`)}
  for(const code of ['uk','de','ja']){await page.goto(base+'?install=1&lang='+code);await page.locator('.installation-page').waitFor();assert.equal(await page.evaluate(()=>document.documentElement.lang),code);assert.equal(await page.locator('link[rel="preload"][as="image"]').count(),0);assert(!await page.locator('.installation-instructions').evaluate(el=>/[А-Яа-яЁё]/.test(el.textContent))||code==='uk')}
  check(true,`${width}: direct installation links load selected-language instructions without hero preloads`);
  await context.close();
 }
 check(errors.length===0,'No uncaught browser errors');await writeFile(path.join(out,'ui-'+engine+'.json'),JSON.stringify({engine,checks,errors},null,2));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
