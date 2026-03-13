import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
const MAX_RETRIES = 3;

let cachedModel = null;

const getModel = () => {
  if (!GEMINI_API_KEY) {
    throw Object.assign(new Error("Missing GEMINI_API_KEY environment variable"), {
      code: "GEMINI_KEY_MISSING",
    });
  }
  if (!cachedModel) {
    cachedModel = new GoogleGenerativeAI(GEMINI_API_KEY).getGenerativeModel({ model: GEMINI_MODEL });
  }
  return cachedModel;
};

const parseJSON = (text) => {
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleaned);
};

// Retry with exponential backoff on 429 rate-limit errors
const generateWithRetry = async (prompt, retries = MAX_RETRIES) => {
  const model = getModel();
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      const isRateLimit = err.status === 429 || err.message?.includes("429");
      if (isRateLimit && attempt < retries) {
        const wait = attempt * 10000; // 10s, 20s, 30s
        console.warn(`Gemini rate limit hit, retrying in ${wait / 1000}s (attempt ${attempt}/${retries})`);
        await new Promise((r) => setTimeout(r, wait));
      } else {
        throw err;
      }
    }
  }
};

/**
 * Categorize a single transaction using Gemini.
 * Returns { category, confidence, reasoning }
 */
export const categorizeWithGemini = async ({ merchant, description, amount }) => {
  const prompt = `Classify this corporate expense. Return ONLY valid JSON.
Merchant: ${merchant} | Amount: $${amount} | Note: ${description ?? "n/a"}
{"category":"Travel|Meals|Software|Office|Utilities|R&D|Operations|Wellness|Other","confidence":0.0,"reasoning":"brief reason"}`;

  const text = await generateWithRetry(prompt);
  return parseJSON(text);
};

/**
 * Generate AI insights from real transaction data.
 * Returns { insights, recommendations, trends }
 */
export const generateInsights = async (summary) => {
  const topCats = summary.categories.slice(0, 5).map((c) => `${c.label}:$${c.value}`).join(", ");
  const monthTrend = summary.monthlySpending.slice(-3).map((m) => `${m.label}:$${m.value}`).join(", ");

  const prompt = `Analyze corporate expenses. Return ONLY valid JSON.
Spend:$${summary.totalSpend} Txns:${summary.totalTransactions} Avg:$${summary.avgTicket?.toFixed(0)} Flagged:${summary.flaggedCount}
TopCategories:${topCats} MonthlyTrend:${monthTrend}
{"insights":[{"type":"spending_pattern|category_alert|anomaly|trend","title":"short","description":"2 sentences","severity":"info|warning|error"}],"recommendations":["string"],"trends":[{"metric":"name","change":"+X%","period":"MoM"}]}
Give 3 insights, 3 recommendations, 2 trends.`;

  const text = await generateWithRetry(prompt);
  return parseJSON(text);
};

/**
 * Categorize a batch of transactions in one Gemini call.
 * Returns array of { index, category, confidence }
 */
export const categorizeBatch = async (transactions) => {
  if (!transactions || transactions.length === 0) return [];

  const list = transactions
    .map((t, i) => `${i}:${t.merchant}/$${t.amount}`)
    .join(", ");

  const prompt = `Categorize these corporate expenses. Return ONLY a valid JSON array.
Transactions (index:merchant/amount): ${list}
Categories: Travel, Meals, Software, Office, Utilities, R&D, Operations, Wellness, Other
[{"index":0,"category":"Travel","confidence":0.9}]`;

  const text = await generateWithRetry(prompt);
  return parseJSON(text);
};

/**
 * Detect anomalies in a batch of transactions using Gemini.
 * Returns array of { index, reason } for flagged transactions.
 */
export const detectAnomalies = async (transactions) => {
  if (!transactions || transactions.length === 0) return [];

  // Send only merchant, amount, date to minimise tokens
  const simplified = transactions.map((t, i) => `${i}:${t.merchant}/$${t.amount}/${t.date}`).join(", ");
  const avg = (transactions.reduce((s, t) => s + t.amount, 0) / transactions.length).toFixed(0);

  const prompt = `Flag anomalous corporate expenses. Batch avg:$${avg}. Return ONLY valid JSON array.
Transactions (index:merchant/amount/date): ${simplified}
Flag if amount>3x avg, suspicious merchant, or duplicate. Return [] if none.
[{"index":0,"reason":"brief"}]`;

  const text = await generateWithRetry(prompt);
  return parseJSON(text);
};
