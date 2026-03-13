import express from "express";
import { upload } from "../middleware/upload.js";
import { uploadValidation, insightsValidation } from "../middleware/validation.js";
import { uploadFile } from "../controllers/uploadController.js";
import { getTransactionsList } from "../controllers/transactionsController.js";
import { getInsights } from "../controllers/insightsController.js";

const router = express.Router();

/**
 * POST /upload
 * Upload expense files for processing
 */
router.post(
  "/upload",
  upload.array("files", 5),
  uploadValidation,
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

export default router;
