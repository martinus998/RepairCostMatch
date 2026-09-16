const CACHE='rcm-shell-v14';
const BUILD='20260916-2215';
const CORE=['./','index.html','style.css','blueprint-home.css','pro-home.css','trust-center.css','trust-center.js','readability-tune.css','pro-package.css','smart-tools.css','smart-tools.js','quote-checker.css','quote-checker.js','provider-market.css','provider-market.js','diy-assistant.css','diy-assistant.js','other-problem.js','app.js','favicon.svg','foundation-repair-cost.html','basement-waterproofing-cost.html','foundation-cracks.html','bowing-basement-wall.html'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  const hot=['/billing-live.js','/provider-market.js','/diy-assistant.js','/diy-assistant.css','/style.css','/readability-tune.css','/other-problem.js'];
  if(hot.some(path=>url.pathname.endsWith(path))){
    const freshUrl=new URL(event.request.url);
    freshUrl.searchParams.set('rcm_build',BUILD);
    const freshRequest=new Request(freshUrl.toString(),{
      method:'GET',
      headers:event.request.headers,
      mode:event.request.mode,
      credentials:event.request.credentials,
      redirect:event.request.redirect,
      referrer:event.request.referrer,
      referrerPolicy:event.request.referrerPolicy,
      cache:'no-store'
    });
    event.respondWith(fetch(freshRequest,{cache:'no-store'}).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response;}).catch(()=>caches.match(event.request)));
    return;
  }
  if(event.request.mode==='navigate'){
    const freshNav=new Request(event.request,{cache:'no-store'});
    event.respondWith(fetch(freshNav).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response;}).catch(()=>caches.match(event.request).then(r=>r||caches.match('./'))));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response;})));
});