# Database Setup Guide

This project uses **PostgreSQL** with **Prisma ORM**. [Supabase](https://supabase.com) or any Postgres host works.

---

## Prisma schema

The `Transaction` model maps to the SQL table **`transactions`** (`@@map("transactions")`).

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | UUID | Auto | Primary key |
| `date` | Date | Yes | Transaction date |
| `description` | String | No | Memo / description |
| `amount` | Decimal(10,2) | Yes | Amount (stored positive) |
| `merchant` | String | Yes | Merchant or payee |
| `category` | String | No | Category from CSV |
| `aiCategory` | String | No | AI-assigned category (Gemini batch) |
| `confidence` | Float | No | AI confidence **0.0–1.0** (from upload `aiConfidence`) |
| `anomalyFlag` | Boolean | No | Anomaly flag (default `false`) |
| `reason` | String | No | Anomaly / flag reason |
| `createdAt` | DateTime | Auto | Created at |
| `updatedAt` | DateTime | Auto | Updated at |

**Typical AI categories (enforced in app):** `Travel`, `Meals`, `Software`, `Office`, `Utilities`, `R&D`, `Operations`, `Wellness`, `Other`

### Indexes

- `date`, `merchant`, `category`, `anomalyFlag` — for filters and reporting

---

## Setup

### 1. Install dependencies

```bash
cd backend/express
npm install
```

### 2. Environment

Create `backend/express/.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/expense_tracker?schema=public"
GEMINI_API_KEY="your_gemini_api_key_here"
GEMINI_MODEL="gemini-2.5-flash-lite"
PORT=4000
```

Supabase example:

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres?schema=public&sslmode=require"
```

### 3. Generate Prisma Client

```bash
npm run db:generate
```

### 4. Apply schema

Development (quick, no migration history):

```bash
npm run db:push
```

Production (migrations):

```bash
npm run db:migrate
```

### 5. Browse data (optional)

```bash
npm run db:studio
```

Opens **http://localhost:5555** — view/edit rows in `transactions`.

---

## NPM scripts

| Script | Command | Description |
|---|---|---|
| `db:generate` | `prisma generate` | Regenerate Prisma Client |
| `db:migrate` | `prisma migrate dev` | Create/apply migrations |
| `db:push` | `prisma db push` | Push schema (dev) |
| `db:studio` | `prisma studio` | GUI for tables |

---

## Clear all transaction rows

To **delete every row** (keeps the table and schema):

**Option A — Prisma CLI (from `backend/express/` with `.env` loaded):**

```bash
cd backend/express
npx prisma db execute --schema prisma/schema.prisma --stdin <<'SQL'
DELETE FROM "transactions";
SQL
```

**Option B — SQL in any Postgres client:**

```sql
DELETE FROM "transactions";
```

**Option C — Prisma Studio:** open the `Transaction` model and delete records (fine for small tests; slow at scale).

To reset the table and **reset sequences** (if you add serial ids later), use raw SQL appropriate to your DB; UUID PKs do not need a sequence reset.

---

## Usage in code

Prefer **`transactionService.js`** for DB access; controllers should not instantiate Prisma directly.

```javascript
import {
  createTransactionsBulk,
  getTransactions,
  getTransactionStats,
} from "./services/transactionService.js";

// After CSV + AI enrichment (uploadController)
await createTransactionsBulk([
  {
    date: "2024-12-04",
    amount: 482.23,
    merchant: "Midtown Grocer",
    description: "Grocery",
    category: null,
    aiCategory: "Meals",
    aiConfidence: 0.91,
    anomalyFlag: false,
    reason: null,
  },
]);

const rows = await getTransactions({ limit: 100, skip: 0 });
const stats = await getTransactionStats({});
// stats: { total, totalAmount, averageAmount, anomalyCount }
```

---

## Production notes

1. **Pooling** — Use [Prisma Accelerate](https://www.prisma.io/data-platform/accelerate) or PgBouncer for serverless/high concurrency.
2. **Migrations** — Use `db:migrate` in production, not `db:push`.
3. **Backups** — Automated backups on your host (e.g. Supabase).
4. **Secrets** — Store `DATABASE_URL` and `GEMINI_API_KEY` in a secrets manager; never commit `.env`.
5. **SSL** — Use `sslmode=require` for hosted Postgres URLs.
