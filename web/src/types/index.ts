export interface PlayerSummary {
  name: string;
  chips: number;
  currentBet: number;
  totalBet: number;
  folded: boolean;
  allIn: boolean;
  isDealer: boolean;
  isSB: boolean;
  isBB: boolean;
  position: string;
  isMe: boolean;
  isCurrentTurn: boolean;
}

export interface MyState {
  chips: number;
  currentBet: number;
  toCall: number;
  isMyTurn: boolean;
  folded: boolean;
  allIn: boolean;
  sessionStake: number;
  sessionNet: number;
  inPendingBuyIn: boolean;
  inQueue: boolean;
}

export interface AccountSummary {
  balance: number;
  totalBuyIn: number;
  buyInCount: number;
  gamesPlayed: number;
}

export interface PlayerView {
  phase: string;
  handNum: number;
  holeCards: string[];
  community: string[];
  pot: number;
  currentBet: number;
  players: PlayerSummary[];
  myState: MyState | null;
  account: AccountSummary | null;
  pendingBuyInList: string[];
  queueList: string[];
}
