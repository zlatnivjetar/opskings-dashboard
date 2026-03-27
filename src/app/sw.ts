/// <reference lib="webworker" />

import { defaultCache } from '@serwist/next/worker';
import {
  CacheFirst,
  ExpirationPlugin,
  NetworkFirst,
  Serwist,
  StaleWhileRevalidate,
  type PrecacheEntry,
  type RuntimeCaching,
} from 'serwist';

declare global {
  interface WorkerGlobalScope {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const appVersion = process.env.NEXT_PUBLIC_APP_VERSION?.slice(0, 12) ?? 'dev';

function cacheName(name: string) {
  return `opskings-${appVersion}-${name}`;
}

const runtimeCaching: RuntimeCaching[] = [
  {
    matcher: ({ sameOrigin, url }) => sameOrigin && url.pathname.startsWith('/_next/static/'),
    handler: new CacheFirst({
      cacheName: cacheName('next-static'),
      plugins: [
        new ExpirationPlugin({
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60,
          maxAgeFrom: 'last-used',
        }),
      ],
    }),
  },
  {
    matcher: ({ request }) => request.destination === 'font',
    handler: new CacheFirst({
      cacheName: cacheName('fonts'),
      plugins: [
        new ExpirationPlugin({
          maxEntries: 16,
          maxAgeSeconds: 30 * 24 * 60 * 60,
          maxAgeFrom: 'last-used',
        }),
      ],
    }),
  },
  {
    matcher: ({ request }) => request.destination === 'image',
    handler: new CacheFirst({
      cacheName: cacheName('images'),
      plugins: [
        new ExpirationPlugin({
          maxEntries: 96,
          maxAgeSeconds: 30 * 24 * 60 * 60,
          maxAgeFrom: 'last-used',
        }),
      ],
    }),
  },
  {
    matcher: ({ sameOrigin, url }) =>
      sameOrigin &&
      /^\/api\/(?:dashboard\/tickets-over-time|dashboard\/distributions|response-time\/details)$/.test(
        url.pathname,
      ),
    method: 'GET',
    handler: new StaleWhileRevalidate({
      cacheName: cacheName('api-reference'),
      plugins: [
        new ExpirationPlugin({
          maxEntries: 32,
          maxAgeSeconds: 10 * 60,
          maxAgeFrom: 'last-used',
        }),
      ],
    }),
  },
  {
    matcher: ({ sameOrigin, url }) =>
      sameOrigin &&
      /^\/api\/(?:dashboard\/summary|response-time\/overview|response-time\/overdue|clients\/analysis|team\/performance|portal\/tickets)$/.test(
        url.pathname,
      ),
    method: 'GET',
    handler: new NetworkFirst({
      cacheName: cacheName('api-live'),
      networkTimeoutSeconds: 5,
      plugins: [
        new ExpirationPlugin({
          maxEntries: 48,
          maxAgeSeconds: 5 * 60,
          maxAgeFrom: 'last-used',
        }),
      ],
    }),
  },
  ...defaultCache,
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  precacheOptions: {
    cleanupOutdatedCaches: true,
  },
  runtimeCaching,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  disableDevLogs: true,
  fallbacks: {
    entries: [
      {
        url: '/~offline',
        matcher: ({ request }) => request.destination === 'document',
      },
    ],
  },
});

serwist.addEventListeners();
