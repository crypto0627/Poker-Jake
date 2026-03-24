'use client';

import dynamic from 'next/dynamic';

// LIFF SDK is browser-only — disable SSR for the entire game view
const GameApp = dynamic(() => import('@/components/GameApp'), { ssr: false });

export default function Page() {
  return <GameApp />;
}
