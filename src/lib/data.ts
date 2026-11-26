import raw from '../data/quran.json';
import letters from '../../data/letters.json';

export type Word = {
  t: string; // metin (Türk imlası)
  wbw: string; // kelime ses dosyası, ör. 001_001_001
  tm: [number, number] | null; // ayet sesi içinde başlangıç/bitiş (ms)
  sh: boolean; // şedde var mı
  sk: boolean; // cezim var mı
};

export type AyahItem = {
  type: 'ayah' | 'besmele';
  key: string;
  s: number;
  a: number;
  audio: string;
  words: Word[];
};

export type SuraItem = { type: 'sura'; name: string };
export type Item = AyahItem | SuraItem;
export type Page = { no: number; title: string; items: Item[] };

export const PAGES: Page[] = (raw as { pages: Page[] }).pages;

/** Sayfadaki çalınabilir öğeler (besmele dahil). */
export const playable = (p: Page) => p.items.filter((i): i is AyahItem => i.type !== 'sura');
/** Sayfadaki numaralı ayetler (yıldız hesabı için). */
export const ayahsOf = (p: Page) => playable(p).filter((i) => i.type === 'ayah');
export const pageByNo = (no: number) => PAGES.find((p) => p.no === no)!;

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
export const arNum = (n: number) => String(n).replace(/\d/g, (d) => AR_DIGITS[+d]);

// ---- Harf çözümleme (oyunlar ve yardım modu için) ----
const MARK = /[ً-ٰٟۖ-ۭ]/;

/** Kelimeyi "harf + üzerindeki işaretler" kümelerine böler. */
export function clusters(word: string): string[] {
  const out: string[] = [];
  for (const ch of word) {
    if (MARK.test(ch) && out.length) out[out.length - 1] += ch;
    else out.push(ch);
  }
  return out;
}

const NORMAL: Record<string, string> = { 'آ': 'ا', 'أ': 'ا', 'إ': 'ا', 'ٱ': 'ا', 'ى': 'ي', 'ئ': 'ي', 'ؤ': 'و' };
export const baseOf = (cluster: string) => {
  const b = [...cluster].find((c) => !MARK.test(c)) ?? '';
  return NORMAL[b] ?? b;
};
export const baseLetters = (word: string) => clusters(word).map(baseOf);

// Harf adları ve karıştırılan harf çiftleri (şekilce benzerler, sonra sesçe yakınlar): data/letters.json
export const LETTER_NAMES: Record<string, string> = letters.names;
export const CONFUSABLE = letters.confusable as [string, string][];
