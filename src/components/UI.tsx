import type { ComponentChildren } from 'preact';
import { useEffect } from 'preact/hooks';
import { Hudhud } from './Art';
import { useBubble, say, lineText, type LineId } from '../lib/voice';
import { useStore, go, type Route } from '../lib/store';
import { sfx, stopAll } from '../lib/audio';

/** Hüdhüd ve konuşma balonu. Kuşa dokununca son cümleyi tekrar söyler. */
export function Guide({ line, onTap }: { line?: LineId; onTap?: () => void }) {
  const { bubble, speaking } = useBubble();
  return (
    <div class="guide">
      <button class="guide-bird" onClick={() => (onTap ? onTap() : line && say(line))} aria-label="Hüdhüd'ü dinle">
        <Hudhud size={84} talking={speaking} />
      </button>
      {bubble && <div class="bubble">{bubble}</div>}
    </div>
  );
}

export function TopBar({ back, title }: { back?: Route; title?: string }) {
  const s = useStore();
  return (
    <header class="topbar">
      {back ? (
        <button
          class="icon-btn"
          aria-label="Geri"
          onClick={() => {
            stopAll();
            go(back);
          }}
        >
          ⬅️
        </button>
      ) : (
        <span class="icon-spacer" />
      )}
      {title && <div class="topbar-title">{title}</div>}
      <div class="wallet">
        <span class="chip">⭐ {s.seeds}</span>
        <span class="chip gold">🌟 {s.gold}</span>
      </div>
    </header>
  );
}

export function Stars({ n, of = 3, big = false }: { n: number; of?: number; big?: boolean }) {
  return (
    <span class={`stars ${big ? 'big' : ''}`} aria-label={`${n} yıldız`}>
      {Array.from({ length: of }, (_, i) => (
        <span class={i < n ? 'on' : 'off'}>★</span>
      ))}
    </span>
  );
}

/** Kutlama ekranı: büyük yıldız + Hüdhüd cümlesi. */
export function Celebrate({ line, extra, icon = '⭐', onDone }: { line: LineId; extra?: LineId; icon?: string; onDone: () => void }) {
  useEffect(() => {
    sfx.star();
    (async () => {
      await say(line);
      if (extra) await say(extra);
    })();
  }, []);
  return (
    <div class="overlay" onClick={onDone}>
      <div class="celebrate">
        <div class="confetti">
          {Array.from({ length: 18 }, (_, i) => (
            <i style={{ '--i': i } as any} />
          ))}
        </div>
        <div class="big-star">{icon}</div>
        <Hudhud size={120} talking />
        <p class="rest-text">{lineText(line)}</p>
        <button class="btn primary big" onClick={onDone}>
          Devam ➡️
        </button>
      </div>
    </div>
  );
}

export function Screen({ children, class: cls = '' }: { children: ComponentChildren; class?: string }) {
  return <div class={`screen ${cls}`}>{children}</div>;
}
