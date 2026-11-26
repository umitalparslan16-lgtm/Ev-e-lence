// Uygulamaya gömülecek ses dosyalarını indirir (GitHub Actions'ta derlemeden önce çalışır).
// İndirilemeyen dosyalar için uygulama çalışırken internetteki kaynağa düşer.
import { readFileSync, mkdirSync, writeFileSync, existsSync, statSync } from 'node:fs';

const root = new URL('..', import.meta.url);
const { pages } = JSON.parse(readFileSync(new URL('src/data/quran.json', root), 'utf8'));

const SRC = {
  husary: 'https://everyayah.com/data/Husary_Muallim_128kbps/',
  minshawy: 'https://everyayah.com/data/Minshawy_Teacher_128kbps/',
  wbw: 'https://audio.qurancdn.com/wbw/',
};

const ayahFiles = new Set();
const wordFiles = new Set();
for (const p of pages)
  for (const it of p.items) {
    if (!it.words) continue;
    ayahFiles.add(it.audio);
    for (const w of it.words) wordFiles.add(w.wbw);
  }

const jobs = [
  ...[...ayahFiles].map((f) => ['husary', f]),
  ...[...ayahFiles].map((f) => ['minshawy', f]),
  ...[...wordFiles].map((f) => ['wbw', f]),
];

async function get(kind, file) {
  const dir = new URL(`public/audio/${kind}/`, root);
  mkdirSync(dir, { recursive: true });
  const out = new URL(`${file}.mp3`, dir);
  if (existsSync(out) && statSync(out).size > 1000) return true;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(SRC[kind] + file + '.mp3');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 1000) throw new Error('çok küçük');
      writeFileSync(out, buf);
      return true;
    } catch (e) {
      if (attempt === 4) {
        console.warn(`! ${kind}/${file}: ${e.message}`);
        return false;
      }
      await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
    }
  }
}

const result = {};
let i = 0;
async function worker() {
  while (i < jobs.length) {
    const [kind, file] = jobs[i++];
    const ok = await get(kind, file);
    result[kind] ??= { ok: 0, fail: 0 };
    result[kind][ok ? 'ok' : 'fail']++;
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
console.log('Ses indirme özeti:', JSON.stringify(result));
if (!result.husary?.ok) {
  console.error('Husarî sesleri indirilemedi.');
  process.exitCode = 1;
}
