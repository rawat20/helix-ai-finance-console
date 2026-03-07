import { categorizeWithAI } from "../services/categorizationService.js";

/**
 * POST /categorize
 * Categorizes a single transaction using Gemini AI
 */
export const categorizeTransaction = async (req, res, next) => {
  try {
    const { merchant, amount, date, description } = req.body;

    try {
      const aiResult = await categorizeWithAI({ merchant, description, amount });

      return res.status(200).json({
        success: true,
        data: {
          category: aiResult.category,
          confidence: aiResult.confidence,
          reasoning: aiResult.reasoning,
          merchant,
          amount,
          date: date || new Date().toISOString().split("T")[0],
          source: "gemini",
        },
      });
    } catch (aiError) {
      if (aiError.code === "GEMINI_KEY_MISSING") {
        console.warn("Gemini key missing, using rule-based categorization");
      } else {
        console.warn("Gemini categorization failed:", aiError.message);
      }
    }

    // Fallback: rule-based categorization
    const categoryMap = {
      grocery: ["groc", "food", "market", "supermarket", "whole foods"],
      travel: ["air", "hotel", "flight", "travel", "uber", "lyft", "bluebird"],
      software: ["cloud", "saas", "software", "subscription", "api", "nimbus", "spotify"],
      meals: ["restaurant", "cafe", "dining", "eat", "golden bean"],
      transport: ["metro", "bus", "train", "transit", "ride", "verizon"],
      wellness: ["gym", "fitness", "health", "medical", "doctor"],
      utilities: ["electric", "water", "gas", "internet", "phone"],
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
  } catch (error) {
    next(error);
  }
};
