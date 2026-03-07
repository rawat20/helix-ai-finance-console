import { getTransactions, getTransactionStats } from "../services/transactionService.js";

/**
 * GET /analytics
 * Returns detailed analytics computed directly from Supabase DB
 */
export const getAnalytics = async (req, res, next) => {
  try {
    const { period = "90d" } = req.query;

    // Compute date range from period param
    const endDate = new Date();
    const startDate = new Date();
    const days = parseInt(period) || 90;
    startDate.setDate(endDate.getDate() - days);

    const filters = {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      limit: 1000,
    };

    const [transactions, stats] = await Promise.all([
      getTransactions(filters),
      getTransactionStats(filters),
    ]);

    // Category breakdown
    const categoryMap = new Map();
    transactions.forEach((t) => {
      const cat = t.aiCategory || t.category || "Uncategorized";
      const current = categoryMap.get(cat) || { total: 0, count: 0 };
      categoryMap.set(cat, {
        total: current.total + Number(t.amount),
        count: current.count + 1,
      });
    });

    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        total: Number(data.total.toFixed(2)),
        count: data.count,
        avg: Number((data.total / data.count).toFixed(2)),
      }))
      .sort((a, b) => b.total - a.total);

    // Monthly time series
    const monthlyMap = new Map();
    transactions.forEach((t) => {
      const key = new Date(t.date).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      const current = monthlyMap.get(key) || { value: 0, count: 0 };
      monthlyMap.set(key, {
        value: current.value + Number(t.amount),
        count: current.count + 1,
      });
    });

    const timeSeries = Array.from(monthlyMap.entries())
      .map(([period, data]) => ({
        period,
        value: Number(data.value.toFixed(2)),
        count: data.count,
      }))
      .sort((a, b) => new Date(a.period) - new Date(b.period));

    // Top merchants
    const merchantMap = new Map();
    transactions.forEach((t) => {
      const current = merchantMap.get(t.merchant) || { total: 0, count: 0 };
      merchantMap.set(t.merchant, {
        total: current.total + Number(t.amount),
        count: current.count + 1,
      });
    });

    const topMerchants = Array.from(merchantMap.entries())
      .map(([merchant, data]) => ({
        merchant,
        total: Number(data.total.toFixed(2)),
        count: data.count,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalSpend: Number(stats.totalAmount) || 0,
          totalTransactions: stats.total || 0,
          avgTicket: Number(stats.averageAmount?.toFixed(2)) || 0,
          flaggedCount: stats.anomalyCount || 0,
          period,
        },
        timeSeries,
        categoryBreakdown,
        topMerchants,
        period,
        source: "database",
      },
    });
  } catch (error) {
    next(error);
  }
};
