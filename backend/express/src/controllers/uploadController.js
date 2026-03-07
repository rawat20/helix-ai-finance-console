import { parseCSV } from "../services/csvParser.js";
import { createTransactionsBulk } from "../services/transactionService.js";
import { detectAnomalies } from "../services/geminiService.js";

/**
 * POST /upload
 * Parses uploaded CSV, runs Gemini anomaly detection, saves to DB
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

    // Run Gemini anomaly detection on parsed transactions
    let anomaliesDetected = 0;
    if (allTransactions.length > 0) {
      try {
        const flagged = await detectAnomalies(allTransactions);
        flagged.forEach(({ index, reason }) => {
          if (allTransactions[index]) {
            allTransactions[index].anomalyFlag = true;
            allTransactions[index].reason = reason;
          }
        });
        anomaliesDetected = flagged.length;
      } catch (aiError) {
        console.warn("Gemini anomaly detection failed, using threshold fallback:", aiError.message);
        // Fallback: flag transactions above 3x the average amount
        const avg =
          allTransactions.reduce((sum, t) => sum + t.amount, 0) / allTransactions.length;
        allTransactions.forEach((t) => {
          if (t.amount > avg * 3) {
            t.anomalyFlag = true;
            t.reason = "Amount significantly exceeds batch average";
            anomaliesDetected++;
          }
        });
      }
    }

    // Save to Supabase DB
    let savedCount = 0;
    if (allTransactions.length > 0) {
      try {
        const result = await createTransactionsBulk(allTransactions);
        savedCount = result.count;
      } catch (dbError) {
        console.error("Database save error:", dbError.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Successfully processed ${files.length} file(s)`,
      data: {
        filesProcessed: files.length,
        transactions: allTransactions,
        transactionsAdded: allTransactions.length,
        transactionsSaved: savedCount,
        anomaliesDetected,
        errors: processingErrors.length > 0 ? processingErrors : undefined,
      },
    });
  } catch (error) {
    next(error);
  }
};
