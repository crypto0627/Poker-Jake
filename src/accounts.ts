/** Persistent player account stored in KV under key `a:{userId}` */

export interface PlayerAccount {
  userId: string;
  name: string;
  balance: number;       // cumulative net chips (profit - loss, can be negative)
  totalBuyIn: number;    // total chips ever staked across all sessions
  buyInCount: number;    // total buy-in transactions (initial join + re-buys)
  gamesPlayed: number;   // number of settled game sessions
  updatedAt: number;     // unix ms
}

export interface SettlementEntry {
  userId: string;
  name: string;
  finalChips: number;
  sessionStake: number;      // total chips bought in this session
  net: number;               // finalChips - sessionStake
  buyInThisSession: number;  // buy-in transactions this session
}

export function defaultAccount(userId: string, name: string): PlayerAccount {
  return {
    userId,
    name,
    balance: 0,
    totalBuyIn: 0,
    buyInCount: 0,
    gamesPlayed: 0,
    updatedAt: Date.now(),
  };
}

export async function loadAccount(kv: KVNamespace, userId: string): Promise<PlayerAccount | null> {
  return kv.get(`a:${userId}`, 'json') as Promise<PlayerAccount | null>;
}

export async function saveAccount(kv: KVNamespace, account: PlayerAccount): Promise<void> {
  account.updatedAt = Date.now();
  await kv.put(`a:${account.userId}`, JSON.stringify(account), {
    expirationTtl: 31_536_000, // 1 year
  });
}

/** Apply a settlement entry to a player's account and persist it. */
export async function applySettlement(
  kv: KVNamespace,
  entry: SettlementEntry
): Promise<PlayerAccount> {
  const acc = (await loadAccount(kv, entry.userId)) ?? defaultAccount(entry.userId, entry.name);
  acc.name = entry.name; // keep name fresh
  acc.balance += entry.net;
  acc.totalBuyIn += entry.sessionStake;
  acc.buyInCount += entry.buyInThisSession;
  acc.gamesPlayed += 1;
  await saveAccount(kv, acc);
  return acc;
}

/** Track which users have played in a group (for leaderboard). */
export async function registerGroupMember(
  kv: KVNamespace,
  groupId: string,
  userId: string
): Promise<void> {
  const key = `gm:${groupId}`;
  const members = ((await kv.get(key, 'json')) as string[] | null) ?? [];
  if (!members.includes(userId)) {
    members.push(userId);
    await kv.put(key, JSON.stringify(members), { expirationTtl: 31_536_000 });
  }
}

/** Return all accounts for a group sorted by balance desc. */
export async function getLeaderboard(
  kv: KVNamespace,
  groupId: string
): Promise<PlayerAccount[]> {
  const members = ((await kv.get(`gm:${groupId}`, 'json')) as string[] | null) ?? [];
  const accounts = await Promise.all(members.map((uid) => loadAccount(kv, uid)));
  return (accounts.filter(Boolean) as PlayerAccount[]).sort((a, b) => b.balance - a.balance);
}

/** Format an account for display. */
export function formatAccount(acc: PlayerAccount): string {
  const sign = acc.balance >= 0 ? '+' : '';
  const reBuys = acc.buyInCount - acc.gamesPlayed; // total re-buys (excludes initial joins)
  return (
    `👤 ${acc.name}\n` +
    `  累積盈虧：${sign}$${acc.balance}\n` +
    `  總下注：$${acc.totalBuyIn}（${acc.gamesPlayed} 局）\n` +
    `  加倉次數：${reBuys} 次`
  );
}
