import { Card, FULL_DECK, RANK_VALUE } from './cards';
import { bestHand, cmp, HAND_NAMES } from './evaluator';

export interface OutsResult {
  outs: number;
  draws: { name: string; outs: number; pctTurn: number; pctRiver: number }[];
  rule4: number;   // outs × 4 (from flop: 2 cards to come)
  rule2: number;   // outs × 2 (from turn: 1 card to come)
  applicable: boolean; // false when community < 3 or = 5
}

export function calcOuts(hole: Card[], community: Card[]): OutsResult {
  if (community.length < 3 || community.length >= 5) {
    return { applicable: false, outs: 0, draws: [], rule4: 0, rule2: 0 };
  }

  const usedIds = new Set([...hole, ...community].map(c => c.id));
  const remaining = FULL_DECK.filter(c => !usedIds.has(c.id));

  const currentScore = bestHand(hole, community);

  // Count total outs (cards that improve current best hand)
  let outsCount = 0;
  for (const card of remaining) {
    const newScore = bestHand(hole, [...community, card]);
    if (cmp(newScore, currentScore) > 0) {
      outsCount++;
    }
  }

  // Detect specific draws
  const all = [...hole, ...community];
  const draws: { name: string; outs: number; pctTurn: number; pctRiver: number }[] = [];

  // Flush draw: 4+ cards of same suit
  const suitCounts: Record<string, number> = {};
  for (const c of all) {
    suitCounts[c.suit] = (suitCounts[c.suit] ?? 0) + 1;
  }
  for (const [suit, count] of Object.entries(suitCounts)) {
    if (count === 4) {
      // 9 remaining cards of that suit in deck (13 - 4 = 9)
      const flushOuts = remaining.filter(c => c.suit === suit).length;
      draws.push({ name: '同花聽牌', outs: flushOuts, pctTurn: flushOuts / remaining.length * 100, pctRiver: flushOuts / remaining.length * 100 });
      break;
    }
  }

  // Straight draws: look at rank values present in all cards
  const rankVals = [...new Set(all.map(c => RANK_VALUE[c.rank]))];
  // Also consider Ace as 1 for low straights
  const rankValsWithLowAce = rankVals.some(v => v === 14) ? [...rankVals, 1] : rankVals;
  const rankSet = new Set(rankValsWithLowAce);

  // Check 5-consecutive windows for straight draws
  // Ranks 1(A-low) through 14(A-high)
  let hasOESD = false;
  let hasGutshot = false;

  for (let low = 1; low <= 10; low++) {
    const window = [low, low + 1, low + 2, low + 3, low + 4];
    const present = window.filter(v => rankSet.has(v)).length;
    const missing = window.filter(v => !rankSet.has(v));

    if (present === 4 && missing.length === 1) {
      const missingVal = missing[0];
      const isEndMissing = missingVal === low || missingVal === low + 4;
      if (isEndMissing) {
        // OESD: missing from one end
        hasOESD = true;
      } else {
        // Gutshot: missing from the middle
        hasGutshot = true;
      }
    }
  }

  // Check for OESD: 4 consecutive ranks, can extend on either side
  // More precise: find any 4 consecutive ranks among hole+community
  if (!hasOESD) {
    for (let low = 1; low <= 11; low++) {
      const consec = [low, low + 1, low + 2, low + 3];
      if (consec.every(v => rankSet.has(v))) {
        // Can extend below (low - 1 >= 1) or above (low + 4 <= 14)
        const canExtendLow = low - 1 >= 1;
        const canExtendHigh = low + 4 <= 14;
        if (canExtendLow && canExtendHigh) {
          hasOESD = true;
        }
      }
    }
  }

  if (hasOESD) {
    const oeOuts = 8;
    draws.push({ name: '順子聽牌(兩頭)', outs: oeOuts, pctTurn: oeOuts / remaining.length * 100, pctRiver: oeOuts / remaining.length * 100 });
  } else if (hasGutshot) {
    const gsOuts = 4;
    draws.push({ name: '順子聽牌(卡腸)', outs: gsOuts, pctTurn: gsOuts / remaining.length * 100, pctRiver: gsOuts / remaining.length * 100 });
  }

  // Pair to set (pocket pair, no trips on board)
  if (hole.length === 2 && hole[0].rank === hole[1].rank) {
    const boardRankCounts: Record<string, number> = {};
    for (const c of community) {
      boardRankCounts[c.rank] = (boardRankCounts[c.rank] ?? 0) + 1;
    }
    const hasTripsOnBoard = Object.values(boardRankCounts).some(cnt => cnt >= 3);
    const hasMyRankOnBoard = boardRankCounts[hole[0].rank] !== undefined;
    if (!hasTripsOnBoard && !hasMyRankOnBoard) {
      const setOuts = 2;
      draws.push({ name: '一對→三條', outs: setOuts, pctTurn: setOuts / remaining.length * 100, pctRiver: setOuts / remaining.length * 100 });
    }
  }

  // Two pair to full house
  const allRankCounts: Record<string, number> = {};
  for (const c of all) {
    allRankCounts[c.rank] = (allRankCounts[c.rank] ?? 0) + 1;
  }
  const pairs = Object.entries(allRankCounts).filter(([, cnt]) => cnt === 2);
  const trips = Object.entries(allRankCounts).filter(([, cnt]) => cnt === 3);

  if (pairs.length >= 2 && trips.length === 0) {
    const fhOuts = 4;
    draws.push({ name: '兩對→葫蘆', outs: fhOuts, pctTurn: fhOuts / remaining.length * 100, pctRiver: fhOuts / remaining.length * 100 });
  }

  // Set to full house/quads
  if (trips.length >= 1) {
    const sfhOuts = 7;
    draws.push({ name: '三條→葫蘆/四條', outs: sfhOuts, pctTurn: sfhOuts / remaining.length * 100, pctRiver: sfhOuts / remaining.length * 100 });
  }

  const rule4 = Math.min(outsCount * 4, 100);
  const rule2 = Math.min(outsCount * 2, 100);

  return {
    applicable: true,
    outs: outsCount,
    draws,
    rule4,
    rule2,
  };
}
