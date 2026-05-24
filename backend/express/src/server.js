"use strict";

import "dotenv/config";
import express from "express";
import cors from "cors";
import routes from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 4000;

/**
 * Production: allow only Vercel (and optional preview) origins.
 * Development: allow all origins for local Next.js on :3000.
 */
function getCorsOptions() {
  if (process.env.NODE_ENV !== "production") {
    return {};
  }

  const origins = [];
  if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL.replace(/\/$/, ""));
  }
  if (process.env.FRONTEND_URL_PREVIEW) {
    process.env.FRONTEND_URL_PREVIEW.split(",")
      .map((s) => s.trim().replace(/\/$/, ""))
      .filter(Boolean)
      .forEach((url) => origins.push(url));
  }

  if (origins.length === 0) {
    console.warn(
      "NODE_ENV=production but FRONTEND_URL is unset; browser CORS requests will be rejected."
    );
    return { origin: false, credentials: true };
  }

  return {
    origin: origins,
    credentials: false,
  };
}

app.use(cors(getCorsOptions()));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Helix AI Finance API running on port ${PORT}`);
  if (process.env.NODE_ENV === "production" && process.env.FRONTEND_URL) {
    console.log(`CORS allowed origin: ${process.env.FRONTEND_URL}`);
  }
  console.log(`Available routes:`);
  console.log(`  GET  /api/health`);
  console.log(`  POST /api/upload`);
  console.log(`  GET  /api/transactions`);
  console.log(`  GET  /api/insights`);
  console.log(`  GET  /api/export`);
});
