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
