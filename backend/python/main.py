import random
import base64
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import FastAPI, Query
from pydantic import BaseModel


app = FastAPI(title="AI Expense Categorization Service", version="0.2.0")


class ExpenseSummary(BaseModel):
    totalSpend: float
    flaggedCount: int
    avgTicket: float


class CategoryBreakdown(BaseModel):
    label: str
    value: float


class MonthlySeriesPoint(BaseModel):
    label: str
    value: float


class Transaction(BaseModel):
    id: str
    merchant: str
    category: str
    amount: float
    date: str
    anomaly: bool
    confidence: float
    note: Optional[str] = None


class ExpenseResponse(BaseModel):
    summary: ExpenseSummary
    categories: List[CategoryBreakdown]
    monthlySpending: List[MonthlySeriesPoint]
    transactions: List[Transaction]


class FileUploadRequest(BaseModel):
    files: List[dict]


class FileUploadResponse(BaseModel):
    transactionsAdded: int
    anomaliesDetected: int
    processingTime: float


class CategorizeRequest(BaseModel):
    merchant: str
    amount: float
    date: Optional[str] = None
    description: Optional[str] = None


class CategorizeResponse(BaseModel):
    category: str
    confidence: float
    subcategory: Optional[str] = None
    tags: List[str] = []


class Insight(BaseModel):
    type: str
    title: str
    description: str
    severity: str


class Recommendation(BaseModel):
    text: str
    priority: str


class Trend(BaseModel):
    metric: str
    change: str
    period: str


class AnomalyDetail(BaseModel):
    id: str
    amount: float
    merchant: str
    date: str
    reason: str


class InsightsResponse(BaseModel):
    insights: List[Insight]
    recommendations: List[str]
    trends: List[Trend]
    anomalies: List[AnomalyDetail]


class AnalyticsSummary(BaseModel):
    totalSpend: float
    totalTransactions: int
    avgTicket: float
    flaggedCount: int
    period: str


class TimeSeriesPoint(BaseModel):
    period: str
    value: float
    count: int


class CategoryAnalytics(BaseModel):
    category: str
    total: float
    count: int
    avg: float


class MerchantAnalytics(BaseModel):
    merchant: str
    total: float
    count: int


class AnalyticsResponse(BaseModel):
    summary: AnalyticsSummary
    timeSeries: List[TimeSeriesPoint]
    categoryBreakdown: List[CategoryAnalytics]
    topMerchants: List[MerchantAnalytics]


MERCHANTS = [
    ("Midtown Grocer", "Groceries"),
    ("Nimbus Cloud AI", "Software"),
    ("BlueBird Air", "Travel"),
    ("MetroRide", "Transport"),
    ("Golden Bean Cafe", "Meals"),
    ("Urban Cowork", "Workspace"),
    ("Pulse Fitness", "Wellness"),
    ("Northwind Freight", "Logistics"),
]


def rolling_month_labels(months: int = 6) -> List[str]:
    today = datetime.utcnow().replace(day=1)
    labels: List[str] = []
    for diff in range(months):
        point = today - timedelta(days=diff * 30)
        labels.append(point.strftime("%b %Y"))
    return list(reversed(labels))


def generate_monthly_spend() -> List[MonthlySeriesPoint]:
    baseline = 18000
    labels = rolling_month_labels()
    series: List[MonthlySeriesPoint] = []
    for index, label in enumerate(labels):
        jitter = random.randint(-2500, 2500)
        drift = index * 450
        series.append(MonthlySeriesPoint(label=label, value=baseline + drift + jitter))
    return series


def generate_categories(total: float) -> List[CategoryBreakdown]:
    weights = [
        ("Operations", 0.32),
        ("R&D", 0.24),
        ("Travel", 0.18),
        ("Meals", 0.11),
        ("Wellness", 0.07),
        ("Other", 0.08),
    ]
    return [
        CategoryBreakdown(label=label, value=round(total * pct, 2))
        for label, pct in weights
    ]


def generate_transactions() -> List[Transaction]:
    transactions: List[Transaction] = []
    base_date = datetime.utcnow()
    for idx in range(12):
        merchant, category = random.choice(MERCHANTS)
        amount = round(random.uniform(40, 6400), 2)
        anomaly = amount > 4000 or random.random() < 0.15
        transactions.append(
            Transaction(
                id=f"txn_{idx + 1:04d}",
                merchant=merchant,
                category=category,
                amount=amount,
                date=(base_date - timedelta(days=idx * 2)).strftime("%Y-%m-%d"),
                anomaly=anomaly,
                confidence=round(random.uniform(0.78, 0.98), 2),
                note="Confidence dropped below threshold"
                if anomaly
                else None,
            )
        )
    return transactions


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "python"}


@app.get("/expenses", response_model=ExpenseResponse)
def get_expenses():
    monthly = generate_monthly_spend()
    total_spend = sum(point.value for point in monthly[-3:])
    transactions = generate_transactions()
    flagged = len([t for t in transactions if t.anomaly])
    summary = ExpenseSummary(
        totalSpend=round(total_spend, 2),
        flaggedCount=flagged,
        avgTicket=round(sum(t.amount for t in transactions) / len(transactions), 2),
    )
    return ExpenseResponse(
        summary=summary,
        categories=generate_categories(total_spend),
        monthlySpending=monthly,
        transactions=transactions,
    )


