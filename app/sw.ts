import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate, Serwist } from 'serwist';
import { ExpirationPlugin } from 'serwist';

// This is injected by @serwist/next at build time
declare global {
  interface ServiceWorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Supabase CDN strip images — serve from cache first, refresh in background
    {
      matcher: ({ url }) => url.hostname.endsWith('.supabase.co') && url.pathname.startsWith('/storage/'),
      handler: new StaleWhileRevalidate({
        cacheName: 'supabase-images',
        plugins: [
          new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 7 * 24 * 60 * 60 }),
        ],
      }),
    },
    // Google Fonts stylesheets
    {
      matcher: ({ url }) => url.hostname === 'fonts.googleapis.com',
      handler: new StaleWhileRevalidate({ cacheName: 'google-fonts-stylesheets' }),
    },
    // Google Fonts files
    {
      matcher: ({ url }) => url.hostname === 'fonts.gstatic.com',
      handler: new CacheFirst({
        cacheName: 'google-fonts-webfonts',
        plugins: [
          new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 }),
        ],
      }),
    },
    // Next.js static assets — always from network (they're hash-versioned by the precache)
    {
      matcher: ({ url }) => url.pathname.startsWith('/_next/static/'),
      handler: new CacheFirst({ cacheName: 'next-static' }),
    },
    // Navigation requests for pages that can work offline (/, /studio, /editor)
    // All other navigations fall through to the offline fallback below
    {
      matcher: ({ request }) => request.mode === 'navigate',
      handler: new NetworkFirst({
        cacheName: 'pages',
        plugins: [
          new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 24 * 60 * 60 }),
        ],
        networkTimeoutSeconds: 5,
      }),
    },
  ],
  fallbacks: {
    entries: [{ url: '/offline', matcher: ({ request }) => request.mode === 'navigate' }],
  },
});

serwist.addEventListeners();
