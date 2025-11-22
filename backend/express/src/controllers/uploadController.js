import axios from "axios";
import { parseCSV } from "../services/csvParser.js";
import { createTransactionsBulk } from "../services/transactionService.js";

const PY_SERVICE_URL = process.env.PY_SERVICE_URL || "http://127.0.0.1:8000";

/**
 * POST /upload
 * Handles file uploads for expense processing
 */
export const uploadFile = async (req, res, next) => {
  try {
    if (!req.file && !req.files) {
      return res.status(400).json({
        success: false,
        error: "No file provided",
        message: "Please upload a file (CSV, Excel, or JSON)",
      });
    }

    const files = req.files || [req.file];
    const allTransactions = [];
    const processingErrors = [];

    // Process CSV files locally
    for (const file of files) {
      const isCSV =
        file.mimetype === "text/csv" ||
        file.originalname.toLowerCase().endsWith(".csv") ||
        file.mimetype === "text/plain";

      if (isCSV) {
        try {
          const transactions = parseCSV(file.buffer, file.originalname);
          allTransactions.push(...transactions);
        } catch (csvError) {
          processingErrors.push({
            filename: file.originalname,
            error: csvError.message,
          });
        }
      }
    }

    // Prepare file data for Python service (for non-CSV files or additional processing)
    const fileData = files.map((file) => ({
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      buffer: file.buffer.toString("base64"),
    }));

    // Save transactions to database
    let savedCount = 0;
    if (allTransactions.length > 0) {
      try {
        const result = await createTransactionsBulk(allTransactions);
        savedCount = result.count;
      } catch (dbError) {
        console.error("Database error:", dbError.message);
        // Continue even if DB save fails
      }
    }

    // Forward to Python service for additional processing (anomaly detection, etc.)
    let pythonResults = null;
    try {
      const { data } = await axios.post(
        `${PY_SERVICE_URL}/upload`,
        { files: fileData, transactions: allTransactions },
        {
          timeout: 30000,
          headers: { "Content-Type": "application/json" },
        }
      );
      pythonResults = data;
    } catch (pyError) {
      console.warn("Python service unavailable:", pyError.message);
    }

    const anomaliesDetected =
      pythonResults?.anomaliesDetected ||
      allTransactions.filter((t) => t.amount > 5000).length;

    return res.status(200).json({
      success: true,
      message: `Successfully processed ${files.length} file(s)`,
      data: {
        filesProcessed: files.length,
        transactions: allTransactions,
        transactionsAdded: allTransactions.length,
        transactionsSaved: savedCount,
        anomaliesDetected,
        processingTime: pythonResults?.processingTime || 0.5,
        errors: processingErrors.length > 0 ? processingErrors : undefined,
      },
    });
  } catch (error) {
    next(error);
  }
};

