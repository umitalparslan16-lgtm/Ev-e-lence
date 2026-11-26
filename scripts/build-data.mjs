// data/mushaf-tr.txt + data/timing-husary-muallim.json -> src/data/quran.json
// Kelime sayılarını Tanzil referansıyla ve zamanlamayla karşılaştırır; uyuşmazlıkta durur.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const root = new URL('..', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');

const parse = (txt) => {
  const m = new Map();
  for (const line of txt.split('\n')) {
    if (!line.trim() || line.startsWith('#')) continue;
    const [s, a, text] = line.split('|');
    m.set(`${s}:${a}`, text.trim());
  }
  return m;
};

const tr = parse(read('data/mushaf-tr.txt'));
const ref = parse(read('data/tanzil-uthmani-ref.txt'));
const timing = JSON.parse(read('data/timing-husary-muallim.json')).ayahs;

const SHADDA = 'ّ';
const SUKUN = 'ْ';
const pad3 = (n) => String(n).padStart(3, '0');

function words(text, s, a, timKey) {
  const ws = text.replace(/~/g, 'ٖ').split(' ');
  const tim = timKey ? timing[timKey] : null;
  if (tim && tim.length !== ws.length) throw new Error(`zamanlama uyuşmazlığı ${timKey}`);
  return ws.map((t, i) => ({
    t,
    wbw: `${pad3(s)}_${pad3(a)}_${pad3(i + 1)}`,
    tm: tim ? tim[i] : null,
    sh: t.includes(SHADDA),
    sk: t.includes(SUKUN),
  }));
}

function ayah(s, a) {
  const key = `${s}:${a}`;
  const text = tr.get(key);
  if (!text) throw new Error(`eksik ayet ${key}`);
  const r = ref.get(key);
  if (r.split(' ').length !== text.split(' ').length) throw new Error(`kelime sayısı uyuşmazlığı ${key}`);
  return { type: 'ayah', key, s, a, audio: `${pad3(s)}${pad3(a)}`, words: words(text, s, a, key) };
}

const range = (s, from, to) => Array.from({ length: to - from + 1 }, (_, i) => ayah(s, from + i));

const besmele = {
  type: 'besmele',
  key: 'besmele',
  s: 1,
  a: 1,
  audio: '001001',
  words: words(tr.get('BESMELE:0'), 1, 1, '1:1'),
};

const pages = [
  { no: 1, title: 'Fâtiha', items: [{ type: 'sura', name: 'سُورَةُ الْفَاتِحَةِ' }, ...range(1, 1, 7)] },
  { no: 2, title: 'Bakara 1-5', items: [{ type: 'sura', name: 'سُورَةُ الْبَقَرَةِ' }, besmele, ...range(2, 1, 5)] },
  { no: 3, title: 'Bakara 6-16', items: range(2, 6, 16) },
];

mkdirSync(new URL('src/data/', root), { recursive: true });
writeFileSync(new URL('src/data/quran.json', root), JSON.stringify({ pages }));
const n = pages.flatMap((p) => p.items.filter((i) => i.words)).reduce((x, i) => x + i.words.length, 0);
console.log(`quran.json yazıldı: ${pages.length} sayfa, ${n} kelime`);
