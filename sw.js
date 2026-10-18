const CACHE="reavers-forged-v31";
const STATIC=[
  "./",
  "./index.html",
  "./team.html",
  "./fighter.html",
  "./training.html",
  "./events.html",
  "./community.html",
  "./media.html",
  "./social.html",
  "./styles.css?v=27",
  "./app.js?v=27",
  "./team-data.js?v=27",
  "./buhurtos.js?v=27",
  "./members.html",
  "./members.webmanifest",
  "./assets/members-app.css?v=1",
  "./assets/js/buhurtos-config.js",
  "./assets/js/member-portal.js",
  "./assets/js/vendor/supabase-js-2.117.2.umd.js",
  "./fighter.js?v=27",
  "./gallery.js?v=27",
  "./assets/icons.svg",
  "./assets/crest-96.webp",
  "./assets/crest-256.webp",
  "./assets/crest-640.webp",
  "./vendor/fonts/grenze-gotisch-latin-wght-normal.woff2",
  "./vendor/fonts/cinzel-latin-wght-normal.woff2",
  "./vendor/fonts/alegreya-sans-latin-400-normal.woff2",
  "./vendor/fonts/alegreya-sans-latin-700-normal.woff2",
  "./vendor/photoswipe/photoswipe.css?v=27",
  "./vendor/photoswipe/photoswipe-lightbox.esm.js",
  "./vendor/photoswipe/photoswipe.esm.js"
];

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(STATIC)));
  self.skipWaiting();
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const req=event.request;
  const sameOrigin=req.url.startsWith(self.location.origin);
  // Live data (team API, BuhurtOS) is never cached by the worker; the pages show their own fallbacks.
  if(!sameOrigin)return;
  const alwaysFresh=req.mode==="navigate"||req.destination==="style"||req.destination==="script"||req.url.includes("/assets/social/feed.json");

  if(alwaysFresh){
    event.respondWith(
      fetch(req,{cache:"no-store"})
        .then(response=>{
          if(response.ok)caches.open(CACHE).then(cache=>cache.put(req,response.clone()));
          return response;
        })
        .catch(async()=>{
          const cached=await caches.match(req,{ignoreSearch:req.mode==="navigate"});
          if(cached)return cached;
          if(req.mode==="navigate")return caches.match("./index.html");
          return Response.error();
        })
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached=>cached||fetch(req).then(response=>{
      if(response.ok)caches.open(CACHE).then(cache=>cache.put(req,response.clone()));
      return response;
    }))
  );
});
