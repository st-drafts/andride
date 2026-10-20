const CACHE='andride-__VERSION__';const FILES=__FILES__;
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('andride-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('message',event=>{if(event.data==='ACTIVATE_UPDATE')self.skipWaiting()});
self.addEventListener('fetch',event=>{const u=new URL(event.request.url);if(event.request.method!=='GET'||u.origin!==self.location.origin)return;event.respondWith((async()=>{const hit=await caches.match(event.request);if(hit)return hit;try{return await fetch(event.request)}catch(error){if(event.request.mode==='navigate')return await caches.match(new URL('./index.html',self.registration.scope));throw error}})())});
