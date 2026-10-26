// Service worker: app shell offline com estratégia stale-while-revalidate.
// Não guarda dados do jogador (localStorage continua sendo a única fonte).

const CACHE = 'pdd-v1';
const SHELL = [
  './index.html',
  './css/tokens.css',
  './css/base.css',
  './css/components.css',
  './css/animations.css',
  './js/app.js',
  './js/daily.js',
  './js/game.js',
  './js/dictionary.js',
  './js/stats.js',
  './js/share.js',
  './js/storage.js',
  './js/a11y.js',
  './js/feedback.js',
  './js/components/board.js',
  './js/components/keyboard.js',
  './js/components/modal.js',
  './js/components/toast.js',
  './js/screens/home.js',
  './js/screens/game.js',
  './js/screens/stats.js',
  './data/respostas.js',
  './data/validas.js'
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((chaves) =>
        Promise.all(
          chaves
            .filter((chave) => chave.startsWith('pdd-') && chave !== CACHE)
            .map((chave) => caches.delete(chave))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (evento) => {
  const requisicao = evento.request;
  if (requisicao.method !== 'GET') return;

  const url = new URL(requisicao.url);
  if (url.origin !== self.location.origin) return;

  // As páginas de teste não entram no cache: evitam validar código antigo.
  if (url.pathname.startsWith('/tests/')) return;

  if (requisicao.mode === 'navigate') {
    // Navegação: rede primeiro para não servir o index em URLs erradas (por
    // exemplo /tests/test.html). Offline, cai para a própria página ou para o
    // app shell.
    evento.respondWith(
      fetch(requisicao)
        .then((resposta) => {
          if (resposta && resposta.ok) {
            const copia = resposta.clone();
            caches.open(CACHE).then((cache) => cache.put(requisicao, copia));
          }
          return resposta;
        })
        .catch(() =>
          caches
            .match(requisicao)
            .then((emCache) => emCache || caches.match('./index.html'))
        )
    );
    return;
  }

  evento.respondWith(
    caches.match(requisicao).then((emCache) => {
      const rede = fetch(requisicao)
        .then((resposta) => {
          if (resposta && resposta.ok) {
            const copia = resposta.clone();
            caches.open(CACHE).then((cache) => cache.put(requisicao, copia));
          }
          return resposta;
        })
        .catch(() => emCache);

      return emCache || rede;
    })
  );
});
