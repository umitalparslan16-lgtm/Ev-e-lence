import { useEffect, useMemo, useState } from 'preact/hooks';
import { pageByNo, playable, baseLetters, baseOf, CONFUSABLE, LETTER_NAMES, type Word } from '../lib/data';
import { useStore, award, go, type AwardResult } from '../lib/store';
import { playWord, sfx, stopAll } from '../lib/audio';
import { say, sayText, CORRECT } from '../lib/voice';
import { WordText } from '../components/Mushaf';
import { Celebrate, Guide, TopBar, Screen } from '../components/UI';

type Q =
  | { kind: 'harf'; word: Word; target: string; options: string[] }
  | { kind: 'isaret'; mark: 'sh' | 'sk'; options: Word[]; answer: number }
  | { kind: 'duy'; options: Word[]; answer: number };

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const shuffle = <T,>(a: T[]) => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};

function makeQuestions(pool: Word[], n = 6): Q[] {
  const used = new Set<string>();
  const fresh = (ws: Word[]) => {
    const f = ws.filter((w) => !used.has(w.t));
    return f.length ? f : ws;
  };

  const harf = (): Q | null => {
    const cands: { word: Word; x: string; y: string }[] = [];
    for (const w of pool) {
      const L = new Set(baseLetters(w.t));
      for (const [a, b] of CONFUSABLE) {
        if (L.has(a) && !L.has(b)) cands.push({ word: w, x: a, y: b });
        if (L.has(b) && !L.has(a)) cands.push({ word: w, x: b, y: a });
      }
    }
    const c = cands.filter((c) => !used.has(c.word.t));
    if (!(c.length || cands.length)) return null;
    const ch = pick(c.length ? c : cands);
    used.add(ch.word.t);
    return { kind: 'harf', word: ch.word, target: ch.x, options: shuffle([ch.x, ch.y]) };
  };

  const isaret = (): Q | null => {
    const mark = Math.random() < 0.5 ? 'sh' : 'sk';
    const yes = fresh(pool.filter((w) => w[mark]));
    const no = pool.filter((w) => !w[mark]);
    if (!yes.length || no.length < 2) return null;
    const ans = pick(yes);
    used.add(ans.t);
    const opts = shuffle([ans, ...shuffle(no).slice(0, 2)]);
    return { kind: 'isaret', mark, options: opts, answer: opts.indexOf(ans) };
  };

  const duy = (): Q | null => {
    const ans = pick(fresh(pool));
    used.add(ans.t);
    const others = shuffle(pool.filter((w) => w.t !== ans.t))
      .sort((a, b) => Math.abs(a.t.length - ans.t.length) - Math.abs(b.t.length - ans.t.length))
      .slice(0, 4);
    const opts = shuffle([ans, ...shuffle(others).slice(0, 2)]);
    return { kind: 'duy', options: opts, answer: opts.indexOf(ans) };
  };

  const order = shuffle(['duy', 'harf', 'isaret', 'duy', 'harf', 'isaret']).slice(0, n);
  const makers = { harf, isaret, duy };
  return order.map((k) => makers[k as keyof typeof makers]() ?? duy()!);
}

export function Play({ page }: { page: number }) {
  const [round, setRound] = useState(0);
  return <Game key={round} page={page} onAgain={() => setRound((r) => r + 1)} />;
}

