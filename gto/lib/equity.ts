import { Card, FULL_DECK } from './cards';
import { bestHand, cmp, HAND_NAMES, HandScore } from './evaluator';

function pick(arr: Card[], n: number): Card[][] {
  if (n === 0) return [[]];
  if (arr.length < n) return [];
  const [first, ...rest] = arr;
  const withFirst = pick(rest, n - 1).map(combo => [first, ...combo]);
  const withoutFirst = pick(rest, n);
  return [...withFirst, ...withoutFirst];
}

export interface EquityResult {
  win: number;   // 0-1
  tie: number;
  lose: number;
  total: number;
  // breakdown: which hand types opponent had when they beat us
  loseBreakdown: Record<string, number>;  // handName → count
  winBreakdown: Record<string, number>;   // our handName → count when we win
  myHandName: string;
}

function pick2(arr: Card[]): [Card, Card][] {
  const out: [Card, Card][] = [];
  for (let i = 0; i < arr.length - 1; i++)
    for (let j = i + 1; j < arr.length; j++)
      out.push([arr[i], arr[j]]);
  return out;
}

// Exact equity when board is complete (5 community cards known)
export function calcEquityExact(hole: Card[], community: Card[]): EquityResult {
  const usedIds = new Set([...hole, ...community].map(c => c.id));
  const remaining = FULL_DECK.filter(c => !usedIds.has(c.id));

  const myScore = bestHand(hole, community);
  const myHandName = HAND_NAMES[myScore[0]];

  let win = 0, tie = 0, lose = 0;
  const loseBreakdown: Record<string, number> = {};
  const winBreakdown: Record<string, number> = {};

  for (const [o1, o2] of pick2(remaining)) {
    const oppScore = bestHand([o1, o2], community);
    const result = cmp(myScore, oppScore);
    if (result > 0) {
      win++;
      winBreakdown[myHandName] = (winBreakdown[myHandName] ?? 0) + 1;
    } else if (result === 0) {
      tie++;
    } else {
      lose++;
      const oppName = HAND_NAMES[oppScore[0]];
      loseBreakdown[oppName] = (loseBreakdown[oppName] ?? 0) + 1;
    }
  }

  const total = win + tie + lose;
  return { win: win / total, tie: tie / total, lose: lose / total, total, loseBreakdown, winBreakdown, myHandName };
}

// Monte Carlo when board is incomplete
export function calcEquityMonteCarlo(hole: Card[], community: Card[], simulations = 8000): EquityResult {
  const usedIds = new Set([...hole, ...community].map(c => c.id));
  const remaining = FULL_DECK.filter(c => !usedIds.has(c.id));
  const boardNeeded = 5 - community.length;

  let win = 0, tie = 0, lose = 0;
  const loseBreakdown: Record<string, number> = {};
  const winBreakdown: Record<string, number> = {};

  for (let s = 0; s < simulations; s++) {
    // Fisher-Yates shuffle a copy
    const pool = [...remaining];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const board = [...community, ...pool.slice(0, boardNeeded)];
    const oppHole: [Card, Card] = [pool[boardNeeded], pool[boardNeeded + 1]];

    const myScore = bestHand(hole, board);
    const oppScore = bestHand(oppHole, board);
    const result = cmp(myScore, oppScore);

    if (result > 0) {
      win++;
      const n = HAND_NAMES[myScore[0]];
      winBreakdown[n] = (winBreakdown[n] ?? 0) + 1;
    } else if (result === 0) {
      tie++;
    } else {
      lose++;
      const n = HAND_NAMES[oppScore[0]];
      loseBreakdown[n] = (loseBreakdown[n] ?? 0) + 1;
    }
  }

  const total = win + tie + lose;
  const myScore = bestHand(hole, community);
  return {
    win: win / total, tie: tie / total, lose: lose / total,
    total, loseBreakdown, winBreakdown,
    myHandName: community.length >= 5 ? HAND_NAMES[myScore[0]] : '(模擬中)',
  };
}

// Exact equity vs a specific opponent hand
export function calcEquityVsHand(myHole: Card[], oppHole: Card[], community: Card[]): EquityResult {
  const usedIds = new Set([...myHole, ...oppHole, ...community].map(c => c.id));
  const remaining = FULL_DECK.filter(c => !usedIds.has(c.id));
  const boardNeeded = 5 - community.length;

  let win = 0, tie = 0, lose = 0;
  const loseBreakdown: Record<string, number> = {};
  const winBreakdown: Record<string, number> = {};

  const evaluate = (board: Card[]) => {
    const myScore = bestHand(myHole, board);
    const oppScore = bestHand(oppHole, board);
    const result = cmp(myScore, oppScore);
    if (result > 0) {
      win++;
      const n = HAND_NAMES[myScore[0]];
      winBreakdown[n] = (winBreakdown[n] ?? 0) + 1;
    } else if (result === 0) {
      tie++;
    } else {
      lose++;
      const n = HAND_NAMES[oppScore[0]];
      loseBreakdown[n] = (loseBreakdown[n] ?? 0) + 1;
    }
  };

  if (boardNeeded === 0) {
    // River: direct comparison
    evaluate(community);
  } else if (boardNeeded <= 2) {
    // Exact enumeration: C(remaining, boardNeeded)
    const combos = pick(remaining, boardNeeded);
    for (const extra of combos) {
      evaluate([...community, ...extra]);
    }
  } else {
    // Monte Carlo for pre-flop / turn with no community (boardNeeded >= 3)
    const simulations = 5000;
    for (let s = 0; s < simulations; s++) {
      const pool = [...remaining];
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      evaluate([...community, ...pool.slice(0, boardNeeded)]);
    }
  }

  const total = win + tie + lose;
  const myScore = bestHand(myHole, community);
  const myHandName = community.length >= 3 ? HAND_NAMES[myScore[0]] : '(計算中)';

  return {
    win: win / total,
    tie: tie / total,
    lose: lose / total,
    total,
    loseBreakdown,
    winBreakdown,
    myHandName,
  };
}
