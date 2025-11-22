import axios from "axios";

const PY_SERVICE_URL = process.env.PY_SERVICE_URL || "http://127.0.0.1:8000";

/**
 * GET /analytics
 * Returns detailed analytics and aggregated data
 */
export const getAnalytics = async (req, res, next) => {
  try {
    const { period = "90d", groupBy = "month" } = req.query;

    try {
      const { data } = await axios.get(`${PY_SERVICE_URL}/analytics`, {
        params: { period, groupBy },
        timeout: 5000,
      });

      return res.status(200).json({
        success: true,
        data: {
          summary: data.summary || {},
          timeSeries: data.timeSeries || [],
          categoryBreakdown: data.categoryBreakdown || [],
          topMerchants: data.topMerchants || [],
          period: period,
          groupBy: groupBy,
        },
      });
    } catch (pyError) {
      // Fallback analytics
      console.warn("Python service unavailable, using fallback:", pyError.message);

      const fallbackTimeSeries = [
        { period: "Jul 2024", value: 17200, count: 45 },
        { period: "Aug 2024", value: 18100, count: 52 },
        { period: "Sep 2024", value: 19040, count: 48 },
        { period: "Oct 2024", value: 20110, count: 55 },
        { period: "Nov 2024", value: 21450, count: 61 },
        { period: "Dec 2024", value: 22600, count: 58 },
      ];

      const fallbackCategories = [
        { category: "Operations", total: 19800, count: 120, avg: 165.0 },
        { category: "R&D", total: 14680, count: 85, avg: 172.7 },
        { category: "Travel", total: 11620, count: 42, avg: 277.1 },
        { category: "Meals", total: 6732, count: 95, avg: 70.9 },
        { category: "Wellness", total: 4284, count: 28, avg: 152.9 },
        { category: "Other", total: 4664, count: 38, avg: 122.7 },
      ];

      const fallbackTopMerchants = [
        { merchant: "Nimbus Cloud AI", total: 12843.74, count: 2 },
        { merchant: "BlueBird Air", total: 3868.68, count: 3 },
        { merchant: "Midtown Grocer", total: 2411.15, count: 5 },
        { merchant: "Urban Cowork", total: 1920.0, count: 4 },
        { merchant: "Golden Bean Cafe", total: 1420.5, count: 12 },
      ];

      return res.status(200).json({
        success: true,
        data: {
          summary: {
            totalSpend: 61200,
            totalTransactions: 408,
            avgTicket: 150.0,
            flaggedCount: 12,
            period: period,
          },
          timeSeries: fallbackTimeSeries,
          categoryBreakdown: fallbackCategories,
          topMerchants: fallbackTopMerchants,
          period: period,
          groupBy: groupBy,
          note: "Fallback analytics (AI service unavailable)",
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

