/**
 * LINE Texas Hold'em Poker Bot — Cloudflare Worker
 *
 * Env secrets (wrangler secret put):
 *   LINE_CHANNEL_SECRET
 *   LINE_CHANNEL_ACCESS_TOKEN
 *
 * Env vars (wrangler.toml [vars]):
 *   LIFF_URL   — https://liff.line.me/{LIFF_ID}  (web app for viewing hole cards)
 *
 * KV namespace:  GAMES_KV
 *   {groupId}        → GameState
 *   a:{userId}       → PlayerAccount  (only updated at /endgame)
 *   gm:{groupId}     → string[]       (member list for leaderboard)
 *
 * Routes:
 *   POST /webhook          — LINE webhook
 *   GET  /api/player       — LIFF web app fetches game state + hole cards
 *   OPTIONS /api/player    — CORS preflight
 */

import {
  verifySignature,
  replyMessage,
  replyWithMention,
  getGroupMemberProfile,
} from './line';

import {
  GameState,
  newGame,
  addPlayer,
  removePlayer,
  startGame,
  nextHand,
  endGame,
  forceEndGame,
  getStatus,
  processAction,
  buyIn,
  ActionResult,
  STARTING_CHIPS,
} from './game';

import {
  applySettlement,
  registerGroupMember,
  getLeaderboard,
  formatAccount,
  loadAccount,
  defaultAccount,
} from './accounts';

// ── Cloudflare Worker env ─────────────────────────────────────────────────────

export interface Env {
  LINE_CHANNEL_SECRET: string;
  LINE_CHANNEL_ACCESS_TOKEN: string;
  LIFF_URL: string;
  GAMES_KV: KVNamespace;
}

// ── KV helpers ────────────────────────────────────────────────────────────────

async function loadGame(kv: KVNamespace, groupId: string): Promise<GameState> {
  const raw = (await kv.get(groupId, 'json')) as GameState | null;
  if (!raw) return newGame(groupId);
  // Backfill fields added after initial release
  raw.queue        ??= [];
  raw.pendingBuyIn ??= [];
  for (const p of raw.players ?? []) {
    p.wantsToLeave     ??= false;
    p.sessionStake     ??= p.chips;
    p.buyInThisSession ??= 1;
  }
  return raw;
}

async function saveGame(kv: KVNamespace, state: GameState): Promise<void> {
  await kv.put(state.groupId, JSON.stringify(state), { expirationTtl: 86_400 });
}

// ── CORS headers ──────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};

// ── /api/player — LIFF endpoint ───────────────────────────────────────────────

