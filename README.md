# 💰 Wealth-Navigator — AI-Powered Personal Finance Management App

> **Smart, Secure & AI-Driven Personal Finance Assistant**

A mobile-first, production-ready application that helps you track, analyze, and improve your financial health — powered by **AI**, **Plaid banking**, and **WebAuthn security**.

---

## 🌐 Live Demo

👉 **[personal-finance-ai-client.vercel.app](https://personal-finance-ai-client.vercel.app)**

---

## 📸 Preview

```
📱 Wealth-Navigator

├── AI Assistant: "How much can I save next month?" (Generic/Personalized Mode)

├── Dashboard: Cash flow, spending, and trends from selected accounts

└── Bank Sync: Securely link accounts via Plaid

```

---

## 🎥 Videos & Photos

### 📹 Demo Video
<!-- Add your demo video link here -->
🎬 **[Watch the Demo](https://github.com/Sanjanadharanikota/Wealth-Navigator-/blob/main/VID-20251001-WA0005%20(1).mp4)** - See the app in action!

### 📷 Screenshots
#### Home Page View
<!-- Add your home page screenshot -->
![Home Page](https://github.com/Sanjanadharanikota/Wealth-Navigator-/blob/main/Screenshot%202025-10-22%20205020.png)




#### Dashboard View
<!-- Add your dashboard screenshot -->
![Dashboard](https://github.com/Sanjanadharanikota/Wealth-Navigator-/blob/main/Screenshot%202025-10-22%20205102.png)

#### AI Assistant
<!-- Add your AI assistant screenshot -->
![AI Assistant](https://github.com/Sanjanadharanikota/Wealth-Navigator-/blob/main/IMG-20251022-WA0053.jpg)

#### Bank Connection
<!-- Add your bank connection screenshot -->
![Bank Connection](https://github.com/Sanjanadharanikota/Wealth-Navigator-/blob/main/Screenshot%202025-10-22%20205031.png)

#### Transaction Analytics
<!-- Add your analytics screenshot -->
![Analytics](https://github.com/Sanjanadharanikota/Wealth-Navigator-/blob/main/Screenshot%202025-10-22%20205102.png)



---

## 🚀 Overview

**Wealth-Navigator** combines the power of **AI**, **secure bank integrations**, and **insightful analytics** in one intuitive dashboard.

💡 Built for users who value **clarity**, **control**, and **security** in managing their money.

---

## ✨ Features

### 🔐 Security & Authentication
- **WebAuthn Authentication**: Biometric unlock (fingerprint/face ID) for secure device access
- **AES-256 Encryption**: All sensitive financial data encrypted at rest
- **JWT Tokens**: Short-lived access tokens with refresh mechanism
- **GDPR Compliant**: Full data ownership and deletion capabilities
- **PIN Protection**: Additional security layer for sensitive operations

### 🏦 Banking Integration
- **Plaid Integration**: Secure bank account linking via Plaid API
- **Real-time Balances**: Check account balances with PIN protection
- **Transaction Sync**: Automatic transaction fetching and categorization
- **Multi-account Support**: Link and manage multiple bank accounts
- **Account Selection**: Choose which accounts to analyze and display insights

### 📊 Analytics & Insights
- **Cash Flow Analysis**: Monthly inflow vs outflow visualization with trends
- **Expense Breakdown**: Category-wise spending analysis with interactive pie charts
- **Net Worth Tracking**: Assets vs liabilities trend analysis over time
- **What-if Simulator**: Future wealth projections based on current spending patterns
- **Anomaly Detection**: Automatic detection of unusual transactions and spending patterns
- **CSV Export**: Download chart data and reports for external analysis
- **Financial Insights**: AI-powered insights based on your selected accounts' data

### 🤖 AI Chat Assistant (Dual Mode)
The AI Assistant offers two powerful modes to suit your needs:

#### 🌐 Generic Mode
- **General Financial Advice**: Get answers to common financial questions
- **Educational Content**: Learn about budgeting, investing, and financial planning
- **No Data Required**: Works without connecting your bank accounts
- **Best For**: Users who want general financial guidance

#### 🎯 Personalized Mode
- **Data-Driven Insights**: AI analyzes all financial data from your **selected accounts**
- **Personalized Recommendations**: Get advice tailored to your spending patterns
- **Account-Specific Analysis**: Insights based on transactions from chosen accounts
- **Smart Suggestions**: 
  - Spending pattern analysis
  - Budget recommendations
  - Savings opportunities
  - Investment suggestions based on your financial health
- **Contextual Answers**: AI understands your financial situation and provides relevant advice
- **Source Attribution**: See which accounts and data sources were used for insights

**How It Works:**
1. Connect your bank accounts via Plaid
2. Select which accounts you want to analyze
3. Switch to **Personalized Mode** in the AI Assistant
4. Ask questions like:
   - "How much did I spend on groceries last month?"
   - "What's my biggest expense category?"
   - "Can I afford a vacation based on my current spending?"
   - "Show me insights from my checking account"

The AI will analyze transactions from your selected accounts and provide personalized insights, trends, and recommendations.

### 📱 UI / UX
- **Mobile-First Design**: Optimized for mobile devices with responsive layout
- **PWA Support**: Install as a native app on your device
- **PhonePe-like Navigation**: Intuitive bottom navigation bar
- **Dark Mode**: Eye-friendly dark theme for comfortable viewing
- **Smooth Animations**: Polished micro-interactions and transitions
- **Voice Input/Output**: Hands-free interaction with the AI Assistant
- **Real-time Updates**: Live data synchronization from connected accounts

---

## ⚙️ Tech Stack

| Layer | Technologies |
|--------|--------------|
| **Frontend** | React 18 • TypeScript • Tailwind CSS • Zustand • Chart.js • Vite |
| **Backend** | Node.js • Express • TypeScript • MongoDB • Plaid API • Gemini AI • WebAuthn |
| **DevOps** | Docker • Docker Compose • Nginx • MongoDB Atlas |

---

## 🧭 Architecture

```
Frontend (React + Tailwind)
        │
        ▼
Backend (Node.js + Express + TypeScript)
        │
        ▼
Plaid API  •  Gemini AI  •  MongoDB (Encrypted)
```

---
## 🏗️ Technical Overview

<a href="https://github.com/Sanjanadharanikota/Wealth-Navigator-/blob/main/TechnicalOverview.png">
  <img src="https://github.com/Sanjanadharanikota/Wealth-Navigator-/blob/main/TechnicalOverview.png" width="600">
</a>

---
## 👤 User View

<a href="https://github.com/Sanjanadharanikota/Wealth-Navigator-/blob/main/UserView.png">
  <img src="https://github.com/Sanjanadharanikota/Wealth-Navigator-/blob/main/UserView.png" width="600">
</a>
---

## 🧰 Prerequisites

- Node.js **v20+**
- MongoDB (local or Docker)
- Plaid Sandbox credentials
- Gemini API key

---

## 🔧 Installation

```bash
# 1️⃣ Clone repo
git clone <repository-url>
cd financial-agent

# 2️⃣ Install dependencies
npm run install:all

# 3️⃣ Setup environment
cd server
cp .env.example .env
# Edit with your values
```

---

## 💻 Run Locally

```bash
# Start MongoDB (if not using Docker)
mongod --dbpath /path/to/data

# Run both servers
npm run dev
```

> **Frontend:** http://localhost:3000  
> **Backend:** http://localhost:5000  

---

## 🐳 Docker Setup

```bash
docker-compose up -d
```

**Services:**
- Frontend → port 3000  
- Backend → port 5000  
- MongoDB → port 27017  

To stop:
```bash
docker-compose down
```

---

## ⚙️ Environment Variables

### 🧩 Server `.env`

```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/financial-agent

# JWT & Encryption
JWT_SECRET=<64-char-secret>
JWT_EXPIRES_IN=15m
AES_256_KEY=<32-char-key>

# Plaid Sandbox
PLAID_CLIENT_ID=your-client-id
PLAID_SECRET=your-secret
PLAID_ENV=sandbox

# Gemini AI
GEMINI_API_KEY=your-gemini-key

# WebAuthn
RP_NAME=Financial Agent
RP_ID=localhost
ORIGIN=http://localhost:3000

# CORS
ALLOWED_ORIGINS=http://localhost:3000
```

### 🧩 Client `.env`

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🧠 AI Assistant Examples

### Generic Mode Examples:
- "What is a good savings rate?"
- "How does compound interest work?"
- "What are the best budgeting strategies?"
- "Explain the difference between stocks and bonds"

### Personalized Mode Examples:
- "How much will I save by 2026?" (analyzes your selected accounts)
- "Can I afford a ₹50L home loan?" (based on your income/expenses)
- "Show my expenses for the last 6 months." (from your accounts)
- "Detect any unusual spending this month." (analyzes your transactions)
- "What's my biggest expense category?" (from selected accounts)
- "How much did I spend on dining out last month?" (account-specific)
- "Show me insights from my checking account" (personalized analysis)

---

## 🏦 Plaid Sandbox Test Login

```
Username: user_good
Password: pass_good
MFA: 1234
```

---

## 📡 API Endpoints

### 🔑 Authentication
```
POST /api/auth/register        → Register user
POST /api/auth/login           → Login user
```

### 🪪 WebAuthn
```
POST /api/webauthn/register/options
POST /api/webauthn/register/verify
POST /api/webauthn/authenticate/options
POST /api/webauthn/authenticate/verify
```

### 🏦 Plaid
```
POST /api/plaid/create-link-token
POST /api/plaid/exchange-token
POST /api/plaid/sync-transactions
POST /api/plaid/unlink
```

### 💳 Accounts & Transactions
```
GET /api/accounts
GET /api/accounts/balances
GET /api/transactions
GET /api/transactions/:id
PATCH /api/transactions/:id
POST /api/transactions/detect-anomalies
```

### 📊 Charts & Analytics
```
GET /api/charts/cashflow?range=6m
GET /api/charts/expense-breakdown?range=6m
GET /api/charts/networth?range=12m
POST /api/charts/simulate
GET /api/charts/export/:chartType
```

### 🤖 AI Assistant
```
POST /api/assistant/query
POST /api/assistant/calculate/loan-affordability
POST /api/assistant/calculate/future-wealth
```

---

## 🛡️ Security Best Practices

✅ Don't commit `.env` files  
✅ Rotate keys regularly  
✅ Use HTTPS in production  
✅ Rate-limit API requests  
✅ Backup encrypted data  
✅ Monitor for anomalies  

---

## ☁️ Deployment

### Vercel (Frontend)
```bash
cd client
vercel --prod
```

### Render / Heroku (Backend)
```bash
cd server
# Follow platform-specific instructions
```

### MongoDB Atlas
- Create cluster at [mongodb.com](https://www.mongodb.com)
- Enable **encryption at rest**
- Update `MONGODB_URI` in `.env`

---

## 🧪 Testing

```bash
cd server && npm test
cd client && npm test
```

---

## 🧰 Troubleshooting

| Problem | Possible Fix |
|----------|---------------|
| ❌ WebAuthn not working | Use HTTPS or correct RP_ID |
| 🔐 Plaid error | Verify sandbox credentials |
| 📦 MongoDB connection failed | Check URI & service status |
| ⚠️ CORS issue | Update `ALLOWED_ORIGINS` in `.env` |

---

## 🤝 Contributing

Contributions are welcome! 🎉

```bash
git checkout -b feature/awesome-feature
git commit -m "Add awesome feature"
git push origin feature/awesome-feature
```

Then open a pull request 🚀

---

## 📜 License

Licensed under the **MIT License** — free for personal and commercial use.

---

## 🙏 Acknowledgments

- 🏦 [Plaid](https://plaid.com) — Bank Integration  
- 🧠 [Google Gemini](https://deepmind.google) — AI Engine  
- 🔐 [SimpleWebAuthn](https://simplewebauthn.dev) — Authentication  
- 📊 [Chart.js](https://www.chartjs.org) — Data Visualization  

---

### 💎 Crafted with ❤️ for a Smarter Financial Future

**👉 [Try Live Demo](https://personal-finance-ai-client.vercel.app)**
