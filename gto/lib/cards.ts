export const SUITS = ['♠', '♥', '♦', '♣'] as const;
export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'] as const;
export type Suit = (typeof SUITS)[number];
export type Rank = (typeof RANKS)[number];

export const RANK_VALUE: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
  '9': 9, 'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
};

export interface Card {
  rank: Rank;
  suit: Suit;
  value: number;
  id: string; // 'A♠'
}

export function makeCard(rank: Rank, suit: Suit): Card {
  return { rank, suit, value: RANK_VALUE[rank], id: `${rank}${suit}` };
}

export function makeDeck(): Card[] {
  const deck: Card[] = [];
  for (const rank of RANKS) {
    for (const suit of SUITS) {
      deck.push(makeCard(rank, suit));
    }
  }
  return deck;
}

export const FULL_DECK = makeDeck();

// ♠ white  ♥ red  ♦ blue  ♣ green
export const SUIT_COLOR: Record<Suit, string> = {
  '♠': '#e5e7eb',
  '♥': '#f87171',
  '♦': '#60a5fa',
  '♣': '#4ade80',
};
/** @deprecated use SUIT_COLOR */
export const isRed = (suit: Suit) => suit === '♥';
