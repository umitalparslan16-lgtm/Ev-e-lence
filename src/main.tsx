import { render } from 'preact';
import { App } from './App';
import './styles.css';

render(<App />, document.getElementById('app')!);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  // Yeni sürüm yüklenince sayfayı bir kez yenile (eski sürümde takılı kalmasın)
  const hadController = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController && !reloaded) {
      reloaded = true;
      location.reload();
    }
  });
  window.addEventListener('load', () =>
    navigator.serviceWorker.register('./sw.js').then((r) => r.update()).catch(() => {})
  );
}
