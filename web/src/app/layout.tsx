import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Poker Jake',
  description: 'LINE 德州撲克 — 查看手牌與桌況',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  );
}
