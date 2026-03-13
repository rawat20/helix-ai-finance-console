"use strict";

import "dotenv/config";
import express from "express";
import cors from "cors";
import routes from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Legacy /api/expenses — served from DB
app.get("/api/expenses", async (_req, res) => {
  try {
    const { getTransactions, getTransactionStats } = await import(
      "./services/transactionService.js"
    );
    const transactions = await getTransactions({ limit: 100 });
    const stats = await getTransactionStats();

    if (transactions.length === 0) {
      return res.json({
        summary: { totalSpend: 0, flaggedCount: 0, avgTicket: 0 },
        categories: [],
        monthlySpending: [],
        transactions: [],
        source: "database",
      });
    }

    const categoryMap = new Map();
    transactions.forEach((t) => {
      const cat = t.aiCategory || t.category || "Uncategorized";
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + Number(t.amount));
    });

    const categories = Array.from(categoryMap.entries()).map(([label, value]) => ({
      label,
      value: Number(value),
    }));

    const monthlyMap = new Map();
    transactions.forEach((t) => {
      const key = new Date(t.date).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      monthlyMap.set(key, (monthlyMap.get(key) || 0) + Number(t.amount));
    });

    const monthlySpending = Array.from(monthlyMap.entries())
      .map(([label, value]) => ({ label, value: Number(value) }))
      .sort((a, b) => new Date(a.label) - new Date(b.label));

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
  } catch (dbError) {
    console.error("Error in /api/expenses:", dbError.message);
    return res.status(503).json({ success: false, error: "Database unavailable" });
  }
});

// CSV export route
app.get("/api/export", async (_req, res) => {
  try {
    const { getTransactions } = await import("./services/transactionService.js");
    const transactions = await getTransactions({ limit: 1000 });

    if (!transactions || transactions.length === 0) {
      return res.status(404).json({ success: false, error: "No exportable data available" });
    }

    const header = ["id", "date", "merchant", "category", "amount", "anomaly", "note"];
    const lines = transactions.map((t) => {
      const date = t.date ? new Date(t.date).toISOString().split("T")[0] : "";
      const merchant = (t.merchant || "").replace(/"/g, '""');
      const category = (t.category || t.aiCategory || "").replace(/"/g, '""');
      const amount = Number(t.amount || 0).toFixed(2);
      const anomaly = t.anomalyFlag ? "true" : "false";
      const note = (t.reason || "").replace(/"/g, '""');
      return `"${t.id}","${date}","${merchant}","${category}","${amount}","${anomaly}","${note}"`;
    });

    const csv = `${header.join(",")}\n${lines.join("\n")}`;
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="helix_expense_report.csv"');
    return res.send(csv);
  } catch (err) {
    console.error("Export error:", err.message);
    return res.status(500).json({ success: false, error: "Export failed" });
  }
});

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Helix AI Finance API running on http://localhost:${PORT}`);
  console.log(`Available routes:`);
  console.log(`  POST /api/upload`);
  console.log(`  GET  /api/transactions`);
  console.log(`  GET  /api/insights`);
  console.log(`  GET  /api/export`);
});
