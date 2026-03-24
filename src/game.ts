/**
 * Texas Hold'em game engine for Cloudflare Workers.
 * State is plain JSON so it round-trips through KV without issues.
 */

import { Card, makeDeck } from './card';
import { bestHand, handName, HandScore } from './handEvaluator';
import { SettlementEntry } from './accounts';

export const SMALL_BLIND = 10;
export const BIG_BLIND = 20;
export const STARTING_CHIPS = 1000;
export const MAX_PLAYERS = 9;

export type Phase =
  | 'waiting'
  | 'preflop'
  | 'flop'
  | 'turn'
  | 'river'
  | 'showdown'
  | 'ended';

// ── Data types ────────────────────────────────────────────────────────────────

export interface PlayerState {
  userId: string;
  name: string;
  chips: number;
  holeCards: Card[];
  currentBet: number;        // committed in current betting round
  totalBet: number;          // committed in this hand (for side-pot calc)
  folded: boolean;
  allIn: boolean;
  isDealer: boolean;
  isSB: boolean;
  isBB: boolean;
  hasActed: boolean;
  wantsToLeave: boolean;
  sessionStake: number;      // total chips bought in for this game session
  buyInThisSession: number;  // buy-in transactions this session (1 = initial join)
}

export interface QueueEntry {
  userId: string;
  name: string;
  startingChips: number;     // chips to receive when hand starts
  sessionStake: number;      // accumulated stake so far (carries over from re-buys)
  buyInThisSession: number;  // buy-in count so far (carries over)
}

export interface PendingBuyInEntry {
  userId: string;
  name: string;
  sessionStake: number;      // stake at time of bust
  buyInThisSession: number;  // buy-in count at time of bust
}

export interface GameState {
  groupId: string;
  phase: Phase;
  handNum: number;
  players: PlayerState[];
  queue: QueueEntry[];
  pendingBuyIn: PendingBuyInEntry[];  // busted, awaiting re-buy decision
  deck: Card[];
  community: Card[];
  pot: number;
  currentBet: number;
  dealerIdx: number;
  currentIdx: number;
}

