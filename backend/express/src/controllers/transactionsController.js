import {
  getTransactions,
  getTransactionStats,
} from "../services/transactionService.js";

/**
 * GET /api/transactions
 * Get transactions with optional filters, served directly from Supabase DB
 */
export const getTransactionsList = async (req, res, next) => {
  try {
    const {
      startDate,
      endDate,
      merchant,
      category,
      aiCategory,
      anomalyFlag,
      limit = "100",
      skip = "0",
    } = req.query;

    const filters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (merchant) filters.merchant = merchant;
    if (category) filters.category = category;
    if (aiCategory) filters.aiCategory = aiCategory;
    if (anomalyFlag !== undefined) filters.anomalyFlag = anomalyFlag === "true";
    filters.limit = parseInt(limit, 10);
    filters.skip = parseInt(skip, 10);

    const [transactions, stats] = await Promise.all([
      getTransactions(filters),
      getTransactionStats(filters),
    ]);

    // Category breakdown
    const categoryMap = new Map();
    transactions.forEach((t) => {
      const cat = t.aiCategory || t.category || "Uncategorized";
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + Number(t.amount));
    });

    const categories = Array.from(categoryMap.entries()).map(([label, value]) => ({
      label,
      value: Number(value),
    }));

    // Monthly spending
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

    return res.status(200).json({
      success: true,
      data: {
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
          description: t.description || "",
        })),
        source: "database",
      },
    });
  } catch (error) {
    next(error);
  }
};
