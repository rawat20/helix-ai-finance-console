/** Summary block returned inside /api/transactions response. */
export type ExpenseSummary = {
  totalSpend: number;
  flaggedCount: number;
  avgTicket: number;
};

/** A single { label, value } point for the pie chart (category breakdown). */
export type CategoryPoint = {
  label: string;
  value: number;
};

/** A single { label, value } point for the line chart (monthly spending). */
export type MonthlyPoint = {
  label: string;
  value: number;
};

/** Full shape of one transaction row as returned by the backend. */
export type Transaction = {
  id: string;
  merchant: string;
  category: string;
  amount: number;
  date: string;
  anomaly: boolean;
  confidence: number;
  note?: string;
};

/** Top-level API response envelope from /api/transactions. */
export type ExpenseResponse = {
  summary: ExpenseSummary;
  categories: CategoryPoint[];
  monthlySpending: MonthlyPoint[];
  transactions: Transaction[];
  source?: string;
};

/** A single AI-generated insight card returned by /api/insights. */
export type InsightItem = {
  type: string;
  title: string;
  description: string;
  severity: "info" | "warning";
};

/** Full response from /api/insights — modal uses insights + recommendations only. */
export type InsightsData = {
  insights: InsightItem[];
  recommendations: string[];
  trends?: { metric: string; change: string; period: string }[];
};
