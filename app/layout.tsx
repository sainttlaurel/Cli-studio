import type { Metadata, Viewport } from 'next';
import { Inter, Fredoka, JetBrains_Mono } from 'next/font/google';
import { WhatsNewModal } from '@/components/WhatsNewModal';
import { I18nProvider } from '@/lib/i18n';
import { getDefaultLocale } from '@/lib/i18n/server';
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
  title: 'ClickStudio - Own Your Shot',
  description:
    'The ultimate browser-based Y2K photo booth. No app, no signup, just vibes.',
  applicationName: 'ClickStudio',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'ClickStudio',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#fff0f5',
  colorScheme: 'light dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const defaultLocale = getDefaultLocale();

  return (
    <html lang={defaultLocale}>
      <body
        className={`${inter.variable} ${fredoka.variable} ${mono.variable} font-sans bg-background text-foreground antialiased`}
      >
        <I18nProvider initialLocale={defaultLocale}>
          {children}
          <WhatsNewModal />
        </I18nProvider>
      </body>
    </html>
  );
}