async function handlePlayerAPI(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const groupId = url.searchParams.get('groupId');
  if (!groupId) {
    return new Response(JSON.stringify({ error: 'Missing groupId' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  // Verify LIFF access token with LINE API
  const auth = request.headers.get('Authorization') ?? '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!token) {
    return new Response(JSON.stringify({ error: 'Missing token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  const profileRes = await fetch('https://api.line.me/v2/profile', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!profileRes.ok) {
    return new Response(JSON.stringify({ error: 'Invalid LINE token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
  const lineProfile = await profileRes.json() as { userId: string; displayName: string };

  const [state, account] = await Promise.all([
    loadGame(env.GAMES_KV, groupId),
    loadAccount(env.GAMES_KV, lineProfile.userId),
  ]);

  const userId = lineProfile.userId;
  const player = state.players.find((p) => p.userId === userId);
  const pending = state.pendingBuyIn.find((p) => p.userId === userId);
  const inQueue = state.queue.some((q) => q.userId === userId);
  const currentPlayer = state.players[state.currentIdx];

  const view = {
    phase: state.phase,
    handNum: state.handNum,
    holeCards: player?.holeCards.map((c) => c.label) ?? [],
    community: state.community.map((c) => c.label),
    pot: state.pot,
    currentBet: state.currentBet,
    players: state.players.map((p, i) => ({
      name: p.name,
      chips: p.chips,
      currentBet: p.currentBet,
      totalBet: p.totalBet,
      folded: p.folded,
      allIn: p.allIn,
      isDealer: p.isDealer,
      isSB: p.isSB,
      isBB: p.isBB,
      isMe: p.userId === userId,
      isCurrentTurn: i === state.currentIdx && !p.folded && !p.allIn,
    })),
    myState: player ? {
      chips: player.chips,
      currentBet: player.currentBet,
      toCall: Math.max(0, state.currentBet - player.currentBet),
      isMyTurn: currentPlayer?.userId === userId,
      folded: player.folded,
      allIn: player.allIn,
      sessionStake: player.sessionStake,
      sessionNet: player.chips - player.sessionStake,
      inPendingBuyIn: false,
      inQueue: false,
    } : pending ? {
      chips: 0,
      currentBet: 0,
      toCall: 0,
      isMyTurn: false,
      folded: false,
      allIn: false,
      sessionStake: pending.sessionStake,
      sessionNet: -pending.sessionStake,
      inPendingBuyIn: true,
      inQueue: false,
    } : inQueue ? {
      chips: 0,
      currentBet: 0,
      toCall: 0,
      isMyTurn: false,
      folded: false,
      allIn: false,
      sessionStake: 0,
      sessionNet: 0,
      inPendingBuyIn: false,
      inQueue: true,
    } : null,
    account: account ? {
      balance: account.balance,
      totalBuyIn: account.totalBuyIn,
      buyInCount: account.buyInCount,
      gamesPlayed: account.gamesPlayed,
    } : null,
    pendingBuyInList: state.pendingBuyIn.map((p) => p.name),
    queueList: state.queue.map((q) => q.name),
  };

  return new Response(JSON.stringify(view), {
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

// ── LIFF URL builder — embeds groupId so the web app gets it from URL params ──

function buildLiffUrl(base: string, groupId: string): string {
  // liff.state tells LIFF which path/query to open: /?groupId=Cxxx
  return `${base}?liff.state=${encodeURIComponent('/?groupId=' + groupId)}`;
}

// ── Help text ─────────────────────────────────────────────────────────────────

function buildHelpText(liffUrl: string): string {
  return `🃏 德州撲克指令說明

【加入/離開】
  /join  或  加入        — 加入桌子
  /leave 或  離開        — 離開（開始前）
  /start 或  開始        — 開始遊戲（≥2人）

【遊戲中行動】
  /call  或  跟注        — 跟注
  /check 或  過牌        — 過牌
  /fold  或  棄牌        — 棄牌
  /raise 或  加注 <金額>  — 加注（例: /raise 100）
  /allin 或  全押        — 全押
  /buyin 或  加倉 [金額]  — 爆倉後加倉（預設 $${STARTING_CHIPS}）

【其他】
  /next     或 下一局  — 下一局
  /endgame  或 結束    — 結束遊戲（記錄帳戶）
  /forceend 或 強制結束 — 強制結束遊戲（任何狀態皆可）
  /status  或 狀態   — 查看桌況
  /balance 或 帳戶   — 查看個人帳戶
  /rank    或 排行榜  — 本群排行榜
  /help    或 幫助   — 此說明

🃏 底牌請點以下連結查看：
${liffUrl}

起始籌碼：$${STARTING_CHIPS}  |  盲注：$10 / $20`;
}

// ── Command aliases ────────────────────────────────────────────────────────────

const ALIASES: Record<string, string> = {
  '加入': '/join', '離開': '/leave', '開始': '/start',
  '跟注': '/call', '過牌': '/check', '棄牌': '/fold',
  '加注': '/raise', '全押': '/allin', '加倉': '/buyin',
  '下一局': '/next', '結束': '/endgame', '強制結束': '/forceend', '狀態': '/status',
  '手牌': '/cards', '帳戶': '/balance', '我的帳戶': '/balance',
  '排行榜': '/rank', '幫助': '/help',
};

// ── Main fetch handler ────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const { pathname } = new URL(request.url);

    // CORS preflight for LIFF app
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // LIFF web app API
    if (request.method === 'GET' && pathname === '/api/player') {
      return handlePlayerAPI(request, env);
    }

    // Health check
    if (request.method === 'GET') {
      return new Response('OK', { status: 200 });
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    // LINE webhook — verify signature synchronously, then process in background
    const body = await request.text();
    const signature = request.headers.get('x-line-signature') ?? '';

    try {
      const valid = await verifySignature(env.LINE_CHANNEL_SECRET, body, signature);
      if (!valid) {
        console.error('Signature verification failed.');
        return new Response('OK');
      }
    } catch (e) {
      console.error('Signature error:', e);
      return new Response('OK');
    }

    // Return 200 OK to LINE immediately, process events in background.
    // This prevents LINE from timing out and retrying the webhook.
    const payload = JSON.parse(body) as { events: LineEvent[] };
    ctx.waitUntil(
      (async () => {
        for (const evt of payload.events) {
          try {
            await handleEvent(evt, env);
          } catch (e) {
            console.error('handleEvent error:', e);
          }
        }
      })()
    );

    return new Response('OK');
  },
};

// ── Event types ───────────────────────────────────────────────────────────────

interface LineEvent {
  type: string;
  replyToken?: string;
  source: { type: string; groupId?: string; userId?: string };
  message?: { type: string; text?: string };
}

// ── Event dispatcher ──────────────────────────────────────────────────────────

async function handleEvent(event: LineEvent, env: Env): Promise<void> {
  console.log('event:', JSON.stringify({
    type: event.type,
    sourceType: event.source.type,
    text: event.message?.text,
  }));

  if (event.type !== 'message' || event.message?.type !== 'text') return;

  if (event.source.type !== 'group') {
    if (event.replyToken) {
      await replyMessage(env.LINE_CHANNEL_ACCESS_TOKEN, event.replyToken,
        '請在群組中使用這個機器人！\n輸入 /help 查看指令。');
    }
    return;
  }

  const groupId = event.source.groupId!;
  const userId  = event.source.userId!;
  const replyToken = event.replyToken!;
  const rawText = (event.message!.text ?? '').trim();

  const parts = rawText.split(/\s+/);
  let cmd = parts[0];
  const args = parts.slice(1);

  if (ALIASES[cmd]) cmd = ALIASES[cmd];
  cmd = cmd.toLowerCase();
  if (!cmd.startsWith('/')) return;

  const token = env.LINE_CHANNEL_ACCESS_TOKEN;
  const state = await loadGame(env.GAMES_KV, groupId);
  const displayName = await getGroupMemberProfile(token, groupId, userId);

  let result: ActionResult | null = null;
  let replyText = '';

  switch (cmd) {
    case '/help':
    case '/h':
      replyText = buildHelpText(buildLiffUrl(env.LIFF_URL, groupId));
      break;

    case '/join':
      result = addPlayer(state, userId, displayName);
      if (result.ok) await registerGroupMember(env.GAMES_KV, groupId, userId);
      break;

    case '/leave':
      result = removePlayer(state, userId);
      // NOTE: no account settlement here — only recorded at /endgame
      break;

    case '/start':
      result = startGame(state, userId);
      // Append LIFF link to game start message
      if (result.ok) {
        result = { ...result, groupMsg: result.groupMsg + `\n\n🃏 底牌查看：${buildLiffUrl(env.LIFF_URL, groupId)}` };
      }
      break;

    case '/call':
      result = processAction(state, userId, 'call');
      break;

    case '/check':
      result = processAction(state, userId, 'check');
      break;

    case '/fold':
      result = processAction(state, userId, 'fold');
      break;

    case '/raise': {
      const amt = parseInt(args[0] ?? '', 10);
      if (isNaN(amt)) { replyText = '請指定加注金額，例如：/raise 100'; break; }
      result = processAction(state, userId, 'raise', amt);
      break;
    }

    case '/allin':
      result = processAction(state, userId, 'allin');
      break;

    case '/buyin': {
      const amt = parseInt(args[0] ?? '', 10) || STARTING_CHIPS;
      result = buyIn(state, userId, amt);
      break;
    }

    case '/next':
      result = nextHand(state, userId);
      // Notify busted players via the group message (no push messages needed)
      if (result.ok && result.bustedPlayers?.length) {
        result = {
          ...result,
          groupMsg:
            result.groupMsg +
            `\n\n💸 爆倉玩家請點連結加倉：${buildLiffUrl(env.LIFF_URL, groupId)}\n指令：/buyin [金額] 或 /leave`,
        };
      }
      break;

    case '/forceend': {
      result = forceEndGame(state);
      if (result.settlements?.length) {
        for (const s of result.settlements) {
          await applySettlement(env.GAMES_KV, s);
          await registerGroupMember(env.GAMES_KV, groupId, s.userId);
        }
      }
      await env.GAMES_KV.delete(groupId);
      await sendResult(token, replyToken, result);
      return;
    }

    case '/endgame': {
      result = endGame(state, userId);
      // ── Only record accounts at /endgame ──────────────────────────────────
      if (result.settlements?.length) {
        for (const s of result.settlements) {
          await applySettlement(env.GAMES_KV, s);
          await registerGroupMember(env.GAMES_KV, groupId, s.userId);
        }
      }
      await env.GAMES_KV.delete(groupId);
      await sendResult(token, replyToken, result);
      return;
    }

    case '/status':
      replyText = getStatus(state);
      break;

    // /cards kept as fallback but now just points to the LIFF app
    case '/cards':
      replyText = `🃏 請點以下連結查看底牌：\n${buildLiffUrl(env.LIFF_URL, groupId)}`;
      break;

    case '/balance': {
      const acc = (await loadAccount(env.GAMES_KV, userId)) ?? defaultAccount(userId, displayName);
      replyText = formatAccount({ ...acc, name: displayName });
      break;
    }

    case '/rank': {
      const board = await getLeaderboard(env.GAMES_KV, groupId);
      if (!board.length) {
        replyText = '排行榜暫無資料，先完成一局遊戲吧！';
      } else {
        const medals = ['🥇', '🥈', '🥉'];
        const lines = board.map((acc, i) => {
          const sign = acc.balance >= 0 ? '+' : '';
          const reBuys = acc.buyInCount - acc.gamesPlayed;
          return `${medals[i] ?? `${i + 1}.`} ${acc.name}：${sign}$${acc.balance}（${acc.gamesPlayed} 局，加倉 ${reBuys} 次）`;
        });
        replyText = `🏆 本群排行榜\n━━━━━━━━━━━━━━━\n${lines.join('\n')}`;
      }
      break;
    }

    default:
      replyText = '未知指令。輸入 /help 查看所有指令。';
  }

  if (result) {
    // No more push messages — hole cards are viewed via the LIFF web app
    replyText = result.groupMsg;
  }

  await saveGame(env.GAMES_KV, state);
  await sendResult(token, replyToken, result ?? { ok: true, groupMsg: replyText, privateMessages: {} });
}

async function sendResult(token: string, replyToken: string, result: ActionResult): Promise<void> {
  if (result.mentionUserId && result.mentionName) {
    await replyWithMention(token, replyToken, result.groupMsg, result.mentionUserId, result.mentionName);
  } else {
    await replyMessage(token, replyToken, result.groupMsg);
  }
}
