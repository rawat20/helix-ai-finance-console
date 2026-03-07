import { parseCSV } from "../services/csvParser.js";

/**
 * POST /api/parse
 * Parse CSV file and return normalized transactions
 */
export const parseCSVFile = async (req, res, next) => {
  try {
    if (!req.file && !req.files) {
      return res.status(400).json({
        success: false,
        error: "No file provided",
        message: "Please upload a CSV file",
      });
    }

    const files = req.files || [req.file];
    const allTransactions = [];
    const errors = [];

    for (const file of files) {
      const isCSV =
        file.mimetype === "text/csv" ||
        file.originalname.toLowerCase().endsWith(".csv") ||
        file.mimetype === "text/plain";

      if (!isCSV) {
        errors.push({
          filename: file.originalname,
          error: "File must be a CSV file",
        });
        continue;
      }

      try {
        const transactions = parseCSV(file.buffer, file.originalname);
        allTransactions.push(...transactions);
      } catch (parseError) {
        errors.push({
          filename: file.originalname,
          error: parseError.message,
        });
      }
    }

    if (allTransactions.length === 0 && errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Failed to parse CSV files",
        errors,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        transactions: allTransactions,
        count: allTransactions.length,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    next(error);
  }
};

