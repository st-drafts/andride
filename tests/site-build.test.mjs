import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,copyFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

test('build fingerprints public entry, imports and font URLs automatically and creates offline aliases',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'andride-site-build-'));
 try{
  for(const dir of ['scripts','src','vendor','public/assets/landing'])await mkdir(path.join(root,dir),{recursive:true});
  await copyFile(new URL('../scripts/build.mjs',import.meta.url),path.join(root,'scripts/build.mjs'));
  await copyFile(new URL('../scripts/sw-template.js',import.meta.url),path.join(root,'scripts/sw-template.js'));
  for(const file of ['legacy-copy.js','landing-copy.js','language-catalog.js','legacy-browser.js','legacy-browser.css','browser-gate.js'])await copyFile(new URL('../src/'+file,import.meta.url),path.join(root,'src',file));
  const files={
   'package.json':'{"type":"module","version":"1.0.65"}',
   'src/release-notes.js':'export const releaseNotes={displayVersion:"1.65",language:"en",changes:[]};',
   'index.html':'<script type="module" src="./src/entry.js?site-v=__SITE_VERSION__"></script>',
   'src/entry.js':'import("./landing.js?site-v=__SITE_VERSION__");',
   'src/landing.js':'import "./installation.js?site-v=__SITE_VERSION__";',
   'src/installation.js':'export const value="__SITE_VERSION__";',
   'src/installation-qr.js':'import "./installation-platform.js?site-v=__SITE_VERSION__";',
   'src/installation-platform.js':'export const value=true;',
   'src/landing.css':"@font-face{src:url('../assets/InterDisplay-SemiBold.ttf')}",
   'public/assets/landing/phone.png':'legacy original',
   'public/assets/landing/phone.webp':'first image',
   'public/assets/InterDisplay-SemiBold.ttf':'font',
   'LICENSE':'license','THIRD_PARTY_NOTICES.txt':'notices'
  };
  for(const [name,content] of Object.entries(files))await writeFile(path.join(root,name),content);
  const build=()=>execFileSync(process.execPath,['scripts/build.mjs'],{cwd:root,encoding:'utf8'});
  const read=name=>readFile(path.join(root,'dist',name),'utf8');
  build();assert.equal(await read('assets/landing/phone.png'),'legacy original');const first=await read('index.html'),version=first.match(/site-v=([a-f0-9]{14})/)[1];
  const compatibility=await read('src/legacy-browser.js');assert(!compatibility.includes('__LEGACY_BROWSER_COPY__'));assert(compatibility.includes('Для работы приложения нужен более новый браузер.'));
  assert((await read('src/entry.js')).includes('site-v='+version));
  assert((await read('src/landing.js')).includes('site-v='+version));
  assert((await read('src/installation-qr.js')).includes('site-v='+version));
  assert((await read('src/landing.css')).includes('InterDisplay-SemiBold.ttf?site-v='+version));
  const worker=await read('sw.js');assert(worker.includes('cacheSiteAliases'));assert(worker.includes('./assets/landing/phone.webp'));assert(!worker.includes('./assets/landing/phone.png'));assert(!worker.includes('__SITE_'));assert(worker.includes('./src/installation-qr.js'));assert(worker.includes('./src/installation-platform.js'));
  build();assert.equal(await read('index.html'),first);
  await writeFile(path.join(root,'public/assets/landing/phone.webp'),'changed image');
  build();assert.notEqual(await read('index.html'),first);
  const second=await read('index.html');
  await writeFile(path.join(root,'scripts/sw-template.js'),(await readFile(path.join(root,'scripts/sw-template.js'),'utf8'))+'\n// Changed cache policy\n');
  build();assert.notEqual(await read('index.html'),second);
 }finally{await rm(root,{recursive:true,force:true})}
});
