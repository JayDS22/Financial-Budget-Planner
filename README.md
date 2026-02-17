<div align="center">

# 💎 VisionFi

### *Intelligent Budget Planner for the Modern Age*

**🏆 TartanHacks 2026 — Carnegie Mellon University**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![Claude AI](https://img.shields.io/badge/Claude_AI-Powered-CC785C?style=for-the-badge&logo=anthropic&logoColor=white)](https://anthropic.com)
[![Railway](https://img.shields.io/badge/Railway-Deployed-0B0D0E?style=for-the-badge&logo=railway&logoColor=white)](https://railway.app)

<br/>

[🚀 **Live Demo**](https://visionfi-prod.up.railway.app/) · [📖 Features](#-features) · [⚡ Quick Start](#-quick-start) · [🏗 Architecture](#-architecture)

<br/>

<img src="https://img.shields.io/badge/Built_at-TartanHacks_2026-C41230?style=for-the-badge" alt="TartanHacks 2026"/>

</div>

---

<br/>

## 🧠 What is VisionFi?

VisionFi is a full-stack AI-powered financial planner that brings together **budgeting, credit management, investment tracking, and personalized insights** into one beautiful dashboard. Built with a Visa-inspired design language, it empowers users to take control of their finances through intelligent automation and goal-oriented AI guidance.

> *Your finances, one vision ahead.*

<br/>

## ✨ Features

| | Feature | Description |
|---|---------|-------------|
| 📊 | **Dashboard** | Net worth overview, income/expense tracking, transaction management & budget monitoring |
| 🛒 | **Smart Shopping** | AI-powered shopping planner with deal discovery and card-matched offers |
| 📱 | **Subscriptions** | Usage analysis, cancellation recommendations & a guard for unused services |
| 💳 | **Credit & Loans** | Credit score monitoring, card management, loan tracking & spending breakdowns |
| 📈 | **Investments** | Stock, mutual fund & bond portfolio tracking with historical performance charts |
| 💡 | **Insights & Predictions** | AI-generated spending insights and cash-flow forecasting |
| 📖 | **Learn** | Financial literacy hub with guided educational content |
| 🤖 | **AI Chat Assistant** | Goal-oriented financial advisor powered by Claude with multi-model orchestration |
| ⚙️ | **Smart Automations** | Round-up savings, under-budget sweeps, bill reminders, spending alerts & more |

<br/>

## 🛠 Tech Stack

```
┌─────────────────────────────────────────────┐
│  Frontend     │  Vanilla JS · CSS (SPA)     │
│  Backend      │  Node.js · Express 5        │
│  Database     │  sql.js (in-memory SQLite)   │
│  AI Engine    │  Anthropic Claude API        │
│  Routing      │  Dedalus Labs (multi-model)  │
│  Deployment   │  Railway                     │
└─────────────────────────────────────────────┘
```

<br/>

## ⚡ Quick Start

**1 ·** Clone the repo

```bash
git clone https://github.com/your-username/Financial-Budget-Planner.git
cd Financial-Budget-Planner
```

**2 ·** Install dependencies

```bash
npm install
```

**3 ·** Set up environment variables

```bash
cp .env.example .env
```

```env
ANTHROPIC_API_KEY=sk-ant-...
DEDALUS_API_KEY=your-key-here   # optional — enables multi-model orchestration
```

**4 ·** Launch

```bash
npm start
```

**5 ·** Open [**localhost:3000**](http://localhost:3000) and explore 🎉

<br/>

### 🔑 Demo Accounts

| Email | Password |
|:------|:---------|
| `alex@cmu.edu` | `demo123` |
| `sarah@gmail.com` | `demo123` |
| `jay@cmu.edu` | `demo123` |

<br/>

## 🏗 Architecture

```
VisionFi/
│
├── server.js             # Express API · DB schema · AI endpoints
├── index.html            # Entry point
│
├── app.js                # Main frontend — routing, state, dashboard
├── chat.js               # AI chat assistant & goal-based agent
├── credit.js             # Credit score, cards, loans & spending
├── investment.js          # Stock, fund & bond portfolio tracking
├── insight.js            # AI-powered spending insights
├── prediction.js         # Cash-flow prediction engine
├── automation.js         # Smart savings automations
├── learn.js              # Financial literacy learning hub
├── styles.css            # Global styles
│
├── package.json
└── .env                  # API keys (not committed)
```

<br/>

## 🌐 Deployment

The app is live on Railway:

> **🔗 [https://visionfi-prod.up.railway.app](https://visionfi-prod.up.railway.app/)**

To deploy your own instance, connect the repo to [Railway](https://railway.app) and add your environment variables (`ANTHROPIC_API_KEY`, optionally `DEDALUS_API_KEY`) in the dashboard.

<br/>

---

<div align="center">

**Built with ❤️ and ☕ at TartanHacks 2026**

*Carnegie Mellon University · Pittsburgh, PA*

</div>