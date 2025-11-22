import { body, query, validationResult } from "express-validator";

/**
 * Middleware to check validation results
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      details: errors.array(),
    });
  }
  next();
};

/**
 * Validation rules for POST /upload
 */
export const uploadValidation = [
  // File validation is handled by multer, but we can add other validations here
  validate,
];

/**
 * Validation rules for POST /categorize
 */
export const categorizeValidation = [
  body("merchant")
    .trim()
    .notEmpty()
    .withMessage("Merchant name is required")
    .isLength({ min: 1, max: 200 })
    .withMessage("Merchant name must be between 1 and 200 characters"),
  body("amount")
    .isFloat({ min: 0.01 })
    .withMessage("Amount must be a positive number")
    .toFloat(),
  body("date")
    .optional()
    .isISO8601()
    .withMessage("Date must be in ISO 8601 format (YYYY-MM-DD)"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must be less than 500 characters"),
  validate,
];

/**
 * Validation rules for GET /insights
 */
export const insightsValidation = [
  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("startDate must be in ISO 8601 format"),
  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("endDate must be in ISO 8601 format"),
  query("category")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Category filter must be less than 100 characters"),
  validate,
];

/**
 * Validation rules for GET /analytics
 */
export const analyticsValidation = [
  query("period")
    .optional()
    .isIn(["7d", "30d", "90d", "1y", "all"])
    .withMessage("Period must be one of: 7d, 30d, 90d, 1y, all"),
  query("groupBy")
    .optional()
    .isIn(["day", "week", "month", "category"])
    .withMessage("groupBy must be one of: day, week, month, category"),
  validate,
];

