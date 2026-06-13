import { PlayerView, PlayerSummary } from '@/types';
import PlayingCard from './PlayingCard';

const PHASE_LABELS: Record<string, string> = {
  waiting: '等待中', preflop: '翻牌前', flop: '翻牌',
  turn: '轉牌', river: '河牌', showdown: '攤牌', ended: '已結束',
};

const PHASE_BADGE: Record<string, string> = {
  waiting: 'border-ivory/30 text-ivory/60',
  ended: 'border-ivory/30 text-ivory/60',
  showdown: 'border-gold bg-gold text-ink',
};
const ACTIVE_BADGE = 'border-gold/60 text-gold-bright';

const signStr = (n: number) => (n >= 0 ? `+$${n}` : `-$${Math.abs(n)}`);

interface GameViewProps {
  view: PlayerView;
  displayName: string;
  lastUpdated: Date | null;
  onRefresh: () => void;
}

export default function GameView({ view, displayName, lastUpdated, onRefresh }: GameViewProps) {
  const { phase, myState: my } = view;
  const inHand = phase !== 'waiting' && phase !== 'ended';

  return (
    <div className="mx-auto flex max-w-md flex-col gap-3 px-3 pt-3 pb-8">

      {/* Header */}
      <header className="flex items-center justify-between">
        <h1 className="font-display text-lg font-bold tracking-wide text-gold">
          Poker Jake
        </h1>
        <div className="flex flex-col items-end gap-0.5">
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${PHASE_BADGE[phase] ?? ACTIVE_BADGE}`}>
            {PHASE_LABELS[phase] ?? phase} · 第 {view.handNum} 局
          </span>
          <button onClick={onRefresh} className="text-[11px] text-ivory/40" title="點擊立即刷新">
            {lastUpdated
              ? `更新於 ${lastUpdated.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
              : '刷新'}
          </button>
        </div>
      </header>

      {/* My hand */}
      <Panel
        title={`${displayName} 的手牌`}
        aside={my && (
          <span className="text-sm text-ivory/60">
            ${my.chips}
            {my.sessionNet !== 0 && (
              <span className={`ml-1.5 ${my.sessionNet > 0 ? 'text-gold-bright' : 'text-crimson-soft'}`}>
                ({signStr(my.sessionNet)})
              </span>
            )}
          </span>
        )}
      >
        <div className="flex justify-center gap-2.5">
          {view.holeCards.length > 0
            ? view.holeCards.map((c, i) => <PlayingCard key={i} label={c} />)
            : <HandHint view={view} />}
        </div>

        {my?.isMyTurn && !my.folded && !my.allIn && (
          <div className="rounded-lg bg-gold px-3 py-1.5 text-center text-sm font-bold text-ink">
            輪到你了{my.toCall > 0 ? ` · 需跟注 $${my.toCall}` : ''}
          </div>
        )}
        {my?.inPendingBuyIn && (
          <div className="rounded-lg bg-crimson px-3 py-1.5 text-center text-sm font-bold text-ivory">
            爆倉！在群組輸入 /buyin 加倉繼續
          </div>
        )}
      </Panel>

      {/* Community cards */}
      {(view.community.length > 0 || ['flop', 'turn', 'river', 'showdown'].includes(phase)) && (
        <Panel title="公共牌">
          <div className="flex flex-wrap gap-2">
            {view.community.map((c, i) => <PlayingCard key={i} label={c} />)}
            {Array.from({ length: 5 - view.community.length }).map((_, i) => (
              <PlayingCard key={`h${i}`} hidden />
            ))}
          </div>
        </Panel>
      )}

      {/* Pot */}
      {inHand && (
        <div className="flex gap-3">
          <PotTile label="底池" value={`$${view.pot}`} valueClass="text-gold-bright" />
          <PotTile label="當前下注" value={`$${view.currentBet}`} valueClass="text-ivory" />
        </div>
      )}

      {/* Players */}
      <Panel title="牌桌玩家">
        {view.players.length === 0 && <p className="text-sm text-ivory/40">尚無玩家</p>}
        {view.players.map((p, i) => <PlayerRow key={i} p={p} />)}

        {view.queueList.length > 0 && (
          <FooterNote className="text-felt-light">等待上桌：{view.queueList.join('、')}</FooterNote>
        )}
        {view.pendingBuyInList.length > 0 && (
          <FooterNote className="text-crimson-soft">等待加倉：{view.pendingBuyInList.join('、')}</FooterNote>
        )}
      </Panel>

      {/* Account */}
      <Panel title="我的帳戶">
        {view.account ? (
          <div className="grid grid-cols-2 gap-2.5">
            <Stat
              label="累積盈虧"
              value={signStr(view.account.balance)}
              valueClass={view.account.balance >= 0 ? 'text-gold-bright' : 'text-crimson-soft'}
            />
            <Stat label="遊戲場次" value={`${view.account.gamesPlayed} 局`} />
            <Stat label="總投入" value={`$${view.account.totalBuyIn}`} />
            <Stat label="加倉次數" value={`${Math.max(0, view.account.buyInCount - view.account.gamesPlayed)} 次`} />
          </div>
        ) : (
          <p className="text-sm text-ivory/40">完成第一局遊戲後顯示（/endgame 結算）</p>
        )}
        {my && (
          <FooterNote className="text-ivory/60">
            本局投入 ${my.sessionStake}，目前{' '}
            <span className={`font-semibold ${my.sessionNet >= 0 ? 'text-gold-bright' : 'text-crimson-soft'}`}>
              {signStr(my.sessionNet)}
            </span>
            （結算於 /endgame）
          </FooterNote>
        )}
      </Panel>

      <button
        onClick={onRefresh}
        className="rounded-xl border border-ivory/15 py-2.5 text-sm text-ivory/60 active:bg-ivory/10"
      >
        重新整理
      </button>

    </div>
  );
}

