# Full-Stack Analytics Demo - live (https://helix-ai-finance-console-k46fbwnv8-adityas-projects-f913f7c9.vercel.app/)

# 🧠 Helix AI Finance Console  
**AI-powered Expense Analytics, Categorization & Anomaly Detection**

A full-stack financial insights platform that uses **LLMs, anomaly detection, and interactive dashboards** to help users understand their spending patterns.  
Built with **Next.js, Express, FastAPI, PostgreSQL, Prisma**, and powered by **OpenAI**.  
Developed using **agentic workflows with Cursor** for rapid prototyping and automation.

---

# 🚀 Features

### 🤖 AI Intelligence
- **LLM-powered auto-categorization** of expenses  
- **Anomaly detection** for unusual, duplicate, or suspicious transactions  
- **AI-generated insights** about spending patterns and financial behavior  
- Structured outputs using OpenAI for reliable analytics  

### 💻 Full-Stack System
- **CSV/Excel upload → normalized transactions → stored in PostgreSQL**
- **Interactive Next.js dashboard** (Tailwind + Recharts)
- **FastAPI microservice** for AI computations
- **Express API gateway** orchestrating ingestion, categorization, and insights
- **Prisma ORM** with schema-driven migrations
- Real-time charts, category breakdowns, anomaly review table

### 🛠 Prototyping + Agentic AI
- Developed using **Cursor** for agentic code generation  
- Modular architecture enabling rapid iteration  
- Clear separation of frontend, backend services, and data layer  

---

## Tech Stack

- Next.js 15 (App Router, TypeScript)
- Tailwind CSS for styling
- Recharts for data visualization
- Express + Axios for the API layer
- FastAPI + Uvicorn for the data service
- PostgreSQL + Prisma ORM for data persistence

## Project Structure

```
frontend/        # Next.js client
backend/
  ├─ express/    # Node gateway server
  └─ python/     # FastAPI service
```

## Quick Start

**New to the project?** See [QUICKSTART.md](./QUICKSTART.md) for detailed step-by-step instructions to run everything locally.

## Getting Started

### 1. Python service
```bash
cd backend/python
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Database Setup (PostgreSQL)
```bash
cd backend/express
# Create .env file with DATABASE_URL
cp .env.example .env  # Edit with your database credentials

# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate
```

### 3. Express gateway
```bash
cd backend/express
npm install
npm run dev
```
Environment variables:
- `DATABASE_URL` (required, PostgreSQL connection string)
- `PORT` (default 4000)
- `PY_SERVICE_URL` (default `http://127.0.0.1:8000`)
- `OPENAI_API_KEY` (required for AI categorization)
- `OPENAI_MODEL` (optional, defaults to `gpt-4o-mini`)

See `backend/express/DATABASE.md` for detailed database setup instructions.

### 4. Next.js frontend
```bash
cd frontend
cp .env.example .env.local   # update if needed
npm install
npm run dev
```
Key env var:
- `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:4000`)

Then visit http://localhost:3000.

## Notes
- The Express server gracefully falls back to static data if the Python service is unavailable.
- Charts refresh once per minute; adjust in `src/app/page.tsx`.
- Tailwind + Recharts are already wired up; tweak the UI via the same file or break components into their own directories.
