import type { Metadata, Viewport } from 'next';
import { Inter, Fredoka, JetBrains_Mono } from 'next/font/google';
import { WhatsNewModal } from '@/components/WhatsNewModal';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
});

const fredoka = Fredoka({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['400', '500', '600', '700'],
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'ClickStudio — Free Y2K Photo Booth Online',
  description:
    'Take photo strips, add filters and stickers, download high-res PNGs and share instantly. No app, no signup — just pure Y2K fun in your browser.',
  applicationName: 'ClickStudio',
  manifest: '/manifest.webmanifest',
  keywords: [
    'photo booth', 'online photo booth', 'y2k photo booth', 'photo strip',
    'free photo booth', 'browser photo booth', 'photo filters', 'photo stickers',
    'make photo strip', 'share photo strip',
  ],
  authors: [{ name: 'ClickStudio' }],
  creator: 'ClickStudio',
  metadataBase: new URL('https://cli-studiodev.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: 'https://cli-studiodev.vercel.app',
    siteName: 'ClickStudio',
    title: 'ClickStudio — Free Y2K Photo Booth Online',
    description:
      'Take photo strips, add filters and stickers, download high-res PNGs and share instantly. No app, no signup.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'ClickStudio — Free Y2K Photo Booth',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ClickStudio — Free Y2K Photo Booth Online',
    description:
      'Take photo strips, add filters and stickers, download and share instantly. No app, no signup.',
    images: ['/opengraph-image'],
  },
  appleWebApp: {
    capable: true,
    title: 'ClickStudio',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#fff0f5',
  colorScheme: 'light dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${fredoka.variable} ${mono.variable} font-sans bg-background text-foreground antialiased`}
      >
        {children}
        <WhatsNewModal />
      </body>
    </html>
  );
}
