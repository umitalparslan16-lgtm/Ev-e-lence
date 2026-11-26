// Derlemeden sonra dist/ içindeki tüm dosyaları önbelleğe alan bir service worker üretir.
// Böylece uygulama (sesler dahil) bir kez açıldıktan sonra internetsiz çalışır.
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const dist = new URL('../dist/', import.meta.url).pathname;
const files = [];
const walk = (d) => {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (f !== 'sw.js') files.push(relative(dist, p).split('\\').join('/'));
  }
};
walk(dist);
const hash = createHash('sha1');
for (const f of files.sort()) hash.update(f).update(readFileSync(join(dist, f)));
const version = hash.digest('hex').slice(0, 10);
const list = ['./', ...files.map((f) => './' + f)];

writeFileSync(
  join(dist, 'sw.js'),
  `const V = 'hudhud-${version}';
const FILES = ${JSON.stringify(list)};
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(V).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const remoteAudio = /everyayah\\.com|qurancdn\\.com/.test(url.host);
  if (url.origin !== location.origin && !remoteAudio) return;
  // Range isteklerinde (ses sarma) önbellekteki tam dosyayı ver
  e.respondWith(
    caches.match(req.url, { ignoreSearch: true }).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok && (remoteAudio || url.origin === location.origin) && res.status === 200) {
            const copy = res.clone();
            caches.open(V).then((c) => c.put(req.url, copy));
          }
          return res;
        })
    )
  );
});
`
);
console.log(`sw.js: ${list.length} dosya, sürüm ${version}`);
