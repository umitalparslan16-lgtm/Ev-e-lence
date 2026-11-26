import { useEffect, useState } from 'preact/hooks';
import { useStore, update } from '../lib/store';
import { say } from '../lib/voice';
import { sfx } from '../lib/audio';
import { Kitten } from '../components/Art';
import { Guide, TopBar, Screen } from '../components/UI';

const PLANTS = [
  { kind: '🌷', cost: 1 },
  { kind: '🌻', cost: 1 },
  { kind: '🌹', cost: 1 },
  { kind: '🌼', cost: 1 },
  { kind: '🌳', cost: 3 },
  { kind: '🍎', cost: 3 },
];
const TOYS = ['🧶', '🐟', '🎀', '🦋', '🧸', '🛏️'];

export function Garden() {
  const s = useStore();
  const [sel, setSel] = useState<string | null>(null);
  const [happy, setHappy] = useState(false);
  const slots = Math.max(12, Math.ceil((s.garden.length + 3) / 3) * 3);

  useEffect(() => {
    say(s.gold > 0 ? 'altin' : 'bahce');
  }, []);

  const cost = (k: string) => PLANTS.find((p) => p.kind === k)!.cost;

  function plant(slot: number) {
    if (!sel || s.garden.some((g) => g.slot === slot)) return;
    if (s.seeds < cost(sel)) return;
    update((d) => {
      d.seeds -= cost(sel);
      d.garden.push({ slot, kind: sel });
    });
    sfx.pop();
    say('ekildi');
    if (s.seeds - cost(sel) < cost(sel)) setSel(null);
  }

  function buyToy(t: string) {
    if (s.gold < 1 || s.toys.includes(t)) return;
    update((d) => {
      d.gold -= 1;
      d.toys.push(t);
    });
    sfx.star();
    pet();
  }

  function pet() {
    setHappy(true);
    sfx.correct();
    say('kedi');
    setTimeout(() => setHappy(false), 1800);
  }

  return (
    <Screen class="garden">
      <TopBar back={{ name: 'home' }} title="🌷 Bahçem" />
      <Guide line="bahce" />

      <div class="shop">
        {PLANTS.map((p) => (
          <button
            class={`shop-item ${sel === p.kind ? 'sel' : ''}`}
            disabled={s.seeds < p.cost}
            onClick={() => setSel(sel === p.kind ? null : p.kind)}
          >
            <span class="shop-ico">{p.kind}</span>
            <span class="shop-cost">{'⭐'.repeat(p.cost)}</span>
          </button>
        ))}
      </div>
      {sel && <p class="hint big-hint">Boş bir yere dokun 👇</p>}

      <div class="yard">
        <div class="plots">
          {Array.from({ length: slots }, (_, i) => {
            const g = s.garden.find((x) => x.slot === i);
            return (
              <button class={`plot ${g ? 'full' : ''} ${sel && !g ? 'ready' : ''}`} onClick={() => plant(i)} aria-label="Toprak">
                {g ? <span class="grown">{g.kind}</span> : sel ? <span class="ghost">＋</span> : null}
              </button>
            );
          })}
        </div>
        <div class="kitty-zone">
          <button class="kitty" onClick={pet} aria-label="Kediyi sev">
            <Kitten size={110} happy={happy} />
            {happy && <span class="hearts">💕</span>}
          </button>
          <div class="toys">{s.toys.map((t) => <span>{t}</span>)}</div>
        </div>
      </div>

      <h3 class="sub">🌟 Kediciğe hediye</h3>
      <div class="shop">
        {TOYS.map((t) => (
          <button class={`shop-item gold ${s.toys.includes(t) ? 'owned' : ''}`} disabled={s.gold < 1 || s.toys.includes(t)} onClick={() => buyToy(t)}>
            <span class="shop-ico">{t}</span>
            <span class="shop-cost">{s.toys.includes(t) ? '✔️' : '🌟'}</span>
          </button>
        ))}
      </div>
    </Screen>
  );
}
