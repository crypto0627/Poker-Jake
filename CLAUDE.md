# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Worker (backend)
```bash
npm run dev          # wrangler dev — local Worker at localhost:8787
npm run deploy       # wrangler deploy — deploy to Cloudflare
npm run typecheck    # tsc --noEmit for src/
npx wrangler tail    # stream live Worker logs
```

### Web (frontend)
```bash
cd web && npm run dev    # Next.js dev server
cd web && npm run build  # static export to web/out/
```

### Tests
```bash
npx tsx test_game.ts     # full game logic test suite (~114 assertions)
npx tsx test_mention.ts  # buildMentionMessage unit tests
```

### Deploy secrets
```bash
npx wrangler secret put LINE_CHANNEL_SECRET
npx wrangler secret put LINE_CHANNEL_ACCESS_TOKEN
```

## Architecture

Two independent deployments sharing no code at runtime:

**Backend — Cloudflare Worker (`src/`)**
- `index.ts` — single `fetch` handler; verifies LINE HMAC signature synchronously, then uses `ctx.waitUntil()` to process all webhook events in the background (returns 200 OK to LINE immediately to prevent retry loops).
- `game.ts` — all game state mutations; pure functions that take/return `GameState` and `ActionResult`. No I/O.
- `line.ts` — LINE Messaging API client; uses `textV2` message type (released 2024-10-30) for `@mention` via `substitution` map — NOT the old `type:"text"` + `mention.mentionees[]` index approach.
- `accounts.ts` — persistent player accounts in KV (`a:{userId}`); only written at `/endgame` or `/leave`.
- `card.ts` / `handEvaluator.ts` — deck, shuffle, 7-card best-hand evaluation.

**Frontend — Next.js static export (`web/`)**
- Deployed to Cloudflare Pages via git push; `output: 'export'` in `next.config.ts` required.
- Single component `GameApp.tsx` wraps LIFF init, auth, and all game UI.
- Polling is intentionally removed — refresh triggers are: (1) `visibilitychange` when switching back to the app, (2) manual refresh button.
- `groupId` propagation: bot encodes it in `liff.state` query param (`buildLiffUrl`), frontend reads it from `liff.getContext()` or falls back to `?groupId=` URL param; `liff.login({ redirectUri: window.location.href })` preserves it through OAuth redirect.

## KV Data Model

| Key | Value | TTL |
|-----|-------|-----|
| `{groupId}` | `GameState` JSON | 24 h (refreshed each save) |
| `a:{userId}` | `PlayerAccount` JSON | permanent |
| `gm:{groupId}` | `string[]` (member list) | permanent |

`loadGame` in `index.ts` backfills new fields with `??=` for backwards compatibility with existing KV data.

## Game State Flow

```
waiting → preflop → flop → turn → river → showdown → (next hand: preflop…)
                                                     → (endgame: ended)
```

- `startNewHand()` applies `pendingTopUp` (pre-reserved chip top-ups), moves `wantsToLeave` players out, promotes from `queue`, deals cards.
- `advancePhase()` auto-runs out remaining community cards when `playersWhoCanAct().length <= 1` (i.e. all-in situation with no more betting possible).
- `forceEndGame()` skips phase checks; `endGame()` requires active game.

## Key Constants (`game.ts`)
- 使ㄩㄥSTARTING_CHIPS = 1000`, `SMALL_BLIND = 10`, `BIG_BLIND = 20`, `MAX_PLAYERS = 9`

## LINE Mention

`replyWithMention` in `line.ts` uses `type: "textV2"` with `substitution` — replaces `@{name}` in the text with `{m0}` placeholder. The old `type:"text"` + character-index approach does not work reliably with emoji-heavy text.
