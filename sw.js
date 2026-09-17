const CACHE_NAME="catatan-shopiput-offline-v72";
const ROOT=new URL("./",self.registration.scope).href;
const INDEX=new URL("./index.html",self.registration.scope).href;
const ASSETS=[
  ROOT,INDEX,
  new URL("./manifest.json",self.registration.scope).href,
  new URL("./icon-192.png",self.registration.scope).href,
  new URL("./icon-512.png",self.registration.scope).href,
  new URL("./screenshot-mobile.png",self.registration.scope).href,
  new URL("./screenshot-desktop.png",self.registration.scope).href,
  new URL("./fontawesome-offline.css",self.registration.scope).href,
  new URL("./fontawesome-webfont.ttf",self.registration.scope).href
];

self.addEventListener("install",event=>{
  event.waitUntil((async()=>{
    const c=await caches.open(CACHE_NAME);
    for(const u of ASSETS){
      try{
        const r=await fetch(u,{cache:"no-store"});
        if(r.ok)await c.put(u,r.clone());
      }catch(e){}
    }
    await self.skipWaiting();
  })());
});

self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const req=event.request;
  const url=new URL(req.url);

  if(req.mode==="navigate"){
    event.respondWith((async()=>{
      const c=await caches.open(CACHE_NAME);
      const cached=await c.match(req);
      if(cached)return cached;
      const root=await c.match(ROOT);
      if(root && !navigator.onLine)return root;
      try{
        const r=await fetch(req);
        if(r.ok){
          await c.put(req,r.clone());
          if(url.pathname===new URL(ROOT).pathname)await c.put(ROOT,r.clone());
        }
        return r;
      }catch(e){
        return root || await c.match(INDEX) || new Response(
          "Catatan Shopiput sedang offline.",
          {status:503,headers:{"Content-Type":"text/plain;charset=utf-8"}}
        );
      }
    })());
    return;
  }

  if(url.origin===self.location.origin){
    event.respondWith((async()=>{
      const c=await caches.open(CACHE_NAME);
      const cached=await c.match(req);
      if(cached)return cached;
      try{
        const r=await fetch(req);
        if(r.ok)await c.put(req,r.clone());
        return r;
      }catch(e){return Response.error();}
    })());
  }
});
