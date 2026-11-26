import { useEffect, useState } from 'preact/hooks';
import { useStore, useRoute, update, getState, rollDay } from './lib/store';
import { say } from './lib/voice';
import { Hudhud } from './components/Art';
import { Home, Setup, Station } from './screens/Home';
import { Listen } from './screens/Listen';
import { Read } from './screens/Read';
import { Play } from './screens/Play';
import { Garden } from './screens/Garden';
import { Parent } from './screens/Parent';

/** Günlük süreyi sayar; ayarlanan süre dolunca bir kez nazikçe mola önerir. */
function useSessionTimer(onBreak: () => void) {
  useEffect(() => {
    const t = setInterval(() => {
      if (document.hidden) return;
      rollDay();
      update((d) => void (d.day.seconds += 15));
      const s = getState();
      if (!s.day.breakShown && s.day.seconds >= s.settings.sessionMin * 60) {
        update((d) => void (d.day.breakShown = true));
        onBreak();
      }
    }, 15000);
    return () => clearInterval(t);
  }, []);
}

export function App() {
  const s = useStore();
  const r = useRoute();
  const [started, setStarted] = useState(false);
  const [rest, setRest] = useState(false);
  useSessionTimer(() => {
    setRest(true);
    say('mola');
  });

  if (!s.setupDone) return <Setup />;

  // Tarayıcılar sesi ancak bir dokunuştan sonra çalar: açılışta tek dokunuşla başla.
  if (!started) {
    return (
      <div
        class="splash"
        onClick={() => {
          setStarted(true);
          say('hosgeldin');
        }}
      >
        <Hudhud size={180} />
        <h1>{s.childName}</h1>
        <button class="btn primary big">Dokun, başlayalım ▶️</button>
      </div>
    );
  }

  return (
    <>
      {r.name === 'home' && <Home />}
      {r.name === 'station' && <Station page={r.page} />}
      {r.name === 'listen' && <Listen page={r.page} />}
      {r.name === 'read' && <Read page={r.page} />}
      {r.name === 'play' && <Play page={r.page} />}
      {r.name === 'garden' && <Garden />}
      {r.name === 'parent' && <Parent />}
      {rest && (
        <div class="overlay" onClick={() => setRest(false)}>
          <div class="celebrate">
            <div class="big-star">🌙</div>
            <Hudhud size={120} />
            <p class="rest-text">Bugün çok güzel çalıştın!</p>
            <button class="btn primary big">Tamam</button>
          </div>
        </div>
      )}
    </>
  );
}
