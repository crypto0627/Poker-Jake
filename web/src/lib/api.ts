import { PlayerView } from '@/types';

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL!;

export async function fetchPlayerView(groupId: string, accessToken: string): Promise<PlayerView> {
  const res = await fetch(
    `${WORKER_URL}/api/player?groupId=${encodeURIComponent(groupId)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText })) as { error: string };
    throw new Error(err.error ?? 'Failed to fetch game data');
  }
  return res.json() as Promise<PlayerView>;
}
