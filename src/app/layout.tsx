import type { Metadata } from 'next';
import { Caveat, Nunito } from 'next/font/google';
import './globals.css';

const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito', display: 'swap' });
const caveat = Caveat({ subsets: ['latin'], variable: '--font-caveat', display: 'swap' });

export const metadata: Metadata = {
  title: 'Morrow Studio — Make a little magic',
  description: 'An illustrated landscape workspace with prompts, watercolor moods, and a personal gallery.',
  icons: {
    icon: '/icon.ico',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${nunito.variable} ${caveat.variable}`}>{children}</body></html>;
}
