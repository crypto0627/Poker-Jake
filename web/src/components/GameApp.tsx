'use client';

import { useEffect, useRef, useState } from 'react';
import type Liff from '@line/liff';
import { fetchPlayerView } from '@/lib/api';
import { PlayerView } from '@/types';

// ── Card component ────────────────────────────────────────────────────────────

function Card({ label, hidden }: { label?: string; hidden?: boolean }) {
  if (hidden || !label) {
    return (
      <div className="w-12 h-18 rounded-lg flex items-center justify-center text-white text-2xl"
        style={{ background: 'linear-gradient(135deg,#1e40af,#1d4ed8)', width: 48, height: 72, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.5)' }}>
        🂠
      </div>
    );
  }
  const isRed = label.includes('♥️') || label.includes('♦️');
  return (
    <div style={{ background: '#fff', width: 48, height: 72, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.4)', flexShrink: 0 }}>
      <span style={{ fontSize: 18, fontWeight: 700, color: isRed ? '#dc2626' : '#111', lineHeight: 1 }}>{label}</span>
    </div>
  );
}

// ── Phase label ───────────────────────────────────────────────────────────────

const PHASE_LABELS: Record<string, string> = {
  waiting: '等待中', preflop: '翻牌前', flop: '翻牌',
  turn: '轉牌', river: '河牌', showdown: '攤牌', ended: '已結束',
};

const PHASE_COLORS: Record<string, string> = {
  waiting: '#6b7280', preflop: '#3b82f6', flop: '#10b981',
  turn: '#f59e0b', river: '#ef4444', showdown: '#8b5cf6', ended: '#6b7280',
};

// ── Main component ────────────────────────────────────────────────────────────

export default function GameApp() {
  const [status, setStatus] = useState<'loading' | 'no-group' | 'error' | 'ok'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [view, setView] = useState<PlayerView | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [displayName, setDisplayName] = useState('');

  const groupIdRef = useRef<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    initLiff();

    // Refresh immediately when user switches back to this tab/app
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  async function initLiff() {
    try {
      const liff = (await import('@line/liff')).default as typeof Liff;
      await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });

      if (!liff.isLoggedIn()) {
        // Preserve current URL (including ?groupId=xxx) through LINE OAuth redirect
        liff.login({ redirectUri: window.location.href });
        return;
      }

      const profile = await liff.getProfile();
      setDisplayName(profile.displayName);
      tokenRef.current = liff.getAccessToken();

      // groupId from LIFF context (opened via LIFF link inside LINE)
      // or from URL param (direct browser access with ?groupId=xxx)
      const ctx = liff.getContext();
      const groupId =
        (ctx as { groupId?: string })?.groupId ??
        new URL(window.location.href).searchParams.get('groupId') ??
        undefined;

      if (!groupId) {
        setStatus('no-group');
        return;
      }

      groupIdRef.current = groupId;
      await refresh();

      // Poll every 2 seconds
      intervalRef.current = setInterval(refresh, 2000);
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
    } catch (e) {
      console.error('refresh error', e);
    }
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', gap: 16 }}>
        <div style={{ fontSize: 48 }}>🃏</div>
        <p style={{ color: '#9ca3af' }}>連接中…</p>
      </div>
    );
  }

  if (status === 'no-group') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', gap: 12, padding: 24 }}>
        <div style={{ fontSize: 48 }}>⚠️</div>
        <h2 style={{ fontWeight: 700, fontSize: 18 }}>請從 LINE 群組開啟</h2>
        <p style={{ color: '#9ca3af', textAlign: 'center', fontSize: 14 }}>
          請在正在進行 Poker 的群組中點擊連結開啟此頁面。
        </p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ color: '#ef4444', fontWeight: 700 }}>錯誤</h2>
        <p style={{ color: '#9ca3af', fontSize: 13 }}>{errorMsg}</p>
      </div>
    );
  }

  // ── Game view ───────────────────────────────────────────────────────────────
  if (!view) return null;

  const phase = view.phase;
  const my = view.myState;
  const signStr = (n: number) => (n >= 0 ? `+$${n}` : `-$${Math.abs(n)}`);

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '12px 12px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 24 }}>🃏</span>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Poker Jake</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
          <span style={{ background: PHASE_COLORS[phase] ?? '#6b7280', color: '#fff', borderRadius: 12, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>
            {PHASE_LABELS[phase] ?? phase}  第 {view.handNum} 局
          </span>
          <span
            onClick={refresh}
            style={{ color: '#6b7280', fontSize: 11, cursor: 'pointer', userSelect: 'none' }}
            title="點擊立即刷新"
          >
            {lastUpdated
              ? `🔄 ${lastUpdated.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
              : '🔄'}
          </span>
        </div>
      </div>

      {/* My Hole Cards */}
      <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>👤 {displayName} 的手牌</span>
          {my && (
            <span style={{ fontSize: 13, color: '#9ca3af' }}>
              💰 ${my.chips}
              {my.sessionNet !== 0 && (
                <span style={{ color: my.sessionNet > 0 ? '#34d399' : '#f87171', marginLeft: 6 }}>
                  ({signStr(my.sessionNet)})
                </span>
              )}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          {view.holeCards.length > 0
            ? view.holeCards.map((c, i) => <Card key={i} label={c} />)
            : (
              phase === 'waiting' || phase === 'ended'
                ? <p style={{ color: '#6b7280', fontSize: 14 }}>遊戲尚未開始</p>
                : my?.folded
                  ? <p style={{ color: '#6b7280', fontSize: 14 }}>❌ 已棄牌</p>
                  : my?.inPendingBuyIn
                    ? <p style={{ color: '#f59e0b', fontSize: 14 }}>💸 爆倉等待加倉</p>
                    : my?.inQueue
                      ? <p style={{ color: '#60a5fa', fontSize: 14 }}>⏳ 等待上桌</p>
                      : !my
                        ? <p style={{ color: '#6b7280', fontSize: 14 }}>你不在牌桌上</p>
                        : <><Card hidden /><Card hidden /></>
            )
          }
        </div>

        {/* Turn indicator */}
        {my?.isMyTurn && !my.folded && !my.allIn && (
          <div style={{ background: '#f0b429', color: '#111', borderRadius: 10, padding: '6px 12px', textAlign: 'center', fontWeight: 700, fontSize: 14 }}>
            👉 輪到你了！{my.toCall > 0 ? ` 需跟注 $${my.toCall}` : ''}
          </div>
        )}
        {my?.inPendingBuyIn && (
          <div style={{ background: '#7c3aed', color: '#fff', borderRadius: 10, padding: '6px 12px', textAlign: 'center', fontWeight: 700, fontSize: 14 }}>
            💸 爆倉！在群組輸入 /buyin 加倉繼續
          </div>
        )}
      </div>

      {/* Community Cards */}
      {(view.community.length > 0 || ['flop','turn','river','showdown'].includes(phase)) && (
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>🎴 公共牌</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {view.community.map((c, i) => <Card key={i} label={c} />)}
            {/* Placeholder for unrevealed cards */}
            {Array.from({ length: 5 - view.community.length }).map((_, i) => (
              <Card key={`h${i}`} hidden />
            ))}
          </div>
        </div>
      )}

      {/* Pot info */}
      {phase !== 'waiting' && phase !== 'ended' && (
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '10px 14px', textAlign: 'center' }}>
            <div style={{ color: '#9ca3af', fontSize: 12, marginBottom: 2 }}>底池</div>
            <div style={{ fontWeight: 700, fontSize: 20, color: '#f0b429' }}>${view.pot}</div>
          </div>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '10px 14px', textAlign: 'center' }}>
            <div style={{ color: '#9ca3af', fontSize: 12, marginBottom: 2 }}>當前下注</div>
            <div style={{ fontWeight: 700, fontSize: 20, color: '#60a5fa' }}>${view.currentBet}</div>
          </div>
        </div>
      )}

      {/* Players list */}
      <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>🪑 牌桌玩家</span>
        {view.players.length === 0 && (
          <p style={{ color: '#6b7280', fontSize: 13 }}>尚無玩家</p>
        )}
        {view.players.map((p, i) => {
          const tags: string[] = [];
          if (p.isDealer) tags.push('D');
          if (p.isSB) tags.push('SB');
          if (p.isBB) tags.push('BB');
          if (p.allIn) tags.push('All-In');

          return (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 10px', borderRadius: 10,
              background: p.isCurrentTurn ? 'rgba(240,180,41,0.15)' : p.isMe ? 'rgba(255,255,255,0.08)' : 'transparent',
              border: p.isCurrentTurn ? '1px solid rgba(240,180,41,0.4)' : p.isMe ? '1px solid rgba(255,255,255,0.12)' : '1px solid transparent',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                {p.isCurrentTurn && <span>▶</span>}
                <span style={{ fontWeight: p.isMe ? 700 : 400, fontSize: 14, opacity: p.folded ? 0.4 : 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.name}{p.isMe ? ' (我)' : ''}
                </span>
                {tags.map(t => (
                  <span key={t} style={{ background: t === 'D' ? '#374151' : t === 'All-In' ? '#7c3aed' : '#1d4ed8', color: '#fff', borderRadius: 6, padding: '1px 5px', fontSize: 11 }}>{t}</span>
                ))}
                {p.folded && <span style={{ color: '#ef4444', fontSize: 12 }}>棄牌</span>}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>💰 ${p.chips}</div>
                {p.currentBet > 0 && <div style={{ color: '#9ca3af', fontSize: 12 }}>下注 ${p.currentBet}</div>}
              </div>
            </div>
          );
        })}

        {/* Queue & pending buy-in */}
        {view.queueList.length > 0 && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 8, marginTop: 4 }}>
            <span style={{ color: '#60a5fa', fontSize: 13 }}>⏳ 等待上桌：{view.queueList.join('、')}</span>
          </div>
        )}
        {view.pendingBuyInList.length > 0 && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 8, marginTop: 4 }}>
            <span style={{ color: '#f59e0b', fontSize: 13 }}>💸 等待加倉：{view.pendingBuyInList.join('、')}</span>
          </div>
        )}
      </div>

      {/* Account */}
      <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>📊 我的帳戶</span>
        {view.account ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Stat label="累積盈虧" value={signStr(view.account.balance)} color={view.account.balance >= 0 ? '#34d399' : '#f87171'} />
            <Stat label="遊戲場次" value={`${view.account.gamesPlayed} 局`} />
            <Stat label="總投入" value={`$${view.account.totalBuyIn}`} />
            <Stat label="加倉次數" value={`${Math.max(0, view.account.buyInCount - view.account.gamesPlayed)} 次`} />
          </div>
        ) : (
          <p style={{ color: '#6b7280', fontSize: 13 }}>完成第一局遊戲後顯示（/endgame 結算）</p>
        )}
        {my && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 8, marginTop: 2 }}>
            <span style={{ color: '#9ca3af', fontSize: 13 }}>
              本局投入 ${my.sessionStake}，
              目前 <span style={{ color: my.sessionNet >= 0 ? '#34d399' : '#f87171', fontWeight: 600 }}>{signStr(my.sessionNet)}</span>
              （結算於 /endgame）
            </span>
          </div>
        )}
      </div>

      {/* Refresh button */}
      <button
        onClick={refresh}
        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '10px', color: '#9ca3af', fontSize: 14, cursor: 'pointer' }}
      >
        🔄 手動刷新
      </button>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '8px 12px' }}>
      <div style={{ color: '#6b7280', fontSize: 11, marginBottom: 2 }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: 16, color: color ?? '#f1f5f0' }}>{value}</div>
    </div>
  );
}
