import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ClickStudio',
    short_name: 'ClickStudio',
    description: 'A browser-based Y2K photo booth for shooting, editing, saving, and sharing photo strips.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#fff0f5',
    theme_color: '#fff0f5',
    orientation: 'portrait',
    categories: ['photo', 'entertainment'],
    icons: [
      {
        src: '/web-app-manifest-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/web-app-manifest-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/web-app-manifest-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
