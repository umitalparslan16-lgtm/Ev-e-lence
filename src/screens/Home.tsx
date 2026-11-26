import { useEffect, useState } from 'preact/hooks';
import { PAGES } from '../lib/data';
import { useStore, update, go, isUnlocked, starsOf, currentPage, progOf, getState, type State } from '../lib/store';
import { say, setBubble, lineText, type LineId } from '../lib/voice';
import { Hudhud } from '../components/Art';
import { Guide, Stars, TopBar, Screen } from '../components/UI';

export function Setup() {
  const [name, setName] = useState('');
  return (
    <Screen class="setup">
      <Hudhud size={150} />
      <h1>Hüdhüd ile Kur'an</h1>
      <p class="note">Ebeveyn için: Hüdhüd çocuğunuzu adıyla karşılayacak. Ad ve kayıtlar yalnızca bu telefonda saklanır.</p>
      <label class="field">
        Çocuğun adı
        <input value={name} onInput={(e) => setName((e.target as HTMLInputElement).value)} placeholder="Ad" />
      </label>
      <button
        class="btn primary big"
        disabled={!name.trim()}
        onClick={() => {
          update((s) => {
            s.childName = name.trim();
            s.setupDone = true;
          });
          say('hosgeldin');
        }}
      >
        Başla ▶️
      </button>
    </Screen>
  );
}

function dailyTask(s: State): { line: LineId; page: number } {
  const no = currentPage(s);
  const p = progOf(s, no);
  if (!p.listen) return { line: 'gorevDinle', page: no };
  if (!p.read) return { line: 'gorevOku', page: no };
  if (!p.play) return { line: 'gorevOyna', page: no };
  return { line: 'gorevTekrar', page: no };
}

// Harita üzerindeki durak konumları (yüzde); yol aşağıdan yukarı kıvrılarak çıkar.
const SPOTS = [
  { x: 28, y: 84 },
  { x: 70, y: 66 },
  { x: 32, y: 47 },
  { x: 68, y: 29 },
  { x: 36, y: 12 },
];

let homeVisits = 0;

export function Home() {
  const s = useStore();
  const task = dailyTask(s);
  const cur = currentPage(s);

  // Ana ekrana her dönüşte balonda günün görevi yazsın (açılış selamı hariç)
  useEffect(() => {
    if (homeVisits++ > 0) setBubble(lineText(task.line));
  }, []);
  return (
    <Screen class="home">
      <TopBar />
      <Guide line={task.line} />
      <button class="task-card" onClick={() => go({ name: 'station', page: task.page })}>
        <span class="task-ico">🎯</span>
        <span>
          <b>Günün görevi</b>
          <br />
          {task.page}. durak
        </span>
        <span class="task-go">▶️</span>
      </button>

      <div class="map">
        <svg class="map-path" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path
            d={`M${SPOTS[0].x} ${SPOTS[0].y} C 50 84, 70 78, ${SPOTS[1].x} ${SPOTS[1].y} S 20 55, ${SPOTS[2].x} ${SPOTS[2].y} S 75 38, ${SPOTS[3].x} ${SPOTS[3].y} S 30 20, ${SPOTS[4].x} ${SPOTS[4].y}`}
            fill="none"
            stroke="#e8d6a8"
            stroke-width="5"
            stroke-linecap="round"
            stroke-dasharray="0.1 7"
          />
        </svg>
        <span class="deco" style={{ left: '8%', top: '62%' }}>🌳</span>
        <span class="deco" style={{ left: '84%', top: '84%' }}>🌷</span>
        <span class="deco" style={{ left: '86%', top: '46%' }}>🌲</span>
        <span class="deco" style={{ left: '6%', top: '26%' }}>⛰️</span>
        <span class="deco" style={{ left: '58%', top: '4%' }}>☁️</span>

        {SPOTS.map((pos, i) => {
          const page = PAGES[i];
          if (!page) {
            return (
              <div class="stop soon" style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
                <span class="stop-num">{i + 1}</span>
                <span class="stop-label">yakında</span>
              </div>
            );
          }
          const open = isUnlocked(s, page.no);
          const stars = starsOf(s, page.no);
          return (
            <button
              class={`stop ${open ? 'open' : 'locked'} ${page.no === cur ? 'current' : ''} ${stars === 3 ? 'done' : ''}`}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              onClick={() => (open ? go({ name: 'station', page: page.no }) : say('durakSec'))}
              aria-label={`${page.no}. durak ${page.title}`}
            >
              <span class="stop-num">{open ? page.no : '🔒'}</span>
              <Stars n={stars} />
              <span class="stop-label">{page.title}</span>
              {page.no === cur && (
                <span class="stop-bird">
                  <Hudhud size={56} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <nav class="bottom-nav">
        <button class="btn garden-btn" onClick={() => go({ name: 'garden' })}>
          🌷 Bahçem
        </button>
        <button class="btn parent-btn" onClick={() => go({ name: 'parent' })} aria-label="Ebeveyn köşesi">
          👪
        </button>
      </nav>
    </Screen>
  );
}

export function Station({ page }: { page: number }) {
  const s = useStore();
  const p = progOf(s, page);
  const info = PAGES.find((x) => x.no === page)!;
  useEffect(() => {
    if (starsOf(getState(), page) < 3) say('durak');
    else setBubble(lineText('gorevTekrar'));
  }, []);
  const tile = (key: 'listen' | 'read' | 'play', ico: string, label: string, color: string) => (
    <button class={`section-tile ${color} ${p[key] ? 'done' : ''}`} onClick={() => go({ name: key, page })}>
      <span class="tile-ico">{ico}</span>
      <span class="tile-label">{label}</span>
      <span class="tile-star">{p[key] ? '⭐' : '☆'}</span>
    </button>
  );
  return (
    <Screen class="station">
      <TopBar back={{ name: 'home' }} title={`${page}. durak · ${info.title}`} />
      <Guide line="durak" />
      <div class="tiles">
        {tile('listen', '🎧', 'Dinle', 'c1')}
        {tile('read', '🎙️', 'Oku', 'c2')}
        {tile('play', '🎮', 'Oyna', 'c3')}
      </div>
      <div class="station-stars">
        <Stars n={starsOf(s, page)} big />
      </div>
    </Screen>
  );
}
