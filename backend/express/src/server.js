"use strict";

import "dotenv/config";
import express from "express";
import cors from "cors";
import routes from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Helix AI Finance API running on http://localhost:${PORT}`);
  console.log(`Available routes:`);
  console.log(`  POST /api/upload`);
  console.log(`  GET  /api/transactions`);
  console.log(`  GET  /api/insights`);
  console.log(`  GET  /api/export`);
});
