import express from "express";
import { upload } from "../middleware/upload.js";
import { requireAuth } from "../middleware/auth.js";
import { insightsValidation } from "../middleware/validation.js";
import { googleLogin } from "../controllers/authController.js";
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
 * POST /auth/google
 * Exchange Google ID token for app JWT
 */
router.post("/auth/google", googleLogin);

/**
 * POST /upload
 * Upload expense files for processing
 */
router.post(
  "/upload",
  requireAuth,
  upload.array("files", 5),
  uploadFile
);

/**
 * GET /transactions
 * Get transactions from database with filters
 */
router.get("/transactions", requireAuth, getTransactionsList);

/**
 * GET /insights
 * Get AI-generated insights and recommendations
 */
router.get(
  "/insights",
  requireAuth,
  insightsValidation,
  getInsights
);

/**
 * GET /export
 * Download all transactions as a CSV file
 */
router.get("/export", requireAuth, exportCsv);

export default router;
