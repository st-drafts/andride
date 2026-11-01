import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {languages,setLanguage} from '../src/i18n.js';
import {installationCopies} from '../src/installation-copy.js';
import {installationURL,isMobileInstallation,detectInstallationPlatform,installationSteps,installationMarkup,installationQRMarkup} from '../src/installation.js';

const agents={ios:'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 Version/26.0 Mobile/15E148 Safari/604.1','ios-other':'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 CriOS/140.0 Mobile/15E148 Safari/604.1',android:'Mozilla/5.0 (Linux; Android 16) AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36','android-other':'Mozilla/5.0 (Linux; Android 16) AppleWebKit/537.36 Chrome/140.0 SamsungBrowser/28.0 Mobile Safari/537.36',mac:'Mozilla/5.0 (Macintosh; Intel Mac OS X 15_0) AppleWebKit/605.1.15 Version/26.0 Safari/605.1.15',desktop:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0 Safari/537.36 Edg/140.0','desktop-other':'Mozilla/5.0 (X11; Linux x86_64; rv:144.0) Gecko/20100101 Firefox/144.0'};
test('installation selects device and browser instructions, including iPad desktop user agents',()=>{
 for(const [platform,ua] of Object.entries(agents)){assert.equal(detectInstallationPlatform(ua,0),platform);assert.equal(isMobileInstallation(ua,0),['ios','ios-other','android','android-other'].includes(platform))}
 assert.equal(detectInstallationPlatform(agents.mac.replace('Version/26.0','Version/16.0'),0),'desktop-other');
 assert.equal(detectInstallationPlatform(agents.mac,5),'ios');assert.equal(isMobileInstallation(agents.mac,5),true);
 assert.equal(detectInstallationPlatform('Mozilla/5.0 (iPhone) Instagram Mobile',0),'ios-other');
});
test('every supported locale has complete installation copy and translated browser steps',async()=>{
 assert.deepEqual(Object.keys(installationCopies).sort(),languages.map(([code])=>code).sort());
 const keys=Object.keys(installationCopies.en).sort(),cyrillic=new Set(['ru','bg','be','kk','ky','tg','uk']);
 try{for(const [code] of languages){await setLanguage(code);assert.deepEqual(Object.keys(installationCopies[code]).sort(),keys);for(const text of Object.values(installationCopies[code]))assert(text.trim());
  for(const platform of Object.keys(agents)){
   const steps=installationSteps(code,platform);assert(steps.length>=1);
   for(const step of steps){assert(step.title&&step.text);if(!cyrillic.has(code))assert(!/[А-Яа-яЁё]/.test(step.text),`${code} ${platform}: ${step.text}`)}
   const html=installationMarkup(code,platform);assert(html.includes(`value="${platform}" selected`));assert(html.includes('wordmark-white.svg'));assert(html.includes('data-native-install hidden'));assert(!html.includes('data-landing-install'));assert(html.includes('data-landing-language'));if(code!=='ru')assert(!html.includes('>Язык<'),code);
  }
  const qr=installationQRMarkup(code);assert(qr.includes('install-qr.svg'));assert(qr.includes(installationURL(code)));assert(qr.includes(installationCopies[code].computer));
 }}finally{await setLanguage('ru')}
});
test('QR artwork points directly to installation and keeps a four-module quiet zone',async()=>{
 const svg=await readFile(new URL('../public/assets/landing/install-qr.svg',import.meta.url),'utf8');
 assert(svg.includes('https://st-drafts.github.io/andride/?install=1'));assert(svg.includes('viewBox="0 0 41 41"'));assert(svg.includes('shape-rendering="crispEdges"'));
});
