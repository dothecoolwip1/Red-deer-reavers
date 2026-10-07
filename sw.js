const CACHE="reavers-forged-v25";
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
  "./styles.css?v=25",
  "./app.js?v=25",
  "./team-data.js?v=25",
  "./buhurtos.js?v=25",
  "./fighter.js?v=25",
  "./gallery.js?v=25",
  "./assets/icons.svg",
  "./assets/crest-96.webp",
  "./assets/crest-256.webp",
  "./assets/crest-640.webp",
  "./vendor/fonts/grenze-gotisch-latin-wght-normal.woff2",
  "./vendor/fonts/cinzel-latin-wght-normal.woff2",
  "./vendor/fonts/alegreya-sans-latin-400-normal.woff2",
  "./vendor/fonts/alegreya-sans-latin-700-normal.woff2",
  "./vendor/photoswipe/photoswipe.css?v=25",
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

/* Push notifications for the members area (merged from the old reavers-sw.js). The route in the payload is relative to this site. */
self.addEventListener("push", event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) {}
  const base = new URL("./", self.registration.scope).href;
  const url = data.route ? new URL(data.route, base).href : new URL("members.html", base).href;
  event.waitUntil(self.registration.showNotification(data.title || "Red Deer Reavers", { body: data.body || "", tag: data.tag || "red-deer-reavers", icon: "assets/icon-192.png", data: { url } }));
});
self.addEventListener("notificationclick", event => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || new URL("members.html", self.registration.scope).href;
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(wins => {
    for (const w of wins) { if (w.url.startsWith(self.registration.scope) && "focus" in w) { w.navigate(url); return w.focus(); } }
    return clients.openWindow ? clients.openWindow(url) : null;
  }));
});
