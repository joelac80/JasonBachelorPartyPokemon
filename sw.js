/* sw.js — the offline heart of the PWA.
   INSTALL: fetches index.html, parses every same-origin <script src> /
   <link href> out of it, and pre-caches the whole app (~8MB — every view,
   move, and baked sprite) plus the icons. The list is derived from
   index.html itself, so adding a new data/view file never needs a manual
   cache-list edit — just bump VERSION to roll everyone forward.
   FETCH: network-first with cache fallback — fresh while online, fully
   playable in a cabin with no bars. Navigations fall back to the cached
   index.html (hash routing makes every page the same document).
   Live sync (Firestore) is the one thing that needs a signal — the app
   already degrades to local play + localStorage, and the append-only
   merge folds everything back together when the connection returns. */
const VERSION = "bachhub-v23";

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    const res = await fetch("index.html", { cache: "no-cache" });
    const html = await res.text();
    await c.put("index.html", new Response(html, { headers: { "Content-Type": "text/html" } }));
    await c.put("./", new Response(html, { headers: { "Content-Type": "text/html" } }));
    const urls = new Set([
      "manifest.webmanifest",
      "assets/icon-192.png", "assets/icon-512.png",
      "assets/apple-touch-icon.png", "assets/favicon.svg",
    ]);
    const re = /(?:src|href)="([^"]+)"/g;
    let m;
    while ((m = re.exec(html))) {
      const u = m[1];
      if (u && !/^(https?:|\/\/|#|data:|mailto:)/.test(u)) urls.add(u);
    }
    // Small batches; a single miss must never sink the install.
    const list = [...urls];
    for (let i = 0; i < list.length; i += 8) {
      await Promise.all(list.slice(i, i + 8).map((u) => c.add(u).catch(() => {})));
    }
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  let url;
  try { url = new URL(req.url); } catch (_) { return; }
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() =>
        caches.match(req, { ignoreSearch: true })
          .then((r) => r || (req.mode === "navigate" ? caches.match("index.html") : Response.error()))
      )
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) { if ("focus" in c) return c.focus(); }
      return self.clients.openWindow("./");
    })
  );
});
