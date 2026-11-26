import { useEffect, useRef, useState } from 'preact/hooks';
import { pageByNo, ayahsOf, arNum } from '../lib/data';
import { useStore, award, progOf, getState, type AwardResult } from '../lib/store';
import { sfx, stopAll } from '../lib/audio';
import { Recorder, saveRec, loadRec, recKey, listRecKeys, playBlob, stopBlob } from '../lib/recorder';
import { say, setBubble } from '../lib/voice';
import { Mushaf } from '../components/Mushaf';
import { Celebrate, Guide, TopBar, Screen } from '../components/UI';
import { playAyah, useWakeLock } from './Listen';

export function Read({ page }: { page: number }) {
  const s = useStore();
  const pg = pageByNo(page);
  const ayahs = ayahsOf(pg);
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [recording, setRecording] = useState(false);
  const [secs, setSecs] = useState(0);
  const [mode, setMode] = useState<'idle' | 'model' | 'mine'>('idle');
  const [word, setWord] = useState(-1);
  const [win, setWin] = useState<AwardResult | null>(null);
  const rec = useRef(new Recorder());
  const session = useRef(new Set<string>());
  const cur = ayahs[idx];
  useWakeLock(recording);

  useEffect(() => {
    say('okuBasla');
    listRecKeys('rec:').then((ks) => setDone(new Set(ks.map((k) => k.slice(4)))));
    return () => {
      rec.current.cancel();
      stopBlob();
      stopAll();
    };
  }, []);

  useEffect(() => {
    if (!recording) return;
    setSecs(0);
    const t = setInterval(() => setSecs((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [recording]);

  function stopPlayback() {
    stopAll();
    stopBlob();
    setMode('idle');
    setWord(-1);
  }

  async function listenModel() {
    stopPlayback();
    setMode('model');
    await playAyah(cur, setWord);
    setMode('idle');
  }

  async function listenMine() {
    stopPlayback();
    const r = await loadRec(recKey(cur.key));
    if (!r) return;
    setMode('mine');
    await playBlob(r.blob);
    setMode('idle');
  }

  async function toggleRec() {
    if (recording) return finishRec();
    stopPlayback();
    if (!Recorder.supported()) {
      setBubble('Bu telefonda ses kaydı açılamadı.');
      return;
    }
    try {
      await rec.current.start(120, () => finishRec());
      sfx.pop();
      setRecording(true);
    } catch {
      setBubble('Mikrofon izni gerekiyor. Annene ya da babana söyle 🙂');
    }
  }

  async function finishRec() {
    const blob = await rec.current.stop();
    setRecording(false);
    if (!blob) return;
    await saveRec(recKey(cur.key), blob);
    sfx.correct();
    const nd = new Set(done).add(cur.key);
    setDone(nd);
    session.current.add(cur.key);

    const all = ayahs.every((a) => nd.has(a.key));
    const firstTime = all && !progOf(getState(), page).read;
    const again = ayahs.every((a) => session.current.has(a.key));
    if (firstTime || again) {
      const r = award(page, 'read');
      session.current.clear();
      if (r.kind === 'new') return setWin(r);
      if (r.kind === 'repeat') return say('tekrar');
    }
    await say('okuKayit');
  }

  const go = (d: number) => {
    stopPlayback();
    setIdx((i) => Math.min(ayahs.length - 1, Math.max(0, i + d)));
  };

  return (
    <Screen class="read">
      <TopBar back={{ name: 'station', page }} title="🎙️ Oku" />
      <Guide line="okuBasla" />
      <div class="dots" dir="rtl">
        {ayahs.map((a, i) => (
          <button
            class={`dot ${done.has(a.key) ? 'done' : ''} ${i === idx ? 'cur' : ''}`}
            onClick={() => {
              stopPlayback();
              setIdx(i);
            }}
            aria-label={`Ayet ${a.a}`}
          >
            {arNum(a.a)}
          </button>
        ))}
      </div>

      <div class={`read-card ${recording ? 'rec' : ''}`} style={{ fontSize: `${2.4 * s.settings.fontScale}rem` }}>
        <Mushaf page={pg} help={s.settings.help} only={cur.key} activeKey={mode === 'model' ? cur.key : null} activeWord={word} />
      </div>

      <div class="read-controls">
        <button class="btn round mid" onClick={() => (mode === 'model' ? stopPlayback() : listenModel())} aria-label="Hocayı dinle" disabled={recording}>
          {mode === 'model' ? '⏸️' : '🎧'}
        </button>
        <button class={`btn round huge mic ${recording ? 'on' : ''}`} onClick={toggleRec} aria-label={recording ? 'Kaydı bitir' : 'Kaydet'}>
          {recording ? '⏹️' : '🎙️'}
          {recording && <span class="rec-secs">{secs}</span>}
        </button>
        <button
          class="btn round mid"
          onClick={() => (mode === 'mine' ? stopPlayback() : listenMine())}
          disabled={recording || !done.has(cur.key)}
          aria-label="Kendini dinle"
        >
          {mode === 'mine' ? '⏸️' : '👂'}
        </button>
      </div>

      <div class="nav-row">
        <button class="btn" onClick={() => go(-1)} disabled={idx === 0 || recording}>
          ⬅️ Önceki
        </button>
        <button
          class={`btn primary ${done.has(cur.key) && !recording && idx < ayahs.length - 1 ? 'nudge' : ''}`}
          onClick={() => go(1)}
          disabled={idx === ayahs.length - 1 || recording}
        >
          Sonraki ➡️
        </button>
      </div>

      {win && <Celebrate line="okuBitti" extra={win.pageDone ? 'durakTamam' : undefined} onDone={() => setWin(null)} />}
    </Screen>
  );
}
