# Helix AI Finance Console

An AI-powered corporate expense management console that parses bank statements, categorizes transactions with Google Gemini, detects anomalies, and generates real-time insights — all backed by a PostgreSQL database.

---

## Screenshots

### Dashboard Overview
![Dashboard Overview](assets/dashboard.png)

### CSV Upload & Processing
![CSV Upload](assets/upload.png)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, TypeScript, Tailwind CSS, Recharts, SWR |
| Backend | Node.js, Express.js 5 |
| Database | PostgreSQL (Supabase) + Prisma ORM |
| AI | Google Gemini (`gemini-2.5-flash-lite` by default) |

---

## Features

- **CSV Upload** — Upload bank export files; transactions are parsed, categorized, and saved instantly
- **AI Categorization** — Gemini classifies every expense into a normalized category (Travel, Meals, Software, Office, Utilities, R&D, Operations, Wellness, Other) with a confidence score
- **Anomaly Detection** — Gemini flags suspicious or unusual transactions on upload; rule-based fallback if AI is unavailable
- **AI Insights** — On-demand insights, recommendations, and month-over-month trends generated from your real expense data
- **Dashboard** — Monthly spending line chart, category pie chart, transaction table with anomaly badges
- **CSV Export** — Download all transactions as a formatted CSV report
- **Graceful Fallbacks** — Rule-based categorization and computed insights work without a Gemini API key

---

## Project Structure

```
helix-ai-finance-console/
├── frontend/                        # Next.js app
│   └── src/
│       └── app/
│           └── page.tsx             # Single-page dashboard UI
├── backend/
│   └── express/                     # Express API server
│       ├── prisma/
│       │   └── schema.prisma        # Transaction model
│       ├── src/
│       │   ├── server.js            # Entry point + export route
│       │   ├── routes/
│       │   │   └── index.js
│       │   ├── controllers/
│       │   │   ├── uploadController.js
│       │   │   ├── transactionsController.js
│       │   │   └── insightsController.js
│       │   ├── services/
│       │   │   ├── geminiService.js       # Gemini AI integration
│       │   │   ├── transactionService.js  # Prisma DB queries
│       │   │   ├── csvParser.js           # CSV normalization
│       │   │   └── prisma.js              # Prisma client singleton
│       │   └── middleware/
│       │       ├── upload.js        # Multer file handling
│       │       ├── validation.js    # Request validation
│       │       └── errorHandler.js  # Centralized error handling
│       ├── sample-expenses.csv      # 25 sample corporate transactions
│       ├── API.md                   # Full API reference
│       └── DATABASE.md             # Database setup guide
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A PostgreSQL database — [Supabase](https://supabase.com) free tier works
- A [Google AI Studio](https://aistudio.google.com) API key (optional — app works without it using fallbacks)

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd helix-ai-finance-console
```

### 2. Set up the backend

```bash
cd backend/express
npm install
```

Create a `.env` file in `backend/express/`:

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres?schema=public&sslmode=require"
GEMINI_API_KEY="your_gemini_api_key_here"
```

Push the schema to your database:

```bash
npx prisma generate
npx prisma db push
```

Start the backend:

```bash
npm run dev
```

The API runs at `http://localhost:4000`.

### 3. Set up the frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:3000`.

> By default the frontend calls `http://localhost:4000`. To use a different API URL, create `frontend/.env.local` with:
> ```env
> NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.com
> ```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/upload` | Upload CSV file — parse, categorize, detect anomalies, save to DB |
| `GET` | `/api/transactions` | Fetch transactions with filters and pagination |
| `GET` | `/api/insights` | AI-generated insights and recommendations from real data |
| `GET` | `/api/export` | Download all transactions as a CSV file |

See [`backend/express/API.md`](backend/express/API.md) for full request/response documentation.

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `GEMINI_API_KEY` | No | — | Google Gemini API key for AI features |
| `GEMINI_MODEL` | No | `gemini-2.5-flash-lite` | Gemini model to use |
| `PORT` | No | `4000` | API server port |

---

## How It Works

```
CSV Upload
  → multer receives file in memory
  → csvParser normalizes rows (handles column name variations)
  → Gemini categorizeBatch() assigns aiCategory + confidence to all transactions
  → Gemini detectAnomalies() flags suspicious transactions
      (fallback: flag transactions > 3x batch average if Gemini unavailable)
  → createTransactionsBulk() saves everything to PostgreSQL

GET /api/transactions
  → Prisma queries DB with optional filters
  → Returns transactions + category breakdown + monthly spending totals

GET /api/insights (lazy — only loads when user opens the panel)
  → Fetches up to 200 transactions from DB
  → Builds summary (total spend, category breakdown, monthly trend)
  → Gemini generateInsights() returns insights, recommendations, trends
      (fallback: computed insights from DB data if Gemini unavailable)

GET /api/export
  → Fetches up to 1000 transactions from DB
  → Streams back as text/csv download
```

---

## Sample Data

A sample CSV is included at `backend/express/sample-expenses.csv` with 25 realistic corporate transactions (no Category column — demonstrating that AI categorization works without pre-labeled data).

Made by : Aditya Rawat 
