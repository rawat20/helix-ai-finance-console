import Papa from "papaparse";

/**
 * Normalizes CSV data to a standard transaction format
 * Handles various CSV column name variations
 */
export const parseCSV = async (file) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      trimHeaders: true,
      complete: (results) => {
        try {
          if (!results.data || results.data.length === 0) {
            reject(new Error("CSV file is empty or has no valid rows"));
            return;
          }

          // Normalize column names (case-insensitive, handles common variations)
          const normalizedRecords = results.data
            .map((row, index) => normalizeRow(row, index))
            .filter(Boolean);

          if (normalizedRecords.length === 0) {
            reject(new Error("No valid transactions found in CSV"));
            return;
          }

          resolve(normalizedRecords);
        } catch (error) {
          reject(new Error(`Failed to parse CSV: ${error.message}`));
        }
      },
      error: (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      },
    });
  });
};

/**
 * Normalizes a single CSV row to the standard format
 */
const normalizeRow = (row, index) => {
  // Find column mappings (case-insensitive)
  const findColumn = (variations) => {
    const lowerRow = Object.keys(row).reduce((acc, key) => {
      acc[key.toLowerCase()] = row[key];
      return acc;
    }, {});

    for (const variation of variations) {
      const key = Object.keys(lowerRow).find(
        (k) => k.toLowerCase() === variation.toLowerCase()
      );
      if (key !== undefined) {
        return lowerRow[key];
      }
    }
    return null;
  };

  // Date variations
  const dateValue = findColumn([
    "date",
    "transaction date",
    "transaction_date",
    "posted date",
    "posted_date",
    "payment date",
    "payment_date",
  ]);

  // Amount variations (handle negative/positive, remove currency symbols)
  const amountValue = findColumn([
    "amount",
    "transaction amount",
    "transaction_amount",
    "debit",
    "credit",
    "value",
    "price",
  ]);

  // Description variations
  const descriptionValue = findColumn([
    "description",
    "transaction description",
    "transaction_description",
    "details",
    "memo",
    "notes",
    "narration",
  ]);

  // Merchant variations
  const merchantValue = findColumn([
    "merchant",
    "vendor",
    "payee",
    "name",
    "merchant name",
    "merchant_name",
    "store",
    "business",
  ]);

  // Category variations
  const categoryValue = findColumn([
    "category",
    "type",
    "expense category",
    "expense_category",
    "classification",
  ]);

  // Validate required fields
  if (!dateValue || !amountValue) {
    console.warn(`Row ${index + 1}: Missing required fields (date or amount)`);
    return null;
  }

  // Parse and normalize date
  let normalizedDate = null;
  try {
    const dateObj = new Date(dateValue);
    if (isNaN(dateObj.getTime())) {
      // Try common date formats
      const formats = [
        /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
        /(\d{2})\/(\d{2})\/(\d{4})/, // MM/DD/YYYY
        /(\d{2})-(\d{2})-(\d{4})/, // MM-DD-YYYY
      ];

      let matched = false;
      for (const format of formats) {
        const match = dateValue.match(format);
        if (match) {
          if (format === formats[0]) {
            normalizedDate = match[0];
          } else {
            // MM/DD/YYYY or MM-DD-YYYY -> YYYY-MM-DD
            normalizedDate = `${match[3]}-${match[1]}-${match[2]}`;
          }
          matched = true;
          break;
        }
      }

      if (!matched) {
        console.warn(`Row ${index + 1}: Invalid date format: ${dateValue}`);
        return null;
      }
    } else {
      normalizedDate = dateObj.toISOString().split("T")[0];
    }
  } catch (e) {
    console.warn(`Row ${index + 1}: Date parsing error: ${dateValue}`);
    return null;
  }

  // Parse and normalize amount (remove currency symbols, handle negatives)
  let normalizedAmount = null;
  try {
    const amountStr = String(amountValue)
      .replace(/[$,€£¥₹]/g, "")
      .replace(/,/g, "")
      .trim();

    normalizedAmount = parseFloat(amountStr);

    if (isNaN(normalizedAmount)) {
      console.warn(`Row ${index + 1}: Invalid amount: ${amountValue}`);
      return null;
    }

    // Ensure positive (some banks use negative for debits)
    normalizedAmount = Math.abs(normalizedAmount);
  } catch (e) {
    console.warn(`Row ${index + 1}: Amount parsing error: ${amountValue}`);
    return null;
  }

  return {
    date: normalizedDate,
    amount: normalizedAmount,
    description: descriptionValue?.trim() || "",
    merchant: merchantValue?.trim() || descriptionValue?.trim() || "Unknown",
    category: categoryValue?.trim() || null,
  };
};

