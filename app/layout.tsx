import type { Metadata } from 'next';
import { Fraunces, Karla } from 'next/font/google';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  weight: ['600', '700'],
});
const karla = Karla({
  subsets: ['latin'],
  variable: '--font-karla',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Delivery da Paty',
  description: 'Peça das suas lojas parceiras favoritas',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${fraunces.variable} ${karla.variable}`}>
      <body className="min-h-screen bg-bg font-body text-ink">{children}</body>
    </html>
  );
}
