# DC AgentPay X — AI Agent 智能支付平台

> Let every AI Agent become an independent economic actor.

## 核心升級

| 功能 | 說明 |
|------|------|
| 🔐 **MetaMask + Google 登入** | 支援 Web3 錢包簽名登入與 Google OAuth 雙重認證 |
| 🗄️ **MongoDB 數據庫** | 取代內存 Store，資料持久化儲存（Atlas / 本地） |
| 🧪 **HTX Testnet 測試網** | 預設使用 HTX 測試網進行功能驗證，安全無風險 |
| 🤖 **真實 Agent 接入** | 用戶輸入 Agent API Key + Endpoint 即可接入平台 |
| 💰 **Agent 支付能力** | 透過 API Key 直接從用戶帳戶扣款，權限可控 |
| 💱 **即時 HTX Chain 匯率** | Swap 時取得鏈上即時兌換率，毫秒級更新 |
| 🌐 **生產模式切換** | `DEMO_MODE=false` 時所有功能真實執行 |
| ⚙️ **自動兌換上限** | 為每個 Agent 設定自動兌換最大金額，防止意外損失 |

## 快速開始

### 1. 安裝依賴
```bash
npm install
```

### 2. 配置環境變數
```bash
cp .env.example .env.local
# 編輯 .env.local，填入以下必要變數：
# - MONGODB_URI (MongoDB Atlas 連接字串)
# - GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET (Google OAuth)
# - HTX_API_KEY / HTX_API_SECRET (HTX API 憑證)
# - DEEPSEEK_API_KEY (DeepSeek AI)
# - JWT_SECRET (至少 32 字元)
```

### 3. 初始化 MongoDB
```bash
npm run db:init
```

### 4. 啟動開發服務
```bash
npm run dev
```
訪問 http://localhost:3000

### 5. 部署到 Vercel
```bash
git push origin main
# Vercel 自動檢測 Next.js 並部署
# 在 Vercel Dashboard 配置相同環境變數
```

## 登入方式

### MetaMask 錢包登入
1. 點擊 "MetaMask 錢包登入"
2. 瀏覽器彈出 MetaMask 簽名請求
3. 確認簽名後自動創建/綁定賬戶

### Google 登入
1. 點擊 "Google 登入"
2. 選擇 Google 賬戶授權
3. 自動創建/綁定賬戶

## Agent 接入流程

1. 進入 **Agent 管理** 頁面
2. 點擊 **"接入真實 Agent"**
3. 填寫：
   - Agent 名稱與類型
   - **API Endpoint**（如 `https://your-agent.api/v1`）
   - **API Key**（Agent 服務的認證密鑰）
   - **認證方式**（Bearer Token / Basic Auth / API Key Header）
   - **使用貨幣**（USDT / HTX / KITE / ETH / BTC / TRX）
   - **自動兌換上限**（每次自動兌換的最大 USDT 金額）
   - **每日限額 / 單筆限額**
   - **權限**（讀取 / 交易 / 提幣）
4. 點擊 **"測試連接"** 驗證 Agent 是否可達
5. 提交完成接入

接入後，Agent 可以根據您設定的權限和限額自主進行支付。

## 即時匯率

Swap 頁面會自動從 **HTX Chain** 獲取即時市場匯率：
- 支持所有主流交易對
- 匯率即時刷新（帶時間戳顯示）
- 滑點保護（可自訂最大滑點）

## 模式切換

右上角可切換 **Demo Mode** ↔ **Production Mode**：
- **Demo Mode** (`DEMO_MODE=true`)：模擬資料，安全測試
- **Production Mode** (`DEMO_MODE=false`)：真實交易，連接 HTX 主網

## 目錄結構

```
src/
  app/
    api/
      auth/
        login/route.ts          # MetaMask 簽名驗證登入
        google/route.ts         # Google OAuth 入口
        callback/route.ts       # Google OAuth 回調處理
      require-auth.ts           # JWT 中間件
      mongo/                    # MongoDB 工具
      htx/                      # HTX API 代理
      agents/                   # Agent CRUD + 真實接入
      payments/                 # 支付執行（含 AI 風控）
      swap/                     # 即時匯率 + 兌換執行
      deepseek/route.ts         # DeepSeek AI 代理
      strategy/route.ts         # 策略配置
      gateway/route.ts          # 商戶支付網關
      health/route.ts           # 全系統健康檢查
    [locale]/                   # 多語言路由
      dashboard/page.tsx        # 統一儀表板
      agents/page.tsx           # Agent 管理（含接入表單）
      payments/page.tsx         # 支付監控
      swap/page.tsx             # 代幣兌換（即時匯率）
      strategy/page.tsx         # 策略配置 + AI 顧問
      gateway/page.tsx          # 支付網關
      profile/page.tsx          # 個人中心
      health/page.tsx           # 健康檢查
  components/
    AuthButtons.tsx             # MetaMask + Google 登入按鈕
    WalletBadge.tsx             # 錢包狀態顯示
    AgentConnectForm.tsx        # 真實 Agent 接入表單
    Sidebar.tsx / Topbar.tsx    # 佈局組件
    StatCard.tsx                # 統計卡片
  lib/
    db/
      mongo.ts                  # MongoDB 連接池
      schema.ts                 # 數據模型定義
    auth/
      metaMask.ts               # MetaMask 簽名驗證
      google.ts                 # Google OAuth 驗證
      jwt.ts                    # JWT 工具
    htx/
      client.ts                 # HTX API 客戶端（含測試網）
    deepseek.ts                 # DeepSeek AI 客戶端
    ethers.ts                   # Ethers.js 工具（MetaMask 交互）
    utils.ts                    # 通用工具
    clientStore.ts              # Zustand 客戶端狀態
  i18n/                         # 多語言字典
    zh-TW.json / zh-CN.json / en.json
```

## 安全說明

- API Key 儲存在 MongoDB 中（生產環境應加密儲存）
- JWT Session 7天有效，自動續期
- MetaMask 簽名使用 `personal_sign`，不洩露私鑰
- 所有敏感操作需通過權限檢查 + 限額檢查
- AI 風控可攔截高風險支付

## 📊 健康檢查

訪問 `/zh-TW/health` 一鍵驗證：
- ✅ MetaMask 登入流程
- ✅ Google OAuth 配置
- ✅ MongoDB 連接與索引
- ✅ HTX 測試網行情
- ✅ HTX 簽名生成
- ✅ DeepSeek AI 回應
- ✅ JWT 驗證

## DEMO
* https://youtu.be/YETznovPlTc

## Screen Cap
* 首頁
![home_page](https://github.com/MartinYeung5/DC-AgentPay-X/blob/main/image/20260713_1.png)

* Dashboard
![home_page](https://github.com/MartinYeung5/DC-AgentPay-X/blob/main/image/20260713_2.png)

* Agents
![home_page](https://github.com/MartinYeung5/DC-AgentPay-X/blob/main/image/20260713_3.png)

* Payments
![home_page](https://github.com/MartinYeung5/DC-AgentPay-X/blob/main/image/20260713_4.png)

* Swap
![home_page](https://github.com/MartinYeung5/DC-AgentPay-X/blob/main/image/20260713_5.png)