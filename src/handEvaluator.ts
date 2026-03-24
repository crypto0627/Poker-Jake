import { Card } from './card';

export const HAND_NAMES: Record<number, string> = {
  8: '同花順 (Straight Flush)',
  7: '四條 (Four of a Kind)',
  6: '葫蘆 (Full House)',
  5: '同花 (Flush)',
  4: '順子 (Straight)',
  3: '三條 (Three of a Kind)',
  2: '兩對 (Two Pair)',
  1: '一對 (One Pair)',
  0: '高牌 (High Card)',
};

export type HandScore = [number, number[]]; // [rank, tiebreakers]

function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [first, ...rest] = arr;
  const withFirst = combinations(rest, k - 1).map((c) => [first, ...c]);
  const withoutFirst = combinations(rest, k);
  return [...withFirst, ...withoutFirst];
}

function scoreFiveCards(cards: Card[]): HandScore {
  let values = cards.map((c) => c.value).sort((a, b) => b - a);
  const suits = cards.map((c) => c.suit);

  const isFlush = new Set(suits).size === 1;

  // Straight detection
  let isStraight = false;
  let straightHigh = values[0];
  const uniqueVals = [...new Set(values)];
  if (uniqueVals.length === 5) {
    if (values[0] - values[4] === 4) {
      isStraight = true;
    } else if (
      new Set(values).size === 5 &&
      new Set([14, 2, 3, 4, 5]).size === 5 &&
      values.every((v) => [14, 2, 3, 4, 5].includes(v))
    ) {
      // Wheel: A-2-3-4-5
      isStraight = true;
      values = [5, 4, 3, 2, 1];
      straightHigh = 5;
    }
  }

  // Count occurrences
  const counts = new Map<number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const groupSizes = groups.map((g) => g[1]);
  const groupVals = groups.map((g) => g[0]);

  if (isStraight && isFlush) return [8, [straightHigh]];
  if (groupSizes[0] === 4)                     return [7, groupVals];
  if (groupSizes[0] === 3 && groupSizes[1] === 2) return [6, groupVals];
  if (isFlush)                                 return [5, values];
  if (isStraight)                              return [4, [straightHigh]];
  if (groupSizes[0] === 3)                     return [3, groupVals];
  if (groupSizes[0] === 2 && groupSizes[1] === 2) return [2, groupVals];
  if (groupSizes[0] === 2)                     return [1, groupVals];
  return [0, values];
}

function compareScores(a: HandScore, b: HandScore): number {
  if (a[0] !== b[0]) return a[0] - b[0];
  for (let i = 0; i < Math.max(a[1].length, b[1].length); i++) {
    const diff = (a[1][i] ?? 0) - (b[1][i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export function bestHand(holeCards: Card[], community: Card[]): HandScore {
  const all = [...holeCards, ...community];
  const n = Math.min(all.length, 7);
  const combos = combinations(all, Math.min(5, n));
  let best: HandScore = [-1, []];
  for (const combo of combos) {
    const score = scoreFiveCards(combo);
    if (compareScores(score, best) > 0) best = score;
  }
  return best;
}

export function handName(score: HandScore): string {
  return HAND_NAMES[score[0]] ?? '未知';
}