function Game({ page, onAgain }: { page: number; onAgain: () => void }) {
  const s = useStore();
  const pg = pageByNo(page);
  const pool = useMemo(() => {
    const seen = new Map<string, Word>();
    for (const it of playable(pg)) for (const w of it.words) if (w.t !== 'الٓمٓ' && !seen.has(w.t)) seen.set(w.t, w);
    return [...seen.values()];
  }, [page]);
  const [qs] = useState(() => makeQuestions(pool));
  const [qi, setQi] = useState(0);
  const [solved, setSolved] = useState(false);
  const [wrong, setWrong] = useState<number | null>(null);
  const [win, setWin] = useState<AwardResult | null>(null);
  const [started, setStarted] = useState(false);
  const q = qs[qi];

  useEffect(() => {
    say('oynaBasla').then(() => setStarted(true));
    return () => stopAll();
  }, []);

  // Her yeni soruda yönergeyi söyle
  useEffect(() => {
    if (!started) return;
    (async () => {
      if (q.kind === 'harf') {
        await playWord(q.word.wbw);
        await sayText(`${LETTER_NAMES[q.options[0]]} mi, ${LETTER_NAMES[q.options[1]]} mi?`);
      } else if (q.kind === 'isaret') {
        await say(q.mark === 'sh' ? 'seddeSoru' : 'cezimSoru');
      } else {
        await say('duySoru');
        await playWord(q.options[q.answer].wbw);
      }
    })();
  }, [qi, started]);

  async function right(w: Word) {
    setSolved(true);
    setWrong(null);
    sfx.correct();
    await say(pick(CORRECT));
    await playWord(w.wbw);
    setTimeout(next, 700);
  }

  function miss(i: number) {
    setWrong(i);
    sfx.soft();
    say('yanlis').then(() => {
      if (q.kind === 'duy') playWord(q.options[q.answer].wbw);
      if (q.kind === 'harf') playWord(q.word.wbw);
    });
    setTimeout(() => setWrong(null), 600);
  }

  function next() {
    if (qi + 1 < qs.length) {
      setQi(qi + 1);
      setSolved(false);
    } else {
      const r = award(page, 'play');
      if (r.kind === 'new') setWin(r);
      else {
        if (r.kind === 'repeat') say('tekrar');
        else say('oynaBitti');
        setWin({ kind: 'none', pageDone: false });
      }
    }
  }

  return (
    <Screen class="play">
      <TopBar back={{ name: 'station', page }} title="🎮 Oyna" />
      <Guide
        onTap={() => {
          if (q.kind === 'harf') sayText(`${LETTER_NAMES[q.options[0]]} mi, ${LETTER_NAMES[q.options[1]]} mi?`);
          else if (q.kind === 'isaret') say(q.mark === 'sh' ? 'seddeSoru' : 'cezimSoru');
          else playWord(q.options[q.answer].wbw);
        }}
      />
      <div class="progress-flowers">
        {qs.map((_, i) => (
          <span class={i < qi || (i === qi && solved) ? 'on' : ''}>{i < qi || (i === qi && solved) ? '🌸' : '🌱'}</span>
        ))}
      </div>

      {q.kind === 'harf' && (
        <div class="game">
          <button class="word-card hero" dir="rtl" lang="ar" onClick={() => playWord(q.word.wbw)}>
            <WordText w={q.word} help={false} mark={solved ? (c) => baseOf(c) === q.target : undefined} />
            <span class="speaker">🔊</span>
          </button>
          <div class="letter-row">
            {q.options.map((l, i) => (
              <button
                class={`letter-tile ${wrong === i ? 'shake' : ''} ${solved && l === q.target ? 'right' : ''}`}
                onClick={() => !solved && (l === q.target ? right(q.word) : miss(i))}
                lang="ar"
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      )}

      {q.kind === 'isaret' && (
        <div class="game">
          <div class="mark-hint" lang="ar">
            <span>{q.mark === 'sh' ? '◌ّ' : '◌ْ'}</span>
            {q.mark === 'sh' ? 'Şedde' : 'Cezim'}
          </div>
          <div class="word-list">
            {q.options.map((w, i) => (
              <button
                class={`word-card ${wrong === i ? 'shake' : ''} ${solved && i === q.answer ? 'right' : ''}`}
                dir="rtl"
                lang="ar"
                onClick={() => !solved && (i === q.answer ? right(w) : miss(i))}
              >
                <WordText w={w} help={solved && i === q.answer} />
              </button>
            ))}
          </div>
        </div>
      )}

      {q.kind === 'duy' && (
        <div class="game">
          <button class="btn round huge" onClick={() => playWord(q.options[q.answer].wbw)} aria-label="Tekrar dinle">
            🔊
          </button>
          <div class="word-list">
            {q.options.map((w, i) => (
              <button
                class={`word-card ${wrong === i ? 'shake' : ''} ${solved && i === q.answer ? 'right' : ''}`}
                dir="rtl"
                lang="ar"
                onClick={() => !solved && (i === q.answer ? right(w) : miss(i))}
              >
                <WordText w={w} help={s.settings.help} />
              </button>
            ))}
          </div>
        </div>
      )}

      {win &&
        (win.kind === 'new' ? (
          <Celebrate line="oynaBitti" extra={win.pageDone ? 'durakTamam' : undefined} onDone={() => go({ name: 'station', page })} />
        ) : (
          <div class="overlay">
            <div class="celebrate">
              <div class="big-star">🌸</div>
              <button class="btn primary big" onClick={onAgain}>
                Yeniden oyna 🔄
              </button>
              <button class="btn big" onClick={() => go({ name: 'station', page })}>
                Durağa dön ⬅️
              </button>
            </div>
          </div>
        ))}
    </Screen>
  );
}
