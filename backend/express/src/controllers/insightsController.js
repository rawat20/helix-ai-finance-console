import { generateInsights } from "../services/geminiService.js";
import { getTransactions, getTransactionStats } from "../services/transactionService.js";

/**
 * GET /insights
 * Queries real transactions from DB, passes summary to Gemini, returns AI-generated insights
 */
export const getInsights = async (req, res, next) => {
  try {
    const { startDate, endDate, category } = req.query;

    const filters = { userId: req.userId };
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (category) filters.category = category;

    // Fetch real data from DB
    const [transactions, stats] = await Promise.all([
      getTransactions({ ...filters, limit: 200 }),
      getTransactionStats(filters),
    ]);

    // Build category breakdown
    const categoryMap = new Map();
    transactions.forEach((t) => {
      const cat = t.aiCategory || t.category || "Uncategorized";
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + Number(t.amount));
    });
    const categories = Array.from(categoryMap.entries())
      .map(([label, value]) => ({ label, value: Number(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value);

    // Build monthly spending trend
    const monthlyMap = new Map();
    transactions.forEach((t) => {
      const key = new Date(t.date).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      monthlyMap.set(key, (monthlyMap.get(key) || 0) + Number(t.amount));
    });
    const monthlySpending = Array.from(monthlyMap.entries())
      .map(([label, value]) => ({ label, value: Number(value.toFixed(2)) }))
      .sort((a, b) => new Date(a.label) - new Date(b.label));

    const summary = {
      totalSpend: Number(stats.totalAmount) || 0,
      totalTransactions: stats.total || 0,
      avgTicket: Number(stats.averageAmount) || 0,
      flaggedCount: stats.anomalyCount || 0,
      categories,
      monthlySpending,
    };

    // If no data yet, return empty state
    if (summary.totalTransactions === 0) {
      return res.status(200).json({
        success: true,
        data: {
          insights: [],
          recommendations: ["Upload a CSV file to start generating AI insights from your expense data."],
          trends: [],
          period: { startDate: startDate || null, endDate: endDate || null, category: category || null },
        },
      });
    }

    try {
      const aiResult = await generateInsights(summary);

      return res.status(200).json({
        success: true,
        data: {
          insights: aiResult.insights || [],
          recommendations: aiResult.recommendations || [],
          trends: aiResult.trends || [],
          period: { startDate: startDate || null, endDate: endDate || null, category: category || null },
          source: "gemini",
        },
      });
    } catch (aiError) {
      console.warn("Gemini insights failed, using computed fallback:", aiError.message);

      // Computed fallback from real DB data (no hardcoded values)
      const topCategory = categories[0];
      const flaggedRate = summary.totalTransactions > 0
        ? ((summary.flaggedCount / summary.totalTransactions) * 100).toFixed(1)
        : 0;

      return res.status(200).json({
        success: true,
        data: {
          insights: [
            {
              type: "spending_pattern",
              title: `Total spend: $${summary.totalSpend.toLocaleString()}`,
              description: `You have ${summary.totalTransactions} transactions with an average ticket of $${summary.avgTicket?.toFixed(2)}.`,
              severity: "info",
            },
            topCategory
              ? {
                  type: "category_alert",
                  title: `Top category: ${topCategory.label}`,
                  description: `${topCategory.label} accounts for $${topCategory.value.toLocaleString()} of your total spend.`,
                  severity: "info",
                }
              : null,
            summary.flaggedCount > 0
              ? {
                  type: "anomaly",
                  title: `${summary.flaggedCount} flagged transaction${summary.flaggedCount > 1 ? "s" : ""}`,
                  description: `${flaggedRate}% of transactions were flagged as anomalous. Review them in the transactions table.`,
                  severity: "warning",
                }
              : null,
          ].filter(Boolean),
          recommendations: [
            "Review flagged transactions for potential fraud",
            `Monitor your top spending category: ${topCategory?.label || "N/A"}`,
            "Set monthly budget limits per category",
          ],
          trends: monthlySpending.slice(-2).map((m, i, arr) => ({
            metric: m.label,
            change: i > 0 ? `${(((m.value - arr[i - 1].value) / arr[i - 1].value) * 100).toFixed(1)}%` : "—",
            period: "MoM",
          })),
          period: { startDate: startDate || null, endDate: endDate || null, category: category || null },
          source: "computed",
        },
      });
    }
  } catch (error) {
    next(error);
  }
};
