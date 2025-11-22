"use strict";

import "dotenv/config";
import express from "express";
import cors from "cors";
import axios from "axios";
import routes from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 4000;
const PY_SERVICE_URL =
  process.env.PY_SERVICE_URL || "http://127.0.0.1:8000";

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Legacy routes (kept for backward compatibility)
const fallbackExpenses = {
  summary: {
    totalSpend: 61200,
    flaggedCount: 3,
    avgTicket: 421.4,
  },
  categories: [
    { label: "Operations", value: 19800 },
    { label: "R&D", value: 14680 },
    { label: "Travel", value: 11620 },
    { label: "Meals", value: 6732 },
    { label: "Wellness", value: 4284 },
    { label: "Other", value: 4664 },
  ],
  monthlySpending: [
    { label: "Jul 2024", value: 17200 },
    { label: "Aug 2024", value: 18100 },
    { label: "Sep 2024", value: 19040 },
    { label: "Oct 2024", value: 20110 },
    { label: "Nov 2024", value: 21450 },
    { label: "Dec 2024", value: 22600 },
  ],
  transactions: [
    {
      id: "txn_0001",
      merchant: "Midtown Grocer",
      category: "Operations",
      amount: 482.23,
      date: "2024-12-04",
      anomaly: false,
      confidence: 0.93,
    },
    {
      id: "txn_0002",
      merchant: "Nimbus Cloud AI",
      category: "R&D",
      amount: 6421.87,
      date: "2024-12-04",
      anomaly: true,
      confidence: 0.81,
      note: "Spike beyond 30-day mean",
    },
    {
      id: "txn_0003",
      merchant: "BlueBird Air",
      category: "Travel",
      amount: 1289.56,
      date: "2024-12-03",
      anomaly: false,
      confidence: 0.9,
    },
  ],
  source: "fallback",
};

app.get("/api/health", async (_req, res) => {
  try {
    const { data } = await axios.get(`${PY_SERVICE_URL}/health`, {
      timeout: 2000,
    });
    return res.json({ status: "ok", python: data });
  } catch (error) {
    return res.json({ status: "degraded", python: "offline" });
  }
});

app.get("/api/expenses", async (_req, res) => {
  try {
    // Try to get from database first
    try {
      const { getTransactions, getTransactionStats } = await import(
        "./services/transactionService.js"
      );
      const transactions = await getTransactions({ limit: 100 });
      const stats = await getTransactionStats();

      if (transactions.length > 0) {
        // Calculate category breakdown
        const categoryMap = new Map();
        transactions.forEach((t) => {
          const cat = t.aiCategory || t.category || "Uncategorized";
          const current = categoryMap.get(cat) || 0;
          categoryMap.set(cat, current + Number(t.amount));
        });

        const categories = Array.from(categoryMap.entries()).map(([label, value]) => ({
          label,
          value: Number(value),
        }));

        // Calculate monthly spending
        const monthlyMap = new Map();
        transactions.forEach((t) => {
          const date = new Date(t.date);
          const monthKey = date.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          });
          const current = monthlyMap.get(monthKey) || 0;
          monthlyMap.set(monthKey, current + Number(t.amount));
        });

        const monthlySpending = Array.from(monthlyMap.entries())
          .map(([label, value]) => ({ label, value: Number(value) }))
          .sort((a, b) => {
            const dateA = new Date(a.label);
            const dateB = new Date(b.label);
            return dateA.getTime() - dateB.getTime();
          });

        return res.json({
          summary: {
            totalSpend: Number(stats.totalAmount),
            flaggedCount: stats.anomalyCount,
            avgTicket: stats.averageAmount,
          },
          categories,
          monthlySpending,
          transactions: transactions.map((t) => ({
            id: t.id,
            merchant: t.merchant,
            category: t.category || t.aiCategory || "Uncategorized",
            amount: Number(t.amount),
            date: t.date.toISOString().split("T")[0],
            anomaly: t.anomalyFlag,
            confidence: 0.85,
            note: t.reason || null,
          })),
          source: "database",
        });
      }
    } catch (dbError) {
      console.warn("Database not available, trying Python service:", dbError.message);
    }

    // Fallback to Python service
    try {
      const { data } = await axios.get(`${PY_SERVICE_URL}/expenses`, {
        timeout: 2000,
      });
      return res.json({ ...data, source: "python-service" });
    } catch (error) {
      console.error("Falling back to static expenses:", error.message);
      return res.json(fallbackExpenses);
    }
  } catch (error) {
    console.error("Error in /api/expenses:", error.message);
    return res.json(fallbackExpenses);
  }
});

// New modular routes
app.use("/api", routes);

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Express API running on http://localhost:${PORT}`);
  console.log(`Available routes:`);
  console.log(`  POST /api/upload`);
  console.log(`  POST /api/categorize`);
  console.log(`  GET  /api/insights`);
  console.log(`  GET  /api/analytics`);
  console.log(`  GET  /api/health (legacy)`);
  console.log(`  GET  /api/expenses (legacy)`);
});
