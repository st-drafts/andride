import {releaseNotes} from '../src/release-notes.js';
import {legacyBrowserCopies} from '../src/legacy-copy.js';
import {mkdir,rm,cp,readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';

await rm('dist',{recursive:true,force:true});
await mkdir('dist',{recursive:true});
await cp('public','dist',{recursive:true});
await cp('vendor','dist/vendor',{recursive:true});
await cp('src','dist/src',{recursive:true});
await cp('index.html','dist/index.html');
await cp('LICENSE','dist/LICENSE.txt');
await cp('THIRD_PARTY_NOTICES.txt','dist/THIRD_PARTY_NOTICES.txt');
// Old engines receive only ES5 and normal-flow CSS; modern boot stays inline.
const compatibilityJSON=JSON.stringify(legacyBrowserCopies).replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
const compatibilityCSS=await readFile('src/legacy-browser.css','utf8'),browserGate=await readFile('src/browser-gate.js','utf8');
await writeFile('dist/src/legacy-browser.js',(await readFile('src/legacy-browser.js','utf8')).replace('__LEGACY_BROWSER_COPY__',()=>compatibilityJSON));
await writeFile('dist/index.html',(await readFile('dist/index.html','utf8'))
 .replace('__LEGACY_BROWSER_CSS__',()=>compatibilityCSS)
 .replace('__BROWSER_GATE__',()=>browserGate));
async function files(dir){
 const out=[];
 for(const d of await readdir(dir,{withFileTypes:true})){
  const p=`${dir}/${d.name}`;
  if(d.isDirectory())out.push(...await files(p));else out.push(p);
 }
 return out;
}
const paths=(await files('dist')).filter(p=>!p.endsWith('/sw.js')).sort();
// Keep legacy images and type declarations available on the server. Offline
// installations only need the current image formats and runtime files.
const pathSet=new Set(paths);
const precachePaths=paths.filter(p=>!p.endsWith('.d.ts')&&
 !(p.startsWith('dist/assets/landing/')&&p.endsWith('.png')&&pathSet.has(p.slice(0,-4)+'.webp')));
const release={...releaseNotes,version:JSON.parse(await readFile('package.json','utf8')).version};
// Fingerprint inputs before substituting the fingerprint itself. Any public
// asset change changes the URLs, even if a release number was not edited.
const hash=createHash('sha256');hash.update(release.version+'\0');
hash.update(await readFile('scripts/sw-template.js'));hash.update(await readFile('scripts/build.mjs'));
for(const p of paths){hash.update(p+'\0');hash.update(await readFile(p));hash.update('\0')}
const version=hash.digest('hex').slice(0,14);
for(const p of ['dist/index.html','dist/src/entry.js','dist/src/landing.js','dist/src/installation.js','dist/src/installation-qr.js'].filter(p=>pathSet.has(p))){
 await writeFile(p,(await readFile(p,'utf8')).replaceAll('__SITE_VERSION__',version));
}
const css='dist/src/landing.css';
await writeFile(css,(await readFile(css,'utf8')).replace(/url\((['"])(\.\.\/assets\/[^'"?]+)\1\)/g,(_,quote,url)=>`url(${quote}${url}?site-v=${version}${quote})`));
const siteFiles=['./src/legacy-browser.js','./src/entry.js','./src/landing.js','./src/landing.css','./src/landing-copy.js','./src/installation.js','./src/installation-copy.js','./src/installation-platform.js','./src/installation-qr.js','./assets/InterDisplay-SemiBold.ttf',...precachePaths.filter(p=>p.startsWith('dist/assets/landing/')).map(p=>'./'+p.slice(5))];
const sw=(await readFile('scripts/sw-template.js','utf8'))
 .replace('__VERSION__',version).replaceAll('__SITE_VERSION__',version)
 .replace('__SITE_FILES__',JSON.stringify(siteFiles))
 .replace('__RELEASE__',JSON.stringify(release))
 .replace('__FILES__',JSON.stringify(['./',...precachePaths.map(p=>'./'+p.slice(5))]));
await writeFile('dist/sw.js',sw);
await writeFile('dist/.nojekyll','');
console.log(`Built ${paths.length} files, cache ${version}`);
