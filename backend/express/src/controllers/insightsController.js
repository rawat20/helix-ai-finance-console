import axios from "axios";

const PY_SERVICE_URL = process.env.PY_SERVICE_URL || "http://127.0.0.1:8000";

/**
 * GET /insights
 * Returns AI-generated insights and recommendations
 */
export const getInsights = async (req, res, next) => {
  try {
    const { startDate, endDate, category } = req.query;

    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append("startDate", startDate);
    if (endDate) queryParams.append("endDate", endDate);
    if (category) queryParams.append("category", category);

    try {
      const { data } = await axios.get(
        `${PY_SERVICE_URL}/insights?${queryParams.toString()}`,
        {
          timeout: 5000,
        }
      );

      return res.status(200).json({
        success: true,
        data: {
          insights: data.insights || [],
          recommendations: data.recommendations || [],
          trends: data.trends || [],
          anomalies: data.anomalies || [],
          period: {
            startDate: startDate || null,
            endDate: endDate || null,
            category: category || null,
          },
        },
      });
    } catch (pyError) {
      // Fallback insights
      console.warn("Python service unavailable, using fallback:", pyError.message);

      const fallbackInsights = [
        {
          type: "spending_pattern",
          title: "Spending increased 12% this month",
          description: "Your spending has increased compared to last month. Consider reviewing recurring subscriptions.",
          severity: "info",
        },
        {
          type: "category_alert",
          title: "High travel expenses detected",
          description: "Travel category accounts for 28% of total spending this period.",
          severity: "warning",
        },
        {
          type: "anomaly",
          title: "Unusual transaction detected",
          description: "A transaction of $6,421.87 was flagged as anomalous.",
          severity: "error",
        },
      ];

      return res.status(200).json({
        success: true,
        data: {
          insights: fallbackInsights,
          recommendations: [
            "Review flagged transactions weekly",
            "Set up category-based spending limits",
            "Enable real-time anomaly alerts",
          ],
          trends: [
            { metric: "Total Spend", change: "+12%", period: "MoM" },
            { metric: "Average Ticket", change: "+5%", period: "MoM" },
            { metric: "Anomaly Rate", change: "+2%", period: "MoM" },
          ],
          anomalies: [
            {
              id: "txn_0002",
              amount: 6421.87,
              merchant: "Nimbus Cloud AI",
              date: "2024-12-04",
              reason: "Spike beyond 30-day mean",
            },
          ],
          period: {
            startDate: startDate || null,
            endDate: endDate || null,
            category: category || null,
          },
          note: "Fallback insights (AI service unavailable)",
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

