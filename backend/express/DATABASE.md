# Database Setup Guide

This project uses **PostgreSQL** with **Prisma ORM** for data persistence.

## Prisma Schema

The `Transaction` model includes the following fields:

- `id` (UUID, primary key)
- `date` (Date)
- `description` (String, optional)
- `amount` (Decimal)
- `merchant` (String)
- `category` (String, optional)
- `aiCategory` (String, optional) - AI-generated category
- `anomalyFlag` (Boolean, default: false)
- `reason` (String, optional) - Reasoning for anomaly flag or categorization
- `createdAt` (DateTime, auto-generated)
- `updatedAt` (DateTime, auto-updated)

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend/express
npm install
```

### 2. Configure Database

Create a `.env` file in `backend/express/`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/expense_tracker?schema=public"
```

Or use a cloud database:

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public&sslmode=require"
```

### 3. Generate Prisma Client

```bash
npm run db:generate
```

### 4. Run Migrations

```bash
npm run db:migrate
```

This will:
- Create the database if it doesn't exist
- Create the `transactions` table
- Set up indexes for performance

### 5. (Optional) Open Prisma Studio

```bash
npm run db:studio
```

This opens a visual database browser at http://localhost:5555

## Database Scripts

- `npm run db:generate` - Generate Prisma Client
- `npm run db:migrate` - Create and run migrations
- `npm run db:push` - Push schema changes without migrations (dev only)
- `npm run db:studio` - Open Prisma Studio

## Usage in Code

```javascript
import prisma from "./services/prisma.js";
import { createTransaction, getTransactions } from "./services/transactionService.js";

// Create a transaction
const transaction = await createTransaction({
  date: "2024-12-04",
  amount: 482.23,
  merchant: "Midtown Grocer",
  description: "Grocery shopping",
  category: "Groceries",
  aiCategory: "Groceries",
  anomalyFlag: false,
});

// Get transactions
const transactions = await getTransactions({
  startDate: "2024-12-01",
  endDate: "2024-12-31",
  anomalyFlag: true,
});
```

## Indexes

The schema includes indexes on:
- `date` - For time-based queries
- `merchant` - For merchant lookups
- `category` - For category filtering
- `anomalyFlag` - For anomaly detection queries

## Production Considerations

1. **Connection Pooling**: Use Prisma Accelerate or PgBouncer for connection pooling
2. **Backups**: Set up regular database backups
3. **Migrations**: Always test migrations in staging before production
4. **Environment Variables**: Use secure secret management for DATABASE_URL

