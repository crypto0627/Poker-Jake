# Poker-Jake — LINE 德州撲克機器人

Cloudflare Workers + LINE Messaging API 實作的群組德州撲克遊戲機器人。

## 專案結構

```
Poker-Jake/
├── src/
│   ├── index.ts          # Worker 入口、LINE webhook 路由
│   ├── game.ts           # 德州撲克遊戲邏輯
│   ├── card.ts           # 牌組與洗牌
│   ├── handEvaluator.ts  # 牌型評分（高牌 → 同花順）
│   ├── line.ts           # LINE API 呼叫、HMAC 驗證
│   └── accounts.ts       # 玩家帳戶、結算、排行榜
├── wrangler.toml         # Cloudflare Worker 設定
├── tsconfig.json
├── package.json
└── DEPLOY.md
```

---

## 一、前置需求

| 工具 | 版本 |
|------|------|
| Node.js | ≥ 18 |
| Wrangler CLI | 已含在 devDependencies（`npm install` 即可） |
| Cloudflare 帳號 | 免費即可 |
| LINE Developer 帳號 | 免費 |

---

## 二、LINE Developer Console 設定

### 1. 建立 Messaging API Channel

1. 前往 [LINE Developers Console](https://developers.line.biz/console/)
2. 建立 **Provider**（第一次才需要）
3. 建立 **Messaging API** Channel
4. 記下以下兩個值：
   - **Channel Secret** — Basic settings 頁面
   - **Channel Access Token** — Messaging API 頁面 → Issue token

### 2. 啟用群組 & Webhook

在 **Messaging API** 頁面：

| 設定 | 值 |
|------|----|
| Allow bot to join group chats | **Enable** |
| Use webhook | **Enable** |
| Auto-reply messages | **Disable** |
| Greeting messages | **Disable** |

> ⚠️ Auto-reply 沒關掉會讓 Bot 每次都回「感謝您的訊息」而非執行指令。

---

## 三、Cloudflare 設定

### 1. 登入

```bash
npx wrangler login
```

### 2. 建立 KV Namespace

KV 用來儲存遊戲狀態（`{groupId}`）、玩家帳戶（`a:{userId}`）、群組成員列表（`gm:{groupId}`）。

```bash
# 正式環境
npx wrangler kv namespace create GAMES_KV

# 本機開發用
npx wrangler kv namespace create GAMES_KV --preview
```

將輸出的 id 填入 `wrangler.toml`：

```toml
[[kv_namespaces]]
binding = "GAMES_KV"
id = "你的正式 id"
preview_id = "你的 preview id"
```

### 3. 設定 LINE 憑證（加密 Secrets）

```bash
npx wrangler secret put LINE_CHANNEL_SECRET
# 貼上 Channel Secret → Enter

npx wrangler secret put LINE_CHANNEL_ACCESS_TOKEN
# 貼上 Channel Access Token → Enter
```

---

## 四、部署

```bash
npm install
npm run deploy
```

成功後顯示 Worker URL：

```
https://poker-jake.your-subdomain.workers.dev
```

---

## 五、設定 LINE Webhook URL

回到 LINE Developers Console → Messaging API：

1. **Webhook URL** 填入：
   ```
   https://poker-jake.your-subdomain.workers.dev/webhook
   ```
2. 點 **Verify** → 應顯示 **Success**
3. 確認 **Use webhook** 為 **Enabled**

---

## 六、將 Bot 加入群組

1. LINE Developers Console → Messaging API → 掃 QR Code 加 Bot 為好友
2. 在群組邀請 Bot 加入

> ⚠️ **手牌私訊需要好友關係**
> Bot 發手牌走的是 Push Message，LINE 規定只有加過好友的用戶才能收到。
> 請每位玩家先掃 QR Code 加 Bot 好友，才能收到私訊手牌。

---

## 七、本機開發

```bash
npm run dev
# Wrangler 啟動於 http://localhost:8787
```

使用 Cloudflare Quick Tunnel 暴露到公網（免帳號）：

```bash
npx cloudflared tunnel --url http://localhost:8787
```

把輸出的 `https://xxx.trycloudflare.com/webhook` 暫填到 LINE Webhook URL。

---

## 八、完整指令表

### 大廳

| 指令 | 中文別名 | 說明 |
|------|----------|------|
| `/join` | `加入` | 加入桌子（遊戲中→排隊，下局上桌） |
| `/leave` | `離開` | 離開（遊戲中→本局結束後退出） |
| `/start` | `開始` | 開始遊戲（≥ 2 人） |
| `/status` | `狀態` | 查看目前桌況與等待隊列 |
| `/help` | `幫助` | 顯示所有指令 |

### 遊戲中行動

| 指令 | 中文別名 | 說明 |
|------|----------|------|
| `/call` | `跟注` | 跟注當前最高下注 |
| `/check` | `過牌` | 過牌（無人下注時） |
| `/fold` | `棄牌` | 棄牌放棄本局 |
| `/raise 100` | `加注 100` | 加注（本輪最少 = 跟注額 + 大盲 $20） |
| `/allin` | `全押` | 全押所有籌碼 |
| `/cards` | `手牌` | 重新私訊你的手牌 |

### 局間

| 指令 | 中文別名 | 說明 |
|------|----------|------|
| `/next` | `下一局` | 開始下一局（爆倉玩家可趁此加倉） |
| `/endgame` | `結束` | 結束本次遊戲，觸發帳戶結算 |

### 爆倉加倉

| 指令 | 中文別名 | 說明 |
|------|----------|------|
| `/buyin` | `加倉` | 爆倉後加倉 $1,000（預設） |
| `/buyin 2000` | `加倉 2000` | 爆倉後自訂加倉金額 |

加倉後進入下一局等待隊列，輸入 `/next` 後自動上桌。

### 帳戶 & 排行榜

| 指令 | 中文別名 | 說明 |
|------|----------|------|
| `/balance` | `帳戶` / `我的帳戶` | 查看個人帳戶（累積盈虧、加倉次數） |
| `/rank` | `排行榜` | 顯示本群所有玩家排行榜 |

---

## 九、遊戲規則

| 設定 | 值 |
|------|----|
| 起始籌碼 | $1,000 |
| 小盲 | $10 |
| 大盲 | $20 |
| 最多玩家 | 9 人 |
| 手牌 | 2 張底牌（私訊） |
| 公共牌 | 5 張（翻牌 3 + 轉牌 1 + 河牌 1） |

### 牌型（由大到小）

| 牌型 | 說明 |
|------|------|
| 同花順 | 同花色連續 5 張（A 高為皇家同花順） |
| 四條 | 四張相同點數 |
| 葫蘆 | 三條 + 一對 |
| 同花 | 五張同花色 |
| 順子 | 五張連續點數 |
| 三條 | 三張相同點數 |
| 兩對 | 兩組對子 |
| 一對 | 一組對子 |
| 高牌 | 以上皆無 |

### 爆倉流程

```
籌碼歸零
  └─ Bot 私訊通知（/buyin 加倉 或 /leave 離開）
     ├─ /buyin [金額]  → 進入下一局隊列
     │   └─ /next 後自動上桌，繼續遊戲
     └─ /leave → 立即結算，帳戶扣除本局虧損
```

### Side Pot（邊池）規則

All-In 金額不同時自動計算邊池：

- A All-In $600、B All-In $840
  - 主池 $1,200（A、B 均可贏）
  - 邊池 $240（僅 B 可贏）
  - 若 A 贏：A 獲得 $1,200，B 拿回 $240

---

## 十、帳戶系統

玩家帳戶永久存儲於 Cloudflare KV（`a:{userId}`），跨群組、跨 session 記錄：

| 欄位 | 說明 |
|------|------|
| 累積盈虧 | 所有局的淨盈虧（可為負數） |
| 總下注額 | 歷史累積投入籌碼 |
| 遊戲場次 | `/endgame` 完成的局數 |
| 加倉次數 | 歷史 Re-buy 總次數（不含首次入場） |

結算時機：
- `/endgame` — 所有在場玩家一起結算
- `/leave` — 個人立即結算（含爆倉後選擇離開）

---

## 十一、費用

| 服務 | 免費額度 |
|------|---------|
| Cloudflare Workers | 每天 100,000 次請求 |
| Cloudflare KV 讀取 | 每天 100,000 次 |
| Cloudflare KV 寫入 | 每天 1,000 次 |
| LINE Messaging API | 每月 200 則（免費方案） |

> 朋友群組正常使用完全在免費額度內。LINE 免費方案每月 200 則若不夠用，可升級到輕量方案（$5/月，3,000 則）。

---

## 十二、常見問題

**Q: 輸入指令沒有反應？**
- 確認 LINE Developers Console → Messaging API → **Auto-reply messages** 已關閉
- 確認 **Use webhook** 已開啟
- 執行 `npx wrangler tail` 查看 Worker 即時 log

**Q: 收不到手牌私訊？**
- 需先加 Bot 為 LINE 好友（掃描 Messaging API 頁面的 QR Code）

**Q: Verify webhook 失敗（404）？**
- 確認 Webhook URL 末尾有 `/webhook`
- 例：`https://poker-jake.xxx.workers.dev/webhook`

**Q: LINE_CHANNEL_SECRET 怎麼確認有設定？**
```bash
npx wrangler secret list
```
應看到 `LINE_CHANNEL_SECRET` 和 `LINE_CHANNEL_ACCESS_TOKEN`。
