import OpenAI from "openai";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

const jsonSchema = {
  name: "expense_categorization",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["category", "confidence", "reasoning"],
    properties: {
      category: {
        type: "string",
        description: "Human-readable expense category such as Travel or Software",
        minLength: 2,
      },
      confidence: {
        type: "number",
        minimum: 0,
        maximum: 1,
        description: "Confidence score between 0 and 1",
      },
      reasoning: {
        type: "string",
        description: "One or two sentence explanation grounded in the transaction details",
        minLength: 6,
      },
    },
  },
  strict: true,
};

const systemPrompt = `
You are an AI assistant that classifies corporate expenses.
Return a short, descriptive category (e.g., Travel, Meals & Entertainment, Software & Cloud, Office Supplies).
Use the provided structured output schema and always ground reasoning in the description, merchant, and amount.
If the category is unclear, choose the closest match and mention the uncertainty in reasoning.
`.trim();

let cachedClient = null;

const getClient = () => {
  if (!OPENAI_API_KEY) {
    throw Object.assign(new Error("Missing OPENAI_API_KEY environment variable"), {
      code: "OPENAI_KEY_MISSING",
    });
  }

  if (!cachedClient) {
    cachedClient = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });
  }
  return cachedClient;
};

export const categorizeWithOpenAI = async ({
  merchant,
  description,
  amount,
}) => {
  const client = getClient();

  const completion = await client.responses.create({
    model: OPENAI_MODEL,
    input: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Merchant: ${merchant}\nDescription: ${description ?? "n/a"}\nAmount: ${amount}`,
          },
        ],
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: jsonSchema,
    },
  });

  const jsonContent =
    completion.output?.[0]?.content?.find(
      (item) => item.type === "output_json",
    )?.json ?? completion.output_text
      ? JSON.parse(completion.output_text)
      : null;

  if (!jsonContent) {
    throw new Error("Unable to parse categorization response");
  }

  return jsonContent;
};

