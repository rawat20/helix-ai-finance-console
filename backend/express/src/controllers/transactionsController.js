import { getTransactions, getTransactionStats } from "../services/transactionService.js";

/**
 * GET /api/transactions
 * Get transactions with optional filters
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

    const transactions = await getTransactions(filters);
    const stats = await getTransactionStats(filters);

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
      const monthKey = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
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
          confidence: 0.85, // Default confidence, can be enhanced
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

