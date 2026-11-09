// Offline-Speicher: liefert sofort aus dem Cache und aktualisiert im Hintergrund.
// Nach Änderungen die Versionsnummer in CACHE erhöhen.
const CACHE = 'beer-v3';
const FILES = ['./', 'index.html', 'app.js', 'qr.js', 'config.js', 'manifest.webmanifest', 'icon.svg', 'icon-180.png', 'icon-192.png', 'icon-512.png',
  'fonts/oswald.woff2', 'fonts/oswald-ext.woff2', 'fonts/sourcesans.woff2', 'fonts/sourcesans-ext.woff2', 'fonts/sourcesans-italic.woff2'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const net = fetch(req).then(async r => {
    if (r.ok) { const copy = r.clone(); const c = await caches.open(CACHE); await c.put(req, copy); }
    return r;
  });
  e.respondWith(caches.match(req, { ignoreSearch: true })
    .then(hit => hit || net)
    .catch(() => caches.match('./')));
  e.waitUntil(net.catch(() => {}));
});
