// Cache do app para funcionar offline (ex.: academia sem sinal).
const CACHE = 'pilar-v50';
// Os arquivos do app (assets/*.js e *.css, com nome que muda a cada versão) entram no cache na primeira visita.
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// Rede primeiro (pega atualizações), cache se estiver offline.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then((r) => {
      const copy = r.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy));
      return r;
    }).catch(() => caches.match(e.request).then((r) => r || caches.match('index.html')))
  );
});

// Lembretes (Web Push): o servidor manda { titulo, texto, tag, abrir } na hora do lembrete.
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { texto: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.titulo || 'Pilar', {
    body: d.texto || '',
    tag: d.tag || 'pilar',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    silent: true,
    data: { abrir: d.abrir || './' },
  }));
});
// Tocar na notificação abre (ou traz para frente) o Pilar na tela certa.
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const alvo = new URL(e.notification.data?.abrir || './', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => {
    const c = cs.find((x) => x.url.startsWith(self.registration.scope));
    if (c) { c.navigate(alvo).catch(() => {}); return c.focus(); }
    return self.clients.openWindow(alvo);
  }));
});
