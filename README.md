# AgentPay — AI Agent Smart Payment Platform

> Let every AI Agent become an independent economic actor.

AgentPay is an AI Agent smart payment management platform built on the HTX ecosystem. It provides AI Agents with independent wallets, autonomous payment capabilities, intelligent token swapping, and unified management.

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **State Management**: Zustand
- **AI**: DeepSeek (strategy decision‑making / natural language instruction parsing)
- **On‑chain**: HTX REST + WebSocket API
- **Charts**: Recharts

## Feature Modules

1. **Agent Wallet Management System** — multi‑wallet isolation / permission tiers / spending limits
2. **Smart Payment Engine** — rule‑based + AI‑driven automatic payment triggering
3. **Intelligent Token Swap Engine** — automated token conversion via HTX
4. **Unified Agent Dashboard** — consolidated overview of multi‑agent assets, transactions, and monitoring
5. **AI Payment Gateway** — standardised onboarding for service providers
6. **Multi‑language** — Traditional Chinese / Simplified Chinese / English
7. **Health Check** — `/api/health` endpoint to verify module status

## Local Development

```bash
npm install
cp .env.example .env.local   # Fill in DEEPSEEK / HTX keys (set DEMO_MODE=true to try without keys)
npm run dev
```

## Directory Structure

```
src/
  app/
    [locale]/            # multi‑language routing
      page.tsx           # Landing
      dashboard/         # Dashboard
      agents/            # Agent management
      payments/          # Payment monitoring
      swap/              # Token swap
      strategy/          # Strategy configuration
      gateway/           # Payment gateway
      health/            # Health check
    api/
      htx/               # HTX integration
      deepseek/          # DeepSeek integration
      agents/            # Agent CRUD
      payments/          # Payment execution
      swap/              # Swap execution
      gateway/           # Merchant gateway
      health/            # Health check
  components/            # UI components
  lib/                   # HTX signing / DeepSeek / store / i18n
  i18n/                  # Language files
```

## Health Check

Visit `/zh-TW/health` (or `/zh-CN/health`, `/en/health`) to run a one‑click verification of:
- DeepSeek connectivity
- HTX public market data endpoints
- HTX signature generation
- Agent creation / payment simulation / swap simulation
- Data storage

## License
MIT

---


# AgentPay — AI Agent 智能支付平台

> Let every AI Agent become an independent economic actor.

AgentPay 是基於 HTX 生態構建的 AI Agent 智能支付管理平台。為 AI Agent 提供獨立錢包、自主支付、智能代幣兌換以及統一管理能力。

## 技術棧

- **前端**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **狀態**: Zustand
- **AI**: DeepSeek (策略決策 / 自然語言指令解析)
- **鏈上**: HTX REST + WebSocket API
- **圖表**: Recharts

## 功能模塊

1. **Agent 錢包管理系統** — 多錢包隔離 / 權限分級 / 限額策略
2. **智能支付引擎** — 規則化 + AI 決策自動觸發支付
3. **智能代幣兌換引擎** — 通過 HTX 自動兌換目標 Token
4. **Agent 統一儀表板** — 多 Agent 資產 / 交易 / 監控總覽
5. **AI 支付網關** — 面向服務商的標準化接入
6. **多語言** — 繁體中文 / 簡體中文 / English
7. **健康檢查** — `/api/health` 校驗各模塊運作

## 本地運行

```bash
npm install
cp .env.example .env.local   # 填入 DEEPSEEK / HTX Key（DEMO_MODE=true 可免 Key 體驗）
npm run dev
```

## 目錄結構

```
src/
  app/
    [locale]/            # 多語言路由
      page.tsx           # Landing
      dashboard/         # 儀表板
      agents/            # Agent 管理
      payments/          # 支付監控
      swap/              # 代幣兌換
      strategy/          # 策略配置
      gateway/           # 支付網關
      health/            # 健康檢查
    api/
      htx/               # HTX 接入
      deepseek/          # DeepSeek 接入
      agents/            # Agent CRUD
      payments/          # 支付執行
      swap/              # 兌換執行
      gateway/           # 商戶網關
      health/            # 健康檢查
  components/            # UI 組件
  lib/                   # HTX 簽名 / DeepSeek / store / i18n
  i18n/                  # 語言文件
```

## 功能檢查

進入 `/zh-TW/health`（或 `/zh-CN/health`、`/en/health`）一鍵跑通：
- DeepSeek 連通性
- HTX 公共行情接口
- HTX 簽名生成
- Agent 創建 / 支付模擬 / 兌換模擬
- 數據存儲

## License
MIT
