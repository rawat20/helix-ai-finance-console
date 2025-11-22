# Express API Documentation

## Routes

### POST /api/upload

Upload expense files for AI processing.

**Request:**
- Content-Type: `multipart/form-data`
- Body: `files` (array of files, max 5 files, 10MB each)
- Accepted formats: CSV, Excel (.xlsx, .xls), JSON, TXT

**Response:**
```json
{
  "success": true,
  "message": "Successfully processed 2 file(s)",
  "data": {
    "filesProcessed": 2,
    "transactionsAdded": 45,
    "anomaliesDetected": 3,
    "processingTime": 1.2
  }
}
```

**Validation:**
- File size limit: 10MB per file
- Max files: 5 per request
- File type validation

**Notes:**
- CSV files are automatically parsed and normalized
- Returns parsed transactions in the response

---

### POST /api/parse

Parse CSV file(s) and return normalized transaction list.

**Request:**
- Content-Type: `multipart/form-data`
- Body: `files` (array of CSV files, max 5 files, 10MB each)

**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "date": "2024-12-04",
        "amount": 482.23,
        "description": "Grocery shopping",
        "merchant": "Midtown Grocer",
        "category": "Groceries"
      }
    ],
    "count": 1,
    "errors": []
  }
}
```

**Normalized Format:**
All transactions are returned in a consistent format:
- `date`: ISO 8601 format (YYYY-MM-DD)
- `amount`: Positive number (currency symbols removed)
- `description`: Transaction description or empty string
- `merchant`: Merchant name or description fallback
- `category`: Category if present in CSV, otherwise `null`

**Supported Column Names:**
The parser automatically recognizes common column name variations:
- **Date**: `date`, `transaction date`, `posted date`, `payment date`
- **Amount**: `amount`, `transaction amount`, `debit`, `credit`, `value`
- **Description**: `description`, `transaction description`, `details`, `memo`, `notes`
- **Merchant**: `merchant`, `vendor`, `payee`, `name`, `store`
- **Category**: `category`, `type`, `expense category`, `classification`

---

### POST /api/categorize

Categorize a single transaction using AI.

**Request:**
```json
{
  "merchant": "Midtown Grocer",
  "amount": 482.23,
  "date": "2024-12-04",  // Optional, ISO 8601 format
  "description": "Grocery shopping"  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "category": "Groceries",
    "confidence": 0.93,
    "reasoning": "Recurring supermarket spend that maps to groceries.",
    "merchant": "Midtown Grocer",
    "amount": 482.23,
    "date": "2024-12-04",
    "source": "openai"
  }
}
```

**Validation:**
- `merchant`: Required, 1-200 characters
- `amount`: Required, positive number (min 0.01)
- `date`: Optional, ISO 8601 format (YYYY-MM-DD)
- `description`: Optional, max 500 characters

**Notes:**
- Primary categorization uses OpenAI responses API with structured JSON schema.
- Requires `OPENAI_API_KEY` (and optional `OPENAI_MODEL`) environment variables.
- Falls back to Python service or local heuristics if AI is unavailable.

---

### GET /api/insights

Get AI-generated insights and recommendations.

**Query Parameters:**
- `startDate` (optional): ISO 8601 date format
- `endDate` (optional): ISO 8601 date format
- `category` (optional): Filter by category (max 100 chars)

**Response:**
```json
{
  "success": true,
  "data": {
    "insights": [
      {
        "type": "spending_pattern",
        "title": "Spending increased 12% this month",
        "description": "...",
        "severity": "info"
      }
    ],
    "recommendations": [
      "Review flagged transactions weekly",
      "Set up category-based spending limits"
    ],
    "trends": [
      {
        "metric": "Total Spend",
        "change": "+12%",
        "period": "MoM"
      }
    ],
    "anomalies": [
      {
        "id": "txn_0002",
        "amount": 6421.87,
        "merchant": "Nimbus Cloud AI",
        "date": "2024-12-04",
        "reason": "Spike beyond 30-day mean"
      }
    ],
    "period": {
      "startDate": "2024-11-01",
      "endDate": "2024-12-04",
      "category": null
    }
  }
}
```

**Validation:**
- `startDate`: Optional, ISO 8601 format
- `endDate`: Optional, ISO 8601 format
- `category`: Optional, max 100 characters

---

### GET /api/analytics

Get detailed analytics and aggregated data.

**Query Parameters:**
- `period` (optional): `7d`, `30d`, `90d`, `1y`, `all` (default: `90d`)
- `groupBy` (optional): `day`, `week`, `month`, `category` (default: `month`)

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalSpend": 61200.0,
      "totalTransactions": 408,
      "avgTicket": 150.0,
      "flaggedCount": 12,
      "period": "90d"
    },
    "timeSeries": [
      {
        "period": "Jul 2024",
        "value": 17200.0,
        "count": 45
      }
    ],
    "categoryBreakdown": [
      {
        "category": "Operations",
        "total": 19800.0,
        "count": 120,
        "avg": 165.0
      }
    ],
    "topMerchants": [
      {
        "merchant": "Nimbus Cloud AI",
        "total": 12843.74,
        "count": 2
      }
    ],
    "period": "90d",
    "groupBy": "month"
  }
}
```

**Validation:**
- `period`: Must be one of: `7d`, `30d`, `90d`, `1y`, `all`
- `groupBy`: Must be one of: `day`, `week`, `month`, `category`

---

## Error Handling

All routes return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": []  // For validation errors
}
```

**Status Codes:**
- `200`: Success
- `400`: Bad Request (validation errors, invalid input)
- `404`: Route not found
- `500`: Internal server error

---

## Architecture

The API follows a modular structure:

```
src/
├── controllers/     # Business logic handlers
├── middleware/      # Validation, error handling, file upload
├── routes/          # Route definitions
└── server.js        # Express app setup
```

**Features:**
- ✅ Input validation with express-validator
- ✅ File upload handling with multer
- ✅ Centralized error handling
- ✅ Fallback responses when Python service is unavailable
- ✅ Type-safe request/response handling

