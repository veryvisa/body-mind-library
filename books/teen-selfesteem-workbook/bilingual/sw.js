// Offline cache: pages network-first, assets cache-first. Cache name changes with every build. PDFs are not pre-cached.
const PFX = 'bml-teen-selfesteem-workbook-bilingual-';
const CACHE = 'bml-teen-selfesteem-workbook-bilingual-3d3386f842b';
const FILES = ["activity-01.html", "activity-02.html", "activity-03.html", "activity-04.html", "activity-05.html", "activity-06.html", "activity-07.html", "activity-08.html", "activity-09.html", "activity-10.html", "activity-11.html", "activity-12.html", "activity-13.html", "activity-14.html", "activity-15.html", "activity-16.html", "activity-17.html", "activity-18.html", "activity-19.html", "activity-20.html", "activity-21.html", "activity-22.html", "activity-23.html", "activity-24.html", "activity-25.html", "activity-26.html", "activity-27.html", "activity-28.html", "activity-29.html", "activity-30.html", "activity-31.html", "activity-32.html", "activity-33.html", "activity-34.html", "activity-35.html", "activity-36.html", "activity-37.html", "activity-38.html", "activity-39.html", "activity-40.html", "activity-41.html", "activity-42.html", "activity-43.html", "activity-44.html", "activity-45.html", "activity-46.html", "app.js", "cards.html", "downloads.html", "img/cat-listen.svg", "img/cat-read.svg", "img/cat-sign.svg", "img/cat-sleep.svg", "img/cat-think.svg", "index.html", "listen.html", "manifest.webmanifest", "map.html", "notes.html", "pace.html", "part-1.html", "part-2.html", "part-3.html", "part-4.html", "part-5.html", "part-6.html", "style.css", "../../../vendor/mermaid-11.6.0.min.js", "your-turn.html"];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k.startsWith(PFX)).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate' || req.destination === 'document') {
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return r; }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
  } else {
    e.respondWith(caches.match(req, { ignoreSearch: true }).then(r => r || fetch(req)));
  }
});
