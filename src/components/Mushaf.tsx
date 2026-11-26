import type { AyahItem, Page, Word } from '../lib/data';
import { arNum, clusters } from '../lib/data';

/** Kelimeyi harf kümelerine bölerek çizer; yardım modunda şeddeli/cezimli harfleri renklendirir.
 *  `mark` verilirse o harfleri (ör. oyunda hedef harf) vurgular. */
export function WordText({ w, help, mark }: { w: Word; help: boolean; mark?: (cluster: string) => boolean }) {
  if (!help && !mark) return <>{w.t}</>;
  return (
    <>
      {clusters(w.t).map((c) => {
        const cls = mark?.(c)
          ? 'mk'
          : help && c.includes('ّ')
            ? 'sh'
            : help && c.includes('ْ')
              ? 'sk'
              : '';
        return cls ? <span class={cls}>{c}</span> : c;
      })}
    </>
  );
}

type Props = {
  page: Page;
  help: boolean;
  activeKey?: string | null; // çalan ayet
  activeWord?: number; // çalan kelime
  doneKeys?: string[]; // dinlenmiş/okunmuş ayetler
  onWord?: (item: AyahItem, i: number) => void;
  onAyah?: (item: AyahItem) => void;
  only?: string; // sadece bu ayeti göster
};

export function Mushaf({ page, help, activeKey, activeWord = -1, doneKeys = [], onWord, onAyah, only }: Props) {
  return (
    <div class="mushaf" dir="rtl" lang="ar">
      {page.items.map((it) => {
        if (it.type === 'sura') {
          if (only) return null;
          return (
            <div class="sura-head">
              <span>{it.name}</span>
            </div>
          );
        }
        if (only && it.key !== only) return null;
        const active = activeKey === it.key;
        return (
          <span class={`ayah ${it.type} ${active ? 'playing' : ''}`} data-key={it.key}>
            {it.words.map((w, i) => (
              <>
                <span
                  class={`w ${active && i === activeWord ? 'on' : ''}`}
                  onClick={() => onWord?.(it, i)}
                >
                  <WordText w={w} help={help} />
                </span>{' '}
              </>
            ))}
            {it.type === 'ayah' && (
              <button
                class={`ayah-no ${doneKeys.includes(it.key) ? 'done' : ''}`}
                onClick={() => onAyah?.(it)}
                aria-label={`Ayet ${it.a}`}
              >
                {arNum(it.a)}
              </button>
            )}{' '}
            {it.type === 'besmele' && <br />}
          </span>
        );
      })}
    </div>
  );
}
