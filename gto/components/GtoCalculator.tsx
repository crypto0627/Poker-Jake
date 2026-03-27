'use client';

import { useState } from 'react';
import { Card, FULL_DECK, RANKS, SUITS, SUIT_COLOR } from '@/lib/cards';
import { calcEquityExact, calcEquityMonteCarlo, calcEquityVsHand, EquityResult } from '@/lib/equity';
import { calcOuts } from '@/lib/outs';
import { HAND_NAMES } from '@/lib/evaluator';

// ── Types ──────────────────────────────────────────────────────────────────────

type SelectionRole = 'hole' | 'community' | 'opponent' | null;
type PickerMode = 'hole' | 'community' | 'opponent';
type CalcMode = 'all' | 'vs';

interface HistoryEntry {
  hole: string[];
  community: string[];
  win: number;
  myHand: string;
  ts: number;
}

// ── Presets ────────────────────────────────────────────────────────────────────

const PRESETS: { label: string; ids: string[] }[] = [
  { label: 'AA',  ids: ['A♠', 'A♥'] },
  { label: 'KK',  ids: ['K♠', 'K♥'] },
  { label: 'QQ',  ids: ['Q♠', 'Q♥'] },
  { label: 'JJ',  ids: ['J♠', 'J♥'] },
  { label: 'TT',  ids: ['T♠', 'T♥'] },
  { label: 'AKs', ids: ['A♠', 'K♠'] },
  { label: 'AQs', ids: ['A♠', 'Q♠'] },
  { label: 'KQs', ids: ['K♠', 'Q♠'] },
  { label: 'AKo', ids: ['A♠', 'K♣'] },
  { label: 'AQo', ids: ['A♠', 'Q♣'] },
  { label: '72o', ids: ['7♠', '2♣'] },
];

function idToCard(id: string): Card | undefined {
  return FULL_DECK.find(c => c.id === id);
}

// ── Card visual ────────────────────────────────────────────────────────────────

function CardTile({
  card, role, disabled, onClick,
}: {
  card: Card; role: SelectionRole; disabled: boolean; onClick: () => void;
}) {
  const suitColor = SUIT_COLOR[card.suit];
  const bg =
    role === 'hole'      ? '#1d4ed8' :
    role === 'community' ? '#065f46' :
    role === 'opponent'  ? '#6d28d9' :
    disabled             ? '#1f2937' : '#374151';
  const textColor = role !== null ? '#fff' : disabled ? '#4b5563' : suitColor;

  return (
    <button
      onClick={onClick}
      disabled={disabled && role === null}
      style={{
        background: bg, color: textColor,
        border: role !== null ? '2px solid rgba(255,255,255,0.5)' : '1px solid #4b5563',
        borderRadius: 6, width: 36, height: 48,
        fontSize: 11, fontWeight: 700, cursor: disabled && role === null ? 'not-allowed' : 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        lineHeight: 1.2, transition: 'background 0.15s',
      }}
    >
      <span style={{ fontSize: 13 }}>{card.rank}</span>
      <span style={{ fontSize: 11 }}>{card.suit}</span>
    </button>
  );
}

// ── Result bar ─────────────────────────────────────────────────────────────────

