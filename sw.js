const CACHE='rcm-shell-v14';
const CORE=['./','index.html','style.css','blueprint-home.css','pro-home.css','trust-center.css','trust-center.js','readability-tune.css','pro-package.css','smart-tools.css','smart-tools.js','quote-checker.css','quote-checker.js','provider-market.css','provider-market.js','diy-assistant.css','diy-assistant.js','other-problem.js','app.js','favicon.svg','foundation-repair-cost.html','basement-waterproofing-cost.html','foundation-cracks.html','bowing-basement-wall.html'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  if(url.pathname.endsWith('/billing-live.js')||url.pathname.endsWith('/provider-market.js')||url.pathname.endsWith('/diy-assistant.js')||url.pathname.endsWith('/diy-assistant.css')||url.pathname.endsWith('/style.css')||url.pathname.endsWith('/readability-tune.css')||url.pathname.endsWith('/other-problem.js')){
    event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response;}).catch(()=>caches.match(event.request)));
    return;
  }
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response;}).catch(()=>caches.match(event.request).then(r=>r||caches.match('./'))));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response;})));
});