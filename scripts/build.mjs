import {mkdir,rm,cp,readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
await rm('dist',{recursive:true,force:true});await mkdir('dist',{recursive:true});
await cp('public','dist',{recursive:true});await cp('vendor','dist/vendor',{recursive:true});await cp('src','dist/src',{recursive:true});await cp('index.html','dist/index.html');
async function files(dir){let out=[];for(const d of await readdir(dir,{withFileTypes:true})){const p=`${dir}/${d.name}`;if(d.isDirectory())out.push(...await files(p));else out.push(p)}return out}
const paths=(await files('dist')).filter(p=>!p.endsWith('/sw.js'));let hash=createHash('sha256');for(const p of paths)hash.update(await readFile(p));const version=hash.digest('hex').slice(0,14);
const sw=(await readFile('scripts/sw-template.js','utf8')).replace('__VERSION__',version).replace('__FILES__',JSON.stringify(['./',...paths.map(p=>'./'+p.slice(5))]));await writeFile('dist/sw.js',sw);await writeFile('dist/.nojekyll','');console.log(`Built ${paths.length} files, cache ${version}`);
