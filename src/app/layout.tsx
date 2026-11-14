import type { Metadata } from 'next';
import { Caveat, Nunito } from 'next/font/google';
import './globals.css';

const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito', display: 'swap' });
const caveat = Caveat({ subsets: ['latin'], variable: '--font-caveat', display: 'swap' });

export const metadata: Metadata = {
  title: 'quizpaste',
  description: 'Turn your study material into a quick, local quiz experience with quizpaste.',
  icons: {
    icon: '/icon.ico',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${nunito.variable} ${caveat.variable}`}>{children}</body></html>;
}
