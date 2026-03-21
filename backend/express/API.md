# Express API Documentation

## Base URL

```
http://localhost:4000
```

All JSON APIs are mounted under `/api` (see `src/server.js`).

---

## Routes

### POST /api/upload

Upload one or more CSV files for parsing, AI categorization, anomaly detection, and storage.

**Request:**

- Content-Type: `multipart/form-data`
- Field name: `files` (array, max **5** files, **10 MB** each)
- Accepted formats: `.csv`, `.xlsx`, `.xls`, `.json`, `.txt` (only **CSV** rows are parsed in-app; other types are accepted by multer but not normalized here)

**Response:**

```json
{
  "success": true,
  "message": "Successfully processed 1 file(s)",
  "data": {
    "filesProcessed": 1,
    "transactions": [...],
    "transactionsAdded": 25,
    "transactionsSaved": 23,
    "anomaliesDetected": 2,
    "errors": []
  }
}
```

**Notes:**

- CSV rows are parsed and normalized in `csvParser.js` (common column name variations).
- **Google Gemini** (`geminiService.categorizeBatch`) assigns `aiCategory` and confidence to each row; invalid AI labels are corrected to `"Other"`.
- **Gemini anomaly detection** (`geminiService.detectAnomalies`) sets `anomalyFlag` and `reason`; if Gemini fails, transactions **> 3× batch average** are flagged.
- `createTransactionsBulk` uses **`skipDuplicates: true`** — re-uploading overlapping rows may not increase `transactionsSaved`.
- `transactionsSaved` is the Prisma `createMany` **count** (can be less than `transactionsAdded` when duplicates are skipped).

**Middleware:** `upload.array("files", 5)` from `middleware/upload.js` (no separate `uploadValidation` on this route).

**Error responses (examples):**

```json
{ "success": false, "error": "No file provided", "message": "Please upload a file (CSV, Excel, or JSON)" }
```

Multer may respond with `400` for invalid file type, file too large, or too many files (see `middleware/upload.js` / multer error handler).

---

### GET /api/transactions

Fetch transactions from PostgreSQL with optional filters and pagination.

**Query parameters:**

| Parameter | Type | Description |
|---|---|---|
| `startDate` | ISO 8601 date | From this date (inclusive) |
| `endDate` | ISO 8601 date | Up to this date (inclusive) |
| `merchant` | string | Case-insensitive **partial** match |
| `category` | string | Exact match on CSV `category` |
| `aiCategory` | string | Exact match on AI category |
| `anomalyFlag` | `"true"` or `"false"` | Filter flagged / normal |
| `limit` | number | Max rows (default **100**) |
| `skip` | number | Offset for pagination (default **0**) |

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
      { "label": "Software", "value": 6761.87 }
    ],
    "monthlySpending": [
      { "label": "Dec 2024", "value": 13322.9 }
    ],
    "transactions": [
      {
        "id": "uuid",
        "merchant": "AWS",
        "category": "Software",
        "amount": 340.6,
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

**Controller:** `transactionsController.js` · **Service:** `transactionService.js`

---

### GET /api/insights

Returns AI-generated insights, recommendations, and trends from **real** DB data (up to **200** transactions for the filtered query).

**Query parameters:**

| Parameter | Type | Description |
|---|---|---|
| `startDate` | optional ISO date | Filter from |
| `endDate` | optional ISO date | Filter to |
| `category` | optional string | Max **100** characters |

**Validation:** `insightsValidation` in `middleware/validation.js`.

**Response (when data exists and Gemini succeeds):**

```json
{
  "success": true,
  "data": {
    "insights": [
      {
        "type": "spending_pattern",
        "title": "…",
        "description": "…",
        "severity": "info"
      }
    ],
    "recommendations": ["…"],
    "trends": [
      { "metric": "Dec 2024", "change": "+12%", "period": "MoM" }
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

- **`trends`**: From Gemini as `{ metric, change, period }` (see `generateInsights` in `geminiService.js`). If Gemini fails, the **computed** fallback builds a simple trend list from the last two months only.
- **Helix web UI:** The bundled dashboard **does not render** `trends` in the insights modal (only insight cards and recommendations). The field remains in the JSON for other API consumers.
- **`source`**: `"gemini"` when `generateInsights` succeeds; **`"computed"`** when Gemini fails and the server builds insights from aggregates (still real DB data).
- If **no transactions** in range: `insights: []`, a single upload hint in `recommendations`, `trends: []`.
- Insight `severity`: `"info"`, `"warning"`, `"error"` (where applicable).

**Controller:** `insightsController.js` · **Services:** `transactionService.js`, `geminiService.js`

---

### GET /api/export

Download stored transactions as a CSV file.

**Response:**

- `Content-Type: text/csv`
- `Content-Disposition: attachment; filename="helix_expense_report.csv"`

**CSV columns:** `date`, `merchant`, `category`, `amount`, `anomaly`, `note` (internal DB **`id`** is **not** included in the file).

- `category` uses `aiCategory` when `category` is null.
- `note` maps from DB `reason`.

**Limits:** Up to **1000** rows (`getTransactions({ limit: 1000 })`).

**Empty DB:** `404` JSON: `{ "success": false, "error": "No exportable data available" }`

**Controller:** `exportController.js`

---

## Error handling

Centralized in `middleware/errorHandler.js`. Typical shape:

```json
{
  "success": false,
  "error": "Error message",
  "details": []
}
```

| Code | Meaning |
|---|---|
| `200` | Success |
| `400` | Bad request / validation |
| `404` | Not found or no data (e.g. export) |
| `500` | Server error |

In development, responses may include a `stack` field.

---

## Architecture (Express)

```
backend/express/src/
├── server.js                 # App entry: CORS, JSON, /api routes, error handlers
├── routes/
│   └── index.js              # POST /upload, GET /transactions, /insights, /export
├── controllers/
│   ├── uploadController.js
│   ├── transactionsController.js
│   ├── insightsController.js
│   └── exportController.js
├── services/
│   ├── geminiService.js      # Gemini: batch categorize, anomalies, insights
│   ├── transactionService.js # Prisma: bulk insert, queries, stats
│   ├── csvParser.js          # CSV normalization
│   └── prisma.js             # PrismaClient singleton
└── middleware/
    ├── upload.js             # Multer (memory, limits, file types)
    ├── validation.js         # express-validator (insights query)
    └── errorHandler.js
```

**AI:** Google Gemini — see `GEMINI_API_KEY` and `GEMINI_MODEL` in `.env` (see `DATABASE.md`).
