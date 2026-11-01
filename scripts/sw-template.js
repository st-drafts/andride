const RELEASE=__RELEASE__;
const CACHE='andride-__VERSION__';const FILES=__FILES__;
const SITE_VERSION='__SITE_VERSION__',SITE_FILES=__SITE_FILES__;
function publicResponse(response){
 const headers=new Headers(response.headers);headers.set('Cache-Control','no-cache');
 return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}
async function cacheSiteAliases(cache){
 for(const path of SITE_FILES){
  const url=new URL(path,self.registration.scope),response=await cache.match(url);
  if(response){url.searchParams.set('site-v',SITE_VERSION);await cache.put(url,publicResponse(response))}
 }
}
// A legacy worker can keep serving its old installation-only HTML while a
// new worker waits for the installed app to close. Refresh its entry
// documents after precaching succeeds; running app code and personal data stay
// untouched, and no forced activation/reload interrupts an open ride import.
async function refreshCachedEntry(){
 const current=await caches.open(CACHE),entry=await current.match(new URL('./index.html',self.registration.scope));
 if(!entry)return;
 const previous=(await caches.keys()).filter(key=>key.startsWith('andride-')&&!key.startsWith('andride-map-')&&key!==CACHE);
 const bootstrap=await current.match(new URL('./src/entry.js',self.registration.scope));
 await Promise.all(previous.map(async key=>{const cache=await caches.open(key);await Promise.all(['./','./index.html'].map(path=>cache.put(new URL(path,self.registration.scope),entry.clone())));if(bootstrap)await cache.put(new URL('./src/entry.js',self.registration.scope),bootstrap.clone())}));
}
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(async c=>{await c.addAll(FILES.map(file=>new Request(new URL(file,self.registration.scope),{cache:'reload'})));await cacheSiteAliases(c)}).then(refreshCachedEntry)));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('andride-')&&!k.startsWith('andride-map-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('message',event=>{if(event.data==='ACTIVATE_UPDATE')self.skipWaiting();else if(event.data?.type==='RELEASE_INFO')event.ports[0]?.postMessage(RELEASE)});
self.addEventListener('fetch',event=>{const u=new URL(event.request.url);if(event.request.method!=='GET'||u.origin!==self.location.origin)return;event.respondWith((async()=>{
 if(event.request.mode==='navigate'){
  const fallback=async()=>{const current=await caches.open(CACHE);return await current.match(new URL('./index.html',self.registration.scope))};
  try{const response=await fetch(event.request,{cache:'no-cache'});return response.ok?response:await fallback()||response}catch(error){const cached=await fallback();if(cached)return cached;throw error}
 }
 // Public pages update independently of the waiting app worker. Only tagged
 // landing resources use the network; installed-app modules retain their cache.
 if(u.searchParams.has('site-v')&&SITE_FILES.some(path=>new URL(path,self.registration.scope).pathname===u.pathname)){
  const current=await caches.open(CACHE),canonical=new URL(u);canonical.search='';
  const fallback=async()=>await current.match(event.request)||await caches.match(event.request)||await current.match(canonical);
  try{
   const response=await fetch(event.request,{cache:'no-cache'});
   if(!response.ok)return await fallback()||response;
   const fresh=publicResponse(response);
   if(u.searchParams.get('site-v')===SITE_VERSION)event.waitUntil(current.put(event.request,fresh.clone()).catch(()=>{}));
   return fresh;
  }catch(error){const cached=await fallback();if(cached)return cached;throw error}
 }
 if(u.searchParams.has('landing-v')&&['./src/landing.js','./src/landing.css','./src/landing-copy.js','./src/installation.js','./src/installation-copy.js'].some(path=>new URL(path,self.registration.scope).pathname===u.pathname)){
  const current=await caches.open(CACHE),canonical=new URL(u);canonical.search='';const hit=await current.match(canonical);if(hit)return hit;return await fetch(event.request);
 }
 const hit=await caches.match(event.request);if(hit)return hit;return await fetch(event.request);
})())});
