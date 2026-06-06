import { getTransactions } from "../services/transactionService.js";

/**
 * GET /export
 * Download all transactions as a CSV file
 */
export const exportCsv = async (req, res, next) => {
  try {
    const transactions = await getTransactions({ userId: req.userId, limit: 1000 });

    if (!transactions || transactions.length === 0) {
      return res.status(404).json({ success: false, error: "No exportable data available" });
    }

    const header = ["date", "merchant", "category", "amount", "anomaly", "note"];
    const lines = transactions.map((t) => {
      const date = t.date ? new Date(t.date).toISOString().split("T")[0] : "";
      const merchant = (t.merchant || "").replace(/"/g, '""');
      const category = (t.category || t.aiCategory || "").replace(/"/g, '""');
      const amount = Number(t.amount || 0).toFixed(2);
      const anomaly = t.anomalyFlag ? "true" : "false";
      const note = (t.reason || "").replace(/"/g, '""');
      return `"${date}","${merchant}","${category}","${amount}","${anomaly}","${note}"`;
    });

    const csv = `${header.join(",")}\n${lines.join("\n")}`;
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="helix_expense_report.csv"');
    return res.send(csv);
  } catch (err) {
    console.error("Export error:", err.message);
    next(err);
  }
};
