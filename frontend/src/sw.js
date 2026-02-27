/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import { precacheAndRoute, matchPrecache } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkOnly } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

clientsClaim();

precacheAndRoute([
  ...self.__WB_MANIFEST,
  { url: '/offline.html', revision: null },
]);

const networkOnly = new NetworkOnly();
const staticCacheFirst = new CacheFirst({
  cacheName: 'learnify-static-assets',
  plugins: [
    new ExpirationPlugin({
      maxEntries: 200,
      maxAgeSeconds: 60 * 60 * 24 * 30,
    }),
  ],
});

const sensitivePathPattern = /(token|refresh|user\/me|quiz|submit-answer|finalize|quiz-result|quiz-history|payments)/i;

registerRoute(
  ({ url }) => url.hostname === 'api.learnifypakistan.com',
  networkOnly
);

registerRoute(
  ({ url }) => sensitivePathPattern.test(`${url.hostname}${url.pathname}`),
  networkOnly
);

registerRoute(
  ({ request }) =>
    ['script', 'style', 'font', 'image'].includes(request.destination),
  staticCacheFirst
);

registerRoute(
  ({ request }) => request.mode === 'navigate',
  async ({ event }) => {
    try {
      // Force real network for navigations (no SW cache)
      return await fetch(event.request);
    } catch (e) {
      return (await matchPrecache('/offline.html')) || Response.error();
    }
  }
);
