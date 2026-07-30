# Poker-Jake 🃏

LINE 群組德州撲克機器人 — 在 LINE 群組裡用指令玩德州撲克，搭配 LIFF 網頁查看底牌與牌桌狀態。

- **後端**：Cloudflare Worker（LINE Webhook + 遊戲引擎 + KV 儲存）
- **前端**：Next.js 靜態網頁（LIFF App，部署於 Cloudflare Pages）

---

## 功能總覽

### 加入 / 離開

| 指令 | 別名 | 說明 |
|------|------|------|
| `/join` | 加入 | 加入牌桌（最多 9 人）。牌局進行中會進入等待隊列，下一局自動上桌 |
| `/leave` | 離開 | 離開牌桌。牌局進行中會標記「本局結束後退出」；若正輪到你，會自動棄牌並把行動權交給下一位 |
| `/start` | 開始 | 開始遊戲（至少 2 人） |

### 遊戲中行動

| 指令 | 別名 | 說明 |
|------|------|------|
| `/call` | 跟注 | 跟注（無需跟注時等同過牌） |
| `/check` | 過牌 | 過牌（有人下注時不可用） |
| `/fold` | 棄牌 | 棄牌 |
| `/raise <金額>` | 加注 | 在當前注額之上再加注，金額須為 $5（小盲）的倍數且至少 $10（大盲），例：`/raise 100` |
| `/allin` | 全押 | 全押（支援邊池計算） |
| `/buyin [金額]` | 加倉 | 補充籌碼，上限 $1000，下一局生效。爆倉玩家用此指令重新上桌 |
| `/forcefold` | 強制棄牌 | 當前行動者閒置超過 2 分鐘後，其他玩家可用此指令將他強制棄牌 |

### 其他

| 指令 | 別名 | 說明 |
|------|------|------|
| `/next` | 下一局 | 開始下一局 |
| `/endgame` | 結束 | 結束整場遊戲並結算（寫入個人帳戶紀錄） |
| `/forceend` | 強制結束 | 任何狀態下強制結束並重置 |
| `/status` | 狀態 | 查看牌桌狀態，並 @ 提醒當前行動者 |
| `/showcard` | 亮牌 | 主動亮出自己的手牌 |
| `/balance` | 帳戶 | 查看個人累積戰績 |
| `/rank` | 排行榜 | 本群排行榜（依累積盈虧排序） |
| `/link` | 連結 | 重新取得 LIFF 底牌連結 |
| `/help` | 幫助 | 指令說明 |

### 遊戲特色

- **完整德州撲克規則**：盲注（$5/$10）、位置標籤（BTN/SB/BB/UTG/HJ/CO…）、邊池（side pot）、平分底池、7 張牌最佳牌型判定。
- **超時強制棄牌**：輪到的玩家超過 **2 分鐘**未行動，其他玩家即可下 `/forcefold` 將他強制棄牌（時間未到會回覆剩餘等待時間），訊息會 @ 標註被棄牌的玩家並提示下一位行動者。
- **快速回覆按鈕（Quick Reply）**：每則機器人訊息附帶情境按鈕（跟注金額、1/3 pot / 1/2 pot / pot 加注、全押、棄牌…），點一下就出指令。
- **等待隊列與爆倉加倉**：牌局中加入的玩家排隊等下一局；籌碼歸零的玩家可 `/buyin` 重新買入或 `/leave` 離場。
- **帳戶與排行榜**：`/endgame` 結算時將每人盈虧寫入永久帳戶，`/rank` 顯示本群累積排行。
- **LIFF 網頁**：查看自己的底牌、公共牌、底池與每位玩家狀態（PWA，可加入主畫面）。

---

## 專案架構

前後端是兩個獨立部署，執行期不共用任何程式碼：

```
Poker-Jake/
├── src/                    # 後端 — Cloudflare Worker
│   ├── index.ts            # fetch 進入點：Webhook 驗簽、指令分派、KV 讀寫、回覆組裝
│   ├── game.ts             # 遊戲引擎：所有狀態變更（純函式，無 I/O）
│   ├── card.ts             # 牌組建立與洗牌
│   ├── handEvaluator.ts    # 7 張牌最佳牌型評分
│   ├── line.ts             # LINE Messaging API 客戶端（回覆、@mention、驗簽）
│   └── accounts.ts         # 玩家永久帳戶（KV）與排行榜
├── web/                    # 前端 — Next.js 靜態匯出（Cloudflare Pages）
│   └── src/
│       ├── app/            # layout / page / globals.css（Tailwind v4 設計 token）
│       ├── components/     # GameApp（LIFF 初始化+資料抓取）、GameView、PlayingCard
│       └── lib/api.ts      # 呼叫 Worker /api/player
├── test_game.ts            # 遊戲引擎測試（130+ 斷言）
├── test_mention.ts         # @mention 訊息組裝測試
└── wrangler.toml           # Worker 設定（KV binding、LIFF_URL）
```

### 後端（Cloudflare Worker）

**請求流程**：

1. `POST /webhook` — 同步驗證 LINE HMAC 簽章後**立即回 200**，事件用 `ctx.waitUntil()` 背景處理（避免 LINE 逾時重送）。
2. 解析指令（支援中文別名）→ 從 KV 載入 `GameState` → 呼叫 `game.ts` 純函式 → 存回 KV → 用 replyToken 回覆群組。
3. `GET /api/player` — LIFF 網頁帶 LINE access token 呼叫，Worker 向 LINE 驗證 token 後回傳該玩家視角的牌局資料（含自己的底牌）。

