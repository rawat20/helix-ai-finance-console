"use client";

import { useState } from "react";
import { parseCSV } from "./csvParser";

/**
 * React hook for parsing CSV files
 * Returns normalized transaction list
 */
export const useCSVParser = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const parseFile = async (file) => {
    setLoading(true);
    setError(null);

    try {
      if (!file) {
        throw new Error("No file provided");
      }

      const isCSV =
        file.type === "text/csv" ||
        file.name.toLowerCase().endsWith(".csv") ||
        file.type === "text/plain";

      if (!isCSV) {
        throw new Error("File must be a CSV file");
      }

      const transactions = await parseCSV(file);
      setLoading(false);
      return transactions;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  return { parseFile, loading, error };
};

