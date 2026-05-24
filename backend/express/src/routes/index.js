import express from "express";
import { upload } from "../middleware/upload.js";
import { insightsValidation } from "../middleware/validation.js";
import { uploadFile } from "../controllers/uploadController.js";
import { getTransactionsList } from "../controllers/transactionsController.js";
import { getInsights } from "../controllers/insightsController.js";
import { exportCsv } from "../controllers/exportController.js";

const router = express.Router();

/**
 * GET /health
 * Liveness check for Railway / uptime monitors
 */
router.get("/health", (_req, res) => {
  res.status(200).json({ success: true, status: "ok" });
});

/**
 * POST /upload
 * Upload expense files for processing
 */
router.post(
  "/upload",
  upload.array("files", 5),
  uploadFile
);

/**
 * GET /transactions
 * Get transactions from database with filters
 */
router.get("/transactions", getTransactionsList);

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
 * GET /export
 * Download all transactions as a CSV file
 */
router.get("/export", exportCsv);

export default router;
