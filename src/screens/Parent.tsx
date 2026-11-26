import { useEffect, useRef, useState } from 'preact/hooks';
import { PAGES, ayahsOf } from '../lib/data';
import { useStore, update, approve, resetAll } from '../lib/store';
import { Recorder, loadRec, saveRec, deleteRec, recKey, voiceKey, listRecKeys, playBlob, stopBlob } from '../lib/recorder';
import { LINES, lineText, say, trVoices, type LineId } from '../lib/voice';
import { sfx, stopAll } from '../lib/audio';
import { TopBar, Screen } from '../components/UI';

/** Basit ebeveyn kilidi: çarpma sorusu. */
function Gate({ onOpen }: { onOpen: () => void }) {
  const [q] = useState(() => {
    const a = 6 + Math.floor(Math.random() * 4);
    const b = 6 + Math.floor(Math.random() * 4);
    return { a, b };
  });
  const [v, setV] = useState('');
  return (
    <div class="gate">
      <p>Ebeveyn köşesi</p>
      <p class="gate-q">
        {q.a} × {q.b} = ?
      </p>
      <input inputMode="numeric" value={v} onInput={(e) => setV((e.target as HTMLInputElement).value)} />
      <button class="btn primary" onClick={() => (+v === q.a * q.b ? onOpen() : setV(''))}>
        Aç
      </button>
    </div>
  );
}

