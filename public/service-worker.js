const CACHE='activa360-v1.2-cloud-d1';
const CORE=['./','./index.html','./css/styles.css','./js/app.js','./js/auth.js','./js/database.js','./js/router.js','./js/seed.js','./manifest.webmanifest','./assets/images/logo-activa-horizontal-white.png','./assets/images/isotipo-activa-white.png','./assets/images/isotipo-activa-blue.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);
  if(url.pathname.startsWith('/api/')) return;
  event.respondWith(fetch(event.request).then(resp=>{const copy=resp.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));return resp;}).catch(()=>caches.match(event.request).then(r=>r||caches.match('./index.html'))));
});
