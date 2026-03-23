# Helix AI Finance Console

An AI-powered corporate expense console that parses bank CSV exports, categorizes transactions with **Google Gemini**, detects anomalies, and serves a live dashboard backed by **PostgreSQL** (via Prisma).

---

## Screenshots

### Dashboard Overview
![Dashboard Overview](assets/dashboard.png)

### CSV Upload & Processing
![CSV Upload](assets/upload.png)

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, TypeScript, Tailwind CSS, Recharts, SWR |
| API | Node.js, Express 5 |
| Database | PostgreSQL + Prisma ORM |
| AI | Google Gemini (`GEMINI_MODEL`, default e.g. `gemini-2.5-flash-lite`) |

---

## Features

- **CSV upload** — Parse and normalize rows; optional Gemini batch categorization + anomaly detection; persist with `skipDuplicates`
- **Dashboard** — Totals, category pie chart, monthly trend, transaction table with anomaly badges
- **Insights** — `GET /api/insights` builds summaries from DB data and calls Gemini; **computed** fallback if Gemini fails (modal shows insight cards + recommendations; API may still return `trends` for other clients)
- **Export** — `GET /api/export` downloads up to **1000** rows as CSV (`date`, `merchant`, `category`, `amount`, `anomaly`, `note` — no internal row `id`)
- **Fallbacks** — Keyword categorization and statistical anomaly rules when Gemini is unavailable

---

## Project structure

```
helix-ai-finance-console/
├── frontend/
│   └── src/
│       ├── app/page.tsx                    # Route: composes dashboard (client)
│       ├── components/dashboard/         # UI sections + presentational components
│       ├── hooks/useExpenseDashboard.ts  # SWR, state, upload/export handlers
│       ├── lib/                          # api client, format, constants
│       └── types/expense.ts              # API response types
├── backend/express/
│   ├── prisma/schema.prisma      # Transaction model → table `transactions`
│   ├── src/
│   │   ├── server.js             # Express app, mounts /api
│   │   ├── routes/index.js       # upload, transactions, insights, export
│   │   ├── controllers/         # upload, transactions, insights, export
│   │   ├── services/            # geminiService, transactionService, csvParser, prisma
│   │   └── middleware/          # upload (multer), validation, errorHandler
│   ├── sample-expenses.csv
│   ├── API.md
│   └── DATABASE.md
└── README.md
```

---

## Getting started

### Prerequisites

- Node.js 18+
- PostgreSQL (local or [Supabase](https://supabase.com))
- Optional: [Google AI Studio](https://aistudio.google.com) API key for Gemini

### 1. Backend

```bash
cd backend/express
npm install
```

Create `backend/express/.env`:

```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres?schema=public&sslmode=require"
GEMINI_API_KEY="your_key"
GEMINI_MODEL="gemini-2.5-flash-lite"
PORT=4000
```

Apply schema and run:

```bash
npm run db:generate
npm run db:push
npm run dev
```

API: **http://localhost:4000** — routes: `POST /api/upload`, `GET /api/transactions`, `GET /api/insights`, `GET /api/export`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: **http://localhost:3000**

Optional `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

---

## API

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/upload` | Multipart CSV → parse → Gemini (optional) → DB |
| `GET` | `/api/transactions` | Filtered list + summary for charts |
| `GET` | `/api/insights` | Insights from DB + Gemini or computed fallback |
| `GET` | `/api/export` | CSV download |

Details: [`backend/express/API.md`](backend/express/API.md).

---

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `GEMINI_API_KEY` | No | — | Gemini API key |
| `GEMINI_MODEL` | No | (see `.env.example` / docs) | Model id |
| `PORT` | No | `4000` | Express port |

---

## How it works (high level)

```
POST /api/upload
  → multer (memory) accepts files
  → csvParser normalizes CSV rows
  → geminiService: categorizeBatch + detectAnomalies (with keyword / average fallbacks)
  → transactionService.createTransactionsBulk → PostgreSQL

GET /api/transactions
  → transactionService → summary + rows for UI

GET /api/insights
  → transactionService (sample + stats) → geminiService.generateInsights or computed fallback

GET /api/export
  → transactionService (limit 1000) → CSV response
```

---

## Sample data

`backend/express/sample-expenses.csv` — example corporate rows for testing upload.

---

Made by: Aditya Rawat
