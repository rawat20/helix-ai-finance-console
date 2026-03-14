import { query, validationResult } from "express-validator";

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

