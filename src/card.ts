export const SUITS = ['♠', '♥', '♦', '♣'] as const;
export const RANKS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'] as const;

const SUIT_EMOJI: Record<string, string> = {
  '♠': '♠️', '♥': '♥️', '♦': '♦️', '♣': '♣️',
};
const RANK_VALUE: Record<string, number> = Object.fromEntries(
  RANKS.map((r, i) => [r, i + 2])
);

export interface Card {
  rank: string;
  suit: string;
  value: number;
  label: string; // e.g. "K♥️"
}

export function makeCard(rank: string, suit: string): Card {
  return {
    rank,
    suit,
    value: RANK_VALUE[rank],
    label: `${rank}${SUIT_EMOJI[suit] ?? suit}`,
  };
}

export function makeDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(makeCard(rank, suit));
    }
  }
  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
