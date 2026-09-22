/* Monty on a phone with no signal.

   The whole prototype is the page: the shops, the clock and the payments are
   all decided in the browser, with nothing behind them to call. So once a
   phone has loaded Monty, it has everything it needs, and the only reason a
   tunnel or a dead signal should end the visit is that the browser could not
   re-fetch files it already has. This keeps a copy of them.

   It also makes the browser treat Monty as an application rather than a
   bookmark: Android asks for a worker that answers while offline before it
   will install a page as a real app with its own icon.

   The rule is network first, cache second — never the other way around for
   anything that can change. A service worker that answers from its own cache
   is the classic way to leave somebody staring at last month's build after a
   deploy, and that is worth more than the milliseconds it would save. Only the
   font files, whose names carry a content hash and so never change meaning,
   are answered from the cache directly.

   To retire it: delete this file and the registration in index.html, then
   deploy. Browsers unregister a worker whose script has gone. */
const CACHE = 'monty';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) if (name !== CACHE) await caches.delete(name);
    await self.clients.claim();
  })());
});

const isHashedFont = url => url.pathname.endsWith('.woff2');

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  // Someone else's server is their business, and only a plain read is safe to
  // repeat from a cache.
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (isHashedFont(url)) {
      const stored = await cache.match(request);
      if (stored) return stored;
    }
    try {
      const response = await fetch(request);
      if (response.ok) event.waitUntil(cache.put(request, response.clone()));
      return response;
    } catch (offline) {
      const stored = await cache.match(request);
      if (stored) return stored;
      // A phone that opened the installed icon while offline asks for a page
      // Monty has only ever served from "/".
      if (request.mode === 'navigate') {
        const shell = await cache.match('/');
        if (shell) return shell;
      }
      throw offline;
    }
  })());
});
