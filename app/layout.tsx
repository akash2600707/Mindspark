import './globals.css';
import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import { EVENT } from '@/lib/quiz-config';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: `${EVENT.name} · ${EVENT.subtitle}`,
  description:
    'A dynamic quiz contest on Rotary & Rotaract, Current Affairs & News that challenges your knowledge, sparks your curiosity and creates impact.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.variable}>
      <body>{children}</body>
    </html>
  );
}
