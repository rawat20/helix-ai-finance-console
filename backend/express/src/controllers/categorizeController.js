import axios from "axios";
import { categorizeWithOpenAI } from "../services/categorizationService.js";

const PY_SERVICE_URL = process.env.PY_SERVICE_URL || "http://127.0.0.1:8000";

/**
 * POST /categorize
 * Categorizes a single transaction using AI
 */
export const categorizeTransaction = async (req, res, next) => {
  try {
    const { merchant, amount, date, description } = req.body;

    // Attempt to categorize via OpenAI structured output first
    try {
      const aiResult = await categorizeWithOpenAI({
        merchant,
        description,
        amount,
      });

      return res.status(200).json({
        success: true,
        data: {
          category: aiResult.category,
          confidence: aiResult.confidence,
          reasoning: aiResult.reasoning,
          merchant,
          amount,
          date: date || new Date().toISOString().split("T")[0],
          source: "openai",
        },
      });
    } catch (openAiError) {
      if (openAiError.code === "OPENAI_KEY_MISSING") {
        console.warn("OpenAI key missing, skipping AI categorization");
      } else {
        console.warn("OpenAI categorization failed:", openAiError.message);
      }
    }

    // Forward to Python service for categorization if OpenAI unavailable
    try {
      const { data } = await axios.post(
        `${PY_SERVICE_URL}/categorize`,
        {
          merchant,
          amount,
          date: date || new Date().toISOString().split("T")[0],
          description,
        },
        {
          timeout: 5000,
          headers: { "Content-Type": "application/json" },
        }
      );

      if (data?.category) {
        return res.status(200).json({
          success: true,
          data: {
            category: data.category,
            confidence: data.confidence || 0.85,
            reasoning:
              data.reasoning ||
              "Categorized via Python fallback service.",
            merchant,
            amount,
            date: date || new Date().toISOString().split("T")[0],
            source: "python-service",
          },
        });
      }
    } catch (pyError) {
      // Fallback: simple rule-based categorization
      console.warn("Python service unavailable, using fallback:", pyError.message);
      
      const categoryMap = {
        grocery: ["groc", "food", "market", "supermarket"],
        travel: ["air", "hotel", "flight", "travel", "uber", "lyft"],
        software: ["cloud", "saas", "software", "subscription", "api"],
        meals: ["restaurant", "cafe", "dining", "food", "eat"],
        transport: ["metro", "bus", "train", "transit", "ride"],
        wellness: ["gym", "fitness", "health", "medical", "doctor"],
      };

      const merchantLower = merchant.toLowerCase();
      let detectedCategory = "Other";
      let confidence = 0.65;

      for (const [cat, keywords] of Object.entries(categoryMap)) {
        if (keywords.some((kw) => merchantLower.includes(kw))) {
          detectedCategory = cat.charAt(0).toUpperCase() + cat.slice(1);
          confidence = 0.78;
          break;
        }
      }

      return res.status(200).json({
        success: true,
        data: {
          category: detectedCategory,
          confidence,
          reasoning:
            confidence < 0.7
              ? "Heuristic categorization with low confidence. Consider manual review."
              : "Heuristic categorization based on merchant keywords.",
          merchant,
          amount,
          date: date || new Date().toISOString().split("T")[0],
          source: "rule-engine",
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

