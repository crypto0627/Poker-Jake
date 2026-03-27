import { Card } from './cards';

export type HandScore = [number, number[]]; // [rank 0-8, tiebreakers]

export const HAND_NAMES: Record<number, string> = {
  8: '同花順', 7: '四條', 6: '葫蘆', 5: '同花',
  4: '順子',  3: '三條', 2: '兩對', 1: '一對', 0: '高牌',
};

function combos5(arr: Card[]): Card[][] {
  const out: Card[][] = [];
  const n = arr.length;
  for (let a = 0; a < n - 4; a++)
    for (let b = a + 1; b < n - 3; b++)
      for (let c = b + 1; c < n - 2; c++)
        for (let d = c + 1; d < n - 1; d++)
          for (let e = d + 1; e < n; e++)
            out.push([arr[a], arr[b], arr[c], arr[d], arr[e]]);
  return out;
}

function score5(cards: Card[]): HandScore {
  let vals = cards.map(c => c.value).sort((a, b) => b - a);
  const suits = cards.map(c => c.suit);
  const isFlush = new Set(suits).size === 1;
  const uniq = [...new Set(vals)];

  let isStraight = false;
  let strHigh = vals[0];
  if (uniq.length === 5) {
    if (vals[0] - vals[4] === 4) { isStraight = true; }
    else if (vals.every(v => [14, 2, 3, 4, 5].includes(v))) {
      isStraight = true; vals = [5, 4, 3, 2, 1]; strHigh = 5;
    }
  }

  const cnt = new Map<number, number>();
  for (const v of vals) cnt.set(v, (cnt.get(v) ?? 0) + 1);
  const groups = [...cnt.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const gs = groups.map(g => g[1]);
  const gv = groups.map(g => g[0]);

  if (isStraight && isFlush) return [8, [strHigh]];
  if (gs[0] === 4)                     return [7, gv];
  if (gs[0] === 3 && gs[1] === 2)      return [6, gv];
  if (isFlush)                         return [5, vals];
  if (isStraight)                      return [4, [strHigh]];
  if (gs[0] === 3)                     return [3, gv];
  if (gs[0] === 2 && gs[1] === 2)      return [2, gv];
  if (gs[0] === 2)                     return [1, gv];
  return [0, vals];
}

export function cmp(a: HandScore, b: HandScore): number {
  if (a[0] !== b[0]) return a[0] - b[0];
  for (let i = 0; i < Math.max(a[1].length, b[1].length); i++) {
    const d = (a[1][i] ?? 0) - (b[1][i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

export function bestHand(hole: Card[], community: Card[]): HandScore {
  const all = [...hole, ...community];
  if (all.length < 5) return [-1, []] as unknown as HandScore;
  let best: HandScore = [0, [0]];
  for (const c of combos5(all)) {
    const s = score5(c);
    if (cmp(s, best) > 0) best = s;
  }
  return best;
}
