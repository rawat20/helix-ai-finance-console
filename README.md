# Helix AI Finance Console

An AI-powered expense management console that parses bank statements, categorizes transactions, detects anomalies, and generates insights — all backed by a real database.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, Tailwind CSS, Recharts, SWR |
| Backend | Node.js, Express.js |
| Database | PostgreSQL via Supabase + Prisma ORM |
| AI | Google Gemini 2.0 Flash (with rule-based fallback) |

## Features

- **CSV Upload** — Upload bank export files; transactions are parsed and saved to Supabase instantly
- **AI Categorization** — Gemini classifies each expense (Travel, Meals, Software, etc.) with confidence score
- **Anomaly Detection** — Gemini flags suspicious or unusual transactions on upload
- **AI Insights** — Real-time insights and recommendations generated from your actual expense data
- **Analytics Dashboard** — Monthly spending trends, category breakdown, top merchants
- **CSV Export** — Download all transactions as a CSV report
- **Graceful Fallbacks** — Rule-based categorization and computed insights work without an AI key

## Project Structure

```
helix-ai-finance-console/
├── frontend/                  # Next.js app
│   └── src/
│       ├── app/
│       │   └── page.tsx       # Main dashboard UI
│       └── utils/
│           └── useCSVParser.js
├── backend/
│   └── express/               # Express API server
│       ├── prisma/
│       │   └── schema.prisma  # DB schema (Transaction model)
│       ├── src/
│       │   ├── server.js      # Entry point
│       │   ├── routes/
│       │   ├── controllers/
│       │   │   ├── uploadController.js
│       │   │   ├── transactionsController.js
│       │   │   ├── analyticsController.js
│       │   │   ├── insightsController.js
│       │   │   └── categorizeController.js
│       │   └── services/
│       │       ├── geminiService.js      # Gemini AI integration
│       │       ├── categorizationService.js
│       │       ├── transactionService.js # Prisma DB queries
│       │       ├── csvParser.js
│       │       └── prisma.js
│       └── sample-expenses.csv
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)
- A [Google AI Studio](https://aistudio.google.com) API key (optional — app works without it)

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

Create a `.env` file:

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres"
GEMINI_API_KEY="your_gemini_api_key_here"
```

Push the database schema to Supabase:

```bash
npx prisma generate
npx prisma db push
```

Start the backend:

```bash
npm start
```

The API runs at `http://localhost:4000`.

### 3. Set up the frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:3000`.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/upload` | Upload CSV file, parse and save transactions |
| `GET` | `/api/transactions` | Fetch all transactions with filters |
| `GET` | `/api/analytics` | Aggregated analytics from DB |
| `GET` | `/api/insights` | AI-generated insights from real data |
| `POST` | `/api/categorize` | Categorize a single transaction |
| `GET` | `/api/export` | Download all transactions as CSV |
| `GET` | `/api/health` | Health check |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Supabase PostgreSQL connection string |
| `GEMINI_API_KEY` | No | Google Gemini API key for AI features |
| `GEMINI_MODEL` | No | Gemini model name (default: `gemini-2.0-flash`) |
| `PORT` | No | Server port (default: `4000`) |

## How It Works

```
CSV Upload → Express parses → Gemini anomaly detection → Supabase DB
                                      ↓ (if key missing)
                                Rule-based fallback

GET /api/transactions → Supabase DB (always live)
GET /api/insights     → DB data → Gemini AI → real insights
POST /api/categorize  → Gemini AI → category + confidence
```

## Sample Data

A sample CSV file is included at `backend/express/sample-expenses.csv` with 25 realistic corporate transactions for testing.
