# Quick Start Guide - Local Development

Follow these steps to run the full-stack application locally.

## Prerequisites

- **Node.js** (v18 or higher)
- **Python** (3.8 or higher)
- **PostgreSQL** (14 or higher) - [Download here](https://www.postgresql.org/download/)
- **npm** (comes with Node.js)

## Step 1: Set Up PostgreSQL Database

### Option A: Using Homebrew (macOS)
```bash
# Install PostgreSQL
brew install postgresql@14

# Start PostgreSQL service
brew services start postgresql@14

# Create database
createdb expense_tracker
```

### Option B: Using Docker
```bash
docker run --name postgres-expense -e POSTGRES_PASSWORD=password -e POSTGRES_DB=expense_tracker -p 5432:5432 -d postgres:14
```

### Option C: Download PostgreSQL
Download and install from [postgresql.org](https://www.postgresql.org/download/)

After installation, create the database:
```bash
psql -U postgres
CREATE DATABASE expense_tracker;
\q
```

## Step 2: Set Up Python Backend

```bash
# Navigate to Python backend
cd backend/python

# Create virtual environment
python3 -m venv .venv

# Activate virtual environment
# On macOS/Linux:
source .venv/bin/activate
# On Windows:
# .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start Python service (runs on port 8000)
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Keep this terminal open. The Python service should be running at `http://localhost:8000`

## Step 3: Set Up Express Backend

Open a **new terminal**:

```bash
# Navigate to Express backend
cd backend/express

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
DATABASE_URL="postgresql://postgres:password@localhost:5432/expense_tracker?schema=public"
PORT=4000
PY_SERVICE_URL=http://127.0.0.1:8000
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
EOF

# Edit .env file with your actual database credentials
# Replace 'postgres' and 'password' with your PostgreSQL username and password

# Generate Prisma Client
npm run db:generate

# Run database migrations
npm run db:migrate

# Start Express server (runs on port 4000)
npm run dev
```

Keep this terminal open. The Express API should be running at `http://localhost:4000`

**Note:** If you don't have an OpenAI API key, the categorization will fall back to rule-based logic.

## Step 4: Set Up Next.js Frontend

Open a **new terminal**:

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Create .env.local file
cat > .env.local << EOF
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
EOF

# Start Next.js dev server (runs on port 3000)
npm run dev
```

Keep this terminal open. The frontend should be running at `http://localhost:3000`

## Step 5: Test the Application

1. **Open your browser** and go to: `http://localhost:3000`

2. **Upload a CSV file:**
   - Click the upload area
   - Select a CSV file (you can use `backend/express/sample-expenses.csv` as a test file)
   - The file will be parsed and saved to the database
   - The dashboard should update with real data

3. **Verify the data:**
   - Check the summary cards (Total spend, Flagged transactions, Average ticket)
   - View the monthly spending line chart
   - Check the category pie chart
   - Review the transactions table

## Troubleshooting

### Database Connection Issues

If you get database connection errors:

1. **Check PostgreSQL is running:**
   ```bash
   # macOS/Linux
   brew services list
   # or
   pg_isready
   
   # Docker
   docker ps
   ```

2. **Verify DATABASE_URL in `.env`:**
   ```bash
   # Format: postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE
   # Example: postgresql://postgres:password@localhost:5432/expense_tracker
   ```

3. **Test connection:**
   ```bash
   psql -U postgres -d expense_tracker
   ```

### Python Service Not Starting

```bash
# Check if port 8000 is already in use
lsof -i :8000

# If needed, kill the process or use a different port
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
# Then update PY_SERVICE_URL in Express .env
```

### Express Backend Issues

```bash
# Check if Prisma Client is generated
npm run db:generate

# Reset database (WARNING: deletes all data)
npm run db:migrate reset

# View database in Prisma Studio
npm run db:studio
# Opens at http://localhost:5555
```

### Frontend Not Connecting

1. **Check API URL:**
   - Verify `NEXT_PUBLIC_API_BASE_URL` in `frontend/.env.local`
   - Should be `http://localhost:4000`

2. **Check browser console:**
   - Open DevTools (F12)
   - Look for CORS or connection errors

3. **Verify Express is running:**
   ```bash
   curl http://localhost:4000/api/health
   ```

## Sample CSV Format

Create a test CSV file with this format:

```csv
Date,Amount,Description,Merchant,Category
2024-12-04,482.23,Grocery shopping,Midtown Grocer,Groceries
2024-12-03,1289.56,Flight booking,BlueBird Air,Travel
2024-12-02,6421.87,Cloud service,Nimbus Cloud AI,Software
```

Save it and upload through the frontend!

## All Services Running

You should have **3 terminals** running:

1. **Terminal 1:** Python service (port 8000)
2. **Terminal 2:** Express backend (port 4000)
3. **Terminal 3:** Next.js frontend (port 3000)

## Quick Commands Reference

```bash
# Python Backend
cd backend/python
source .venv/bin/activate
uvicorn main:app --reload

# Express Backend
cd backend/express
npm run dev
npm run db:generate    # Generate Prisma Client
npm run db:migrate     # Run migrations
npm run db:studio      # Open Prisma Studio

# Frontend
cd frontend
npm run dev
```

## Next Steps

- Upload CSV files to see real data
- Test the categorization endpoint
- View insights and analytics
- Check Prisma Studio to see saved transactions

Happy testing! 🚀

