// Ses çalma: önce uygulamaya gömülü dosya, yoksa internetteki kaynak.
export type AudioKind = 'husary' | 'minshawy' | 'wbw';

const REMOTE: Record<AudioKind, string> = {
  husary: 'https://everyayah.com/data/Husary_Muallim_128kbps/',
  minshawy: 'https://everyayah.com/data/Minshawy_Teacher_128kbps/',
  wbw: 'https://audio.qurancdn.com/wbw/',
};

export const audioUrls = (kind: AudioKind, file: string) => [
  `audio/${kind}/${file}.mp3`,
  `${REMOTE[kind]}${file}.mp3`,
];

/** Kaynak listesini sırayla dener; biri yüklenince çalmaya başlar. */
export function setSources(el: HTMLAudioElement, urls: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    let i = 0;
    const tryNext = () => {
      if (i >= urls.length) {
        cleanup();
        reject(new Error('ses yüklenemedi'));
        return;
      }
      el.src = urls[i++];
      el.load();
    };
    const ok = () => {
      cleanup();
      resolve();
    };
    const cleanup = () => {
      el.removeEventListener('canplay', ok);
      el.removeEventListener('error', tryNext);
    };
    el.addEventListener('canplay', ok);
    el.addEventListener('error', tryNext);
    tryNext();
  });
}

// Uygulama genelinde iki çalar: ayet/sayfa sesi ve tek kelime sesi.
export const main = new Audio();
export const wordEl = new Audio();
main.preload = 'auto';

/** Bir dosyayı baştan sona çalar; bitince ya da durdurulunca çözülür (true = sonuna kadar çaldı). */
export function playThrough(el: HTMLAudioElement, urls: string[], rate = 1): Promise<boolean> {
  return new Promise(async (resolve) => {
    let done = false;
    const finish = (full: boolean) => {
      if (done) return;
      done = true;
      el.removeEventListener('ended', onEnd);
      el.removeEventListener('pause', onPause);
      resolve(full);
    };
    const onEnd = () => finish(true);
    const onPause = () => {
      if (!el.ended) finish(false);
    };
    try {
      await setSources(el, urls);
      el.playbackRate = rate;
      el.addEventListener('ended', onEnd);
      el.addEventListener('pause', onPause);
      await el.play();
    } catch {
      finish(false);
    }
  });
}

export function stopAll() {
  main.pause();
  wordEl.pause();
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}

export const playWord = (wbw: string) => {
  main.pause();
  return playThrough(wordEl, audioUrls('wbw', wbw));
};

// ---- Küçük efekt sesleri (WebAudio, dosyasız) ----
let ctx: AudioContext | null = null;
function tone(freqs: number[], dur = 0.12, type: OscillatorType = 'sine', gain = 0.12) {
  try {
    ctx ??= new AudioContext();
    let t = ctx.currentTime;
    for (const f of freqs) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = f;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(gain, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + dur + 0.02);
      t += dur * 0.8;
    }
  } catch {
    /* ses kapalı olabilir */
  }
}
export const sfx = {
  correct: () => tone([660, 880, 1175], 0.14),
  star: () => tone([523, 659, 784, 1046, 1318], 0.16, 'triangle'),
  soft: () => tone([392, 349], 0.18, 'sine', 0.06), // yanlışta yumuşak, cezalandırmayan ses
  pop: () => tone([880], 0.08, 'triangle', 0.08),
};