export function Parent() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'rec' | 'voice' | 'set' | 'about'>('rec');
  useEffect(() => () => (stopBlob(), stopAll()), []);
  return (
    <Screen class="parent">
      <TopBar back={{ name: 'home' }} title="👪 Ebeveyn köşesi" />
      {!open ? (
        <Gate onOpen={() => setOpen(true)} />
      ) : (
        <>
          <div class="tabs">
            {(
              [
                ['rec', 'Kayıtlar'],
                ['voice', 'Hüdhüd sesi'],
                ['set', 'Ayarlar'],
                ['about', 'Hakkında'],
              ] as const
            ).map(([k, l]) => (
              <button class={`tab ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>
                {l}
              </button>
            ))}
          </div>
          {tab === 'rec' && <Recordings />}
          {tab === 'voice' && <VoiceLines />}
          {tab === 'set' && <SettingsPanel />}
          {tab === 'about' && <About />}
        </>
      )}
    </Screen>
  );
}

function Recordings() {
  const s = useStore();
  const [have, setHave] = useState<Set<string>>(new Set());
  const [playing, setPlaying] = useState('');
  useEffect(() => {
    listRecKeys('rec:').then((ks) => setHave(new Set(ks.map((k) => k.slice(4)))));
  }, []);
  async function play(k: string) {
    if (playing === k) {
      stopBlob();
      return setPlaying('');
    }
    const r = await loadRec(recKey(k));
    if (!r) return;
    setPlaying(k);
    await playBlob(r.blob);
    setPlaying((p) => (p === k ? '' : p));
  }
  return (
    <div class="panel">
      <p class="note">Kızınızın ayet kayıtlarını dinleyin. Beğendiğinizde 🌟 verin; bahçede kedi için hediye alır.</p>
      {PAGES.map((p) => (
        <div class="rec-page">
          <h4>
            {p.no}. sayfa · {p.title}
          </h4>
          {ayahsOf(p).map((a) => {
            const has = have.has(a.key);
            const ok = s.approved.includes(a.key);
            return (
              <div class={`rec-row ${has ? '' : 'empty'}`}>
                <span class="rec-name">
                  {a.s === 1 ? 'Fâtiha' : 'Bakara'} {a.a}
                </span>
                {has ? (
                  <>
                    <button class="btn small" onClick={() => play(a.key)}>
                      {playing === a.key ? '⏸️' : '▶️'}
                    </button>
                    <button
                      class={`btn small ${ok ? 'gold-done' : 'gold'}`}
                      disabled={ok}
                      onClick={() => approve(a.key) && sfx.star()}
                    >
                      {ok ? '🌟 verildi' : '🌟 Onayla'}
                    </button>
                  </>
                ) : (
                  <span class="muted">kayıt yok</span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function VoiceLines() {
  const [have, setHave] = useState<Set<string>>(new Set());
  const [recId, setRecId] = useState<LineId | null>(null);
  const rec = useRef(new Recorder());
  const refresh = () => listRecKeys('voice:').then((ks) => setHave(new Set(ks.map((k) => k.slice(6)))));
  useEffect(() => {
    refresh();
    return () => rec.current.cancel();
  }, []);

  async function toggle(id: LineId) {
    if (recId === id) {
      const blob = await rec.current.stop();
      setRecId(null);
      if (blob) await saveRec(voiceKey(id), blob);
      refresh();
      return;
    }
    if (recId) return;
    try {
      stopAll();
      await rec.current.start(30, () => toggle(id));
      setRecId(id);
    } catch {
      alert('Mikrofon izni verilmedi.');
    }
  }

  return (
    <div class="panel">
      <p class="note">
        Her cümleyi kendi sesinizle kaydedebilirsiniz. 🎙️ ile başlatın, ⏹️ ile bitirin. Kayıtlı cümleler artık sizin sesinizle
        çalar; silerseniz yapay sese döner.
      </p>
      {(Object.keys(LINES) as LineId[]).map((id) => (
        <div class="line-row">
          <span class="line-text">{lineText(id)}</span>
          <span class="line-btns">
            <button class="btn small" onClick={() => say(id)} aria-label="Dinle">
              ▶️
            </button>
            <button class={`btn small ${recId === id ? 'rec-on' : ''}`} onClick={() => toggle(id)} disabled={!!recId && recId !== id}>
              {recId === id ? '⏹️' : '🎙️'}
            </button>
            {have.has(id) && (
              <button
                class="btn small"
                onClick={async () => {
                  await deleteRec(voiceKey(id));
                  refresh();
                }}
                aria-label="Sil"
              >
                🗑️
              </button>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

function SettingsPanel() {
  const s = useStore();
  const [voices, setVoices] = useState(trVoices());
  useEffect(() => {
    const f = () => setVoices(trVoices());
    speechSynthesis?.addEventListener?.('voiceschanged', f);
    return () => speechSynthesis?.removeEventListener?.('voiceschanged', f);
  }, []);
  const set = (fn: (st: typeof s.settings) => void) => update((d) => fn(d.settings));
  return (
    <div class="panel settings">
      <label class="field">
        Çocuğun adı
        <input value={s.childName} onChange={(e) => update((d) => void (d.childName = (e.target as HTMLInputElement).value.trim()))} />
      </label>
      <label class="field">
        Kâri
        <select value={s.settings.reciter} onChange={(e) => set((st) => void (st.reciter = (e.target as HTMLSelectElement).value as any))}>
          <option value="husary">Husarî (muallim, yavaş) — kelime takibi var</option>
          <option value="minshawy">Minşâvî + çocuklar (öğretici) — ayet takibi</option>
        </select>
      </label>
      <label class="check">
        <input type="checkbox" checked={s.settings.readyVoice} onChange={(e) => set((st) => void (st.readyVoice = (e.target as HTMLInputElement).checked))} />
        Hüdhüd'ün hazır sesini kullan (Emel). Kapalıysa telefonun sesi konuşur.
      </label>
      <label class="field">
        Telefonun yapay sesi (yedek)
        <select value={s.settings.voiceName} onChange={(e) => set((st) => void (st.voiceName = (e.target as HTMLSelectElement).value))}>
          <option value="">Varsayılan Türkçe ses</option>
          {voices.map((v) => (
            <option value={v.name}>{v.name}</option>
          ))}
        </select>
        {voices.length === 0 && <span class="muted">Türkçe ses bulunamadı: Ayarlar › Metin okuma çıkışı › Google ses paketinden Türkçe'yi indirin.</span>}
      </label>
      <label class="field">
        Günlük oturum (dakika): {s.settings.sessionMin}
        <input type="range" min="5" max="30" step="5" value={s.settings.sessionMin} onInput={(e) => set((st) => void (st.sessionMin = +(e.target as HTMLInputElement).value))} />
      </label>
      <label class="field">
        Yazı boyu: {Math.round(s.settings.fontScale * 100)}%
        <input type="range" min="0.8" max="1.6" step="0.1" value={s.settings.fontScale} onInput={(e) => set((st) => void (st.fontScale = +(e.target as HTMLInputElement).value))} />
      </label>
      <label class="check">
        <input type="checkbox" checked={s.settings.help} onChange={(e) => set((st) => void (st.help = (e.target as HTMLInputElement).checked))} />
        Yardım modu: şeddeli harfler <b class="sh-sample">mavi</b>, cezimli harfler <b class="sk-sample">yeşil</b>
      </label>
      <button
        class="btn danger"
        onClick={() => {
          if (confirm('Yıldızlar, bahçe ve ilerleme sıfırlansın mı? (Ses kayıtları kalır)')) resetAll();
        }}
      >
        İlerlemeyi sıfırla
      </button>
    </div>
  );
}

function About() {
  return (
    <div class="panel about">
      <p>
        Bu uygulama reklamsızdır, hesap istemez. Ses kayıtları ve ilerleme yalnızca bu telefonda saklanır.
      </p>
      <h4>Kaynaklar</h4>
      <ul>
        <li>Kur'an metni: Tanzil (tanzil.net) metni temel alınarak Türkiye mushaf imlasına uyarlanmıştır. Lütfen kendi mushafınızla karşılaştırın.</li>
        <li>Kıraat: Mahmud Halil el-Husarî (muallim) ve Muhammed Sıddık el-Minşâvî (öğretici), everyayah.com.</li>
        <li>Kelime sesleri: Quran.com kelime kelime ses kayıtları.</li>
        <li>Kelime zamanlaması: quran-align, Collin Fair (CC BY 4.0).</li>
        <li>Yazı tipi: Scheherazade New, SIL (OFL).</li>
      </ul>
    </div>
  );
}
