import express from "express";
import { upload } from "../middleware/upload.js";
import { uploadValidation, categorizeValidation, insightsValidation, analyticsValidation } from "../middleware/validation.js";
import { uploadFile } from "../controllers/uploadController.js";
import { parseCSVFile } from "../controllers/parseController.js";
import { getTransactionsList } from "../controllers/transactionsController.js";
import { categorizeTransaction } from "../controllers/categorizeController.js";
import { getInsights } from "../controllers/insightsController.js";
import { getAnalytics } from "../controllers/analyticsController.js";

const router = express.Router();

/**
 * POST /upload
 * Upload expense files for processing
 */
router.post(
  "/upload",
  upload.array("files", 5), // Accept up to 5 files
  uploadValidation,
  uploadFile
);

/**
 * POST /parse
 * Parse CSV file and return normalized transactions
 */
router.post(
  "/parse",
  upload.array("files", 5),
  parseCSVFile
);

/**
 * GET /transactions
 * Get transactions from database with filters
 */
router.get("/transactions", getTransactionsList);

/**
 * POST /categorize
 * Categorize a single transaction
 */
router.post(
  "/categorize",
  categorizeValidation,
  categorizeTransaction
);

/**
 * GET /insights
 * Get AI-generated insights and recommendations
 */
router.get(
  "/insights",
  insightsValidation,
  getInsights
);

/**
 * GET /analytics
 * Get detailed analytics and aggregated data
 */
router.get(
  "/analytics",
  analyticsValidation,
  getAnalytics
);

export default router;

