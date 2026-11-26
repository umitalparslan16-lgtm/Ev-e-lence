import { useEffect, useState } from 'preact/hooks';
import { getState } from './store';
import { loadRec, voiceKey } from './recorder';
import { main, wordEl } from './audio';

// Hüdhüd'ün sabit cümleleri. Ebeveyn köşesinden her biri kendi sesinizle kaydedilebilir;
// kayıt varsa o çalar, yoksa telefonun Türkçe sesi okur. {ad} = çocuğun adı.
export const LINES = {
  hosgeldin: "Esselâmü aleyküm {ad}! Ben Hüdhüd. Bugün birlikte Kur'an okuyalım mı?",
  durakSec: 'Hangi durağa gidelim? Parlayan durağa dokun!',
  durak: 'Bu durakta üç yıldız var. Dinle, oku, oyna!',
  dinleBasla: 'Önce güzelce dinleyelim. Renklenen kelimeyi gözünle takip et.',
  dinleBitti: 'Maşallah {ad}! Sayfanın hepsini dinledin. Bir yıldız kazandın!',
  okuBasla: 'Şimdi sıra sende! Kırmızı düğmeye dokun ve ayeti oku.',
  okuKayit: 'Ne güzel okudun! Hadi bir sonraki ayete geçelim.',
  okuBitti: 'Bârekallah {ad}! Bütün ayetleri okudun. Bir yıldız daha!',
  oynaBasla: 'Haydi oynayalım! Dikkatlice bak.',
  seddeSoru: 'Şeddeli kelimeyi bul!',
  cezimSoru: 'Cezimli kelimeyi bul!',
  duySoru: 'Duyduğun kelimeyi bul!',
  dogru1: 'Aferin!',
  dogru2: 'Harika!',
  dogru3: 'Maşallah!',
  yanlis: 'Bir daha bakalım mı? Sen yaparsın!',
  oynaBitti: 'Süpersin {ad}! Oyunu bitirdin. Bir yıldız kazandın!',
  durakTamam: 'Üç yıldızın hepsini topladın! Yeni durak açıldı!',
  tekrar: 'Tekrar ettiğin için bahçene bir yıldız daha!',
  bahce: 'Burası senin bahçen. Yıldızlarınla çiçek ve ağaç ekebilirsin.',
  ekildi: 'Ne güzel oldu!',
  altin: 'Bir altın yıldızın var! Kediciğe hediye alabilirsin.',
  kedi: 'Kedicik seni çok seviyor!',
  gorevDinle: 'Bugünün görevi: sayfayı dinlemek!',
  gorevOku: 'Bugünün görevi: ayetleri okumak!',
  gorevOyna: 'Bugünün görevi: kelime oyunu oynamak!',
  gorevTekrar: 'Bugün sevdiğin bir sayfayı tekrar edelim mi?',
  mola: 'Bugün çok güzel çalıştın {ad}. Biraz dinlenelim mi? Yarın yine görüşürüz!',
} as const;

export type LineId = keyof typeof LINES;
export const CORRECT: LineId[] = ['dogru1', 'dogru2', 'dogru3'];

const fill = (t: string) => t.replace(/\{ad\}/g, getState().childName || '');

// ---- Konuşma balonu durumu ----
let bubble = '';
let speaking = false;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
export function useBubble() {
  const [, f] = useState(0);
  useEffect(() => {
    const s = () => f((x) => x + 1);
    subs.add(s);
    return () => void subs.delete(s);
  }, []);
  return { bubble, speaking };
}

// ---- Türkçe yapay ses ----
export function trVoices(): SpeechSynthesisVoice[] {
  if (!('speechSynthesis' in window)) return [];
  return speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('tr'));
}

function tts(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) return resolve();
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'tr-TR';
    const name = getState().settings.voiceName;
    const v = trVoices().find((x) => x.name === name) ?? trVoices()[0];
    if (v) u.voice = v;
    u.rate = 0.95;
    u.pitch = 1.25; // biraz daha ince, kuş sesi gibi
    u.onend = () => resolve();
    u.onerror = () => resolve();
    speechSynthesis.speak(u);
    setTimeout(resolve, 12000); // takılırsa bekletme
  });
}

let customEl: HTMLAudioElement | null = null;
let token = 0;

/** Hüdhüd bir cümle söyler (önce ebeveyn kaydı, yoksa yapay ses). Balon metni ekranda kalır. */
export async function say(id: LineId): Promise<void> {
  return sayRaw(fill(LINES[id]), id);
}

/** Kaydedilemeyen, anlık oluşan cümleler için (ör. "be mi, te mi?"). */
export function sayText(text: string) {
  return sayRaw(text, null);
}

async function sayRaw(text: string, id: LineId | null) {
  const my = ++token;
  quiet();
  main.pause();
  wordEl.pause();
  bubble = text;
  speaking = true;
  emit();
  try {
    const rec = id ? await loadRec(voiceKey(id)) : undefined;
    // Bu arada kıraat başladıysa Hüdhüd üstüne konuşmasın
    if (my !== token || !main.paused) return;
    if (rec) {
      const url = URL.createObjectURL(rec.blob);
      customEl = new Audio(url);
      await new Promise<void>((r) => {
        customEl!.onended = () => r();
        customEl!.onpause = () => r();
        customEl!.play().catch(() => r());
      });
      URL.revokeObjectURL(url);
    } else {
      await tts(text);
    }
  } finally {
    if (my === token) {
      speaking = false;
      emit();
    }
  }
}

/** Hüdhüd'ü sustur (balon metni kalır). */
export function quiet() {
  customEl?.pause();
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}

export function setBubble(text: string) {
  bubble = text;
  emit();
}

export const lineText = (id: LineId) => fill(LINES[id]);