@app.post("/upload", response_model=FileUploadResponse)
def upload_files(request: FileUploadRequest):
    """Process uploaded expense files"""
    files_count = len(request.files)
    transactions_added = random.randint(10, 50) * files_count
    anomalies_detected = random.randint(0, 5) * files_count
    
    return FileUploadResponse(
        transactionsAdded=transactions_added,
        anomaliesDetected=anomalies_detected,
        processingTime=round(random.uniform(0.8, 2.5), 2),
    )


@app.post("/categorize", response_model=CategorizeResponse)
def categorize_transaction(request: CategorizeRequest):
    """Categorize a single transaction using AI"""
    merchant_lower = request.merchant.lower()
    
    category_map = {
        "groc": "Groceries",
        "food": "Meals",
        "market": "Groceries",
        "air": "Travel",
        "hotel": "Travel",
        "flight": "Travel",
        "cloud": "Software",
        "saas": "Software",
        "software": "Software",
        "restaurant": "Meals",
        "cafe": "Meals",
        "metro": "Transport",
        "bus": "Transport",
        "gym": "Wellness",
        "fitness": "Wellness",
        "medical": "Wellness",
    }
    
    detected_category = "Other"
    confidence = 0.65
    
    for keyword, category in category_map.items():
        if keyword in merchant_lower:
            detected_category = category
            confidence = round(random.uniform(0.78, 0.95), 2)
            break
    
    if request.amount > 5000:
        confidence = max(0.6, confidence - 0.1)
    
    tags = []
    if request.amount > 1000:
        tags.append("high-value")
    if "subscription" in merchant_lower:
        tags.append("recurring")
    
    return CategorizeResponse(
        category=detected_category,
        confidence=confidence,
        subcategory=None,
        tags=tags,
    )


@app.get("/insights", response_model=InsightsResponse)
def get_insights(
    startDate: Optional[str] = Query(None),
    endDate: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
):
    """Get AI-generated insights and recommendations"""
    insights = [
        Insight(
            type="spending_pattern",
            title="Spending increased 12% this month",
            description="Your spending has increased compared to last month. Consider reviewing recurring subscriptions.",
            severity="info",
        ),
        Insight(
            type="category_alert",
            title="High travel expenses detected",
            description=f"{category or 'Travel'} category accounts for 28% of total spending this period.",
            severity="warning",
        ),
        Insight(
            type="anomaly",
            title="Unusual transaction detected",
            description="A transaction of $6,421.87 was flagged as anomalous.",
            severity="error",
        ),
    ]
    
    recommendations = [
        "Review flagged transactions weekly",
        "Set up category-based spending limits",
        "Enable real-time anomaly alerts",
    ]
    
    trends = [
        Trend(metric="Total Spend", change="+12%", period="MoM"),
        Trend(metric="Average Ticket", change="+5%", period="MoM"),
        Trend(metric="Anomaly Rate", change="+2%", period="MoM"),
    ]
    
    anomalies = [
        AnomalyDetail(
            id="txn_0002",
            amount=6421.87,
            merchant="Nimbus Cloud AI",
            date="2024-12-04",
            reason="Spike beyond 30-day mean",
        ),
    ]
    
    return InsightsResponse(
        insights=insights,
        recommendations=recommendations,
        trends=trends,
        anomalies=anomalies,
    )


@app.get("/analytics", response_model=AnalyticsResponse)
def get_analytics(
    period: str = Query("90d", regex="^(7d|30d|90d|1y|all)$"),
    groupBy: str = Query("month", regex="^(day|week|month|category)$"),
):
    """Get detailed analytics and aggregated data"""
    monthly = generate_monthly_spend()
    total_spend = sum(point.value for point in monthly[-3:])
    transactions = generate_transactions()
    
    time_series = [
        TimeSeriesPoint(period=point.label, value=point.value, count=random.randint(40, 60))
        for point in monthly
    ]
    
    categories = generate_categories(total_spend)
    category_breakdown = [
        CategoryAnalytics(
            category=cat.label,
            total=cat.value,
            count=random.randint(20, 120),
            avg=round(cat.value / random.randint(20, 120), 2),
        )
        for cat in categories
    ]
    
    top_merchants = [
        MerchantAnalytics(merchant="Nimbus Cloud AI", total=12843.74, count=2),
        MerchantAnalytics(merchant="BlueBird Air", total=3868.68, count=3),
        MerchantAnalytics(merchant="Midtown Grocer", total=2411.15, count=5),
        MerchantAnalytics(merchant="Urban Cowork", total=1920.0, count=4),
        MerchantAnalytics(merchant="Golden Bean Cafe", total=1420.5, count=12),
    ]
    
    summary = AnalyticsSummary(
        totalSpend=round(total_spend, 2),
        totalTransactions=len(transactions) * 30,
        avgTicket=round(total_spend / (len(transactions) * 30), 2),
        flaggedCount=len([t for t in transactions if t.anomaly]) * 10,
        period=period,
    )
    
    return AnalyticsResponse(
        summary=summary,
        timeSeries=time_series,
        categoryBreakdown=category_breakdown,
        topMerchants=top_merchants,
    )