// ── Building blocks ───────────────────────────────────────────────────────────

function Panel({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5 rounded-2xl border border-ivory/10 bg-felt/70 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold tracking-widest text-gold/80">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function HandHint({ view }: { view: PlayerView }) {
  const my = view.myState;
  if (view.phase === 'waiting' || view.phase === 'ended')
    return <p className="text-sm text-ivory/40">遊戲尚未開始</p>;
  if (my?.folded) return <p className="text-sm text-ivory/40">已棄牌</p>;
  if (my?.inPendingBuyIn) return <p className="text-sm text-crimson-soft">爆倉，等待加倉</p>;
  if (my?.inQueue) return <p className="text-sm text-felt-light">等待上桌</p>;
  if (!my) return <p className="text-sm text-ivory/40">你不在牌桌上</p>;
  return <><PlayingCard hidden /><PlayingCard hidden /></>;
}

function PotTile({ label, value, valueClass }: { label: string; value: string; valueClass: string }) {
  return (
    <div className="flex-1 rounded-xl border border-ivory/10 bg-felt/70 px-3.5 py-2.5 text-center">
      <div className="mb-0.5 text-xs text-ivory/50">{label}</div>
      <div className={`font-display text-xl font-bold ${valueClass}`}>{value}</div>
    </div>
  );
}

function PlayerRow({ p }: { p: PlayerSummary }) {
  const rowClass = p.isCurrentTurn
    ? 'border-l-2 border-gold bg-gold/10'
    : p.isMe
      ? 'bg-ivory/5'
      : '';

  return (
    <div className={`flex items-center justify-between rounded-lg px-2.5 py-2 ${rowClass}`}>
      <div className="flex items-center gap-1.5 overflow-hidden">
        <span className={`truncate text-sm ${p.isMe ? 'font-bold' : ''} ${p.folded ? 'opacity-40' : ''}`}>
          {p.name}{p.isMe ? '（我）' : ''}
        </span>
        {p.position && <Tag className="border-ivory/25 text-ivory/70">{p.position}</Tag>}
        {p.allIn && <Tag className="border-gold text-gold">All-In</Tag>}
        {p.folded && <span className="text-xs text-crimson-soft">棄牌</span>}
      </div>
      <div className="shrink-0 text-right">
        <div className="text-sm font-semibold">${p.chips}</div>
        {p.currentBet > 0 && <div className="text-xs text-ivory/50">下注 ${p.currentBet}</div>}
      </div>
    </div>
  );
}

function Tag({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={`shrink-0 rounded border px-1 py-px text-[11px] leading-tight ${className}`}>
      {children}
    </span>
  );
}

function Stat({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="rounded-lg bg-ivory/5 px-3 py-2">
      <div className="mb-0.5 text-[11px] text-ivory/50">{label}</div>
      <div className={`font-display text-base font-bold ${valueClass ?? 'text-ivory'}`}>{value}</div>
    </div>
  );
}

function FooterNote({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <div className="mt-1 border-t border-ivory/10 pt-2">
      <span className={`text-[13px] ${className}`}>{children}</span>
    </div>
  );
}
