/**
 * Centralized error handling middleware
 */

export const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // Validation errors from express-validator
  if (err.type === "validation") {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      details: err.errors,
    });
  }

  // Multer file upload errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      error: "File too large",
      message: "Maximum file size is 10MB",
    });
  }

  if (err.code === "LIMIT_FILE_COUNT") {
    return res.status(400).json({
      success: false,
      error: "Too many files",
      message: "Maximum 5 files allowed per upload",
    });
  }

  // Axios errors (from Python service calls)
  if (err.response) {
    return res.status(err.response.status || 500).json({
      success: false,
      error: "External service error",
      message: err.response.data?.message || err.message,
    });
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

/**
 * 404 handler for undefined routes
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.originalUrl,
  });
};