function PctBar({ win, tie, lose }: { win: number; tie: number; lose: number }) {
  const pct = (v: number) => (v * 100).toFixed(1) + '%';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', height: 28, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ width: pct(win), background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', minWidth: win > 0.05 ? 32 : 0 }}>
          {win > 0.05 ? pct(win) : ''}
        </div>
        <div style={{ width: pct(tie), background: '#ca8a04', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>
          {tie > 0.05 ? pct(tie) : ''}
        </div>
        <div style={{ width: pct(lose), background: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', minWidth: lose > 0.05 ? 32 : 0 }}>
          {lose > 0.05 ? pct(lose) : ''}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
        <span style={{ color: '#4ade80' }}>✅ 贏 {pct(win)}</span>
        <span style={{ color: '#fbbf24' }}>🤝 平局 {pct(tie)}</span>
        <span style={{ color: '#f87171' }}>❌ 輸 {pct(lose)}</span>
      </div>
    </div>
  );
}

// ── Breakdown table ────────────────────────────────────────────────────────────

function Breakdown({ title, data, total, color }: { title: string; data: Record<string, number>; total: number; color: string }) {
  const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);
  if (!sorted.length) return null;
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 16px' }}>
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color }}>{title}</div>
      {sorted.map(([name, count]) => (
        <div key={name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
          <span style={{ color: '#d1d5db' }}>{name}</span>
          <span style={{ color, fontWeight: 600 }}>
            {count} 次 ({((count / total) * 100).toFixed(1)}%)
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

function parseHash() {
  if (typeof window === 'undefined') return {};
  const hash = window.location.hash.slice(1);
  if (!hash) return {};
  const p = new URLSearchParams(hash);
  return { h: p.get('h'), c: p.get('c'), m: p.get('m'), o: p.get('o') };
}

export default function GtoCalculator() {
  const [holeCards, setHoleCards] = useState<Card[]>(() => {
    const { h } = parseHash();
    if (!h) return [];
    const cards = h.split(',').map(idToCard).filter(Boolean) as Card[];
    return cards.length === 2 ? cards : [];
  });
  const [community, setCommunity] = useState<Card[]>(() => {
    const { c } = parseHash();
    if (!c) return [];
    return c.split(',').map(idToCard).filter(Boolean) as Card[];
  });
  const [oppCards, setOppCards] = useState<Card[]>(() => {
    const { m, o } = parseHash();
    if (m !== 'vs' || !o) return [];
    const cards = o.split(',').map(idToCard).filter(Boolean) as Card[];
    return cards.length === 2 ? cards : [];
  });
  const [calcMode, setCalcMode]         = useState<CalcMode>(() => parseHash().m === 'vs' ? 'vs' : 'all');
  const [pickerMode, setPickerMode]     = useState<PickerMode>('hole');
  const [result, setResult]             = useState<EquityResult | null>(null);
  const [computing, setComputing]       = useState(false);
  const [potSize, setPotSize]           = useState('');
  const [callAmt, setCallAmt]           = useState('');
  const [historyOpen, setHistoryOpen]   = useState(false);
  const [history, setHistory]           = useState<HistoryEntry[]>(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('gto-history') : null;
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  const allSelectedIds = new Set([...holeCards, ...community, ...oppCards].map(c => c.id));

  const cardRole = (card: Card): SelectionRole =>
    holeCards.some(c => c.id === card.id)  ? 'hole' :
    community.some(c => c.id === card.id)  ? 'community' :
    oppCards.some(c => c.id === card.id)   ? 'opponent' : null;

  const handleCardClick = (card: Card) => {
    const role = cardRole(card);
    if (role === 'hole')      { setHoleCards(prev => prev.filter(c => c.id !== card.id)); setResult(null); return; }
    if (role === 'community') { setCommunity(prev => prev.filter(c => c.id !== card.id)); setResult(null); return; }
    if (role === 'opponent')  { setOppCards(prev => prev.filter(c => c.id !== card.id));  setResult(null); return; }
    if (pickerMode === 'hole'      && holeCards.length < 2) { setHoleCards(prev => [...prev, card]); setResult(null); }
    else if (pickerMode === 'community' && community.length < 5) { setCommunity(prev => [...prev, card]); setResult(null); }
    else if (pickerMode === 'opponent'  && oppCards.length < 2)  { setOppCards(prev => [...prev, card]);  setResult(null); }
  };

  const applyPreset = (ids: string[]) => {
    const cards = ids.map(id => idToCard(id)).filter(Boolean) as Card[];
    setHoleCards(cards);
    setResult(null);
  };

  const saveHistory = (res: EquityResult, hole: Card[], comm: Card[]) => {
    const entry: HistoryEntry = {
      hole: hole.map(c => c.id),
      community: comm.map(c => c.id),
      win: res.win,
      myHand: res.myHandName,
      ts: Date.now(),
    };
    setHistory(prev => {
      const next = [entry, ...prev].slice(0, 8);
      try { localStorage.setItem('gto-history', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const calculate = () => {
    if (holeCards.length < 2) return;
    if (calcMode === 'vs' && oppCards.length < 2) return;
    setComputing(true);
    setTimeout(() => {
      let res: EquityResult;
      if (calcMode === 'vs') {
        res = calcEquityVsHand(holeCards, oppCards, community);
      } else if (community.length === 5) {
        res = calcEquityExact(holeCards, community);
      } else {
        res = calcEquityMonteCarlo(holeCards, community);
      }
      setResult(res);
      saveHistory(res, holeCards, community);
      setComputing(false);
    }, 10);
  };

  const reset = () => {
    setHoleCards([]);
    setCommunity([]);
    setOppCards([]);
    setResult(null);
    setPotSize('');
    setCallAmt('');
  };

  const restoreHistory = (entry: HistoryEntry) => {
    const hole = entry.hole.map(id => idToCard(id)).filter(Boolean) as Card[];
    const comm = entry.community.map(id => idToCard(id)).filter(Boolean) as Card[];
    setHoleCards(hole);
    setCommunity(comm);
    setResult(null);
  };

  const shareLink = () => {
    const params = new URLSearchParams();
    if (holeCards.length) params.set('h', holeCards.map(c => c.id).join(','));
    if (community.length) params.set('c', community.map(c => c.id).join(','));
    if (calcMode === 'vs' && oppCards.length) {
      params.set('m', 'vs');
      params.set('o', oppCards.map(c => c.id).join(','));
    }
    const url = `${window.location.pathname}#${params.toString()}`;
    window.history.replaceState(null, '', url);
    navigator.clipboard?.writeText(window.location.href).catch(() => {});
  };

  const phaseLabel = community.length === 0 ? 'Pre-Flop' :
    community.length === 3 ? 'Flop' :
    community.length === 4 ? 'Turn' : 'River';

  // Outs
  const outsResult = calcOuts(holeCards, community);

  // Pot odds
  const potNum  = parseFloat(potSize) || 0;
  const callNum = parseFloat(callAmt) || 0;
  const potOddsPct = potNum + callNum > 0 ? (callNum / (potNum + callNum)) * 100 : 0;
  const winPct = result ? result.win * 100 : 0;
  let adviceColor = '#6b7280';
  let adviceText  = '';
  if (result && callNum > 0) {
    if (winPct > potOddsPct + 3) {
      adviceColor = '#4ade80'; adviceText = '✅ 建議跟注 (EV+)';
    } else if (Math.abs(winPct - potOddsPct) <= 3) {
      adviceColor = '#fbbf24'; adviceText = '🤝 邊際情況';
    } else {
      adviceColor = '#f87171'; adviceText = '❌ 建議棄牌 (EV-)';
    }
  }

  // Disabled logic per picker mode
  const isCardDisabled = (card: Card): boolean => {
    const role = cardRole(card);
    if (role !== null) return false; // selected cards are always clickable (to deselect)
    if (allSelectedIds.has(card.id)) return true;
    if (pickerMode === 'hole') return holeCards.length >= 2;
    if (pickerMode === 'community') return community.length >= 5;
    if (pickerMode === 'opponent') return oppCards.length >= 2;
    return false;
  };

  const tabStyle = (active: boolean, color: string) => ({
    flex: 1, padding: '10px 0', borderRadius: 10, fontWeight: 600, fontSize: 13,
    cursor: 'pointer', border: 'none',
    background: active ? color : 'rgba(255,255,255,0.08)',
    color: '#fff',
  });

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 16px 48px', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{ textAlign: 'center', paddingBottom: 4 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>🃏 Poker GTO 計算器</h1>
        <p style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>選擇手牌與公共牌，計算勝率與對手牌型分析</p>
      </div>

      {/* Quick Presets */}
      <div>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>快速預設</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {PRESETS.map(p => (
            <button key={p.label} onClick={() => applyPreset(p.ids)} style={{
              padding: '5px 10px', borderRadius: 8, border: '1px solid #374151',
              background: 'rgba(255,255,255,0.06)', color: '#e5e7eb',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => { setCalcMode('all'); setOppCards([]); setResult(null); }} style={tabStyle(calcMode === 'all', '#374151')}>
          vs 所有手牌
        </button>
        <button onClick={() => { setCalcMode('vs'); setResult(null); }} style={tabStyle(calcMode === 'vs', '#7c3aed')}>
          vs 特定手牌
        </button>
      </div>

      {/* Picker mode tabs */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => setPickerMode('hole')} style={tabStyle(pickerMode === 'hole', '#1d4ed8')}>
          🤚 手牌 ({holeCards.length}/2)
        </button>
        <button onClick={() => setPickerMode('community')} style={tabStyle(pickerMode === 'community', '#065f46')}>
          🎴 公共牌 ({community.length}/5)
        </button>
        {calcMode === 'vs' && (
          <button onClick={() => setPickerMode('opponent')} style={tabStyle(pickerMode === 'opponent', '#6d28d9')}>
            🎯 對手手牌 ({oppCards.length}/2)
          </button>
        )}
      </div>

      {/* Card picker */}
      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 16 }}>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>
          點擊選牌 — <span style={{ color: '#60a5fa' }}>藍色</span>=手牌　<span style={{ color: '#34d399' }}>綠色</span>=公共牌
          {calcMode === 'vs' && <span>　<span style={{ color: '#a78bfa' }}>紫色</span>=對手手牌</span>}
          　再點一次取消
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {RANKS.slice().reverse().map(rank => (
            <div key={rank} style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <span style={{ width: 18, color: '#6b7280', fontSize: 11, textAlign: 'right', flexShrink: 0 }}>{rank}</span>
              {SUITS.map(suit => {
                const card = FULL_DECK.find(c => c.rank === rank && c.suit === suit)!;
                const role = cardRole(card);
                const disabled = isCardDisabled(card);
                return (
                  <CardTile key={card.id} card={card} role={role} disabled={disabled} onClick={() => handleCardClick(card)} />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Selected cards display */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 120, background: 'rgba(29,78,216,0.15)', borderRadius: 12, padding: '10px 14px', border: '1px solid rgba(29,78,216,0.3)' }}>
          <div style={{ fontSize: 12, color: '#93c5fd', marginBottom: 6 }}>手牌</div>
          <div style={{ display: 'flex', gap: 8, minHeight: 32 }}>
            {holeCards.length === 0
              ? <span style={{ color: '#4b5563', fontSize: 13 }}>尚未選擇</span>
              : holeCards.map(c => (
                <span key={c.id} style={{ fontSize: 18, fontWeight: 700, color: SUIT_COLOR[c.suit] }}>
                  {c.rank}{c.suit}
                </span>
              ))}
          </div>
        </div>
        <div style={{ flex: 2, minWidth: 160, background: 'rgba(6,95,70,0.15)', borderRadius: 12, padding: '10px 14px', border: '1px solid rgba(6,95,70,0.3)' }}>
          <div style={{ fontSize: 12, color: '#6ee7b7', marginBottom: 6 }}>公共牌 — {phaseLabel}</div>
          <div style={{ display: 'flex', gap: 8, minHeight: 32, flexWrap: 'wrap' }}>
            {community.length === 0
              ? <span style={{ color: '#4b5563', fontSize: 13 }}>尚未選擇</span>
              : community.map(c => (
                <span key={c.id} style={{ fontSize: 18, fontWeight: 700, color: SUIT_COLOR[c.suit] }}>
                  {c.rank}{c.suit}
                </span>
              ))}
          </div>
        </div>
        {calcMode === 'vs' && (
          <div style={{ flex: 1, minWidth: 120, background: 'rgba(109,40,217,0.15)', borderRadius: 12, padding: '10px 14px', border: '1px solid rgba(109,40,217,0.3)' }}>
            <div style={{ fontSize: 12, color: '#c4b5fd', marginBottom: 6 }}>對手手牌</div>
            <div style={{ display: 'flex', gap: 8, minHeight: 32 }}>
              {oppCards.length === 0
                ? <span style={{ color: '#4b5563', fontSize: 13 }}>尚未選擇</span>
                : oppCards.map(c => (
                  <span key={c.id} style={{ fontSize: 18, fontWeight: 700, color: SUIT_COLOR[c.suit] }}>
                    {c.rank}{c.suit}
                  </span>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Outs panel */}
      {holeCards.length === 2 && outsResult.applicable && (
        <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 16, padding: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10, color: '#fbbf24' }}>
            🎯 Outs 分析
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, fontWeight: 800, color: '#fbbf24', lineHeight: 1 }}>{outsResult.outs}</div>
              <div style={{ fontSize: 12, color: '#92400e' }}>張 outs</div>
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              {community.length === 3 && (
                <div style={{ fontSize: 13, color: '#fcd34d', marginBottom: 4 }}>
                  翻牌圈 (2張待出): ~{outsResult.rule4}%
                </div>
              )}
              {community.length === 4 && (
                <div style={{ fontSize: 13, color: '#fcd34d', marginBottom: 4 }}>
                  河牌圈 (1張待出): ~{outsResult.rule2}%
                </div>
              )}
              {outsResult.draws.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4 }}>
                  {outsResult.draws.map(d => (
                    <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#d1d5db' }}>
                      <span>{d.name}</span>
                      <span style={{ color: '#fbbf24', fontWeight: 600 }}>{d.outs} outs</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={calculate}
          disabled={holeCards.length < 2 || computing || (calcMode === 'vs' && oppCards.length < 2)}
          style={{
            flex: 3, padding: '12px 0', borderRadius: 12, border: 'none',
            background: (holeCards.length >= 2 && !computing && (calcMode === 'all' || oppCards.length >= 2)) ? '#16a34a' : '#1f2937',
            color: '#fff', fontWeight: 700, fontSize: 16,
            cursor: (holeCards.length >= 2 && !computing && (calcMode === 'all' || oppCards.length >= 2)) ? 'pointer' : 'not-allowed',
          }}
        >
          {computing ? '計算中…' : calcMode === 'vs' ? '⚡ 精確對決計算' : community.length < 5 ? `⚡ 模擬計算 (${community.length === 0 ? 'Pre-Flop' : phaseLabel})` : '⚡ 精確計算 (River)'}
        </button>
        <button onClick={reset} style={{
          flex: 1, padding: '12px 0', borderRadius: 12, border: '1px solid #374151',
          background: 'transparent', color: '#9ca3af', fontWeight: 600, fontSize: 14, cursor: 'pointer',
        }}>
          重置
        </button>
      </div>

      {/* Results */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>📊 勝率分析</span>
              <span style={{ fontSize: 12, color: '#6b7280' }}>
                {calcMode === 'vs'
                  ? `精確枚舉 (${result.total} 種完成)`
                  : community.length === 5
                    ? `精確 (${result.total} 種對手牌)`
                    : `Monte Carlo (${result.total} 次模擬)`}
              </span>
            </div>
            {result.myHandName !== '(模擬中)' && result.myHandName !== '(計算中)' && (
              <div style={{ fontSize: 13, color: '#fbbf24' }}>你目前的牌型：<strong>{result.myHandName}</strong></div>
            )}
            <PctBar win={result.win} tie={result.tie} lose={result.lose} />
          </div>

          {/* Pot Odds Advisor */}
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: '#e5e7eb' }}>💰 底池賠率建議</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 120 }}>
                <label style={{ fontSize: 12, color: '#9ca3af' }}>底池大小</label>
                <input
                  type="number" min="0" value={potSize}
                  onChange={e => setPotSize(e.target.value)}
                  placeholder="0"
                  style={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, padding: '8px 10px', color: '#f3f4f6', fontSize: 14, width: '100%', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 120 }}>
                <label style={{ fontSize: 12, color: '#9ca3af' }}>跟注金額</label>
                <input
                  type="number" min="0" value={callAmt}
                  onChange={e => setCallAmt(e.target.value)}
                  placeholder="0"
                  style={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, padding: '8px 10px', color: '#f3f4f6', fontSize: 14, width: '100%', boxSizing: 'border-box' }}
                />
              </div>
            </div>
            {callNum > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 13, color: '#d1d5db' }}>
                  底池賠率: <strong style={{ color: '#fbbf24' }}>{potOddsPct.toFixed(1)}%</strong>
                  　勝率: <strong style={{ color: '#4ade80' }}>{winPct.toFixed(1)}%</strong>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: adviceColor }}>{adviceText}</div>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Breakdown
              title="❌ 對手贏你時的牌型"
              data={result.loseBreakdown}
              total={result.total}
              color="#f87171"
            />
            <Breakdown
              title="✅ 你贏對手時你的牌型"
              data={result.winBreakdown}
              total={result.total}
              color="#4ade80"
            />
          </div>

          {/* Hand strength reference */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '10px 14px' }}>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>牌型強度（由強到弱）</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
              {[8,7,6,5,4,3,2,1,0].map(i => (
                <span key={i} style={{ fontSize: 12, color: '#9ca3af' }}>{HAND_NAMES[i]}</span>
              ))}
            </div>
          </div>

          {/* Share link */}
          <button onClick={shareLink} style={{
            padding: '10px 0', borderRadius: 12, border: '1px solid #374151',
            background: 'rgba(255,255,255,0.04)', color: '#9ca3af', fontWeight: 600,
            fontSize: 14, cursor: 'pointer',
          }}>
            📋 分享連結
          </button>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16 }}>
          <button
            onClick={() => setHistoryOpen(h => !h)}
            style={{ background: 'none', border: 'none', color: '#e5e7eb', fontWeight: 700, fontSize: 14, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            📜 最近計算 {historyOpen ? '▲' : '▼'}
          </button>
          {historyOpen && (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {history.map((entry, i) => (
                <button
                  key={i}
                  onClick={() => restoreHistory(entry)}
                  style={{
                    background: 'rgba(255,255,255,0.05)', border: '1px solid #374151',
                    borderRadius: 10, padding: '8px 12px', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    color: '#d1d5db', fontSize: 13,
                  }}
                >
                  <span>{entry.hole.join(' ')} {entry.community.length > 0 ? `| ${entry.community.join(' ')}` : ''}</span>
                  <span style={{ display: 'flex', gap: 10 }}>
                    <span style={{ color: '#4ade80', fontWeight: 600 }}>{(entry.win * 100).toFixed(1)}%</span>
                    {entry.myHand && entry.myHand !== '(模擬中)' && entry.myHand !== '(計算中)' && (
                      <span style={{ color: '#fbbf24' }}>{entry.myHand}</span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
