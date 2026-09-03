import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { EB_Garamond, Hanken_Grotesk } from 'next/font/google';
import { getConfig } from '@aip/config';
import { SkipLink } from '../components/skip-link';
import { Toaster } from '../components/toaster';
import './globals.css';

const sans = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const serif = EB_Garamond({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Article Intelligence Platform',
    template: '%s · Article Intelligence',
  },
  description: 'Publish and discover articles with transparent, AI-assisted evaluation.',
  metadataBase: new URL(getConfig().APP_URL),
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body className="font-sans">
        <SkipLink />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