export interface ActionResult {
  ok: boolean;
  groupMsg: string;
  privateMessages: Record<string, string>;
  mentionUserId?: string;
  mentionName?: string;
  /** Players who just hit 0 chips — index.ts should push them a buy-in prompt */
  bustedPlayers?: Array<{ userId: string; name: string }>;
  /** Session settlements to persist in KV accounts */
  settlements?: SettlementEntry[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function ok(
  groupMsg: string,
  privateMsgs: Record<string, string> = {},
  opts: Partial<Omit<ActionResult, 'ok' | 'groupMsg' | 'privateMessages'>> = {}
): ActionResult {
  return { ok: true, groupMsg, privateMessages: privateMsgs, ...opts };
}

function fail(groupMsg: string): ActionResult {
  return { ok: false, groupMsg, privateMessages: {} };
}

function toSettlement(p: PlayerState, finalChips: number): SettlementEntry {
  return {
    userId: p.userId,
    name: p.name,
    finalChips,
    sessionStake: p.sessionStake,
    net: finalChips - p.sessionStake,
    buyInThisSession: p.buyInThisSession,
  };
}

// ── Factory ───────────────────────────────────────────────────────────────────

export function newGame(groupId: string): GameState {
  return {
    groupId,
    phase: 'waiting',
    handNum: 0,
    players: [],
    queue: [],
    pendingBuyIn: [],
    deck: [],
    community: [],
    pot: 0,
    currentBet: 0,
    dealerIdx: 0,
    currentIdx: 0,
  };
}

function makePlayer(userId: string, name: string): PlayerState {
  return {
    userId,
    name,
    chips: STARTING_CHIPS,
    holeCards: [],
    currentBet: 0,
    totalBet: 0,
    folded: false,
    allIn: false,
    isDealer: false,
    isSB: false,
    isBB: false,
    hasActed: false,
    wantsToLeave: false,
    sessionStake: STARTING_CHIPS,
    buyInThisSession: 1,
  };
}

function makePlayerFromQueue(q: QueueEntry): PlayerState {
  return {
    userId: q.userId,
    name: q.name,
    chips: q.startingChips,
    holeCards: [],
    currentBet: 0,
    totalBet: 0,
    folded: false,
    allIn: false,
    isDealer: false,
    isSB: false,
    isBB: false,
    hasActed: false,
    wantsToLeave: false,
    sessionStake: q.sessionStake,
    buyInThisSession: q.buyInThisSession,
  };
}

// ── Internal game helpers ─────────────────────────────────────────────────────

function findPlayer(state: GameState, userId: string): PlayerState | undefined {
  return state.players.find((p) => p.userId === userId);
}

function activePlayers(state: GameState): PlayerState[] {
  return state.players.filter((p) => !p.folded);
}

function playersWhoCanAct(state: GameState): PlayerState[] {
  return state.players.filter((p) => !p.folded && !p.allIn);
}

function dealCard(state: GameState): Card {
  return state.deck.pop()!;
}

function playerBet(p: PlayerState, amount: number): number {
  const actual = Math.min(amount, p.chips);
  p.chips -= actual;
  p.currentBet += actual;
  p.totalBet += actual;
  if (p.chips === 0) p.allIn = true;
  return actual;
}

function resetForHand(p: PlayerState): void {
  p.holeCards = [];
  p.currentBet = 0;
  p.totalBet = 0;
  p.folded = false;
  p.allIn = false;
  p.isDealer = false;
  p.isSB = false;
  p.isBB = false;
  p.hasActed = false;
  // wantsToLeave / sessionStake / buyInThisSession intentionally preserved
}

function resetForRound(state: GameState): void {
  for (const p of state.players) {
    p.currentBet = 0;
    p.hasActed = false;
  }
  state.currentBet = 0;
}

function skipToCanAct(state: GameState): void {
  const n = state.players.length;
  for (let i = 0; i < n; i++) {
    if (!state.players[state.currentIdx].folded && !state.players[state.currentIdx].allIn) return;
    state.currentIdx = (state.currentIdx + 1) % n;
  }
}

function isBettingRoundComplete(state: GameState): boolean {
  for (const p of state.players) {
    if (!p.folded && !p.allIn) {
      if (!p.hasActed || p.currentBet < state.currentBet) return false;
    }
  }
  return true;
}

function findNextActor(state: GameState): PlayerState | null {
  const n = state.players.length;
  let idx = (state.currentIdx + 1) % n;
  for (let i = 0; i < n; i++) {
    const p = state.players[idx];
    if (!p.folded && !p.allIn && (!p.hasActed || p.currentBet < state.currentBet)) {
      state.currentIdx = idx;
      return p;
    }
    idx = (idx + 1) % n;
  }
  return null;
}

// ── Side pot calculation ──────────────────────────────────────────────────────

interface SidePot {
  amount: number;
  eligible: PlayerState[];
}

function calculateSidePots(allPlayers: PlayerState[]): SidePot[] {
  const levels = [...new Set(allPlayers.filter((p) => p.totalBet > 0).map((p) => p.totalBet))].sort(
    (a, b) => a - b
  );

  const pots: SidePot[] = [];
  let prevLevel = 0;

  for (const level of levels) {
    const contributors = allPlayers.filter((p) => p.totalBet >= level);
    const potSize = (level - prevLevel) * contributors.length;
    const eligible = contributors.filter((p) => !p.folded);
    if (potSize > 0 && eligible.length > 0) pots.push({ amount: potSize, eligible });
    prevLevel = level;
  }

  return pots;
}

// ── Display helpers ───────────────────────────────────────────────────────────

function tableStatus(state: GameState): string {
  const communityStr = state.community.length
    ? state.community.map((c) => c.label).join('  ')
    : '（尚未翻牌）';

  const lines = state.players.map((p, i) => {
    let s: string;
    if (p.folded) s = '❌ 棄牌';
    else if (p.allIn) s = `🚀 All-In（已押 $${p.totalBet}）`;
    else {
      const bet = p.currentBet > 0 ? `，本輪 $${p.currentBet}` : '';
      s = `💰 $${p.chips}${bet}`;
    }
    const marker = i === state.currentIdx && !p.folded && !p.allIn ? '▶ ' : '   ';
    return `${marker}${p.name}: ${s}`;
  });

  const queueStr =
    state.queue.length ? `\n⏳ 等待上桌：${state.queue.map((q) => q.name).join('、')}` : '';
  const pendingStr =
    state.pendingBuyIn.length
      ? `\n💸 等待加倉：${state.pendingBuyIn.map((p) => p.name).join('、')}`
      : '';

  return [
    `🎴 公共牌：${communityStr}`,
    `💵 底池：$${state.pot}  |  當前下注：$${state.currentBet}`,
    ...lines,
  ].join('\n') + queueStr + pendingStr;
}

function chipsummary(state: GameState): string {
  return ['💰 籌碼：', ...state.players.map((p) => `  ${p.name}: $${p.chips}`)].join('\n');
}

function finalStandings(state: GameState, settled: SettlementEntry[]): string {
  const medals = ['🥇', '🥈', '🥉'];
  const lines = settled.sort((a, b) => b.net - a.net).map((s, i) => {
    const sign = s.net >= 0 ? '+' : '';
    return `  ${medals[i] ?? `${i + 1}.`} ${s.name}: ${sign}$${s.net}（剩 $${s.finalChips}）`;
  });
  return ['🏆 本局結算：', ...lines].join('\n');
}

// ── Public API ────────────────────────────────────────────────────────────────

export function addPlayer(state: GameState, userId: string, name: string): ActionResult {
  if (state.players.some((p) => p.userId === userId)) return fail('你已經在牌桌上了！');
  if (state.queue.some((q) => q.userId === userId)) return fail('你已經在等待隊列中，下一局自動上桌。');
  if (state.pendingBuyIn.some((p) => p.userId === userId)) return fail('你正在等待加倉決定，輸入 /buyin 加倉或 /leave 離開。');

  const gameInProgress = !['waiting', 'ended'].includes(state.phase);
  const total = state.players.length + state.queue.length;

  if (total >= MAX_PLAYERS) return fail(`桌子已滿（最多 ${MAX_PLAYERS} 人）！`);

  if (gameInProgress) {
    state.queue.push({
      userId,
      name,
      startingChips: STARTING_CHIPS,
      sessionStake: STARTING_CHIPS,
      buyInThisSession: 1,
    });
    return ok(`⏳ ${name} 加入等待隊列！下一局開始時自動上桌（隊列：${state.queue.length} 人）`);
  }

  if (state.phase === 'ended') state.phase = 'waiting';
  state.players.push(makePlayer(userId, name));
  return ok(`✅ ${name} 加入遊戲！（${state.players.length}/${MAX_PLAYERS}）\n湊 2 人以上輸入 /start 開始！`);
}

export function removePlayer(state: GameState, userId: string): ActionResult {
  // In pendingBuyIn → immediate settle and remove
  const pbIdx = state.pendingBuyIn.findIndex((p) => p.userId === userId);
  if (pbIdx !== -1) {
    const [pb] = state.pendingBuyIn.splice(pbIdx, 1);
    const settlement: SettlementEntry = {
      userId: pb.userId,
      name: pb.name,
      finalChips: 0,
      sessionStake: pb.sessionStake,
      net: -pb.sessionStake,
      buyInThisSession: pb.buyInThisSession,
    };
    return ok(`👋 ${pb.name} 離開遊戲。`, {}, { settlements: [settlement] });
  }

  // In queue → just remove
  const qIdx = state.queue.findIndex((q) => q.userId === userId);
  if (qIdx !== -1) {
    const [q] = state.queue.splice(qIdx, 1);
    // Settle the queue entry (they staked but never got chips)
    const settlement: SettlementEntry = {
      userId: q.userId,
      name: q.name,
      finalChips: 0,
      sessionStake: q.sessionStake,
      net: -q.sessionStake,
      buyInThisSession: q.buyInThisSession,
    };
    return ok(`👋 ${q.name} 已從等待隊列離開。`, {}, { settlements: [settlement] });
  }

  const player = findPlayer(state, userId);
  if (!player) return fail('你不在牌桌或等待隊列！');

  const gameInProgress = !['waiting', 'ended', 'showdown'].includes(state.phase);

  if (gameInProgress) {
    // Auto-fold if it's their turn
    if (state.players[state.currentIdx]?.userId === userId && !player.folded) {
      player.folded = true;
      player.hasActed = true;
    }
    player.wantsToLeave = true;
    return ok(`👋 ${player.name} 申請離桌，本局結束後退出。`);
  }

  // Safe to remove immediately (lobby / showdown)
  const settlement = toSettlement(player, player.chips);
  state.players = state.players.filter((p) => p.userId !== userId);
  return ok(`👋 ${player.name} 離開遊戲。`, {}, { settlements: [settlement] });
}

export function startGame(state: GameState, _userId: string): ActionResult {
  if (state.phase !== 'waiting') return fail('遊戲已經開始了！');
  if (state.players.length < 2) return fail('至少需要 2 人才能開始！');
  state.dealerIdx = 0;
  return startNewHand(state);
}

export function nextHand(state: GameState, _userId: string): ActionResult {
  if (state.phase !== 'showdown') return fail('本局尚未結束！');
  return startNewHand(state);
}

export function endGame(state: GameState, _userId: string): ActionResult {
  if (state.phase === 'waiting') return fail('遊戲還沒開始！');

  // Collect settlements for all active players
  const settlements: SettlementEntry[] = [
    ...state.players.map((p) => toSettlement(p, p.chips)),
    // Pending buy-in players already have 0 chips
    ...state.pendingBuyIn.map((pb) => ({
      userId: pb.userId,
      name: pb.name,
      finalChips: 0,
      sessionStake: pb.sessionStake,
      net: -pb.sessionStake,
      buyInThisSession: pb.buyInThisSession,
    })),
    // Queue entries who never got to play
    ...state.queue.map((q) => ({
      userId: q.userId,
      name: q.name,
      finalChips: 0,
      sessionStake: q.sessionStake,
      net: -q.sessionStake,
      buyInThisSession: q.buyInThisSession,
    })),
  ];

  state.phase = 'ended';
  state.pendingBuyIn = [];
  state.queue = [];

  return ok(
    `🎰 遊戲結束！\n` + finalStandings(state, settlements),
    {},
    { settlements }
  );
}

export function buyIn(state: GameState, userId: string, amount: number): ActionResult {
  if (amount <= 0) return fail('加倉金額必須大於 0！');

  const pbIdx = state.pendingBuyIn.findIndex((p) => p.userId === userId);
  if (pbIdx === -1) {
    return fail('你目前不需要加倉！（只有爆倉的玩家才能使用此指令）');
  }

  const [pb] = state.pendingBuyIn.splice(pbIdx, 1);

  // Add to queue for next hand with updated stake
  state.queue.push({
    userId: pb.userId,
    name: pb.name,
    startingChips: amount,
    sessionStake: pb.sessionStake + amount,
    buyInThisSession: pb.buyInThisSession + 1,
  });

  return ok(
    `💰 ${pb.name} 加倉 $${amount}！下一局開始時上桌。\n` +
    `（本局總投入：$${pb.sessionStake + amount}，加倉 ${pb.buyInThisSession} 次）`
  );
}

export function getStatus(state: GameState): string {
  if (state.phase === 'waiting') {
    if (!state.players.length) return '桌子是空的！輸入 /join 加入遊戲。';
    const names = state.players.map((p) => `  • ${p.name}（$${p.chips}）`).join('\n');
    const q = state.queue.length ? `\n⏳ 等待隊列：${state.queue.map((q) => q.name).join('、')}` : '';
    return `🕐 等待玩家中 (${state.players.length}/${MAX_PLAYERS})\n${names}${q}\n湊 2 人以上請輸入 /start 開始！`;
  }
  if (state.phase === 'ended') return '遊戲已結束。輸入 /join 開始新遊戲！';
  return tableStatus(state);
}

export function getHoleCardsMessage(state: GameState, userId: string): string | null {
  const p = findPlayer(state, userId);
  if (!p || !p.holeCards.length) return null;
  return `🃏 你的手牌（第 ${state.handNum} 局）：\n${p.holeCards.map((c) => c.label).join('  ')}`;
}

// ── processAction ─────────────────────────────────────────────────────────────

export function processAction(
  state: GameState,
  userId: string,
  action: string,
  amount = 0
): ActionResult {
  if (['waiting', 'ended', 'showdown'].includes(state.phase)) return fail('現在不是行動時間！');

  const current = state.players[state.currentIdx];
  if (current.userId !== userId) {
    const actor = findPlayer(state, userId);
    if (!actor) return fail('你不在這局遊戲中！');
    return fail(`現在輪到 ${current.name} 行動！`);
  }

  const player = current;
  const toCall = state.currentBet - player.currentBet;
  let actionMsg: string;

  switch (action) {
    case 'fold':
      player.folded = true;
      player.hasActed = true;
      actionMsg = `🏳️ ${player.name} 棄牌`;
      break;

    case 'check':
      if (toCall > 0) return fail(`不能過牌！需跟注 $${toCall}，請用 /call 或 /fold。`);
      player.hasActed = true;
      actionMsg = `✋ ${player.name} 過牌`;
      break;

    case 'call': {
      if (toCall <= 0) {
        player.hasActed = true;
        actionMsg = `✋ ${player.name} 過牌`;
      } else {
        const actual = playerBet(player, Math.min(toCall, player.chips));
        state.pot += actual;
        player.hasActed = true;
        const s = player.allIn ? 'All-In！' : `剩 $${player.chips}`;
        actionMsg = `💰 ${player.name} 跟注 $${actual}（${s}）`;
      }
      break;
    }

    case 'raise': {
      const minRaise = toCall + BIG_BLIND;
      if (amount < minRaise && amount < player.chips) {
        return fail(`最少需加注 $${minRaise}（跟注 $${toCall} + 最小加注 $${BIG_BLIND}）`);
      }
      const additional = Math.min(amount, player.chips + player.currentBet) - player.currentBet;
      if (additional <= 0) return fail('加注金額不足！');
      const actual = playerBet(player, additional);
      state.pot += actual;
      state.currentBet = player.currentBet;
      player.hasActed = true;
      for (const p of state.players) if (p !== player && !p.folded && !p.allIn) p.hasActed = false;
      const s = player.allIn ? 'All-In！' : `剩 $${player.chips}`;
      actionMsg = `⬆️ ${player.name} 加注至 $${state.currentBet}（${s}）`;
      break;
    }

    case 'allin': {
      if (player.chips === 0) return fail('你已經全押了！');
      const actual = playerBet(player, player.chips);
      state.pot += actual;
      player.hasActed = true;
      if (player.currentBet > state.currentBet) {
        state.currentBet = player.currentBet;
        for (const p of state.players) if (p !== player && !p.folded && !p.allIn) p.hasActed = false;
      }
      actionMsg = `🚀 ${player.name} 全押 $${actual}！（共押 $${player.totalBet}）`;
      break;
    }

    default:
      return fail('未知指令！');
  }

  return afterAction(state, actionMsg);
}

// ── Internal game flow ────────────────────────────────────────────────────────

function startNewHand(state: GameState): ActionResult {
  state.handNum++;

  // ── 1. Settle & remove wantsToLeave players ───────────────────────────────
  const exitSettlements: SettlementEntry[] = [];
  state.players = state.players.filter((p) => {
    if (p.wantsToLeave) {
      exitSettlements.push(toSettlement(p, p.chips));
      return false;
    }
    return true;
  });

  // ── 2. Move busted players (0 chips) to pendingBuyIn ─────────────────────
  const newBusted: Array<{ userId: string; name: string }> = [];
  state.players = state.players.filter((p) => {
    if (p.chips === 0 && !state.pendingBuyIn.some((pb) => pb.userId === p.userId)) {
      state.pendingBuyIn.push({
        userId: p.userId,
        name: p.name,
        sessionStake: p.sessionStake,
        buyInThisSession: p.buyInThisSession,
      });
      newBusted.push({ userId: p.userId, name: p.name });
      return false;
    }
    return true;
  });

  // ── 3. Add queued players ─────────────────────────────────────────────────
  while (state.queue.length > 0 && state.players.length < MAX_PLAYERS) {
    const q = state.queue.shift()!;
    if (!state.players.some((p) => p.userId === q.userId)) {
      state.players.push(makePlayerFromQueue(q));
    }
  }

  // ── 4. Check if game can continue ─────────────────────────────────────────
  if (state.players.length < 2) {
    state.phase = 'ended';
    const allSettlements = [
      ...exitSettlements,
      ...state.players.map((p) => toSettlement(p, p.chips)),
      ...state.pendingBuyIn.map((pb) => ({
        userId: pb.userId, name: pb.name, finalChips: 0,
        sessionStake: pb.sessionStake, net: -pb.sessionStake,
        buyInThisSession: pb.buyInThisSession,
      })),
    ];
    state.pendingBuyIn = [];
    const msg =
      newBusted.length
        ? `💸 ${newBusted.map((b) => b.name).join('、')} 爆倉，人數不足，遊戲結束！`
        : '人數不足，遊戲結束！';
    return ok(msg + '\n' + finalStandings(state, allSettlements), {}, {
      settlements: allSettlements,
      bustedPlayers: newBusted,
    });
  }

  // ── 5. Deal new hand ──────────────────────────────────────────────────────
  state.players.forEach(resetForHand);
  state.deck = makeDeck();
  state.community = [];
  state.pot = 0;
  state.currentBet = BIG_BLIND;

  const n = state.players.length;
  const dealerIdx = state.dealerIdx % n;
  const sbIdx = n === 2 ? dealerIdx : (dealerIdx + 1) % n;
  const bbIdx = n === 2 ? (dealerIdx + 1) % n : (dealerIdx + 2) % n;

  state.players[dealerIdx].isDealer = true;
  state.players[sbIdx].isSB = true;
  state.players[bbIdx].isBB = true;

  const sbP = state.players[sbIdx];
  const bbP = state.players[bbIdx];
  state.pot += playerBet(sbP, SMALL_BLIND);
  state.pot += playerBet(bbP, BIG_BLIND);
  state.currentBet = Math.max(sbP.currentBet, bbP.currentBet, BIG_BLIND);

  for (let i = 0; i < 2; i++) for (const p of state.players) p.holeCards.push(dealCard(state));

  state.currentIdx = n === 2 ? sbIdx : (bbIdx + 1) % n;
  skipToCanAct(state);
  state.phase = 'preflop';

  const posLines = state.players.map((p) => {
    const tags = [p.isDealer && 'D', p.isSB && 'SB', p.isBB && 'BB'].filter(Boolean);
    const tag = tags.length ? `[${tags.join('/')}] ` : '      ';
    return `  ${tag}${p.name}: $${p.chips}`;
  });

  const current = state.players[state.currentIdx];

  // Bust notification (appended below)
  const bustNote = newBusted.length
    ? `\n💸 ${newBusted.map((b) => b.name).join('、')} 爆倉，等待加倉（/buyin 或 /leave）`
    : '';

  const queueNote = state.queue.length
    ? `\n⏳ 等待上桌：${state.queue.map((q) => q.name).join('、')}`
    : '';

  const groupMsg =
    `🃏 第 ${state.handNum} 局開始！\n` +
    `━━━━━━━━━━━━━━━\n` +
    posLines.join('\n') + '\n' +
    `━━━━━━━━━━━━━━━\n` +
    `盲注：小盲 $${SMALL_BLIND} / 大盲 $${BIG_BLIND} | 底池：$${state.pot}\n` +
    `━━━━━━━━━━━━━━━\n` +
    `✉️ 手牌已私訊給每位玩家！\n` +
    `👉 @${current.name} 輪到你行動！\n` +
    `可用指令：/call /raise <金額> /fold /check /allin` +
    bustNote + queueNote;

  const privateMsgs: Record<string, string> = {};
  for (const p of state.players) {
    privateMsgs[p.userId] =
      `🃏 你的手牌（第 ${state.handNum} 局）：\n` +
      p.holeCards.map((c) => c.label).join('  ');
  }

  return ok(groupMsg, privateMsgs, {
    mentionUserId: current.userId,
    mentionName: current.name,
    bustedPlayers: newBusted,
    settlements: exitSettlements.length ? exitSettlements : undefined,
  });
}

function afterAction(state: GameState, actionMsg: string): ActionResult {
  const active = activePlayers(state);
  if (active.length === 1) return awardUncontested(state, active[0], actionMsg);
  if (isBettingRoundComplete(state)) return advancePhase(state, actionMsg);

  const next = findNextActor(state);
  if (!next) return advancePhase(state, actionMsg);

  const msg = `${actionMsg}\n━━━━━━━━━━━━━━━\n${tableStatus(state)}\n👉 @${next.name} 輪到你行動！`;
  return ok(msg, {}, { mentionUserId: next.userId, mentionName: next.name });
}

function advancePhase(state: GameState, prevMsg: string): ActionResult {
  resetForRound(state);

  const n = state.players.length;
  state.currentIdx = (state.dealerIdx + 1) % n;
  skipToCanAct(state);

  let phaseLabel: string;

  if (state.phase === 'preflop') {
    state.community.push(dealCard(state), dealCard(state), dealCard(state));
    state.phase = 'flop';
    phaseLabel = '翻牌 (Flop)';
  } else if (state.phase === 'flop') {
    state.community.push(dealCard(state));
    state.phase = 'turn';
    phaseLabel = '轉牌 (Turn)';
  } else if (state.phase === 'turn') {
    state.community.push(dealCard(state));
    state.phase = 'river';
    phaseLabel = '河牌 (River)';
  } else {
    return showdown(state, prevMsg);
  }

  const communityStr = state.community.map((c) => c.label).join('  ');

  if (!playersWhoCanAct(state).length) {
    while (state.community.length < 5) state.community.push(dealCard(state));
    return showdown(state, `${prevMsg}\n🎴 ${phaseLabel}：${communityStr}（自動發完剩餘公共牌）`);
  }

  const next = state.players[state.currentIdx];
  const msg =
    `${prevMsg}\n━━━━━━━━━━━━━━━\n🎴 ${phaseLabel}：${communityStr}\n` +
    `${tableStatus(state)}\n👉 @${next.name} 輪到你行動！`;
  return ok(msg, {}, { mentionUserId: next.userId, mentionName: next.name });
}

function showdown(state: GameState, prevMsg: string): ActionResult {
  state.phase = 'showdown';

  const sidePots = calculateSidePots(state.players);
  const evaluated = activePlayers(state).map((p) => ({
    player: p,
    score: bestHand(p.holeCards, state.community),
  }));

  function cmp(a: HandScore, b: HandScore): number {
    if (a[0] !== b[0]) return b[0] - a[0];
    for (let i = 0; i < Math.max(a[1].length, b[1].length); i++) {
      const d = (b[1][i] ?? 0) - (a[1][i] ?? 0);
      if (d !== 0) return d;
    }
    return 0;
  }
  evaluated.sort((a, b) => cmp(a.score, b.score));

  const winnings: Record<string, number> = {};
  const potResults: string[] = [];

  for (const pot of sidePots) {
    const eligible = pot.eligible
      .map((ep) => evaluated.find((e) => e.player.userId === ep.userId)!)
      .sort((a, b) => cmp(a.score, b.score));

    const best = eligible[0].score;
    const winners = eligible.filter((e) => cmp(e.score, best) === 0);
    const share = Math.floor(pot.amount / winners.length);
    const rem = pot.amount % winners.length;

    for (const w of winners) winnings[w.player.userId] = (winnings[w.player.userId] ?? 0) + share;
    if (rem) winnings[winners[0].player.userId] = (winnings[winners[0].player.userId] ?? 0) + rem;

    if (sidePots.length > 1) {
      const potType = pot.eligible.length < activePlayers(state).length ? '邊池' : '主池';
      potResults.push(`  ${potType} $${pot.amount} → ${winners.map((w) => w.player.name).join('、')}`);
    }
  }

  // Apply winnings
  for (const p of state.players) p.chips += winnings[p.userId] ?? 0;

  const communityStr = state.community.map((c) => c.label).join('  ');
  const revealLines = evaluated.map(
    ({ score, player: p }) =>
      `  ${p.name}：${p.holeCards.map((c) => c.label).join('  ')}  →  ${handName(score)}`
  );

  let winLine: string;
  if (sidePots.length === 1) {
    const mainWinner = evaluated[0];
    const mainWinners = evaluated.filter((e) => cmp(e.score, mainWinner.score) === 0);
    if (mainWinners.length === 1) {
      winLine = `🏆 ${mainWinner.player.name} 獲勝！贏得 $${winnings[mainWinner.player.userId] ?? 0}`;
    } else {
      const share = Math.floor(state.pot / mainWinners.length);
      winLine = `🤝 平局！${mainWinners.map((w) => w.player.name).join('、')} 各得 $${share}`;
    }
  } else {
    winLine = potResults.join('\n');
  }

  state.dealerIdx = (state.dealerIdx + 1) % state.players.length;

  return ok(
    `${prevMsg}\n` +
    `━━━━━━━━━━━━━━━\n` +
    `🎴 公共牌：${communityStr}\n` +
    `━━━━━━━━━━━━━━━\n` +
    `📋 攤牌：\n${revealLines.join('\n')}\n` +
    `━━━━━━━━━━━━━━━\n` +
    `${winLine}\n` +
    `━━━━━━━━━━━━━━━\n` +
    `${chipsummary(state)}\n` +
    `輸入 /next 開始下一局，或 /endgame 結束遊戲`
  );
}

function awardUncontested(state: GameState, winner: PlayerState, prevMsg: string): ActionResult {
  winner.chips += state.pot;
  state.phase = 'showdown';
  state.dealerIdx = (state.dealerIdx + 1) % state.players.length;
  return ok(
    `${prevMsg}\n` +
    `━━━━━━━━━━━━━━━\n` +
    `🏆 ${winner.name} 獲勝！贏得底池 $${state.pot}（其他人棄牌）\n` +
    `━━━━━━━━━━━━━━━\n` +
    `${chipsummary(state)}\n` +
    `輸入 /next 開始下一局，或 /endgame 結束遊戲`
  );
}