**遊戲狀態機**：

```
waiting → preflop → flop → turn → river → showdown ─→ (/next: preflop…)
                                                    └→ (/endgame: ended)
```

- `startNewHand()`：套用預約加倉、移出離桌玩家、隊列玩家上桌、發牌、下盲注。
- `advancePhase()`：所有人 all-in 無法再下注時，自動發完剩餘公共牌直接攤牌。
- `showdown()`：邊池逐池比牌分配。

**超時強制棄牌（`/forcefold`）**：

Worker 沒有常駐計時器，也**不會**自動棄牌 — `GameState.turnStartedAt` 在每次換人行動時蓋時間戳；當前行動者閒置超過 `TURN_TIMEOUT_MS`（2 分鐘）後，須由**其他玩家**下 `/forcefold` 呼叫 `forceFold()` 將他棄牌並公告。時間未到、沒有進行中的下注回合、或行動者對自己下指令（請用 `/fold`）都會被拒絕並回覆原因。

**LINE @mention**：`line.ts` 使用 `textV2` 訊息型別 + `substitution` 佔位符（`{m0}`、`{m1}`…）實作 @mention，支援同一則訊息標註多人（例如同時 @ 被強制棄牌的玩家和下一位行動者）。舊式 `type:"text"` + 字元索引在 emoji 多的文字中不可靠，已棄用。

### KV 資料模型

| Key | Value | TTL |
|-----|-------|-----|
| `{groupId}` | `GameState` JSON（整場牌局狀態） | 24 小時（每次存檔刷新） |
| `a:{userId}` | `PlayerAccount` JSON（累積盈虧、局數、加倉次數） | 永久 |
| `gm:{groupId}` | `string[]`（群組成員清單，供排行榜） | 永久 |

`loadGame()` 用 `??=` 回填新版欄位，向下相容既有 KV 資料。

### 前端（Next.js + LIFF）

- `next.config.ts` 設定 `output: 'export'` 靜態匯出到 `web/out/`，由 Cloudflare Pages 託管；含 PWA 支援。
- `GameApp.tsx` 負責 LIFF 初始化、登入、資料抓取；`GameView.tsx` / `PlayingCard.tsx` 為純展示元件。
- **groupId 傳遞**：機器人把 groupId 編進 `liff.state` 查詢參數，前端從 `liff.getContext()` 或 `?groupId=` 讀取；`liff.login({ redirectUri })` 確保 OAuth 轉跳後不遺失。
- **刻意不做輪詢**：切回 App 時的 `visibilitychange` 事件或手動刷新按鈕觸發更新。

### 關鍵常數（`src/game.ts`）

| 常數 | 值 |
|------|-----|
| `STARTING_CHIPS` | 1000 |
| `SMALL_BLIND` / `BIG_BLIND` | 5 / 10 |
| `MAX_PLAYERS` | 9 |
| `TURN_TIMEOUT_MS` | 2 分鐘 |

---

## 開發

```bash
# 後端
npm install
npm run dev          # wrangler dev — 本機 Worker（localhost:8787）
npm run typecheck    # tsc --noEmit

# 前端
cd web && npm install
npm run dev          # Next.js dev server

# 測試
npx tsx test_game.ts     # 遊戲引擎測試
npx tsx test_mention.ts  # mention 訊息測試
```

---

## 部署

### 事前準備

1. **LINE Developers Console**（https://developers.line.biz/）
   - 建立 Provider 與 **Messaging API** channel → 取得 `Channel secret` 和 `Channel access token`。
   - 建立 **LINE Login** channel → 新增 **LIFF App**（Size: Full，Endpoint URL 先留空，之後填 Pages 網址）→ 取得 LIFF ID。
2. **Cloudflare 帳號**，安裝並登入 wrangler（`npx wrangler login`）。

### 1. 部署後端 Worker

```bash
# 建立 KV namespace，把回傳的 id 填入 wrangler.toml 的 [[kv_namespaces]]
npx wrangler kv namespace create GAMES_KV
npx wrangler kv namespace create GAMES_KV --preview

# 設定 LINE 憑證（secrets）
npx wrangler secret put LINE_CHANNEL_SECRET
npx wrangler secret put LINE_CHANNEL_ACCESS_TOKEN

# wrangler.toml 的 [vars] LIFF_URL 填 https://liff.line.me/{你的LIFF_ID}

# 部署
npm run deploy
```

部署後取得 Worker 網址（`https://poker-jake.<subdomain>.workers.dev`），回到 LINE Messaging API channel 設定：

- **Webhook URL**：`https://<worker網址>/webhook` 路徑不拘，Worker 對所有 POST 都當 webhook 處理，直接填根網址即可
- 開啟 **Use webhook**，關閉自動回覆訊息。

### 2. 部署前端（Cloudflare Pages）

```bash
cd web
npm run build        # 靜態匯出到 web/out/
```

在 Cloudflare Pages 建立專案並連結此 git repo：

- **Build command**：`cd web && npm install && npm run build`
- **Build output directory**：`web/out`

之後每次 `git push` 自動部署。取得 Pages 網址後，回到 LINE Login channel 的 LIFF App 設定，把 **Endpoint URL** 填為 Pages 網址。

### 3. 開始使用

把機器人（Messaging API channel 的官方帳號）邀進 LINE 群組，輸入 `/help` 即可開始。

### 維運

```bash
npx wrangler tail    # 即時串流 Worker log
```

---

## 授權

私人專案。
