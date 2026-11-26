import { useEffect, useState } from 'preact/hooks';
import { PAGES } from './data';

export type Section = 'listen' | 'read' | 'play';
export const SECTIONS: Section[] = ['listen', 'read', 'play'];

export type PageProg = Record<Section, boolean> & { heard: string[] };

export type GardenThing = { slot: number; kind: string };

export type Settings = {
  reciter: 'husary' | 'minshawy';
  slow: boolean;
  help: boolean; // şedde/cezim renklendirme
  sessionMin: number;
  voiceName: string;
  fontScale: number;
  readyVoice: boolean; // hazır (Emel) sesi kullan
};

export type State = {
  childName: string;
  setupDone: boolean;
  prog: Record<number, PageProg>;
  seeds: number; // harcanabilir yıldız
  gold: number; // harcanabilir altın yıldız
  totalStars: number;
  totalGold: number;
  approved: string[]; // altın yıldız verilen ayetler
  garden: GardenThing[];
  toys: string[]; // kedinin oyuncakları
  settings: Settings;
  day: { date: string; seconds: number; repeats: string[]; breakShown: boolean };
};

const KEY = 'hudhud-v1';
const today = () => new Date().toLocaleDateString('sv'); // YYYY-MM-DD

const fresh = (): State => ({
  childName: '',
  setupDone: false,
  prog: {},
  seeds: 0,
  gold: 0,
  totalStars: 0,
  totalGold: 0,
  approved: [],
  garden: [],
  toys: [],
  settings: { reciter: 'husary', slow: false, help: true, sessionMin: 15, voiceName: '', fontScale: 1, readyVoice: true },
  day: { date: today(), seconds: 0, repeats: [], breakShown: false },
});

function load(): State {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (s) {
      const f = fresh();
      return { ...f, ...s, settings: { ...f.settings, ...s.settings } };
    }
  } catch {
    /* boş başla */
  }
  return fresh();
}

let state: State = load();
const subs = new Set<() => void>();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* depolama dolu/kapalı olabilir */
  }
}

export const getState = () => state;

export function update(fn: (s: State) => void) {
  const next = structuredClone(state);
  fn(next);
  state = next;
  save();
  subs.forEach((f) => f());
}

export function useStore(): State {
  const [, force] = useState(0);
  useEffect(() => {
    const f = () => force((x) => x + 1);
    subs.add(f);
    return () => void subs.delete(f);
  }, []);
  return state;
}

export function resetAll() {
  const keep = { childName: state.childName, setupDone: state.setupDone, settings: state.settings };
  state = { ...fresh(), ...keep };
  save();
  subs.forEach((f) => f());
}

// ---- İlerleme kuralları ----
export const progOf = (s: State, no: number): PageProg =>
  s.prog[no] ?? { listen: false, read: false, play: false, heard: [] };
export const starsOf = (s: State, no: number) => SECTIONS.filter((k) => progOf(s, no)[k]).length;
export const isUnlocked = (s: State, no: number) => no === 1 || starsOf(s, no - 1) === 3;

/** Şu anki durak: açılmış ama tamamlanmamış ilk sayfa (hepsi bittiyse son sayfa). */
export function currentPage(s: State) {
  for (const p of PAGES) if (isUnlocked(s, p.no) && starsOf(s, p.no) < 3) return p.no;
  return PAGES[PAGES.length - 1].no;
}

export type AwardResult = { kind: 'new' | 'repeat' | 'none'; pageDone: boolean };

/** Bir bölüm bitince yıldız ver. İlk sefer: kalıcı yıldız + 1 tohum. Tekrar: günde bölüm başına 1 tohum. */
export function award(no: number, sec: Section): AwardResult {
  const s = getState();
  const p = progOf(s, no);
  if (!p[sec]) {
    update((d) => {
      d.prog[no] = { ...progOf(d, no), [sec]: true };
      d.seeds += 1;
      d.totalStars += 1;
    });
    return { kind: 'new', pageDone: starsOf(getState(), no) === 3 };
  }
  const tag = `${no}:${sec}`;
  rollDay();
  if (!getState().day.repeats.includes(tag)) {
    update((d) => {
      d.day.repeats.push(tag);
      d.seeds += 1;
    });
    return { kind: 'repeat', pageDone: false };
  }
  return { kind: 'none', pageDone: false };
}

export function markHeard(no: number, key: string) {
  const p = progOf(getState(), no);
  if (p.heard.includes(key)) return;
  update((d) => {
    const q = progOf(d, no);
    d.prog[no] = { ...q, heard: [...q.heard, key] };
  });
}

export function approve(key: string) {
  if (getState().approved.includes(key)) return false;
  update((d) => {
    d.approved.push(key);
    d.gold += 1;
    d.totalGold += 1;
  });
  return true;
}

export function rollDay() {
  if (getState().day.date !== today()) {
    update((d) => {
      d.day = { date: today(), seconds: 0, repeats: [], breakShown: false };
    });
  }
}

// ---- Gezinme (kaydedilmez) ----
export type Route =
  | { name: 'home' }
  | { name: 'station'; page: number }
  | { name: 'listen'; page: number }
  | { name: 'read'; page: number }
  | { name: 'play'; page: number }
  | { name: 'garden' }
  | { name: 'parent' };

let route: Route = { name: 'home' };
const navSubs = new Set<() => void>();
export function go(r: Route) {
  route = r;
  navSubs.forEach((f) => f());
  window.scrollTo(0, 0);
}
export function useRoute(): Route {
  const [, force] = useState(0);
  useEffect(() => {
    const f = () => force((x) => x + 1);
    navSubs.add(f);
    return () => void navSubs.delete(f);
  }, []);
  return route;
}
