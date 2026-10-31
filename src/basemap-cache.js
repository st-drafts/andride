// Only tiles actually viewed are retained. No area prefetch or bulk download.
export const MAP_CACHE='andride-map-v1';
const SOURCE='https://tiles.openfreemap.org/planet',MAX_ENTRIES=160,MAX_BYTES=20*1024*1024,TTL=7*86400000;
const fresh=r=>{const age=Date.now()-Number(r?.headers.get('X-Andride-Saved'));return age>=0&&age<TTL};
const offline=()=>globalThis.navigator?.onLine===false;
async function cache(){try{return await globalThis.caches?.open(MAP_CACHE)}catch{return null}}
export async function clearMapCaches(){sizes=null;if(!globalThis.caches)return;for(const name of await caches.keys())if(name.startsWith('andride-map-'))await caches.delete(name)}
export async function readMapResource(url){try{return await (await cache())?.match(url)}catch{return null}}
let writes=Promise.resolve(),sizes=null;
async function cacheSizes(c){if(sizes)return sizes;const keys=await c.keys(),rows=await Promise.all(keys.map(async key=>[key.url,Number((await c.match(key))?.headers.get('X-Andride-Bytes'))||0]));sizes=new Map(rows);return sizes;}
async function request(url,signal,parse,fetcher){
 const controller=new AbortController(),abort=()=>controller.abort();if(signal?.aborted)abort();signal?.addEventListener('abort',abort,{once:true});const timer=setTimeout(abort,12000);
 try{const r=await fetcher(url,{signal:controller.signal,credentials:'omit',referrerPolicy:'strict-origin-when-cross-origin'});if(!r.ok)throw Error('map');return await parse(r)}finally{clearTimeout(timer);signal?.removeEventListener('abort',abort)}
}
export function saveMapResource(url,bytes,type,signal){
 writes=writes.catch(()=>{}).then(async()=>{
  if(signal?.aborted||bytes.byteLength>4*1024*1024)return;const c=await cache();if(!c||signal?.aborted)return;
  const response=new Response(bytes,{headers:{'Content-Type':type,'X-Andride-Bytes':String(bytes.byteLength),'X-Andride-Saved':String(Date.now())}});
  await c.delete(url);if(signal?.aborted)return;await c.put(url,response);
  const index=await cacheSizes(c);index.delete(url);index.set(url,bytes.byteLength);let total=[...index.values()].reduce((a,b)=>a+b,0);
  while(index.size>MAX_ENTRIES||total>MAX_BYTES){const [key,size]=index.entries().next().value;await c.delete(key);index.delete(key);total-=size;}
 });return writes.catch(()=>{});
}
export function validMapSource(value){return value&&Array.isArray(value.tiles)&&typeof value.tiles[0]==='string'&&/^https:\/\/tiles\.openfreemap\.org\/planet\/[a-zA-Z0-9_]+\/\{z\}\/\{x\}\/\{y\}\.pbf$/.test(value.tiles[0])}
export async function mapSource(signal,fetcher=fetch){
 const hit=await readMapResource(SOURCE);let saved;try{saved=hit&&await hit.json()}catch{}
 const use=value=>({url:value.tiles[0],maxZoom:Math.max(0,Math.min(14,Number.isInteger(value.maxzoom)?value.maxzoom:14))});
 if(validMapSource(saved)&&(fresh(hit)||offline()))return use(saved);
 try{const value=await request(SOURCE,signal,r=>r.json(),fetcher);if(!validMapSource(value))throw Error('map');await saveMapResource(SOURCE,new TextEncoder().encode(JSON.stringify(value)),'application/json',signal);return use(value)}catch(error){if(validMapSource(saved)&&!signal?.aborted)return use(saved);throw error}
}
export async function mapTile(url,signal,fetcher=fetch,validate=()=>{}){
 // Keep viewed geography usable across weekly source-version changes.
 const key=url.replace(/\/planet\/[a-zA-Z0-9_]+\//,'/planet/viewport/'),hit=await readMapResource(key);
 let cached=null;if(hit){try{cached=await hit.arrayBuffer();validate(cached)}catch{cached=null;try{await (await cache())?.delete(key);sizes?.delete(key)}catch{}}}
 if(cached&&(fresh(hit)||offline()))return cached;
 try{const bytes=await request(url,signal,async r=>{if(Number(r.headers.get('Content-Length'))>4*1024*1024)throw Error('map');const body=await r.arrayBuffer();if(body.byteLength>4*1024*1024)throw Error('map');validate(body);return body},fetcher);await saveMapResource(key,bytes,'application/x-protobuf',signal);return bytes}catch(error){if(cached&&!signal?.aborted)return cached;throw error}
}
