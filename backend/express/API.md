# Express API Documentation

## Base URL

```
http://localhost:4000
```

---

## Routes

### POST /api/upload

Upload one or more CSV files for AI processing and storage.

**Request:**
- Content-Type: `multipart/form-data`
- Field name: `files` (array, max 5 files, 10MB each)
- Accepted formats: `.csv`, `.xlsx`, `.xls`, `.json`, `.txt`

**Response:**
```json
{
  "success": true,
  "message": "Successfully processed 1 file(s)",
  "data": {
    "filesProcessed": 1,
    "transactions": [...],
    "transactionsAdded": 25,
    "transactionsSaved": 25,
    "anomaliesDetected": 2,
    "errors": []
  }
}
```

**Notes:**
- CSV files are parsed and normalized automatically (handles common column name variations)
- Gemini AI runs batch categorization on all transactions (`aiCategory`, `aiConfidence`)
- Gemini AI runs anomaly detection — flags suspicious transactions (`anomalyFlag`, `reason`)
- If Gemini is unavailable, a rule-based fallback flags transactions exceeding 3x the batch average
- `skipDuplicates: true` — re-uploading the same file will not create duplicate records
- `transactionsSaved` may be less than `transactionsAdded` if duplicates were skipped

**Error responses:**
```json
{ "success": false, "error": "No file provided" }
{ "success": false, "error": "File too large", "message": "Maximum file size is 10MB" }
{ "success": false, "error": "Too many files", "message": "Maximum 5 files allowed per upload" }
```

---

### GET /api/transactions

Fetch transactions from the database with optional filters and pagination.

**Query Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `startDate` | ISO 8601 date | Filter transactions from this date |
| `endDate` | ISO 8601 date | Filter transactions up to this date |
| `merchant` | string | Case-insensitive partial match on merchant name |
| `category` | string | Exact match on original CSV category |
| `aiCategory` | string | Exact match on AI-assigned category |
| `anomalyFlag` | `"true"` or `"false"` | Filter flagged/normal transactions |
| `limit` | number | Max results to return (default: `100`) |
| `skip` | number | Records to skip for pagination (default: `0`) |

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalSpend": 14823.45,
      "flaggedCount": 2,
      "avgTicket": 593.74
    },
    "categories": [
      { "label": "Software", "value": 6761.87 },
      { "label": "Travel", "value": 2269.56 }
    ],
    "monthlySpending": [
      { "label": "Nov 2024", "value": 1500.55 },
      { "label": "Dec 2024", "value": 13322.90 }
    ],
    "transactions": [
      {
        "id": "uuid",
        "merchant": "AWS",
        "category": "Software",
        "amount": 340.60,
        "date": "2024-12-07",
        "anomaly": false,
        "confidence": 0.95,
        "note": null,
        "description": "Cloud compute instance"
      }
    ],
    "source": "database"
  }
}
```

---

### GET /api/insights

Get AI-generated insights, recommendations, and trends from real transaction data.

**Query Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `startDate` | ISO 8601 date | Filter data from this date |
| `endDate` | ISO 8601 date | Filter data up to this date |
| `category` | string | Filter by category (max 100 chars) |

**Response:**
```json
{
  "success": true,
  "data": {
    "insights": [
      {
        "type": "spending_pattern",
        "title": "Spending increased 12% this month",
        "description": "Cloud and software costs drove a notable spike in December.",
        "severity": "info"
      }
    ],
    "recommendations": [
      "Review flagged transactions for potential fraud",
      "Set monthly budget limits per category"
    ],
    "trends": [
      {
        "metric": "Dec 2024",
        "change": "+12%",
        "period": "MoM"
      }
    ],
    "period": {
      "startDate": null,
      "endDate": null,
      "category": null
    },
    "source": "gemini"
  }
}
```

**Notes:**
- `source` is `"gemini"` when AI generates the response, `"computed"` when falling back to rule-based insights
- Returns an empty state with an upload hint if no transactions exist in the database
- Insight `severity` values: `"info"`, `"warning"`, `"error"`
- Insight `type` values: `"spending_pattern"`, `"category_alert"`, `"anomaly"`, `"trend"`

**Validation:**
- `startDate` / `endDate`: Optional, must be ISO 8601 format
- `category`: Optional, max 100 characters

---

### GET /api/export

Download all transactions as a CSV file.

**Response:**
- Content-Type: `text/csv`
- Content-Disposition: `attachment; filename="helix_expense_report.csv"`

**CSV columns:** `id`, `date`, `merchant`, `category`, `amount`, `anomaly`, `note`

**Notes:**
- Returns up to 1000 transactions
- `category` uses `aiCategory` as fallback if original category is null
- Returns 404 JSON if no transactions exist

---

## Error Handling

All routes return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": []
}
```

**Status Codes:**

| Code | Meaning |
|---|---|
| `200` | Success |
| `400` | Bad request (validation error, invalid file type/size) |
| `404` | Route not found or no data available |
| `500` | Internal server error |

In development (`NODE_ENV=development`), error responses also include a `stack` field with the full stack trace.

---

## Architecture

```
src/
├── server.js           # Express app entry point, export route
├── routes/
│   └── index.js        # Route definitions
├── controllers/
│   ├── uploadController.js
│   ├── transactionsController.js
│   └── insightsController.js
├── services/
│   ├── geminiService.js       # Google Gemini AI integration
│   ├── transactionService.js  # Prisma DB queries
│   ├── csvParser.js           # CSV parsing and normalization
│   └── prisma.js              # Prisma client singleton
└── middleware/
    ├── upload.js        # Multer file upload config
    ├── validation.js    # express-validator rules
    └── errorHandler.js  # Centralized error handling
```

**AI Provider:** Google Gemini (configured via `GEMINI_API_KEY` and `GEMINI_MODEL` env vars)

**Features:**
- Input validation with `express-validator`
- File upload handling with `multer` (memory storage, no disk writes)
- Centralized error handling with typed error responses
- Graceful fallbacks when Gemini is unavailable
- Batch AI processing (single Gemini call per upload, not per transaction)
