'use client';

import { useEffect, useRef, useState } from 'react';
import type Liff from '@line/liff';
import { fetchPlayerView } from '@/lib/api';
import { PlayerView } from '@/types';
import GameView from './GameView';

type Status = 'loading' | 'no-group' | 'error' | 'ok';

export default function GameApp() {
  const [status, setStatus] = useState<Status>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [view, setView] = useState<PlayerView | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [displayName, setDisplayName] = useState('');

  const groupIdRef = useRef<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  const handNumRef = useRef<number>(-1);

  useEffect(() => {
    initLiff();

    // On visibility restore, refresh immediately then retry a few times to handle
    // Cloudflare KV eventual-consistency delay (cross-region replication can take seconds).
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      const snapHand = handNumRef.current;
      refresh();
      let attempts = 0;
      const retry = setInterval(async () => {
        if (handNumRef.current !== snapHand || ++attempts >= 4) {
          clearInterval(retry);
          return;
        }
        await refresh();
      }, 1500);
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => { document.removeEventListener('visibilitychange', onVisible); };
  }, []);

  async function initLiff() {
    try {
      const liff = (await import('@line/liff')).default as typeof Liff;
      await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });

      if (!liff.isLoggedIn()) {
        liff.login({ redirectUri: window.location.href });
        return;
      }

      const profile = await liff.getProfile();
      setDisplayName(profile.displayName);
      tokenRef.current = liff.getAccessToken();

      const ctx = liff.getContext();
      const ctxGroupId = (ctx as { groupId?: string })?.groupId;
      const urlGroupId = new URL(window.location.href).searchParams.get('groupId');
      // Prefer URL param: the bot encodes the real LINE group ID (C-prefix) there.
      // ctx.groupId can return a UUID in some LIFF environments which won't match KV keys.
      const groupId = urlGroupId ?? ctxGroupId ?? undefined;

      if (!groupId) {
        setStatus('no-group');
        return;
      }

      groupIdRef.current = groupId;
      await refresh();

    } catch (e) {
      console.error(e);
      setErrorMsg(String(e));
      setStatus('error');
    }
  }

  async function refresh() {
    if (!groupIdRef.current || !tokenRef.current) return;
    try {
      const data = await fetchPlayerView(groupIdRef.current, tokenRef.current);
      setView(data);
      setLastUpdated(new Date());
      setStatus('ok');
      handNumRef.current = data.handNum;
    } catch (e) {
      console.error('refresh error', e);
      setErrorMsg(String(e));
      setStatus('error');
    }
  }

  if (status === 'loading') {
    return (
      <CenterScreen>
        <span className="animate-pulse font-display text-5xl text-gold">♠</span>
        <p className="text-sm text-ivory/50">連接中…</p>
      </CenterScreen>
    );
  }

  if (status === 'no-group') {
    return (
      <CenterScreen>
        <span className="font-display text-2xl tracking-[0.4em] text-gold/70">♠♥♦♣</span>
        <h2 className="text-lg font-bold">請從 LINE 群組開啟</h2>
        <p className="text-center text-sm text-ivory/50">
          請在正在進行 Poker 的群組中點擊連結開啟此頁面。
        </p>
      </CenterScreen>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col gap-3 p-6">
        <h2 className="font-bold text-crimson-soft">錯誤</h2>
        <p className="text-[13px] break-all text-ivory/50">{errorMsg}</p>
      </div>
    );
  }

  if (!view) return null;

  return <GameView view={view} displayName={displayName} lastUpdated={lastUpdated} onRefresh={refresh} />;
}

function CenterScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6">
      {children}
    </div>
  );
}
