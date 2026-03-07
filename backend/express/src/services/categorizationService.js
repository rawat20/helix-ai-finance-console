import { categorizeWithGemini } from "./geminiService.js";

/**
 * Categorize a transaction using Gemini AI.
 * Returns { category, confidence, reasoning }
 */
export const categorizeWithAI = async ({ merchant, description, amount }) => {
  return await categorizeWithGemini({ merchant, description, amount });
};
