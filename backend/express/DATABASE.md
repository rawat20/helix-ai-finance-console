# Database Setup Guide

This project uses **PostgreSQL** with **Prisma ORM** for data persistence. Supabase is the recommended hosted PostgreSQL provider.

---

## Prisma Schema

The `Transaction` model stores all expense data:

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | UUID | Auto | Primary key |
| `date` | Date | Yes | Transaction date |
| `description` | String | No | Transaction description or memo |
| `amount` | Decimal(10,2) | Yes | Transaction amount (always positive) |
| `merchant` | String | Yes | Merchant or payee name |
| `category` | String | No | Original category from the uploaded CSV |
| `aiCategory` | String | No | AI-assigned category (Gemini) |
| `confidence` | Float | No | AI categorization confidence score (0.0–1.0) |
| `anomalyFlag` | Boolean | No | `true` if flagged as suspicious (default: `false`) |
| `reason` | String | No | Reason for anomaly flag |
| `createdAt` | DateTime | Auto | Record creation timestamp |
| `updatedAt` | DateTime | Auto | Record last updated timestamp |

**AI Category values:** `Travel`, `Meals`, `Software`, `Office`, `Utilities`, `R&D`, `Operations`, `Wellness`, `Other`

### Indexes

The schema includes indexes on:
- `date` — for time-based range queries
- `merchant` — for merchant search/lookup
- `category` — for category filtering
- `anomalyFlag` — for anomaly detection queries

---

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend/express
npm install
```

### 2. Configure Environment

Create a `.env` file in `backend/express/`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/expense_tracker?schema=public"
GEMINI_API_KEY="your_gemini_api_key_here"
GEMINI_MODEL="gemini-2.5-flash-lite"
PORT=4000
```

For a hosted Supabase database:

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres?schema=public&sslmode=require"
```

### 3. Generate Prisma Client

```bash
npm run db:generate
```

### 4. Push Schema to Database

For development (no migration history):
```bash
npm run db:push
```

For production (with migration history):
```bash
npm run db:migrate
```

### 5. (Optional) Open Prisma Studio

```bash
npm run db:studio
```

Opens a visual database browser at `http://localhost:5555`.

---

## Database Scripts

| Script | Command | Description |
|---|---|---|
| `db:generate` | `prisma generate` | Generates the Prisma Client from schema |
| `db:migrate` | `prisma migrate dev` | Creates and runs migrations (production-safe) |
| `db:push` | `prisma db push` | Pushes schema directly (dev only, no migration files) |
| `db:studio` | `prisma studio` | Opens visual DB browser |

---

## Usage in Code

All DB access goes through `transactionService.js`. Never import Prisma directly in controllers.

```javascript
import {
  createTransactionsBulk,
  getTransactions,
  getTransactionStats,
} from "./services/transactionService.js";

// Bulk insert after CSV upload (used in uploadController)
const result = await createTransactionsBulk([
  {
    date: "2024-12-04",
    amount: 482.23,
    merchant: "Midtown Grocer",
    description: "Grocery shopping",
    category: null,           // from CSV (may be null)
    aiCategory: "Meals",      // from Gemini
    aiConfidence: 0.91,
    anomalyFlag: false,
    reason: null,
  }
]);
// result.count = number of records inserted

// Fetch with filters (used in transactionsController and insightsController)
const transactions = await getTransactions({
  startDate: "2024-12-01",
  endDate: "2024-12-31",
  merchant: "aws",           // case-insensitive partial match
  anomalyFlag: true,
  limit: 100,
  skip: 0,
});

// Get aggregated stats (used alongside getTransactions)
const stats = await getTransactionStats({
  startDate: "2024-12-01",
  endDate: "2024-12-31",
});
// stats = { total, totalAmount, averageAmount, anomalyCount }
```

---

## Production Considerations

1. **Connection Pooling** — Use [Prisma Accelerate](https://www.prisma.io/data-platform/accelerate) or PgBouncer to avoid exhausting connections under load
2. **Migrations** — Use `db:migrate` (not `db:push`) in production to maintain a migration history
3. **Backups** — Set up regular automated backups on your Supabase project
4. **Environment Variables** — Store `DATABASE_URL` and `GEMINI_API_KEY` in a secrets manager, never commit `.env` to source control
5. **SSL** — Always use `sslmode=require` in the connection string for hosted databases
