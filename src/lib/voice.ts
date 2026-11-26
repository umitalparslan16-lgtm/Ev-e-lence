import { useEffect, useState } from 'preact/hooks';
import { getState } from './store';
import { loadRec, voiceKey } from './recorder';
import { main, wordEl } from './audio';
import linesJson from '../../data/hudhud-lines.json';

// Hüdhüd'ün sabit cümleleri: data/hudhud-lines.json. {ad} = çocuğun adı.
// Çalma sırası: ebeveynin kendi kaydı → hazır ses dosyası (voice/) → telefonun yapay sesi.
export const LINES = linesJson as Record<keyof typeof linesJson, string>;

export type LineId = keyof typeof linesJson;
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

// ---- Hazır ses dosyaları (derlemede Microsoft Emel sesiyle üretilir) ----
type Manifest = { name: string; files: string[] };
let manifest: Manifest | null = null;
fetch('voice/manifest.json')
  .then((r) => (r.ok ? r.json() : null))
  .then((m) => (manifest = m))
  .catch(() => {});

const norm = (x: string) => x.trim().toLocaleLowerCase('tr');

/** Bu cümlenin hazır ses dosyası (yoksa null). İsimli cümlede ad uyuşmazsa isimsiz sürüm. */
function clipFor(id: string, named: boolean): string | null {
  if (!manifest || !getState().settings.readyVoice) return null;
  let f = id;
  if (named && norm(manifest.name) !== norm(getState().childName)) f = `${id}-noname`;
  return manifest.files.includes(f) ? `voice/${f}.mp3` : null;
}

export const letterClipId = (a: string, b: string) =>
  `harf-${a.codePointAt(0)!.toString(16)}-${b.codePointAt(0)!.toString(16)}`;

let customEl: HTMLAudioElement | null = null;
let token = 0;

/** Hüdhüd bir cümle söyler (önce ebeveyn kaydı, yoksa yapay ses). Balon metni ekranda kalır. */
export async function say(id: LineId): Promise<void> {
  return sayRaw(fill(LINES[id]), id, clipFor(id, LINES[id].includes('{ad}')));
}

/** Oyundaki "be mi, te mi?" sorusu. */
export function sayLetters(text: string, a: string, b: string) {
  return sayRaw(text, null, clipFor(letterClipId(a, b), false));
}

/** Kaydedilemeyen, anlık oluşan cümleler için (ör. "be mi, te mi?"). */
export function sayText(text: string) {
  return sayRaw(text, null, null);
}

function playUrl(url: string) {
  customEl = new Audio(url);
  return new Promise<boolean>((r) => {
    customEl!.onended = () => r(true);
    customEl!.onpause = () => r(true);
    customEl!.onerror = () => r(false);
    customEl!.play().catch(() => r(false));
  });
}

async function sayRaw(text: string, id: LineId | null, clip: string | null) {
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
      await playUrl(url);
      URL.revokeObjectURL(url);
    } else if (!(clip && (await playUrl(clip)))) {
      if (my === token) await tts(text);
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
