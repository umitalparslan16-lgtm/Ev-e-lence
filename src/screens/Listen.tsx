import { useEffect, useRef, useState } from 'preact/hooks';
import { pageByNo, playable, ayahsOf, type AyahItem } from '../lib/data';
import { useStore, update, award, markHeard, progOf, getState, type AwardResult } from '../lib/store';
import { audioUrls, main, playThrough, playWord, stopAll } from '../lib/audio';
import { say } from '../lib/voice';
import { Mushaf } from '../components/Mushaf';
import { Celebrate, Guide, TopBar, Screen } from '../components/UI';

export function useWakeLock(on: boolean) {
  useEffect(() => {
    if (!on || !('wakeLock' in navigator)) return;
    let lock: any;
    (navigator as any).wakeLock.request('screen').then((l: any) => (lock = l)).catch(() => {});
    return () => lock?.release?.();
  }, [on]);
}

/** Bir ayeti çalar ve çalan kelimeyi bildirir. Sonuna kadar çaldıysa true döner. */
export async function playAyah(item: AyahItem, onWord: (i: number) => void): Promise<boolean> {
  const st = getState().settings;
  const timed = st.reciter === 'husary';
  let raf = 0;
  const tick = () => {
    if (timed) {
      const ms = main.currentTime * 1000;
      let idx = -1;
      item.words.forEach((w, i) => {
        if (w.tm && ms >= w.tm[0] - 60) idx = i;
      });
      onWord(idx);
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  const full = await playThrough(main, audioUrls(st.reciter, item.audio), st.slow ? 0.8 : 1);
  cancelAnimationFrame(raf);
  onWord(-1);
  return full;
}

export function Listen({ page }: { page: number }) {
  const s = useStore();
  const pg = pageByNo(page);
  const items = playable(pg);
  const [cur, setCur] = useState<string | null>(null);
  const [word, setWord] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [win, setWin] = useState<AwardResult | null>(null);
  const runId = useRef(0);
  const sessionHeard = useRef(new Set<string>());
  useWakeLock(playing);

  useEffect(() => {
    say('dinleBasla');
    return () => {
      runId.current++;
      stopAll();
    };
  }, []);

  // Çalan kelimeyi ekranın ortasında tut
  useEffect(() => {
    const el = document.querySelector('.ayah.playing .w.on') ?? document.querySelector('.ayah.playing');
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [cur, word]);

  function checkDone() {
    const keys = ayahsOf(pg).map((a) => a.key);
    const heard = progOf(getState(), page).heard;
    const firstTime = !progOf(getState(), page).listen && keys.every((k) => heard.includes(k));
    const again = keys.every((k) => sessionHeard.current.has(k));
    if (firstTime || again) {
      const r = award(page, 'listen');
      sessionHeard.current.clear();
      if (r.kind === 'new') setWin(r);
      else if (r.kind === 'repeat') say('tekrar');
    }
  }

  async function playFrom(startKey: string) {
    const my = ++runId.current;
    stopAll();
    setPlaying(true);
    const start = items.findIndex((i) => i.key === startKey);
    for (let k = Math.max(0, start); k < items.length; k++) {
      if (my !== runId.current) return;
      const it = items[k];
      setCur(it.key);
      const full = await playAyah(it, (i) => my === runId.current && setWord(i));
      if (my !== runId.current) return;
      if (!full) break;
      if (it.type === 'ayah') {
        markHeard(page, it.key);
        sessionHeard.current.add(it.key);
      }
    }
    if (my !== runId.current) return;
    setPlaying(false);
    setCur(null);
    checkDone();
  }

  function stop() {
    runId.current++;
    stopAll();
    setPlaying(false);
    setWord(-1);
  }

  async function tapWord(it: AyahItem, i: number) {
    stop();
    setCur(it.key);
    setWord(i);
    await playWord(it.words[i].wbw);
    setWord((w) => (w === i ? -1 : w));
  }

  const heard = progOf(s, page).heard;

  return (
    <Screen class="listen">
      <TopBar back={{ name: 'station', page }} title="🎧 Dinle" />
      <Guide line="dinleBasla" />
      <div class="controls">
        <button
          class={`btn round huge ${playing ? 'pause' : 'play'}`}
          onClick={() => (playing ? stop() : playFrom(cur ?? items[0].key))}
          aria-label={playing ? 'Durdur' : 'Dinle'}
        >
          {playing ? '⏸️' : '▶️'}
        </button>
        <button
          class={`btn toggle ${s.settings.slow ? 'on' : ''}`}
          onClick={() => update((d) => void (d.settings.slow = !d.settings.slow))}
          aria-label="Yavaş"
        >
          {s.settings.slow ? '🐢 Yavaş' : '🐇 Normal'}
        </button>
        <button
          class={`btn toggle ${s.settings.help ? 'on' : ''}`}
          onClick={() => update((d) => void (d.settings.help = !d.settings.help))}
          aria-label="Şedde ve cezim renkleri"
        >
          🎨
        </button>
      </div>
      <div class="mushaf-wrap" style={{ fontSize: `${2.1 * s.settings.fontScale}rem` }}>
        <Mushaf
          page={pg}
          help={s.settings.help}
          activeKey={cur}
          activeWord={word}
          doneKeys={heard}
          onWord={tapWord}
          onAyah={(it) => playFrom(it.key)}
        />
      </div>
      <p class="hint">Kelimeye dokun: okunuşunu duy. Ayet numarasına dokun: oradan başla.</p>
      {win && (
        <Celebrate
          line="dinleBitti"
          extra={win.pageDone ? 'durakTamam' : undefined}
          onDone={() => setWin(null)}
        />
      )}
    </Screen>
  );
}
